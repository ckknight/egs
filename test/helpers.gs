let egs = require '../index'
let {expect} = require 'chai'

describe "built-in helpers", #
  describe "'h'", #
    it "can allow HTML code to be unescaped", #
      let template = egs "Hello, <%=h name %>!"
      expect(template name: '<script>')
        .to.eventually.equal 'Hello, <script>!'
      
    it "can allow numbers", #
      let template = egs "Hello, <%=h name %>!"
      expect(template name: 1234)
        .to.eventually.equal 'Hello, 1234!'
    
    it "can be used outside of a write", #
      let template = egs "<% let x = h name %>Hello, <%= x %>!"
      expect(template name: '<script>')
        .to.eventually.equal 'Hello, <script>!'
      
    it "can have a default with 'or'", #
      let template = egs "Hello, <%=h name or 'world' %>!"
      every-promise! [
        expect(template())
          .to.eventually.equal 'Hello, world!'
        expect(template {})
          .to.eventually.equal 'Hello, world!'
        expect(template name: "friend")
          .to.eventually.equal 'Hello, friend!'
      ]