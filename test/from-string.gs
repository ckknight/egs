let egs = require '../index'
let {expect} = require 'chai'

describe "from a string", #
  describe "can build a template", #
    it "can render", #
      let template = egs "Hello, <%= name %>!"
      expect(template).to.be.a \function
      let promise = template(name: "friend")
      expect(promise).to.have.property(\then)
        .that.is.a \function
      
      expect(promise).to.eventually.equal 'Hello, friend!'
  
    it "allows reuse of the template", #
      let template = egs "Hello, <%= name %>!"
      
      every-promise! [
        expect(template()).to.be.rejected.with TypeError
        expect(template(name: "friend")).to.eventually.equal "Hello, friend!"
        expect(template(name: 1234)).to.eventually.equal "Hello, 1234!"
        expect(template(name: '"friend"')).to.eventually.equal "Hello, &quot;friend&quot;!"
        expect(template(name: {})).to.be.rejected.with TypeError
      ]
    
    it "allows a template to be passed in a context that can be overridden", #
      let template = egs "Hello, <%= name %>!", name: "world"
      
      every-promise! [
        expect(template()).to.eventually.equal "Hello, world!"
        expect(template name: "egs").to.eventually.equal "Hello, egs!"
      ]
    
    it "allows if statements", #
      let template = egs """
      Hello, <%= name %>!
      <% if awesome: %>
      You're awesome!
      <% end %>
      """
      
      every-promise! [
        expect(template { name: "world", -awesome })
          .to.eventually.match r'^Hello, world!\s*$'
        expect(template { name: "egs", +awesome })
          .to.eventually.match r'^Hello, egs!\s*You''re awesome!\s*$'
      ]
    
    it "allows if-else statements", #
      let template = egs """
      Hello, <%= name %>!
      <% if awesome: %>
      You're awesome!
      <% else: %>
      Hope you're feeling better.
      <% end %>
      """
      
      every-promise! [
        expect(template { name: "world", -awesome })
          .to.eventually.match r'^Hello, world!\n\s*Hope you''re feeling better.\s*$'
        expect(template { name: "egs", +awesome })
          .to.eventually.match r'^Hello, egs!\n\s*You''re awesome!\s*$'
      ]
    
    it "allows custom tokens to be specified", #
      let template = egs """
      {% if awesome: %}
      You're awesome, {{ name }}!
      {% else: %}
      Hello, {{ name }}!
      {% end %}
      <%= name %>
      """, { open: "{%", close: "%}", open-write: "{{", close-write: "}}" }
      
      every-promise! [
        expect(template { name: "world", -awesome })
          .to.eventually.match r'^\s*Hello, world!\s*<%= name %>$'
        expect(template { name: "egs", +awesome })
          .to.eventually.match r'^\s*You''re awesome, egs!\s*<%= name %>$'
      ]
    
    it "allows helper functions to be called", #
      let template = egs """
      Hello, <%= get-name() %>!
      """
      
      every-promise! [
        expect(template { get-name() "world" })
          .to.eventually.equal "Hello, world!"
        expect(template { get-name() "friend" })
          .to.eventually.equal "Hello, friend!"
        expect(template { get-name() throw RangeError() })
          .to.be.rejected.with RangeError
        expect(template {})
          .to.be.rejected.with TypeError
      ]
    
    it "can use a custom escape", #
      let template = egs """
      Hello, <%= name %>!
      """, escape: #(x) -> x.to-upper-case()
      
      every-promise! [
        expect(template name: "world")
          .to.eventually.equal "Hello, WORLD!"
        expect(template name: "friend")
          .to.eventually.equal "Hello, FRIEND!"
        expect(template name: '"friend"')
          .to.eventually.equal 'Hello, "FRIEND"!'
      ]
    
    it "fails if attempting to use extends", #
      let template = egs """
      <% extends "blah" %>
      """
      
      expect(template())
        .to.be.rejected.with egs.EgsError
    
    it "fails if attempting to use partial", #
      let template = egs """
      <% partial "blah" %>
      """
      
      expect(template())
        .to.be.rejected.with egs.EgsError
  
  describe "can render immediately", #
    it "without making a template first", #
      expect(egs.render "Hello, <%= name %>!", name: "friend")
        .to.eventually.equal "Hello, friend!"
    
    it "uses the context property instead of options if provided", #
      expect(egs.render "Hello, <%= name %>!", context: { name: "friend" })
        .to.eventually.equal "Hello, friend!"
    
    it "allows for a data argument that overrides anything in the context", #
      expect(egs.render "Hello, <%= name %>!", { context: { name: "friend" } }, name: "world")
        .to.eventually.equal "Hello, world!"
