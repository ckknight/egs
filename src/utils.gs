/**
 * Either call a value's .toHTML() method or escape the unsafe HTML codes
 * from its String representation.
 */
exports.escape-HTML := do
  let escapes = {
    "&": "&amp;"
    "<": "&lt;"
    ">": "&gt;"
    '"': "&quot;"
    "'": "&#39;"
  }
  let replacer(x) -> escapes[x]
  let regex = r"[&<>""']"g
  let escaper(text) -> text.replace(regex, replacer)
  #(value)
    if is-string! value
      escaper value
    else if is-number! value
      value.to-string()
    else if value? and is-function! value.to-HTML
      String value.to-HTML()
    else
      throw TypeError "Expected a String, Number, or Object with a toHTML method, got $(typeof! value)"
