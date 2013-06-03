// everything exported here will be available by default in the context

class RawHTML
  def constructor(text)
    @text := text
  def to-HTML() -> @text

/**
 * Wrap the provided text so that it will be treated as safe and non-escaped.
 */
exports.h := #(text)
  RawHTML String text
