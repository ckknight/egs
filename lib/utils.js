(function () {
  "use strict";
  exports.escapeHTML = (function () {
    var escapes, regex;
    escapes = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    function replacer(x) {
      return escapes[x];
    }
    regex = /[&<>"']/g;
    function escape(text) {
      return text.replace(regex, replacer);
    }
    return function (text) {
      if (text != null && typeof text.toHTML === "function") {
        return String(text.toHTML());
      } else {
        return escape(String(text));
      }
    };
  }());
}.call(this));
