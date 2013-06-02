// everything exported here will be available by default in the context

class RawHTML
  def constructor(text)
    @text := text
  def to-HTML() -> @text

/**
 * Wrap the provided text so that it will be treated as safe and non-escaped.
 */
exports.h := #(text)
  switch typeof text
  case \string
    return RawHTML text
  case \number
    return RawHTML text.to-string()
  case \object
    if text and is-function! text.to-HTML
      return text
  throw TypeError "Expected text to be a String, Number, or Object with a toHTML method, got $(typeof! text)"
