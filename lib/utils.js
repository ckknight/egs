(function () {
  "use strict";
  var __typeof;
  __typeof = (function () {
    var _toString;
    _toString = Object.prototype.toString;
    return function (o) {
      if (o === void 0) {
        return "Undefined";
      } else if (o === null) {
        return "Null";
      } else {
        return o.constructor && o.constructor.name || _toString.call(o).slice(8, -1);
      }
    };
  }());
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
    function escaper(text) {
      return text.replace(regex, replacer);
    }
    return function (value) {
      if (typeof value === "string") {
        return escaper(value);
      } else if (typeof value === "number") {
        return value.toString();
      } else if (value != null && typeof value.toHTML === "function") {
        return String(value.toHTML());
      } else {
        throw TypeError("Expected a String, Number, or Object with a toHTML method, got " + __typeof(value));
      }
    };
  }());
}.call(this));
