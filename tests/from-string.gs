describe "from a string", #
  describe "can build a template", #
    it "can render", #(cb)
      let template = egs "Hello, <%= name %>!"
      expect(template).to.be.a \function
      let promise = template(name: "friend")
      expect(promise).to.have.property(\then)
        .that.is.a \function
      promise.then #(value)
        expect(value).to.equal "Hello, friend!"
        cb()
  
    it "allows reuse of the template", #(cb)
      let template = egs "Hello, <%= name %>!"
      (every-promise! {
        empty: template()
        friend: template name: "friend"
        needs-escape: template name: '"friend"'
      }).then #({empty, friend, needs-escape})
        expect(empty).to.equal "Hello, undefined!"
        expect(friend).to.equal "Hello, friend!"
        expect(needs-escape).to.equal "Hello, &quot;friend&quot;!"
        cb()
    
    it "allows a template to be passed in a context that can be overridden", #(cb)
      let template = egs "Hello, <%= name %>!", name: "world"
      (every-promise! {
        normal: template()
        override: template name: "egs"
      }).then #({normal, override})
        expect(normal).to.equal "Hello, world!"
        expect(override).to.equal "Hello, egs!"
        cb()
    
    it "allows if statements", #(cb)
      let template = egs """
      Hello, <%= name %>!
      <% if awesome: %>
      You're awesome!
      <% end %>
      """
      (every-promise! {
        unawesome: template { name: "world", -awesome }
        awesome: template { name: "egs", +awesome }
      }).then #({unawesome, awesome})
        expect(unawesome).to.match r'^Hello, world!\s*$'
        expect(awesome).to.match r'^Hello, egs!\n\s*You''re awesome!\s*$'
        cb()
    
    it "allows if-else statements", #(cb)
      let template = egs """
      Hello, <%= name %>!
      <% if awesome: %>
      You're awesome!
      <% else: %>
      Hope you're feeling better.
      <% end %>
      """
      (every-promise! {
        unawesome: template { name: "world", -awesome }
        awesome: template { name: "egs", +awesome }
      }).then #({unawesome, awesome})
        expect(unawesome).to.match r'^Hello, world!\n\s*Hope you''re feeling better.\s*$'
        expect(awesome).to.match r'^Hello, egs!\n\s*You''re awesome!\s*$'
        cb()
    
    it "allows custom tokens to be specified", #(cb)
      let template = egs """
      {% if awesome: %}
      You're awesome, {{ name }}!
      {% else: %}
      Hello, {{ name }}!
      {% end %}
      <%= name %>
      """, { embedded-open: "{%", embedded-close: "%}", embedded-open-write: "{{", embedded-close-write: "}}" }
      
      (every-promise! {
        unawesome: template { name: "world", -awesome }
        awesome: template { name: "egs", +awesome }
      }).then #({unawesome, awesome})
        expect(unawesome).to.match r'^\s*Hello, world!\s*<%= name %>$'
        expect(awesome).to.match r'^\s*You''re awesome, egs!\s*<%= name %>$'
        cb()
    
    it "allows helper functions to be called", #
      let template = egs """
      Hello, <%= get-name() %>!
      """
      
      let obj = {}
      (every-promise! {
        world: template { get-name: #-> "world" }
        friend: template { get-name: #-> "friend" }
        error: template({ get-name: #-> throw obj })
          .then null, #(reason)
            expect(reason).to.equal obj
            \error
        not-found: template({})
          .then null, #(reason)
            expect(reason).to.be.an.instanceof TypeError
            \not-found
      }).then #({world, friend, error, not-found})
        expect(world).to.equal "Hello, world!"
        expect(friend).to.equal "Hello, friend!"
        expect(error).to.equal \error
        expect(not-found).to.equal \not-found
        cb()
    
    it "can use a custom escape", #
      let template = egs """
      Hello, <%= name %>!
      """, escape: #(x) -> x.to-upper-case()
      
      (every-promise! {
        world: template name: "world"
        friend: template name: "friend"
        quoted: template name: '"friend"'
      }).then #({world, friend, quoted})
        expect(world).to.equal "Hello, WORLD!"
        expect(friend).to.equal "Hello, FRIEND!"
        expect(quoted).to.equal 'Hello, "FRIEND"!'
  
  describe "can render immediately", #
    it "without making a template first", #(cb)
      let promise = egs.render "Hello, <%= name %>!", name: "friend"
      expect(promise).to.have.property(\then)
        .that.is.a \function
      promise.then #(value)
        expect(value).to.equal "Hello, friend!"
        cb()
    
    it "uses the context property instead of options if provided", #(cb)
      let promise = egs.render "Hello, <%= name %>!", context: { name: "friend" }
      promise.then #(value)
        expect(value).to.equal "Hello, friend!"
        cb()
    
    it "allows for a data argument that overrides anything in the context", #(cb)
      let promise = egs.render "Hello, <%= name %>!", { context: { name: "friend" } }, name: "world"
      promise.then #(value)
        expect(value).to.equal "Hello, world!"
        cb()
