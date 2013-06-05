jQuery #($)
  let examples = [
    {
      name: "Hello, world!"
      template: """
      Hello, <%= name %>!
      """
      data: {
        name: "world"
      }
    }
    {
      name: "Email"
      template: """
      Dear <%= title %> <%= name %>,
      
      <%= message %>
      
          <%= signoff %>,
          <%= signature %>
      """
      data: {
        title: "Ms."
        name: "Sarah Connor"
        message: "We have your son, John."
        signoff: "Lovingly yours"
        signature: "Skynet"
      }
    }
    {
      name: "Conditional"
      template: """
      <% if user.is-authenticated: %>
        Welcome, <%= user.name %>
      <% else: %>
        You should log in.
      <% end %>
      """
      data: {
        user: {
          +is-authenticated
          name: "Some guy"
        }
      }
    }
    {
      name: "Looping over an array"
      template: """
      <ul>
        <% for product in products: %>
          <li><%= product.name %>: \$<%= product.price.to-fixed(2) %></li>
        <% else: %>
          <li>There are no items to show at this time.</li>
        <% end %>
      </ul>
      """
      data: {
        products: [
          { name: "Apples", price: 1.28 }
          { name: "Bananas", price: 0.43 }
          { name: "Cherries", price: 4.50 }
          { name: "Dates", price: 2.99 }
        ]
      }
    }
    {
      name: "Escaping"
      template: """
      Escaped: <%= escaped %>
      Unescaped: <%=h unescaped %>
      <script>var text = "<%=j js-escaped %>"</script>
      Custom escaped: <%= custom-escaped %>
      """
      data: """
      {
        escaped: "<script>alert('I am evil!')</script>"
        unescaped: "<script>uhOh()</script>"
        js-escaped: '''
        Newlines
        Tabs\\tand double "quotes" and 'single quotes'
        '''
        custom-escaped: {
          toHTML()
            "<span>Some text here</span>"
        }
      }
      """
    }
    {
      name: "Calling helpers"
      template: """
      There are <%= get-num-people() %> people online.
      """
      data: """
      {
        get-num-people: # Math.random() * 100 \\ 1
      }
      """
    }
    {
      name: "Calling asynchronous helpers"
      template: """
      There are <%= yield get-num-people() %> people online.
      """
      data: """
      {
        get-num-people: promise! #*
          // take some time to figure it out
          yield delay! 200_ms
          Math.random() * 100 \\ 1
      }
      """
    }
    {
      name: "Streaming"
      template: """
      Let's start fetching some data: (at <%= Date() %>)
      <% for c from to-slow-text(text): %><%= yield c %><% end %>
      And we're done! (at <%= Date() %>)
      """
      data: """
      {
        text: "Hello, world! This part is being yielded in one character at a time."
        to-slow-text: #(text as String)!*
          for c in text
            yield delay! 100_ms, ''
            yield fulfilled! c
      }
      """
    }
    {
      name: "Comments"
      template: """
      <%-- This will not be included in the result source --%>
      <!-- But this, a normal HTML comment, will. -->
      """
      data: {}
    }
    {
      name: "Partials"
      template: """
      <%-- This actually won't work in this online compiler, since there is no filesystem --%>
      <% partial 'login' %>
      """
      data: {}
    }
    {
      name: "Inheritance"
      template: """
      <%-- This actually won't work in this online compiler, since there is no filesystem --%>
      <% extends 'layout' %>
      
      <% block body: %>
        <h1>Hello!</h1>
      <% end %>
      """
      data: {}
    }
  ]
  
  let $select = $("#try-examples select")
  for {name}, i in examples
    $select.append $("<option />", value: i, text: name)
  $select.change #
    let index = Number($select.val())
    if index isnt NaN
      let example = examples[index]
      if example
        $("#try-input-template").val(example.template)
        $("#try-input-data").val(if is-string! example.data then example.data else JSON.stringify(example.data, null, 2))
    false
  $select.change()