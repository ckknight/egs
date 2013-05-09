require! gorillascript
require! fs
require! path
require! './helpers'
require! './utils'

let cache(should-cache, obj, key, func, callback)
  if should-cache
    if obj ownskey key
      callback null, obj[key]
    else
      async! callback, result <- func()
      callback null, (obj[key] := result)
  else
    func callback

let get-prelude-macros(callback as ->)!
  async! callback, text <- fs.read-file "$__dirname/../src/egs-prelude.gs", "utf8"
  async! callback, result <- gorillascript.parse text
  callback null, result.macros

let compile(text as String, options as {}, callback as ->)!
  async! callback, macros <- get-prelude-macros()
  async! callback, result <- gorillascript.compile text, {} <<< options <<< {+embedded, +noindent, macros}
  let func = Function("return " & result.code)()
  callback null, func

let file-cache = {}
let read-file(path, should-cache, callback)
  cache should-cache, file-cache, path, (#(cb) -> fs.read-file path, 'utf8', cb), callback

let find-file-cache = {}
let find-file(name, from-filename, should-cache, callback)
  cache should-cache, find-file-cache, name, (#(cb)
    let mutable filename = name
    if not path.extname(filename)
      let match = r'(\..*$)'.exec(path.basename(from-filename))
      if match
        filename &= match[1]
    cb null, path.join path.dirname(from-filename), filename), callback

let find-and-get-compiled(name, options, callback)
  async! callback, filename <- find-file(name, options.filename, options.cache)
  async! callback, text <- read-file filename, options.cache
  get-compiled text, options, callback

class TextBuilder
  def constructor(@escape as ->)
    @head := { text: "", next: null }
    @write := @get-writer()
  
  let to-array(node)
    let mutable current = node
    let sb = []
    while current?
      sb.push current.text
      current := current.next
    sb
  
  def inspect(depth)
    let array = for filter part in to-array(@head); part
    "TextBuilder(" & require('util').inspect(array, null, depth) & ")"
  
  def build()
    to-array(@head).join ""
  
  def get-writer(node)
    let mutable current = node or @head
    let mutable disabled = false
    let write(data, should-escape)!@
      if disabled
        return
      let text = if should-escape
        @escape data
      else
        String data
      current := current.next := { text, current.next }
    write.clone := #@
      let result = @get-writer(current)
      current := current.next := { text: "", current.next }
      result
    write.disable := #! -> disabled := true
    write

let make-uid()
  "$(Math.random().to-string(16).slice(2))-$(new Date().get-time())"

let do-nothing() ->
let get-standard-helpers(options, context, callback)
  let blocks = {}
  let block-writers = {}
  let block-writers-depth = {}
  let mutable pending = 1
  let pend()!
    pending += 1
  let handle-writers()
    while pending == 1
      let mutable max-depth = -1
      let mutable best-name = void
      for name, depth of block-writers-depth
        if depth > max-depth and blocks![name]
          max-depth := depth
          best-name := name
      if best-name?
        let block = blocks[best-name]
        blocks[best-name] := null
        block block-writers[best-name]
      else
        break
  let fulfill()!
    pending -= 1
    if pending == 0
      pending += 1
      handle-writers()
      pending -= 1
      if pending == 0
        callback()
  let name-key = make-uid()
  let depth-key = make-uid()
  {} <<< helpers <<< {
    [depth-key]: 0
    [name-key]: options.filename
    pend
    fulfill
    partial: #(name as String, mutable write as ->, locals = {})!
      if not options.filename
        return callback Error "Can only use partial if the 'filename' option is specified"
      write := write.clone()
      pend()
      async! throw, func <- find-and-get-compiled name, options
      func write, {extends context} <<< locals <<< {[name-key]: name}
      fulfill()
    
    extends: #(name as String, mutable write as ->, locals = {})!
      if not options.filename
        return callback Error "Can only use extends if the 'filename' option is specified"
      write.disable()
      write := write.clone()
      pend()
      async! throw, func <- find-and-get-compiled name, options
      func write, {extends context} <<< locals <<< {[depth-key]: @[depth-key] + 1, [name-key]: name}
      fulfill()
    
    block: #(name as String, mutable write as ->, inside as ->|null)!
      if inside? and blocks not ownskey name
        blocks[name] := inside
      
      if block-writers not ownskey name or @[depth-key] > block-writers-depth[name]
        block-writers[name] := write.clone()
        block-writers-depth[name] := @[depth-key]
  }

let compile-cache = {}
let get-compiled(text as String, options, callback)!
  if options.cache and not options.filename
    return callback Error "If 'cache' is enabled, the 'filename' option must be specified"
  
  cache options.cache, compile-cache, options.filename, (#(cb) -> compile text, options, cb), callback

let make-context(options as {}, data as {}, callback as ->)
  let context = {extends GLOBAL}
  context <<< get-standard-helpers(options, context, callback) <<< (options.context or {}) <<< data

let build(mutable text as String, options = {}, callback as ->|null)
  if is-function! options and not callback?
    return build text, {}, callback
  let mutable compiled-func = void
  let fetch(callback)
    if compiled-func?
      callback null, compiled-func
    else
      async! callback, func <- get-compiled text, options
      text := null // allow memory to be cleared
      compiled-func := func
      callback null, compiled-func
  let render(data = {}, callback)
    if is-function! data and not callback?
      return render {}, data
    if not is-function! callback
      throw TypeError "Expected callback to be a Function, got $(typeof! callback)"
    async! callback, func <- fetch()
    let builder = TextBuilder(if is-function! options.escape then options.escape else utils.escape-HTML)
    let context = make-context options, data, __once #
      callback null, builder.build()
    func builder.write, context
    context.fulfill()
  if callback?
    async! callback <- fetch()
    callback null, render
  else
    render

let build-file(path as String, options = {}, callback)!
  if is-function! options and not callback?
    return build-file path, {}, options
  if not is-function! callback
    throw TypeError "Expected callback to be a Function, got $(typeof! callback)"
  
  options.filename := path
  async! callback, text <- read-file path, options.cache
  build text, options, callback

let render(text as String, options = {}, callback)!
  if is-function! options and not callback?
    return render text, {}, options
  if not is-function! callback
    throw TypeError "Expected callback to be a Function, got $(typeof! callback)"
  async! callback, run <- build(text, options)
  run(if options.context then {} else options, callback)

let render-file(path as String, options = {}, callback)!
  if is-function! options and not callback?
    return render-file path, {}, options
  if not is-function! callback
    throw TypeError "Expected callback to be a Function, got $(typeof! callback)"
  
  async! callback, run <- build-file(path, options)
  run(if options.context then {} else options, callback)

module.exports := build <<< {
  build-file
  render
  render-file
  __express: render-file
}