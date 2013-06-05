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

let memoize(mutable func)
  let mutable result = void
  #
    if func
      result := func()
      func := null
    result

/**
 * Since this may run in the browser, we want to use the AMD system to get GorillaScript if possible.
 */
let get-gorillascript = memoize #
  let from-require = require 'gorillascript'
  if from-require?
    fulfilled! from-require
  else if is-function! define and define.amd
    let defer = __defer()
    real-require ["gorillascript"], #(gorillascript)
      defer.fulfill gorillascript
    defer.promise
  else if is-object! root
    if root.GorillaScript
      fulfilled! root.GorillaScript
    else
      rejected! Error "GorillaScript must be available before EGS requests it"
  else
    rejected! Error "Unable to detect environment, cannot load GorillaScript"

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
let [get-prelude-macros, with-egs-prelude] = do
  let mutable egs-prelude-code = void
  let mutable get-egs-prelude-p = memoize promise! #*
    let text = egs-prelude-code or yield to-promise! fs.read-file "$__dirname/../src/egs-prelude.gs", "utf8"
    let gorillascript = yield get-gorillascript()
    let result = yield gorillascript.parse text
    result.macros
  let prelude-path-cache = {}
  
  [
    #(prelude-path as String|null)
      let egs-prelude-p = get-egs-prelude-p()
      if not prelude-path
        egs-prelude-p
      else
        prelude-path-cache[prelude-path] ownsor= promise!
          let egs-prelude = yield egs-prelude-p
          let text = yield to-promise! fs.read-file prelude-path, "utf8"
          let gorillascript = yield get-gorillascript()
          let result = yield gorillascript.parse text, { macros: egs-prelude }
          result.macros
    #(code as String)
      egs-prelude-code := code
      this
  ]

/**
 * The final AST from the GorillaScript compiler will be piped through this
 * function, allowing for various optimizations.
 */
let get-ast-pipe = do
  let make-get-ast-pipe = memoize promise! #*
    let gorillascript = yield get-gorillascript()
    let ast = gorillascript.AST
    /**
     * Whether the node is a specific ident call
     */
    let is-call(node, function-name)
      if node instanceof ast.Call
        let {func} = node
        func instanceof ast.Ident and func.name == function-name
    /**
     * Whether the node is a specific method call on the context
     */
    let is-context-call(node, function-name)
      if node instanceof ast.Call
        let {func} = node
        if func instanceof ast.Binary and func.op == "."
          let {left, right} = func
          return left instanceof ast.Ident and left.name == "context" and right.is-const() and right.const-value() == function-name
      false
    /**
     * Convert `write(value, true)` to `write(context.escape(value))`
     */
    let convert-write-true-to-write-escape(node)
      if is-call(node, \write) and node.args.length == 2 and node.args[1].is-const() and node.args[1].const-value()
        ast.Call node.pos,
          node.func,
          [ast.Call node.pos,
            ast.Access node.pos,
              ast.Ident node.pos, \context
              ast.Const node.pos, \escape
            [node.args[0]]]
    /**
     * Convert `context.escape(context.h(value))` to `value`
     */
    let unwrap-escape-h(node)
      if is-context-call(node, \escape) and node.args.length == 1
        let arg = node.args[0]
        if arg and (is-context-call(arg, \h) or is-context-call(arg, \html)) and arg.args.length == 1
          arg.args[0]
    /**
     * Naively check on whether the node can be numeric, i.e. whether `x + x`
     * would give a number rather than a string.
     */
    let can-be-numeric(node)
      if node.is-const()
        not is-string! node.const-value()
      else if node instanceof ast.Binary
        if node.op == "+"
          can-be-numeric(node.left) and can-be-numeric(node.right)
        else
          true
      else if node instanceof ast.IfExpression
        can-be-numeric(node.when-true) or can-be-numeric(node.when-false)
      else if node instanceofsome [ast.BlockExpression, ast.BlockStatement]
        can-be-numeric(node.body[* - 1])
      else
        not is-context-call(node, \escape)
  
    /**
     * Convert `write(x); write(y)` to `write("" + x + y)`
     * Convert `if (cond) { write(x); } else { write(y); }` to `write(cond ? x : y)`
     */
    let merge-writes(node)
      if node instanceofsome [ast.BlockExpression, ast.BlockStatement]
        let body = node.body.slice()
        let mutable changed = false
        for subnode, i in body
          let new-subnode = subnode.walk-with-this merge-writes
          body[i] := new-subnode
          if new-subnode != subnode
            changed := true
        let mutable i = 0
        while i < body.length - 1
          let left = body[i]
          let right = body[i + 1]
          if is-call(left, \write) and left.args.length == 1 and is-call(right, \write) and right.args.length == 1
            changed := true
            body.splice i, 2, ast.Call left.pos,
              left.func
              [ast.Binary left.pos,
                if can-be-numeric(left.args[0]) and can-be-numeric(right.args[0])
                  ast.Binary left.pos,
                    ast.Const left.pos, ""
                    "+"
                    left.args[0]
                else
                  left.args[0]
                "+"
                right.args[0]]
          else
            i += 1
        if changed
          ast.Block(node.pos, body, node.label)
      else if node instanceofsome [ast.IfStatement, ast.IfExpression] and not node.label
        let when-true = node.when-true.walk-with-this merge-writes
        let when-false = node.when-false.walk-with-this merge-writes
        if is-call(when-true, \write) and (is-call(when-false, \write) or when-false.is-noop())
          ast.Call node.pos,
            when-true.func
            [ast.IfExpression node.pos,
              node.test.walk-with-this merge-writes
              when-true.args[0]
              if when-false.is-noop()
                ast.Const when-false.pos, ""
              else
                when-false.args[0]]
    /**
     * Return whether the function contains `context.extends`
     */
    let has-extends(node)
      let FOUND = {}
      try
        node.walk #(subnode)
          if subnode instanceof ast.Func
            subnode
          else if is-context-call subnode, \extends
            throw FOUND
      catch e == FOUND
        return true
      false
    /**
     * remove all `write()` calls within the function.
     */
    let remove-writes-in-function(node)
      if node instanceof ast.Func
        node
      else if is-call node, \write
        ast.Noop node.pos
    /**
     * if `context.extends` is detected within afunction, remove all `write()` calls.
     */
    let remove-writes-after-extends(node)
      if node instanceof ast.Func
        if has-extends node
          node.walk remove-writes-in-function
    /**
     * Convert `write(value)` to `write += value`
     */
    let convert-write-to-string-concat(node)
      if is-call node, \write
        ast.Binary(node.pos,
          node.func
          "+="
          node.args[0]).walk-with-this convert-write-to-string-concat
    let prepend(left, node)
      if node instanceof ast.Binary and node.op == "+"
        ast.Binary left.pos,
          prepend(left, node.left)
          "+"
          node.right
      else
        ast.Binary left.pos,
          left
          "+"
          node
    /**
     * Convert `write += value; return write;` to `return write + value;`
     */
    let convert-last-write(node)
      if node instanceof ast.BlockStatement
        let last = node.body[* - 1]
        if last instanceof ast.Return and last.node instanceof ast.Ident and last.node.name == \write
          let before-last = node.body[* - 2]
          if before-last and before-last instanceof ast.Binary and before-last.op == "+=" and before-last.left instanceof ast.Ident and before-last.left.name == \write
            ast.BlockStatement node.pos, [
              ...node.body[0 til -2]
              ast.Return before-last.pos,
                prepend before-last.left, before-last.right
            ], node.label
    /**
     * At the top of the generated function is if (context == null) { context = {}; }
     * Since context is guaranteed to exist, we can turn `context == null` into `false`
     */
    let remove-context-null-check(node)
      if node instanceof ast.Binary and node.op == "==" and node.left instanceof ast.Ident and node.left.name == \context and node.right.is-const() and not node.right.const-value()?
        ast.Const node.pos, false
  
    /**
     * Change `context.key` to `helpers.key` if "key" exists in `helper-names`
     */
    let change-context-to-helpers(helper-names) #(node)
      if node instanceof ast.Binary and node.op == "." and node.left instanceof ast.Ident and node.left.name == \context and node.right.is-const() and node.right.const-value() in helper-names
        ast.Binary node.pos,
          ast.Ident node.left.pos, \helpers
          "."
          node.right
  
    /**
     * Convert the function like `function (write, context) {}` to `function (write, context, helpers) {}`
     */
    let add-helpers-to-params(node)
      if node instanceof ast.Func and node.params.length == 2 and node.params[0].name == \write and node.params[1].name == \context
        ast.Func node.pos,
          node.name
          [
            node.params[0]
            node.params[1]
            ast.Ident node.pos, \helpers
          ]
          node.variables
          node.body
          node.declarations
    #(helper-names) #(root)
      root
        .walk convert-write-true-to-write-escape
        .walk unwrap-escape-h
        .walk merge-writes
        .walk remove-writes-after-extends
        .walk convert-write-to-string-concat
        .walk convert-last-write
        .walk remove-context-null-check
        .walk change-context-to-helpers(helper-names)
        .walk add-helpers-to-params
  promise! #(helper-names)*
    let get-ast-pipe = yield make-get-ast-pipe()
    get-ast-pipe(helper-names)

/**
 * Compile a chunk of egs-code into a chunk of JavaScript code.
 */
let compile-code = promise! #(egs-code as String, compile-options as {}, helper-names as [])*
  let macros = yield get-prelude-macros(compile-options.prelude)
  let ast-pipe = yield get-ast-pipe(helper-names)
  let options = {} <<< compile-options <<< {+embedded, +noindent, macros, prelude: null, ast-pipe }
  let mutable code = void
  let mutable is-generator = false
  let gorillascript = yield get-gorillascript()
  try
    code := (yield gorillascript.compile egs-code, options).code
  catch
    options.embedded-generator := true
    is-generator := true
    code := (yield gorillascript.compile egs-code, options).code
  {
    is-generator
    code
  }

/**
 * Compile a chunk of egs-code to a usable function which takes a write
 * function and the context which it uses to override global access.
 */
let compile = promise! #(egs-code as String, compile-options as {}, helper-names as [])* as Promise<Function<Promise, Function, {}>>
  let {is-generator, code} = yield compile-code(egs-code, compile-options, helper-names)
  
  {
    func: if is-generator
      promise! Function("return $code")()
    else
      Function("return $code")()
    is-simple: for every special in [\extends, \partial, \block]
      code.index-of("helpers.$special") == -1 and code.index-of("helpers[\"$special\"]") == -1
  }

/**
 * Generate a cache key from the given options. It should only include the
 * relevant parts needed for compilation, i.e. not any context-specific data.
 */
let make-cache-key(options) as String
  let parts = []
  for key in [\open, \open-write, \open-comment, \close, \close-write, \close-comment, \cache, \prelude]
    parts.push options[key] or "\0"
  parts.join "\0"

let return-same(value) # value

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
  #(filepath as String, compile-options as {}, helper-names as []) as Function<Promise>
    let inner-cache = cache[filepath] ownsor= {}
    inner-cache[make-cache-key(compile-options) & "\0" & helper-names.join("\0")] ownsor= do
      let recompile-file = promise! #*
        let egs-code = yield to-promise! fs.read-file filepath, "utf8"
        yield compile egs-code, compile-options, helper-names
      if compile-options.cache
        return-same recompile-file()
      else
        let retime = promise! #*
          let stat = yield to-promise! fs.stat filepath
          stat.mtime.get-time()
        let mutable current-compilation-p = recompile-file()
        let mutable current-time-p = retime()
        promise! #*
          let new-time-p = retime()
          if (yield current-time-p) != (yield new-time-p)
            current-compilation-p := recompile-file()
            current-time-p := new-time-p
          yield current-compilation-p

/**
 * Find the filepath of the requested name and return the full filepath and
 * the compiled result.
 */
let find-and-compile-file = promise! #(name as String, from-filepath as String, compile-options = {}, helper-names as [])*
  let filepath = guess-filepath name, from-filepath
  let compiled = yield compile-file(filepath, compile-options, helper-names)()
  { filepath, compiled }

/**
 * Create an options object to be passed to the GorillaScript compiler.
 */
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
    options.undefined-name
    options.uglify
  }

let to-maybe-sync(promise-factory)
  let maybe-sync = promise-factory.maybe-sync
  for k, v of promise-factory
    maybe-sync[k] := v
  maybe-sync

let simple-helpers-proto = {} <<< helpers
let helpers-proto = {} <<< helpers <<< {
  extends(name as String, locals)!
    if not @__current-filepath$
      throw EgsError "Can only use extends if the 'filename' option is specified"
    if @__in-partial$
      throw EgsError "Cannot use extends when in a partial"
    if @__extended-by$
      throw EgsError "Cannot use extends more than once"
    @__extended-by$ := @__fetch-compiled$ name
    @__extended-by-locals$ := locals
  
  partial: to-maybe-sync promise! #(mutable name as String, write as String, locals = {})*
    if not @__current-filepath$
      throw EgsError "Can only use partial if the 'filename' option is specified"
    name := path.join(path.dirname(name), @__partial-prefix$ ~& path.basename(name))
    let {filepath, compiled: {func}} = yield @__fetch-compiled$ name
    let partial-helpers = {extends this
      __current-filepath$: filepath
      __in-partial$: true
    }
    if func.maybe-sync
      yield func.maybe-sync write, locals, partial-helpers
    else
      func write, locals, partial-helpers
  
  block: to-maybe-sync promise! #(mutable name as String, write, inside as ->|null)*
    if @__in-partial$
      throw EgsError "Cannot use block when in a partial"
  
    let blocks = @__blocks$
    let root-helpers = @__helpers$
    if @__extended-by$ and not root-helpers.__in-block$
      if inside? and blocks not ownskey name
        blocks[name] := inside
      write
    else
      let block = blocks![name] or inside
      let mutable result = write
      if block
        root-helpers.__in-block$ := true
        result := yield promise!(true) block write
        root-helpers.__in-block$ := false
      result
  
  __handle-extends$: to-maybe-sync promise! #(current-write)*
    let {filepath, compiled: {func}} = yield @__extended-by$
    let new-helpers = { extends this
      __current-filepath$: filepath
      __extended-by$: null
      __extended-by-locals$: null
    }
    let locals = @__extended-by-locals$ or {}
    let text = if func.maybe-sync
      yield func.maybe-sync "", locals, new-helpers
    else
      func "", locals, new-helpers
    if new-helpers.__extended-by$
      yield new-helpers.__handle-extends$(new-helpers, text)
    else
      text
}

/**
 * Make the `helpers` object to be passed into the template.
 * All global access is converted to be either `context` or `helpers` access within the template.
 */
let make-helpers-factory = do
  let make-factory(partial-prefix, current-filepath, fetch-compiled, escaper, options-context)
    let base-helpers = { extends helpers-proto }
    base-helpers <<< {
      __current-filepath$: current-filepath
      __partial-prefix$: partial-prefix
      __fetch-compiled$: fetch-compiled
      __extended-by$: null
      __extended-by-locals$: null
      __in-partial$: false
      __in-block$: false
      escape: escaper
    }
    let simple-helpers = { extends simple-helpers-proto }
    simple-helpers <<< {
      __current-filepath$: current-filepath
      escape: escaper
    }
    if options-context
      simple-helpers <<< options-context
      base-helpers <<< options-context
    #(is-simple)
      if is-simple
        simple-helpers
      else
        let helpers = { extends base-helpers }
        helpers.__helpers$ := helpers
        helpers.__blocks$ := {}
        helpers
  #(options as {}, helper-names)
    make-factory(
      if is-string! options.partial-prefix
        options.partial-prefix
      else
        PARTIAL_PREFIX
      options.filename
      do
        let in-package = options.__in-package$
        if in-package
          #(name) -> in-package._find name, @__current-filepath$
        else
          let compile-options = get-compile-options(options)
          #(name) -> find-and-compile-file name, @__current-filepath$, compile-options, helper-names
      if is-function! options.escape then options.escape else utils.escape-HTML
      if options ownskey \context
        options.context
      else
        options)

/**
 * Make a template from the compilation that was yielded on.
 */
let make-template(get-compilation-p as ->, make-helpers as ->, cache-compilation as Boolean) as Function<Promise<String>, {}>
  let mutable compilation = void
  let template = promise! #(data)* as Promise<String>
    let mutable tmp = cache-compilation and compilation
    if not tmp
      tmp := yield get-compilation-p()
      if cache-compilation
        compilation := tmp
    let helpers = make-helpers tmp.is-simple
    let mutable result = tmp.func "", data or {}, helpers
    if result and result.then
      result := yield result
    if helpers.__extended-by$
      let extension = helpers.__handle-extends$
      yield extension.maybe-sync@(helpers, result)
    else
      result
  // this is practically the above function, only synchronous
  template.sync := #(data)
    let mutable tmp = cache-compilation and compilation
    if not tmp
      tmp := get-compilation-p().sync()
      if cache-compilation
        compilation := tmp
    let helpers = make-helpers tmp.is-simple
    let func = tmp.func
    let mutable result = (func.sync or func) "", data or {}, helpers
    if not is-string! result
      result := result.sync()
    if helpers.__extended-by$
      helpers.__handle-extends$.sync@(helpers, result)
    else
      result
  template.ready := promise! #!*
    if cache-compilation
      if not compilation
        compilation := yield get-compilation-p()
      let {mutable func} = compilation
      if func.sync
        func := func.sync
      // in the case where the template doesn't extend and might be called synchronously,
      // and we're caching the compilation, optimize it as much as possible.
      if compilation.is-simple
        let helpers = make-helpers(true)
        template.sync := #(data)
          let result = func "", data or {}, helpers
          if not is-string! result
            result.sync()
          else
            result
    else
      yield get-compilation-p()
  template

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
  context: null
}

/**
 * Get the array of keys in the context that the compiler will know about.
 */
let get-helper-names(options)
  let context = if options ownskey \context
    options.context
  else
    options
  let result = [\escape, \extends, \partial, \block]
  for k of helpers
    if k not in result
      result.push k
  if context
    for k of context
      if k not in result
        result.push k
  else
    result
  result.sort()

/**
 * Create a template given the egs-code and options.
 */
let compile-template(mutable egs-code as String, mutable options = {context: null}) as Function<Promise<String>>
  let helper-names = get-helper-names(options)
  make-template return-same(compile(egs-code, get-compile-options(options), helper-names)), make-helpers-factory(options, helper-names), true

/**
 * Create a template from a given filename and options.
 */
let compile-template-from-file(filepath as String, options = {context: null}) as Function<Promise<String>, {}>
  options.filename := filepath
  let helper-names = get-helper-names(options)
  make-template compile-file(filepath, get-compile-options(options), helper-names), make-helpers-factory(options, helper-names), options.cache

/**
 * Render a chunk of egs-code given the options and optional context.
 */
let render = promise! #(egs-code as String, options = {context: null}, mutable context)* as Promise<String>
  let template = compile-template egs-code, sift-options(options)
  if not context
    if options ownskey \context
      context := options.context
    else
      context := options
  yield template.maybe-sync(context)

/**
 * Render a file given the options and the optional context.
 */
let render-file = promise! #(filepath as String, options = {context: null}, mutable context)* as Promise<String>
  options.filename := filepath
  let template = compile-template-from-file filepath, sift-options(options)
  if not context
    if options ownskey \context
      context := options.context
    else
      context := options
  yield template.maybe-sync(context)

/**
 * Handle rendering for express, which does not take a separate context and
 * expects a callback to be invoked.
 */
let express(path as String, options = {context: null}, callback as ->)!
  (from-promise! render-file(path, options))(callback)

/**
 * Traverse through a directory and find all filepaths with a particular extension.
 */
let find-all-extensioned-filepaths = promise! #(dirpath as String, ext as String)*
  let paths = yield to-promise! fs.readdir dirpath
  let result = []
  yield promisefor(3) p in paths
    let joined-path = path.join dirpath, p
    let stat = yield to-promise! fs.stat joined-path
    if stat.is-directory()
      result.push ...(yield find-all-extensioned-filepaths(joined-path, ext))
    else if stat.is-file() and path.extname(p) == ext
      result.push joined-path
  result.sort()

/**
 * Compile a folder of `.egs` files into a single `.js` file that exports
 * a single `Package` with the files referenced by the path relative to
 * `input-dirpath`.
 */
let compile-package = promise! #(input-dirpath as String, output-filepath as String, options = {})*
  let dirstat = yield to-promise! fs.stat input-dirpath
  if not dirstat.is-directory()
    throw Error "Expected '$(input-dirpath)' to be a directory."
  let input-filepaths = yield find-all-extensioned-filepaths input-dirpath, ".egs"
  let gorillascript = yield get-gorillascript()
  let macros = yield get-prelude-macros(options.prelude)
  let ast-pipe = yield get-ast-pipe(get-helper-names({}))
  let full-ast-pipe(mutable root, , ast)
    let files-assigned = {}
    let is-do-wrap(node)
      node instanceof ast.Call and (node.func instanceof ast.Func or (node.func instanceof ast.Binary and node.func.op == "." and node.func.left instanceof ast.Func and node.func.right.is-const() and node.func.right.const-value() in [\call, \apply]))
    let assign-files(node)
      if node.pos.file and files-assigned not ownskey node.pos.file and is-do-wrap(node)
        files-assigned[node.pos.file] := true
        ast.Call node.pos,
          ast.Access node.pos,
            ast.Ident node.pos, \templates
            ast.Const node.pos, \set
          [
            ast.Const node.pos, path.relative(input-dirpath, node.pos.file)
            node
          ]

    root := ast-pipe(root).walk assign-files
    ast.Root root.pos,
      ast.Call root.pos,
        ast.Access root.pos,
          ast.Func root.pos,
            null
            [ast.Ident root.pos, \factory]
            []
            ast.IfStatement root.pos,
              ast.And root.pos,
                ast.Binary root.pos,
                  ast.Unary root.pos,
                    \typeof
                    ast.Ident root.pos, \module
                  "!=="
                  ast.Const root.pos, \undefined
                ast.Access root.pos,
                  ast.Ident root.pos, \module
                  ast.Const root.pos, \exports
              ast.Assign root.pos,
                ast.Access root.pos,
                  ast.Ident root.pos, \module
                  ast.Const root.pos, \exports
                ast.Call root.pos,
                  ast.Ident root.pos, \factory
                  [
                    ast.Call root.pos,
                      ast.Ident root.pos, \require
                      [ast.Const root.pos, \egs]
                  ]
              ast.IfStatement root.pos,
                ast.And root.pos,
                  ast.Binary root.pos,
                    ast.Unary root.pos,
                      \typeof
                      ast.Ident root.pos, \define
                    "==="
                    ast.Const root.pos, \function
                  ast.Access root.pos,
                    ast.Ident root.pos, \define
                    ast.Const root.pos, \amd
                ast.Call root.pos,
                  ast.Ident root.pos, \define
                  [
                    ast.Arr root.pos, [ast.Const root.pos, "egs"]
                    ast.Ident root.pos, \factory
                  ]
                ast.Assign root.pos,
                  ast.Access root.pos,
                    ast.This root.pos,
                    ast.Const root.pos, options.global-export or \EGSTemplates
                  ast.Call root.pos,
                    ast.Ident root.pos, \factory
                    [
                      ast.Access root.pos,
                        ast.This root.pos,
                        ast.Const root.pos, \EGS
                    ]
          ast.Const root.pos, \call
        [
          ast.This root.pos
          ast.Func root.pos,
            null
            [
              ast.Ident root.pos, \EGS
            ]
            [\templates]
            ast.Block root.pos, [
              ast.IfStatement root.pos,
                ast.Unary root.pos,
                  "!"
                  ast.Ident root.pos, \EGS
                ast.Throw root.pos,
                  ast.Call root.pos,
                    ast.Ident root.pos, \Error
                    [ast.Const root.pos, "Expected EGS to be available"]
              ast.Assign root.pos,
                ast.Ident root.pos, \templates
                ast.Call root.pos,
                  ast.Access root.pos,
                    ast.Ident root.pos, \EGS
                    ast.Const root.pos, \Package
                  []
              root.body
              ast.Return root.pos,
                ast.Ident root.pos, \templates
            ]
        ]
      []
      []
  yield gorillascript.compile-file {
    input: input-filepaths
    output: output-filepath
    +embedded
    +embedded-generator
    +noindent
    embedded-open: options.open
    embedded-open-write: options.open-write
    embedded-open-comment: options.open-comment
    embedded-close: options.close
    embedded-close-write: options.close-write
    embedded-close-comment: options.close-comment
    options.coverage
    options.source-map
    options.undefined-name
    options.uglify
    macros
    ast-pipe: full-ast-pipe
  }

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
    @templates[filepath] := make-template return-same(fulfilled! { func: factory, is-simple: false }), make-helpers-factory({__in-package$: this, filename: filepath} <<< @options <<< options), true
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
   * Render a template at the given filepath with the provided data to be used
   * as the context, synchronously. If not possible to execute synchronously,
   * an error is thrown.
   */
  def render-sync(filepath as String, data = {}) as String
    let template = @get filepath
    template.sync data
  
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
      fulfilled! { filepath, compiled: { func: factories[filepath], is-simple: false } }
  
  def express()
    #(path as String, data, callback as ->)@!
      (from-promise! @render(path, data))(callback)

module.exports := compile-template <<< {
  version: __VERSION__
  from-file: compile-template-from-file
  render
  render-file
  with-egs-prelude
  compile-package
  Package
  EgsError
  compile(egs-code as String = "", options = {}, helper-names = [])
    compile-code(egs-code, get-compile-options(options), helper-names)
  __express: express
  express(options = {})
    #(path as String, suboptions = {}, callback as ->)!
      express(path, {} <<< options <<< suboptions, callback)
}
