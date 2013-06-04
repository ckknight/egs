(function () {
  "use strict";
  var __strnum, __typeof;
  __strnum = function (strnum) {
    var type;
    type = typeof strnum;
    if (type === "string") {
      return strnum;
    } else if (type === "number") {
      return String(strnum);
    } else {
      throw TypeError("Expected a string or number, got " + __typeof(strnum));
    }
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
  Prism.languages.egs = Prism.languages.extend("gorillascript", { keyword: RegExp(__strnum(Prism.languages.gorillascript.keyword.source) + "|\\b(end|block|partial|extends)\\b", "g") });
  Prism.languages.insertBefore("egs", "operator", { property: /[\.@]\w[\d\w]*(\-\w[\d\w]*)*\b|\w[\d\w]*(\-\w[\d\w]*)*\s*(?!:\s*(?:%>|%&gt;)):/g });
  Prism.languages.insertBefore("egs", "keyword", { deliminator: /(%>|%&gt;|<%=?|&lt;=)/g });
  if (Prism.languages.markup) {
    Prism.languages.insertBefore("egs", "comment", {
      markup: {
        pattern: /(%>|%&gt;)[\w\W]*?(?=(<%|&lt;%))/g,
        lookbehind: true,
        inside: {
          markup: { pattern: /&lt;\/?[\w:-]+\s*[\w\W]*?&gt;/g, inside: Prism.languages.markup.tag.inside },
          rest: Prism.languages.egs
        }
      }
    });
  }
}.call(this));
