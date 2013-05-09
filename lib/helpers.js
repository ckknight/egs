(function () {
  "use strict";
  var __create, __typeof, RawHTML;
  __create = typeof Object.create === "function" ? Object.create
    : function (x) {
      function F() {}
      F.prototype = x;
      return new F();
    };
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
      if (typeof text !== "string") {
        throw TypeError("Expected text to be a String, got " + __typeof(text));
      }
      _this.text = text;
      return _this;
    }
    _RawHTML_prototype = RawHTML.prototype;
    RawHTML.displayName = "RawHTML";
    _RawHTML_prototype.toString = function () {
      return this.text;
    };
    _RawHTML_prototype.toHTML = function () {
      return this.text;
    };
    return RawHTML;
  }());
  exports.h = function (text) {
    return RawHTML(String(text));
  };
}.call(this));
