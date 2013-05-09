test "Using a partial", #(cb)
  async! throw, result <- egs.render-file "$__dirname/use-partial.html.egs", {}
  eq "Outer layout \"Hello\" Default footer Done", result
  cb()
