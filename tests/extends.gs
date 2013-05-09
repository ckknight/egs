test "Non-overridden blocks are output in the layout", #(cb)
  async! throw, result <- egs.render-file "$__dirname/layout.html.egs", {}
  eq "Outer layout Default footer Done", result
  cb()

test "Overridden blocks are output, regardless of order", #(cb)
  async! throw, result <- egs.render-file "$__dirname/index.html.egs", {}
  eq "Outer layout Body override Footer override Done", result
  cb()

test "Multiple levels of extends", #(cb)
  async! throw, result <- egs.render-file "$__dirname/multiextend.html.egs", {}
  eq "Outer layout [Sub-body override] Default footer Done", result
  cb()
