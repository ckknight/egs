macro extends(name, locals)
  let new-context = if locals and not locals.is-const()
    ASTE {} <<< context <<< $locals
  else
    ASTE context
  ASTE context.extends $name, $new-context

macro block
  syntax ident as Identifier, body as GeneratorBody?
    let name = @const @name(ident)
    if body?
      ASTE! write := yield context.block $name, write, #(write)*
        $body
        write
    else
      ASTE! write := yield context.block $name, write

macro partial(name, locals)
  let new-context = if locals and not locals.is-const()
    ASTE {} <<< context <<< $locals
  else
    ASTE context
  ASTE! write := yield context.partial $name, write, $new-context
