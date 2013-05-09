test "Build reusable template", #(cb)
  let template = egs """
  Hello, <%= name %>!
  """
  
  async! throw, result <- template {name: "world"}
  eq "Hello, world!", result
  
  async! throw, result <- template {name: "friend"}
  eq "Hello, friend!", result
  
  cb()

test "Build file", #(cb)
  async! throw, template <- egs.build-file "$__dirname/layout.html.egs"
  async! throw, result <- template()
  eq "Outer layout Default footer Done", result
  cb()
