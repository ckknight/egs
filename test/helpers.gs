let egs = require '../index'
let {expect} = require 'chai'

describe "built-in helpers", #
  describe "'h'", #
    let template = egs "Hello, <%=h name %>!"
    it "can allow HTML code to be unescaped", #
      expect(template name: '<script>')
        .to.eventually.equal 'Hello, <script>!'
      
    it "can allow numbers", #
      expect(template name: 1234)
        .to.eventually.equal 'Hello, 1234!'
    
    it "errors on objects", #
      expect(template name: {})
        .to.be.rejected.with TypeError
    
    it "allows objects with a toHTML method", #
      expect(template name: { to-HTML() "world" })
        .to.eventually.equal "Hello, world!"
    
    