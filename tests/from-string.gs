test "Normal template", #(cb)
  let code = """
  Hello, <%= name %>!
  """
  async! throw, result <- egs.render code, {name: "world"}
  eq "Hello, world!", result
  cb()

test "If statement", #(cb)
  let code = """
  Hello, <%= name %>!
  <% if awesome: %>
  You're awesome!
  <% end %>
  """
  async! throw, result <- egs.render code, {name: "world", +awesome}
  eq "Hello, world! You're awesome!", result

  async! throw, result <- egs.render code, {name: "world", -awesome}
  eq "Hello, world!", result
  cb()

test "Custom tokens", #(cb)
  let code = """
  {% if awesome: %}
  You're awesome, {{ name }}!
  {% else: %}
  Hello, {{ name }}!
  {% end %}
  <%= name %>
  """

  async! throw, result <- egs.render code, {name: "world", +awesome, embedded-open: "{%", embedded-close: "%}", embedded-open-write: "{{", embedded-close-write: "}}"}
  eq "You're awesome, world! <%= name %>", result

  async! throw, result <- egs.render code, {name: "world", -awesome, embedded-open: "{%", embedded-close: "%}", embedded-open-write: "{{", embedded-close-write: "}}"}
  eq "Hello, world! <%= name %>", result
  
  cb()