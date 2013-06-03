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
  exports.h = function (text) {
    return RawHTML(String(text));
  };
}.call(this));
