test "Normal template", #(cb)
  let code = """
  Hello, <%= not-a-function() %>!
  """
  async err, result <- egs.render code, {not-a-function: null}
  ok err
  cb()