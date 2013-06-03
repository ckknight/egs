// everything exported here will be available by default in the context

class RawHTML
  def constructor(text)
    @text := text
  def to-HTML() -> @text

/**
 * Wrap the provided text so that it will be treated as safe and non-escaped.
 */
exports.h := exports.html := #(text)
  RawHTML String text

/**
 * Wrap a string such that it could be put into a JavaScript string, e.g.
 * <script>var x = "Hello, <%=j name %>!"</script>
 */
exports.j := exports.javascript := do
  let escapes = {
    "\\": "\\\\"
    "\r": "\\r"
    "\u2028": "\\u2028"
    "\u2029": "\\u2029"
    "\n": "\\n"
    "\f": "\\f"
    "'": "\\'"
    '"': '\\"'
    "\t": "\\t"
  }
  let replacer(x) -> escapes[x]
  let regex = r"""[\\\r\u2028\u2029\n\f'"\t]"""g
  #(text)
    RawHTML String(text).replace regex, replacer
