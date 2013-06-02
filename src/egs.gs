require! gorillascript
require! fs
require! path
require! './helpers'
require! './utils'

const PARTIAL_PREFIX = "_"

const DEBUG = false
const DISABLE_TYPE_CHECKING = not DEBUG

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

/**
 * Unlike path.extname, this returns the extension from the first dot onward.
 * If the filename starts with '.', an empty string is returned.
 *
 * For example, "hello.html.egs" will return ".html.egs" rather than ".egs"
 */
let full-extname(filename)
  let match = r'^[^\.]+(.*)$'.exec(path.basename(filename))
  if match
    match[1]
  else
    ""

/**
 * Guess the filepath that is being requested relative to the file it was
 * requested from.
 */
let guess-filepath = do
  let cache = {}
  #(name, from-filepath)
    let inner = cache[from-filepath] ownsor= {}
    inner[name] ownsor=
      let mutable filename = name
      if not path.extname filename
        filename &= full-extname(from-filepath)
      path.resolve path.dirname(from-filepath), filename

/**
 * Parse the macros from the built-in egs-prelude.gs, return the macros to be
 * used in further compilation.
 */
let get-prelude-macros = do
  let mutable cache = void
  # cache ?= promise!
    let text = yield to-promise! fs.read-file "$__dirname/../src/egs-prelude.gs", "utf8"
    let result = yield gorillascript.parse text
    result.macros

/**
 * Compile a chunk of egs-code to a usable function which takes a write
 * function and the context which it uses to override global access.
 */
let compile = promise! #(egs-code as String, compile-options as {})* as Promise<Function<Promise, Function, {}>>
  let macros = yield get-prelude-macros()
  let result = yield gorillascript.compile egs-code, {} <<< compile-options <<< {+embedded, +embedded-generator, +noindent, macros}
  promise! Function("return " & result.code)()

/**
 * Generate a cache key from the given options. It should only include the
 * relevant parts needed for compilation, i.e. not any context-specific data.
 */
let make-cache-key(options) as String
  let parts = []
  for key in [\embedded-open, \embedded-open-write, \embedded-open-comment, \embedded-close, \embedded-close-write, \embedded-close-comment, \cache]
    parts.push options[key] or "\0"
  parts.join "\0"

/**
 * Compile a file, see `compile` for more information.
 * If `options.cache` is unset, then every access to the compilation function
 * results in an `fs.stat` to see if the file has changed, recompiling if
 * necessary. It is important to set `options.cache` in production.
 *
 * This does cache on the path and options passed in so that the compilation is
 * shared between any code that asks for a compilation, such as a partial.
 */
let compile-file = do
  let cache = {}
  #(filepath as String, compile-options as {}) as Promise<Function<Promise, Function, {}>>
    let inner-cache = cache[filepath] ownsor= {}
    inner-cache[make-cache-key compile-options] ownsor= do
      let recompile-file = promise! #*
        let egs-code = yield to-promise! fs.read-file filepath, "utf8"
        yield compile egs-code, compile-options
      if compile-options.cache
        let current-compilation-p = recompile-file()
        current-compilation-p
      else
        let retime = promise! #*
          let stat = yield to-promise! fs.stat filepath
          stat.mtime.get-time()
        let mutable current-compilation-p = recompile-file()
        let mutable current-time-p = retime()
        promise!
          #(...args) promise!
            let new-time-p = retime()
            if (yield current-time-p) != (yield new-time-p)
              current-compilation-p := recompile-file()
              current-time-p := new-time-p
            let func = yield current-compilation-p
            yield func@(this, ...args)

/**
 * Find the filepath of the requested name and return the full filepath and
 * the compiled result.
 */
let find-and-compile-file = promise! #(name as String, from-filepath as String, options = {})*
  let filepath = guess-filepath name, from-filepath
  let compiled = yield compile-file filepath, options
  { filepath, compiled }

/**
 * Make a writer which can be called to add text to the stream and later be
 * built into a single string.
 *
 * The writer can be disabled in the case of extending an object, one wouldn't
 * want the ignored text between <% block %>s to be written.
 */
let make-text-writer(escaper as ->)
  let mutable data as Array|null = []
  let write(value, should-escape)!
    if data
      data.push String if should-escape
        escaper value
      else
        value
  write.disable := #!-> data := null
  write.is-disabled := #-> data == null
  write.build := #-> data.join ""
  write

/**
 * Create a unique key.
 */
let make-uid()
  "$(Math.random().to-string(16).slice(2))-$(new Date().get-time())"

let handle-extends-key = make-uid()
let write-key = make-uid()
/**
 * Create an object full of helpers used to enable extension, partials, and blocks.
 */
let make-standard-helpers(options)
  let filepath-key = make-uid()
  let extended-by-key = make-uid()
  let extended-by-locals-key = make-uid()
  let in-partial-key = make-uid()
  let blocks = {}
  let escaper = if is-function! options.escape then options.escape else utils.escape-HTML
  let write = make-text-writer escaper
  {} <<< helpers <<< {
    [filepath-key]: options.filename
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
      @[extended-by-key] := find-and-compile-file name, @[filepath-key], options
      @[extended-by-locals-key] := locals
    partial: promise! #(mutable name as String, write as ->, locals = {})*
      if not options.filename
        throw Error "Can only use partial if the 'filename' option is specified"
      let partial-prefix = if is-string! options.partial-prefix
        options.partial-prefix
      else
        PARTIAL_PREFIX
      name := path.join(path.dirname(name), partial-prefix ~& path.basename(name))
      let {filepath, compiled} = yield find-and-compile-file name, @[filepath-key], options
      yield compiled write, {extends this} <<< locals <<< {[filepath-key]: filepath, [in-partial-key]: true}
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
      
      let write = make-text-writer escaper
      
      let {filepath, compiled} = yield extended-by
      let new-context = {extends this} <<< @[extended-by-locals-key] <<< {
        [filepath-key]: filepath
        [extended-by-key]: null
        [extended-by-locals-key]: null
        [write-key]: write
      }
      yield compiled write, new-context
      yield new-context[handle-extends-key]()
  }

/**
 * Make the context object to be passed into the template.
 * All global access is converted to be context access within the template.
 */
let make-context(options as {}, data as {}) as {}
  {extends GLOBAL} <<< make-standard-helpers(options) <<< (options.context or options) <<< data

/**
 * Make a template from the compilation that was yielded on.
 */
let make-template(compilation-p, options) as Function<Promise<String>, {}>
  promise! #(data = {})* as Promise<String>
    let func = yield compilation-p
    let context = make-context(options, data)
    let result = func context[write-key], context
    yield result
    yield context[handle-extends-key]()

/**
 * Retrieve only the valid parts of the options so that old data is not kept around.
 */
let sift-options(options) {
  options.filename
  options.embedded-open
  options.embedded-open-write
  options.embedded-open-comment
  options.embedded-close
  options.embedded-close-write
  options.embedded-close-comment
  options.cache
  options.escape
  options.partial-prefix
  // include an empty context to be clear that the options does not inherit anything directly.
  context: {}
}

/**
 * Create a template given the egs-code and options.
 */
let build(mutable egs-code as String, mutable options = {}) as Function<Promise<String>>
  make-template compile(egs-code, sift-options(options)), options

/**
 * Create a template from a given filename and options.
 */
let build-from-file(filepath as String, options = {}) as Function<Promise<String>, {}>
  options.filename := filepath
  make-template compile-file(filepath, sift-options(options)), options

/**
 * Render a chunk of egs-code given the options and optional context.
 */
let render = promise! #(egs-code as String, options = {}, context)* as Promise<String>
  let template = build egs-code, sift-options(options)
  yield template(context or options.context or options)

/**
 * Render a file given the options and the optional context.
 */
let render-file = promise! #(filepath as String, options = {}, context)* as Promise<String>
  options.filename := filepath
  let template = build-from-file filepath, sift-options(options)
  yield template(context or options.context or options)

module.exports := build <<< {
  from-file: build-from-file
  render
  render-file
  __express(path as String, options = {}, callback as ->)!
    let fun = from-promise! render-file(path, options)
    fun callback
}
