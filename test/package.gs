let egs = require '../index'
let {expect} = require 'chai'

describe "package", #
  it "should be able to set and render text", #
    let templates = egs.Package()
    templates.set "hello.egs", #(write, context, helpers)
      "$(write)Hello, $(helpers.escape context.name)!"
    
    let promises = []
    for [context, result] in [
        [{name: "world"}, "Hello, world!"]
        [{name: "friend"}, "Hello, friend!"]]
      expect(templates.render-sync "hello.egs", context)
        .to.equal result
      promises.push(expect(templates.render "hello.egs", context)
        .to.eventually.equal result)
    every-promise! promises
  
  it "should be able to reference another file as a partial", #
    let templates = egs.Package()
    templates.set "_hello.egs", #(write, context, helpers)
      "$(write)Hello, $(helpers.escape context.name)!"
    
    templates.set-generator "use-hello.egs", #(mutable write, context, helpers)*
      write &= "["
      write := yield helpers.partial "hello", write, context
      write & "]"
    
    let promises = []
    for [context, result] in [
        [{name: "world"}, "[Hello, world!]"]
        [{name: "friend"}, "[Hello, friend!]"]]
      expect(templates.render-sync "use-hello.egs", context)
        .to.equal result
      promises.push(expect(templates.render "use-hello.egs", context)
        .to.eventually.equal result)
    every-promise! promises
  
  it "should be able to reference another file as a partial without extensions", #
    let templates = egs.Package()
    templates.set "_hello", #(write, context, helpers)
      "$(write)Hello, $(helpers.escape context.name)!"
    
    templates.set-generator "use-hello", #(mutable write, context, helpers)*
      write &= "["
      write := yield helpers.partial "hello", write, context
      write & "]"
    
    expect(templates.render "use-hello", name: "world")
      .to.eventually.equal "[Hello, world!]"
  
  it "should be able to reference another file as a layout", #
    let templates = egs.Package()
    templates.set-generator "layout.egs", #(mutable write, context, helpers)*
      write &= "["
      write := yield helpers.block "start", write
      write & "]"
    
    templates.set-generator "use-layout.egs", #(write, context, helpers)*
      helpers.extends "layout"
      
      yield helpers.block "start", write, #(write)*
        write & "Hello!"
    
    expect(templates.render-sync "use-layout.egs")
      .to.equal "[Hello!]"
    expect(templates.render "use-layout.egs")
      .to.eventually.equal "[Hello!]"
  
  it "fails if attempting to extend two layouts", #
    let templates = egs.Package()
    templates.set-generator "layout.egs", #(mutable write, context, helpers)*
      write &= "["
      write := yield helpers.block "start", write
      write & "]"
    
    templates.set-generator "other-layout.egs", #(mutable write, context, helpers)*
      write &= "("
      write := yield helpers.block "start", write
      write & ")"
    
    templates.set-generator "use-layout.egs", #(mutable write, context, helpers)*
      helpers.extends "layout"
      helpers.extends "other-layout"
      
      yield helpers.block "start", write, #(write)*
        write & "Hello!"
    
    expect(templates.render "use-layout.egs")
      .to.be.rejected.with egs.EgsError
  
  it "errors if an unknown file is rendered", #
    let templates = egs.Package()
    
    expect(#-> templates.render-sync "unknown.egs")
      .throws egs.EgsError
    expect(templates.render "unknown.egs")
      .to.be.rejected.with egs.EgsError
  
  it "errors if an unknown file is referenced as a partial", #
    let templates = egs.Package()
    templates.set-generator "use-unknown.egs", #(mutable write, context, helpers)*
      write &= "["
      write := yield helpers.partial "unknown", write
      write & "]"
    
    expect(templates.render "use-unknown.egs", name: "world")
      .to.be.rejected.with egs.EgsError
  
  it "errors if a partial extends a layout", #
    let templates = egs.Package()
    templates.set-generator "layout.egs", #(mutable write, context, helpers)*
      write &= "["
      write := yield helpers.block "start", write
      write & "]"
    
    templates.set "_hello.egs", #(mutable write, context, helpers)
      helpers.extends "layout.egs"
    
    templates.set-generator "use-hello.egs", #(mutable write, context, helpers)*
      write &= "["
      write := yield helpers.partial "hello", write
      write & "]"
    
    expect(templates.render "use-hello.egs", name: "world")
      .to.be.rejected.with egs.EgsError
  
  it "errors if a partial uses a block", #
    let templates = egs.Package()
    templates.set-generator "_hello.egs", #(write, context, helpers)*
      yield helpers.block "blah", write, #* ->
    
    templates.set-generator "use-hello.egs", #(mutable write, context, helpers)*
      write &= "["
      write := yield helpers.partial "hello", write
      write & "]"
    
    expect(templates.render "use-hello.egs", name: "world")
      .to.be.rejected.with egs.EgsError
  
  it "can retrieve individual templates from the package", #
    let templates = egs.Package()
    templates.set "hello.egs", #(write, context, helpers)
      "$(write)Hello, $(helpers.escape context.name)!"
    let hello = templates.get "hello.egs"
    expect(hello name: "world")
      .to.eventually.equal "Hello, world!"
  
  it "can retrieve individual templates from the package and run them synchronously", #
    let templates = egs.Package()
    templates.set "hello.egs", #(write, context, helpers)
      "$(write)Hello, $(helpers.escape context.name)!"
    let hello = templates.get("hello.egs").sync
    expect(hello name: "world")
      .to.equal "Hello, world!"
