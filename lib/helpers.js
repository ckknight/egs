(function () {
  "use strict";
  var __create, __isArray, __typeof, RawHTML;
  __create = typeof Object.create === "function" ? Object.create
    : function (x) {
      function F() {}
      F.prototype = x;
      return new F();
    };
  __isArray = typeof Array.isArray === "function" ? Array.isArray
    : (function () {
      var _toString;
      _toString = Object.prototype.toString;
      return function (x) {
        return _toString.call(x) === "[object Array]";
      };
    }());
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
  exports.__maybeEscape = function (escape, arr) {
    if (typeof escape !== "function") {
      throw TypeError("Expected escape to be a Function, got " + __typeof(escape));
    }
    if (!__isArray(arr)) {
      throw TypeError("Expected arr to be an Array, got " + __typeof(arr));
    }
    if (arr[1]) {
      return escape(arr[0]);
    } else {
      return arr[0];
    }
  };
}.call(this));
