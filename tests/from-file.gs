describe "from a file", #
  describe "can build a template", #
    it "can render", #(cb)
      let template = egs.from-file "$__dirname/templates/hello.egs"
      expect(template).to.be.a \function
      let promise = template name: "world"
      expect(promise).to.have.property(\then)
        .that.is.a \function
      promise.then #(value)
        expect(value).to.equal "Hello, world!"
        cb()
    
    it "can be reused", #(cb)
      let template = egs.from-file "$__dirname/templates/hello.egs"
      (every-promise! {
        empty: template()
        friend: template name: "friend"
        needs-escape: template name: '"friend"'
      }).then #({empty, friend, needs-escape})
        expect(empty).to.equal "Hello, undefined!"
        expect(friend).to.equal "Hello, friend!"
        expect(needs-escape).to.equal "Hello, &quot;friend&quot;!"
        cb()
  
  describe "can render immediately", #
    it "without making a template first", #(cb)
      let promise = egs.render-file "$__dirname/templates/hello.egs", name: "friend"
      expect(promise).to.have.property(\then)
        .that.is.a \function
      promise.then #(value)
        expect(value).to.equal "Hello, friend!"
        cb()
    
    it "uses the context property instead of options if provided", #(cb)
      let promise = egs.render-file "$__dirname/templates/hello.egs", context: { name: "friend" }
      promise.then #(value)
        expect(value).to.equal "Hello, friend!"
        cb()
    
    it "allows for a data argument that overrides anything in the context", #(cb)
      let promise = egs.render-file "$__dirname/templates/hello.egs", { context: { name: "friend" } }, name: "world"
      promise.then #(value)
        expect(value).to.equal "Hello, world!"
        cb()
  
  describe "partials", #
    it "can render a partial with a dynamic name and locals", #(cb)
      let template = egs.from-file "$__dirname/templates/use-partial.egs"
      let promise = template partial-name: "quote-text", partial-locals: { text: "Hello" }
      promise.then #(value)
        expect(value).to.equal '["Hello"]'
        cb()
    
    it "can render a partial within a partial", #(cb)
      let template = egs.from-file "$__dirname/templates/use-partial.egs"
      let promise = template partial-name: "render-other-partial", partial-locals: {
        partial-name: "quote-text"
        partial-locals: {
          text: "Hello"
        }
      }
      promise.then #(value)
        expect(value).to.equal '[("Hello")]'
        cb()
  
  describe "extends and blocks", #
    it "can render the layout on its own", #(cb)
      let template = egs.from-file "$__dirname/templates/layout.egs"
      let promise = template()
      promise.then #(value)
        expect(value).to.equal """
        header[Default header]
        body[]
        footer[Default footer]
        """
        cb()
    
    it "can extend a layout and override blocks", #(cb)
      let template = egs.from-file "$__dirname/templates/use-layout.egs"
      let promise = template()
      promise.then #(value)
        expect(value).to.equal """
        header[Overridden header]
        body[Overridden body]
        footer[Default footer]
        """
        cb()
    
    it "can extend a layout which has its own extends", #(cb)
      let template = egs.from-file "$__dirname/templates/use-sublayout.egs"
      let promise = template()
      promise.then #(value)
        expect(value).to.equal """
        header[Overridden header]
        body[sub-body[Overridden sub-body]]
        footer[Default footer]
        """
        cb()
