(function () {
  "use strict";
  var __create, RawHTML;
  __create = typeof Object.create === "function" ? Object.create
    : function (x) {
      function F() {}
      F.prototype = x;
      return new F();
    };
  RawHTML = (function () {
    var _RawHTML_prototype;
    function RawHTML(text) {
      var _this;
      _this = this instanceof RawHTML ? this : __create(_RawHTML_prototype);
      _this.text = text;
      return _this;
    }
    _RawHTML_prototype = RawHTML.prototype;
    RawHTML.displayName = "RawHTML";
    _RawHTML_prototype.toHTML = function () {
      return this.text;
    };
    return RawHTML;
  }());
  exports.h = exports.html = function (text) {
    return RawHTML(String(text));
  };
  exports.j = exports.javascript = (function () {
    var escapes, regex;
    escapes = {
      "\\": "\\\\",
      "\r": "\\r",
      "\u2028": "\\u2028",
      "\u2029": "\\u2029",
      "\n": "\\n",
      "\f": "\\f",
      "'": "\\'",
      '"': '\\"',
      "\t": "\\t"
    };
    function replacer(x) {
      return escapes[x];
    }
    regex = /[\\\r\u2028\u2029\n\f'"\t]/g;
    return function (text) {
      return RawHTML(String(text).replace(regex, replacer));
    };
  }());
}.call(this));
