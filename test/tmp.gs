let egs = require '../index'
let {expect} = require 'chai'
require! fs

it "should be able to reference another file as a partial", #
  let templates = egs.Package()
  templates.set "_hello.egs", #(write, context, helpers)
    "$(write)Hello, $(helpers.escape context.name)!"
  
  templates.set-generator "use-hello.egs", #(mutable write, context, helpers)*
    write &= "["
    write := yield helpers.partial.maybe-sync@ helpers, "hello", write, context
    write & "]"
  
  expect(templates.render-sync "use-hello.egs", name: "world")
    .to.equal "[Hello, world!]"
