let egs = require '../index'
let {expect} = require 'chai'

describe "built-in helpers", #
  describe "'h'", #
    it "can allow HTML code to be unescaped", #
      let template = egs "Hello, <%=h name %>!"
      expect(template name: '<script>')
        .to.eventually.equal 'Hello, <script>!'
      