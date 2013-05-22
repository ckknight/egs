macro extends(name, locals)
  ASTE context.extends $name, $locals

macro block
  syntax ident as Identifier, body as GeneratorBody?
    let name = @const @name(ident)
    if body?
      ASTE yield context.block $name, write, #(write)*
        $body
    else
      ASTE yield context.block $name, write

macro partial(name, locals)
  ASTE yield context.partial $name, write, $locals
