(function () {
  "use strict";
  jQuery(function ($) {
    var $select, _len, examples, i, name;
    examples = [
      { name: "Hello, world!", template: "Hello, <%= name %>!", data: { name: "world" } },
      {
        name: "Email",
        template: "Dear <%= title %> <%= name %>,\n\n<%= message %>\n\n    <%= signoff %>,\n    <%= signature %>",
        data: {
          title: "Ms.",
          name: "Sarah Connor",
          message: "We have your son, John.",
          signoff: "Lovingly yours",
          signature: "Skynet"
        }
      },
      {
        name: "Conditional",
        template: "<% if user.is-authenticated: %>\n  Welcome, <%= user.name %>\n<% else: %>\n  You should log in.\n<% end %>",
        data: { user: { isAuthenticated: true, name: "Some guy" } }
      },
      {
        name: "Looping over an array",
        template: "<ul>\n  <% for product in products: %>\n    <li><%= product.name %>: $<%= product.price.to-fixed(2) %></li>\n  <% else: %>\n    <li>There are no items to show at this time.</li>\n  <% end %>\n</ul>",
        data: {
          products: [
            { name: "Apples", price: 1.28 },
            { name: "Bananas", price: 0.43 },
            { name: "Cherries", price: 4.5 },
            { name: "Dates", price: 2.99 }
          ]
        }
      },
      {
        name: "Escaping",
        template: 'Escaped: <%= escaped %>\nUnescaped: <%=h unescaped %>\n<script>var text = "<%=j js-escaped %>"</script>\nCustom escaped: <%= custom-escaped %>',
        data: "{\n  escaped: \"<script>alert('I am evil!')</script>\"\n  unescaped: \"<script>uhOh()</script>\"\n  js-escaped: '''\n  Newlines\n  Tabs\\tand double \"quotes\" and 'single quotes'\n  '''\n  custom-escaped: {\n    toHTML()\n      \"<span>Some text here</span>\"\n  }\n}"
      },
      {
        name: "Calling helpers",
        template: "There are <%= get-num-people() %> people online.",
        data: "{\n  get-num-people: # Math.random() * 100 \\ 1\n}"
      },
      {
        name: "Calling asynchronous helpers",
        template: "There are <%= yield get-num-people() %> people online.",
        data: "{\n  get-num-people: promise! #*\n    // take some time to figure it out\n    yield delay! 200_ms\n    Math.random() * 100 \\ 1\n}"
      },
      {
        name: "Streaming",
        template: "Let's start fetching some data: (at <%= Date() %>)\n<% for c from to-slow-text(text): %><%= yield c %><% end %>\nAnd we're done! (at <%= Date() %>)",
        data: "{\n  text: \"Hello, world! This part is being yielded in one character at a time.\"\n  to-slow-text: #(text as String)!*\n    for c in text\n      yield delay! 100_ms, ''\n      yield fulfilled! c\n}"
      },
      {
        name: "Comments",
        template: "<%-- This will not be included in the result source --%>\n<!-- But this, a normal HTML comment, will. -->",
        data: {}
      },
      {
        name: "Partials",
        template: "<%-- This actually won't work in this online compiler, since there is no filesystem --%>\n<% partial 'login' %>",
        data: {}
      },
      {
        name: "Inheritance",
        template: "<%-- This actually won't work in this online compiler, since there is no filesystem --%>\n<% extends 'layout' %>\n\n<% block body: %>\n  <h1>Hello!</h1>\n<% end %>",
        data: {}
      }
    ];
    $select = $("#try-examples select");
    for (i = 0, _len = examples.length; i < _len; ++i) {
      name = examples[i].name;
      $select.append($("<option />", { value: i, text: name }));
    }
    $select.change(function () {
      var example, index;
      index = Number($select.val());
      if (index === index) {
        example = examples[index];
        if (example) {
          $("#try-input-template").val(example.template);
          $("#try-input-data").val(typeof example.data === "string" ? example.data : JSON.stringify(example.data, null, 2));
        }
      }
      return false;
    });
    return $select.change();
  });
}.call(this));
