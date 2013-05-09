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
  let escape(text) -> text.replace(regex, replacer)
  #(text)
    if text? and is-function! text.to-HTML
      String text.to-HTML()
    else
      escape String text
