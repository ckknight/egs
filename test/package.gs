let egs = require '../index'
let {expect} = require 'chai'

describe "package", #
  it "should be able to set and render text", #
    let templates = egs.Package()
    templates.set "hello.egs", #(write, context)*
      write "Hello, "
      write context.name, true
      write "!"
    
    expect(templates.render "hello.egs", name: "world")
      .to.eventually.equal "Hello, world!"
  
  it "should be able to reference another file as a partial", #
    let templates = egs.Package()
    templates.set "_hello.egs", #(write, context)*
      write "Hello, "
      write context.name, true
      write "!"
    
    templates.set "use-hello.egs", #(write, context)*
      write "["
      yield context.partial "hello", write
      write "]"
    
    expect(templates.render "use-hello.egs", name: "world")
      .to.eventually.equal "[Hello, world!]"
  
  it "should be able to reference another file as a partial without extensions", #
    let templates = egs.Package()
    templates.set "_hello", #(write, context)*
      write "Hello, "
      write context.name, true
      write "!"
    
    templates.set "use-hello", #(write, context)*
      write "["
      yield context.partial "hello", write
      write "]"
    
    expect(templates.render "use-hello", name: "world")
      .to.eventually.equal "[Hello, world!]"
  
  it "should be able to reference another file as a layout", #
    let templates = egs.Package()
    templates.set "layout.egs", #(write, context)*
      write "["
      yield context.block "start", write
      write "]"
    
    templates.set "use-layout.egs", #(write, context)*
      context.extends "layout"
      
      yield context.block "start", write, #(write)*
        write "Hello!"
    
    expect(templates.render "use-layout.egs")
      .to.eventually.equal "[Hello!]"
  
  it "fails if attempting to extend two layouts", #
    let templates = egs.Package()
    templates.set "layout.egs", #(write, context)*
      write "["
      yield context.block "start", write
      write "]"
    
    templates.set "other-layout.egs", #(write, context)*
      write "("
      yield context.block "start", write
      write ")"
    
    templates.set "use-layout.egs", #(write, context)*
      context.extends "layout"
      context.extends "other-layout"
      
      yield context.block "start", write, #(write)*
        write "Hello!"
    
    expect(templates.render "use-layout.egs")
      .to.be.rejected.with egs.EgsError
  
  it "errors if an unknown file is rendered", #
    let templates = egs.Package()
    
    expect(templates.render "unknown.egs")
      .to.be.rejected.with egs.EgsError
  
  it "errors if an unknown file is referenced as a partial", #
    let templates = egs.Package()
    templates.set "use-unknown.egs", #(write, context)*
      write "["
      yield context.partial "unknown", write
      write "]"
    
    expect(templates.render "use-unknown.egs", name: "world")
      .to.be.rejected.with egs.EgsError
  
  it "errors if a partial extends a layout", #
    let templates = egs.Package()
    templates.set "layout.egs", #(write, context)*
      write "["
      yield context.block "start", write
      write "]"
    
    templates.set "_hello.egs", #(write, context)*
      context.extends "layout.egs"
      write "Hello, "
      write context.name, true
      write "!"
    
    templates.set "use-hello.egs", #(write, context)*
      write "["
      yield context.partial "hello", write
      write "]"
    
    expect(templates.render "use-hello.egs", name: "world")
      .to.be.rejected.with egs.EgsError
  
  it "errors if a partial uses a block", #
    let templates = egs.Package()
    templates.set "_hello.egs", #(write, context)*
      yield context.block "blah", write, #* ->
      write "Hello, "
      write context.name, true
      write "!"
    
    templates.set "use-hello.egs", #(write, context)*
      write "["
      yield context.partial "hello", write
      write "]"
    
    expect(templates.render "use-hello.egs", name: "world")
      .to.be.rejected.with egs.EgsError
  
  it "can retrieve individual templates from the package", #
    let templates = egs.Package()
    templates.set "hello.egs", #(write, context)*
      write "Hello, "
      write context.name, true
      write "!"
    let hello = templates.get "hello.egs"
    expect(hello name: "world")
      .to.eventually.equal "Hello, world!"
