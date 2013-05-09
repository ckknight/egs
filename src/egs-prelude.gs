macro extends
  syntax name
    ASTE context.extends $name, write

macro block
  syntax ident as Identifier, body as Body?
    let name = @const @name(ident)
    if body?
      ASTE context.block $name, write, #(write)!
        $body
    else
      ASTE context.block $name, write

macro partial
  syntax name, locals as (",", this as ObjectLiteral)?
    ASTE context.partial $name, write, $locals
