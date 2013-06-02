require! gorillascript
require! fs
require! path
require! './helpers'
require! './utils'

const PARTIAL_PREFIX = "_"

const DEBUG = false
const DISABLE_TYPE_CHECKING = not DEBUG

class EgsError extends Error
  def constructor(mutable @message as String = "")
    let err = super(message)
    if is-function! Error.capture-stack-trace
      Error.capture-stack-trace this, EgsError
    else if err haskey \stack
      @stack := err.stack
  def name = "EgsError"

/**
 * Unlike path.extname, this returns the extension from the first dot onward.
 * If the filename starts with '.', an empty string is returned.
 *
 * For example, "hello.html.egs" will return ".html.egs" rather than ".egs"
 */
let full-extname(filename)
  let match = r'^[^\.]+(\..*)$'.exec(path.basename(filename))
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
  let mutable egs-prelude-p = void
  let prelude-path-cache = {}
  #(prelude-path as String|null)
    egs-prelude-p ?= promise!
      let text = yield to-promise! fs.read-file "$__dirname/../src/egs-prelude.gs", "utf8"
      let result = yield gorillascript.parse text
      result.macros
    if not prelude-path
      egs-prelude-p
    else
      prelude-path-cache[prelude-path] ownsor= promise!
        let egs-prelude = yield egs-prelude-p
        let text = yield to-promise! fs.read-file prelude-path, "utf8"
        let result = yield gorillascript.parse text, { macros: egs-prelude }
        result.macros

/**
 * Compile a chunk of egs-code to a usable function which takes a write
 * function and the context which it uses to override global access.
 */
let compile = promise! #(egs-code as String, compile-options as {})* as Promise<Function<Promise, Function, {}>>
  let macros = yield get-prelude-macros(compile-options.prelude)
  let result = yield gorillascript.compile egs-code, {} <<< compile-options <<< {+embedded, +embedded-generator, +noindent, macros, prelude: null}
  promise! Function("return " & result.code)()

/**
 * Generate a cache key from the given options. It should only include the
 * relevant parts needed for compilation, i.e. not any context-specific data.
 */
let make-cache-key(options) as String
  let parts = []
  for key in [\open, \open-write, \open-comment, \close, \close-write, \close-comment, \cache, \prelude]
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
        recompile-file()
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
let find-and-compile-file = promise! #(name as String, from-filepath as String, compile-options = {})*
  let filepath = guess-filepath name, from-filepath
  let compiled = yield compile-file filepath, compile-options
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
let package-key = make-uid()

let get-compile-options(options = {})
  {
    options.filename
    embedded-open: options.open
    embedded-open-write: options.open-write
    embedded-open-comment: options.open-comment
    embedded-close: options.close
    embedded-close-write: options.close-write
    embedded-close-comment: options.close-comment
    options.prelude
    options.cache
  }

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
  let fetch-compiled =
    if options[package-key]
      #(context, name) -> options[package-key]._find name, context[filepath-key]
    else
      #(context, name) -> find-and-compile-file name, context[filepath-key], get-compile-options options
  {} <<< helpers <<< {
    [filepath-key]: options.filename
    [extended-by-key]: null
    [extended-by-locals-key]: null
    [in-partial-key]: false
    [write-key]: write
    
    extends(name as String, locals = {})!
      if not options.filename
        throw EgsError "Can only use extends if the 'filename' option is specified"
      if @[in-partial-key]
        throw EgsError "Cannot use extends when in a partial"
      if @[extended-by-key]
        throw EgsError "Cannot use extends more than once"
      @[write-key].disable()
      @[extended-by-key] := fetch-compiled this, name
      @[extended-by-locals-key] := locals
    
    partial: promise! #(mutable name as String, write as ->, locals = {})*
      if not options.filename
        throw EgsError "Can only use partial if the 'filename' option is specified"
      let partial-prefix = if is-string! options.partial-prefix
        options.partial-prefix
      else
        PARTIAL_PREFIX
      name := path.join(path.dirname(name), partial-prefix ~& path.basename(name))
      let {filepath, compiled} = yield fetch-compiled this, name
      yield compiled write, {extends this} <<< locals <<< {[filepath-key]: filepath, [in-partial-key]: true}
    
    block: promise! #(mutable name as String, write as ->, inside as ->|null)*
      if @[in-partial-key]
        throw EgsError "Cannot use block when in a partial"
      
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
  options.open
  options.open-write
  options.open-comment
  options.close
  options.close-write
  options.close-comment
  options.cache
  options.escape
  options.partial-prefix
  options.prelude
  // include an empty context to be clear that the options does not inherit anything directly.
  context: {}
}

/**
 * Create a template given the egs-code and options.
 */
let compile-template(mutable egs-code as String, mutable options = {}) as Function<Promise<String>>
  make-template compile(egs-code, get-compile-options(options)), options

/**
 * Create a template from a given filename and options.
 */
let compile-template-from-file(filepath as String, options = {}) as Function<Promise<String>, {}>
  options.filename := filepath
  make-template compile-file(filepath, get-compile-options(options)), options

/**
 * Render a chunk of egs-code given the options and optional context.
 */
let render = promise! #(egs-code as String, options = {}, context)* as Promise<String>
  let template = compile-template egs-code, sift-options(options)
  yield template(context or options.context or options)

/**
 * Render a file given the options and the optional context.
 */
let render-file = promise! #(filepath as String, options = {}, context)* as Promise<String>
  options.filename := filepath
  let template = compile-template-from-file filepath, sift-options(options)
  yield template(context or options.context or options)

/**
 * Handle rendering for express, which does not take a separate context and
 * expects a callback to be invoked.
 */
let express(path as String, options = {}, callback as ->)!
  (from-promise! render-file(path, options))(callback)

/**
 * A package of pre-compiled files, which can still use extends, partial, block
 * in order to make full use of the helper suite.
 *
 * This is primarily meant to be used in browsers, but could be used in
 * production-mode server apps.
 */
class Package
  def constructor(@options = {})
    @factories := {}
    @templates := {}
  
  let with-leading-slash(filepath as String)
    if filepath.char-code-at(0) != "/".char-code-at(0)
      "/" & filepath
    else
      filepath
  
  /**
   * Set a filepath in the package to have a certain generator which will
   * become a promise, as well as any options.
   *
   * Returns `this`, for fluent APIs.
   */
  def set(mutable filepath as String, generator as ->, options = {})
    filepath := with-leading-slash filepath
    let factory = @factories[filepath] := promise! generator
    @templates[filepath] := make-template (fulfilled! factory), {[package-key]: this, filename: filepath} <<< @options <<< options
    this
  
  /**
   * Get the template for the given filepath, or throw an error if it doesn't exist.
   */
  def get(mutable filepath as String) as Function<Promise<String>, {}>
    filepath := with-leading-slash filepath
    let templates = @templates
    if templates not ownskey filepath
      throw EgsError "Unknown filepath: '$filepath'"
    else
      templates[filepath]
  
  /**
   * Render a template at the given filepath with the provided data to be used
   * as the context.
   */
  def render = promise! #(filepath as String, data = {})* as Promise<String>
    let template = @get filepath
    yield template data
  
  /**
   * Find the filepath of the requested name and return the full filepath and
   * the compiled result.
   */
  def _find(name as String, from-filepath as String)
    let filepath = guess-filepath name, from-filepath
    let factories = @factories
    if factories not ownskey filepath
      rejected! EgsError "Cannot find '$name' from '$filepath', tried '$filepath'"
    else
      fulfilled! { filepath, compiled: factories[filepath] }

module.exports := compile-template <<< {
  from-file: compile-template-from-file
  render
  render-file
  Package
  EgsError
  __express: express
  express(options = {})
    #(path as String, suboptions = {}, callback as ->)!
      express(path, {} <<< options <<< suboptions, callback)
}
