require! gorillascript
require! fs
require! path
require! './helpers'
require! './utils'

const PARTIAL_PREFIX = "_"

macro cache!(should-cache, cache, key, call)
  @maybe-cache cache, #(set-cache, cache)@
    @maybe-cache key, #(set-key, key)@
      AST
        if $should-cache
          if $set-cache ownskey $set-key
            $cache[$key]
          else
            $cache[$key] := $call
        else
          $call

let read-file = do
  let read(path) -> to-promise! fs.read-file path, 'utf8'
  let file-cache = {}
  #(path, should-cache)
    cache! should-cache, file-cache, path, read path

let find-file = do
  let find = promise! #(mutable name, from-filename)*
    if not path.extname(name)
      let match = r'(\.[^/\\]*$)'.exec(path.basename(from-filename))
      if match
        name &= match[1]
    return path.join(path.dirname(from-filename), name)
  
  let find-file-cache = {}
  #(name, from-filename, should-cache)
    cache! should-cache, find-file-cache, "$name\0$from-filename", find name, from-filename

let get-prelude-macros = do
  let mutable cache = void
  #
    return? cache
    cache := promise!
      let text = yield to-promise! fs.read-file "$__dirname/../src/egs-prelude.gs", "utf8"
      let result = yield to-promise! gorillascript.parse text
      return result.macros

let compile = promise! #(text as String, options as {})*
  let macros = yield get-prelude-macros()
  let result = yield to-promise! gorillascript.compile text, {} <<< options <<< {+embedded, +embedded-generator, +noindent, macros}
  return Function("return " & result.code)()

let get-compiled = do
  let compile-cache = {}
  #(text as String, key, options = {})
    if options.cache and not key
      throw Error "If 'cache' is enabled, the 'filename' option must be specified"
    
    cache! options.cache, compile-cache, key, compile text, options

let find-and-get-compiled = promise! #(name, from-filename, options = {})*
  let filename = yield find-file name, from-filename, options.cache
  let text = yield read-file filename, options.cache
  let compiled = yield get-compiled text, filename, options
  return { filename, compiled }

let make-text-writer(escape)
  let mutable data as Array|null = []
  let write(value, should-escape)
    if data
      data.push String if should-escape
        escape value
      else
        value
  write.disable := #!-> data := null
  write.is-disabled := #-> data == null
  write.build := #-> data.join ""
  write

let make-uid()
  "$(Math.random().to-string(16).slice(2))-$(new Date().get-time())"

let handle-extends-key = make-uid()
let write-key = make-uid()
let make-standard-helpers(options)
  let name-key = make-uid()
  let extended-by-key = make-uid()
  let extended-by-locals-key = make-uid()
  let in-partial-key = make-uid()
  let blocks = {}
  let escape = if is-function! options.escape then options.escape else utils.escape-HTML
  let write = make-text-writer escape
  {} <<< helpers <<< {
    [name-key]: options.filename
    [extended-by-key]: null
    [extended-by-locals-key]: null
    [in-partial-key]: false
    [write-key]: write
    extends(name as String, locals = {})!
      if not options.filename
        throw Error "Can only use extends if the 'filename' option is specified"
      if @[in-partial-key]
        throw Error "Cannot use extends when in a partial"
      if @[extended-by-key]
        throw Error "Cannot use extends more than once"
      @[write-key].disable()
      @[extended-by-key] := find-and-get-compiled name, @[name-key], options
      @[extended-by-locals-key] := locals
    partial: promise! #(mutable name as String, write as ->, locals = {})*
      if not options.filename
        throw Error "Can only use partial if the 'filename' option is specified"
      let partial-prefix = if is-string! options.partial-prefix
        options.partial-prefix
      else
        PARTIAL_PREFIX
      name := path.join(path.dirname(name), partial-prefix ~& path.basename(name))
      let {filename, compiled} = yield find-and-get-compiled name, @[name-key], options
      yield promise! compiled write, {extends this} <<< locals <<< {[name-key]: filename, [in-partial-key]: true}
    block: promise! #(mutable name as String, write as ->, inside as ->|null)*
      if @[in-partial-key]
        throw Error "Cannot use block when in a partial"
      
      if write.is-disabled()
        if inside? and blocks not ownskey name
          blocks[name] := inside
      else
        let block = blocks![name] or inside
        if block
          yield promise! block write
    [handle-extends-key]: promise! #(locals = {})*
      let extended-by = @[extended-by-key]
      if not extended-by
        return @[write-key].build()
      
      let write = make-text-writer escape
      
      let {filename, compiled} = yield extended-by
      let new-context = {extends this} <<< @[extended-by-locals-key] <<< {
        [name-key]: filename
        [extended-by-key]: null
        [extended-by-locals-key]: null
        [write-key]: write
      }
      yield promise! compiled write, new-context
      return yield new-context[handle-extends-key]()
  }

let make-context(options as {}, data as {})
  {extends GLOBAL} <<< make-standard-helpers(options) <<< (options.context or options) <<< data

let build(mutable text as String, options = {})
  let func-p = promise!
    return yield get-compiled text, options.filename, options
  
  promise! #(data = {})*
    let func = yield func-p
    let context = make-context(options, data)
    yield promise! func context[write-key], context
    let text = yield context[handle-extends-key]()
    return text

let make-cache-key(options)
  let parts = []
  for key in [\filename, \embedded-open, \embedded-open-write, \embedded-open-comment, \embedded-close, \embedded-close-write, \embedded-close-comment]
    parts.push options[key] or ""
  if is-string! options.partial-prefix
    parts.push options.partial-prefix
  else
    parts.push PARTIAL_PREFIX
  parts.join "\0"
let build-from-file = do
  let get-builder(path, options)
    let build-p = promise!
      let text = yield read-file path, options.cache
      return build text, options
    
    promise! #(data = {})*
      let builder = yield build-p
      return yield builder(data)
  let build-from-file-cache = {}
  #(path as String, options = {})
    options.filename := path
    cache! options.cache, build-from-file-cache, make-cache-key(options), get-builder(path, options)

let render = promise! #(text as String, options = {}, data)*
  let template = build text, options
  return yield template(data)

let render-file = promise! #(path as String, options = {}, data)*
  let template = build-from-file path, options
  return yield template(data)

module.exports := build <<< {
  from-file: build-from-file
  render
  render-file
  __express(path as String, options = {}, callback as ->)!
    let fun = from-promise! render-file(path, options)
    fun callback
}
