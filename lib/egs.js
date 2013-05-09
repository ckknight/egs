(function (GLOBAL) {
  "use strict";
  var __create, __import, __isArray, __lte, __num, __once, __owns, __slice, __strnum, __toArray, __typeof, compileCache, fileCache, findFileCache, fs, gorillascript, helpers, path, TextBuilder, utils;
  __create = typeof Object.create === "function" ? Object.create
    : function (x) {
      function F() {}
      F.prototype = x;
      return new F();
    };
  __import = function (dest, source) {
    var k;
    for (k in source) {
      if (__owns.call(source, k)) {
        dest[k] = source[k];
      }
    }
    return dest;
  };
  __isArray = typeof Array.isArray === "function" ? Array.isArray
    : (function () {
      var _toString;
      _toString = Object.prototype.toString;
      return function (x) {
        return _toString.call(x) === "[object Array]";
      };
    }());
  __lte = function (x, y) {
    var type;
    type = typeof x;
    if (type !== "number" && type !== "string") {
      throw TypeError("Cannot compare a non-number/string: " + type);
    } else if (type !== typeof y) {
      throw TypeError("Cannot compare elements of different types: " + type + " vs " + typeof y);
    } else {
      return x <= y;
    }
  };
  __num = function (num) {
    if (typeof num !== "number") {
      throw TypeError("Expected a number, got " + __typeof(num));
    } else {
      return num;
    }
  };
  __once = (function () {
    function replacement() {
      throw Error("Attempted to call function more than once");
    }
    function doNothing() {}
    return function (func, silentFail) {
      if (typeof func !== "function") {
        throw TypeError("Expected func to be a Function, got " + __typeof(func));
      }
      if (silentFail == null) {
        silentFail = false;
      } else if (typeof silentFail !== "boolean") {
        throw TypeError("Expected silentFail to be a Boolean, got " + __typeof(silentFail));
      }
      return function () {
        var f;
        f = func;
        func = silentFail ? doNothing : replacement;
        return f.apply(this, arguments);
      };
    };
  }());
  __owns = Object.prototype.hasOwnProperty;
  __slice = Array.prototype.slice;
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
  __toArray = function (x) {
    if (x == null) {
      throw TypeError("Expected an object, got " + __typeof(x));
    } else if (__isArray(x)) {
      return x;
    } else if (typeof x === "string") {
      return x.split("");
    } else {
      return __slice.call(x);
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
  gorillascript = require("gorillascript");
  fs = require("fs");
  path = require("path");
  helpers = require("./helpers");
  utils = require("./utils");
  function cache(shouldCache, obj, key, func, callback) {
    if (shouldCache) {
      if (__owns.call(obj, key)) {
        return callback(null, obj[key]);
      } else {
        return func(__once(function (_e, result) {
          if (_e != null) {
            return callback(_e);
          }
          return callback(null, obj[key] = result);
        }));
      }
    } else {
      return func(callback);
    }
  }
  function getPreludeMacros(callback) {
    if (typeof callback !== "function") {
      throw TypeError("Expected callback to be a Function, got " + __typeof(callback));
    }
    fs.readFile(__strnum(__dirname) + "/../src/egs-prelude.gs", "utf8", __once(function (_e, text) {
      if (_e != null) {
        return callback(_e);
      }
      return gorillascript.parse(text, __once(function (_e2, result) {
        if (_e2 != null) {
          return callback(_e2);
        }
        return callback(null, result.macros);
      }));
    }));
  }
  function compile(text, options, callback) {
    if (typeof text !== "string") {
      throw TypeError("Expected text to be a String, got " + __typeof(text));
    }
    if (typeof options !== "object" || options === null) {
      throw TypeError("Expected options to be an Object, got " + __typeof(options));
    }
    if (typeof callback !== "function") {
      throw TypeError("Expected callback to be a Function, got " + __typeof(callback));
    }
    getPreludeMacros(__once(function (_e, macros) {
      var _ref;
      if (_e != null) {
        return callback(_e);
      }
      return gorillascript.compile(
        text,
        ((_ref = __import({}, options)).embedded = true, _ref.noindent = true, _ref.macros = macros, _ref),
        __once(function (_e2, result) {
          var func;
          if (_e2 != null) {
            return callback(_e2);
          }
          func = Function("return " + __strnum(result.code))();
          return callback(null, func);
        })
      );
    }));
  }
  fileCache = {};
  function readFile(path, shouldCache, callback) {
    return cache(
      shouldCache,
      fileCache,
      path,
      function (cb) {
        return fs.readFile(path, "utf8", cb);
      },
      callback
    );
  }
  findFileCache = {};
  function findFile(name, fromFilename, shouldCache, callback) {
    return cache(
      shouldCache,
      findFileCache,
      name,
      function (cb) {
        var filename, match;
        filename = name;
        if (!path.extname(filename)) {
          match = /(\..*$)/.exec(path.basename(fromFilename));
          if (match) {
            filename = __strnum(filename) + __strnum(match[1]);
          }
        }
        return cb(null, path.join(path.dirname(fromFilename), filename));
      },
      callback
    );
  }
  function findAndGetCompiled(name, options, callback) {
    return findFile(name, options.filename, options.cache, __once(function (_e, filename) {
      if (_e != null) {
        return callback(_e);
      }
      return readFile(filename, options.cache, __once(function (_e2, text) {
        if (_e2 != null) {
          return callback(_e2);
        }
        return getCompiled(text, filename, options, callback);
      }));
    }));
  }
  TextBuilder = (function () {
    var _TextBuilder_prototype;
    function TextBuilder(escape) {
      var _this;
      _this = this instanceof TextBuilder ? this : __create(_TextBuilder_prototype);
      if (typeof escape !== "function") {
        throw TypeError("Expected escape to be a Function, got " + __typeof(escape));
      }
      _this.escape = escape;
      _this.head = { text: "", next: null };
      _this.write = _this.getWriter();
      return _this;
    }
    _TextBuilder_prototype = TextBuilder.prototype;
    TextBuilder.displayName = "TextBuilder";
    function toArray(node) {
      var current, sb;
      current = node;
      sb = [];
      while (current != null) {
        sb.push(current.text);
        current = current.next;
      }
      return sb;
    }
    _TextBuilder_prototype.inspect = function (depth) {
      var _arr, _arr2, _i, _len, array, part;
      for (_arr = [], _arr2 = __toArray(toArray(this.head)), _i = 0, _len = _arr2.length; _i < _len; ++_i) {
        part = _arr2[_i];
        if (part) {
          _arr.push(part);
        }
      }
      array = _arr;
      return "TextBuilder(" + __strnum(require("util").inspect(array, null, depth)) + ")";
    };
    _TextBuilder_prototype.build = function () {
      return toArray(this.head).join("");
    };
    _TextBuilder_prototype.getWriter = function (node) {
      var _this, current, disabled;
      _this = this;
      current = node || this.head;
      disabled = false;
      function write(data, shouldEscape) {
        var text;
        if (disabled) {
          return;
        }
        if (shouldEscape) {
          text = _this.escape(data);
        } else {
          text = String(data);
        }
        current = current.next = { text: text, next: current.next };
      }
      write.clone = function () {
        var result;
        result = _this.getWriter(current);
        current = current.next = { text: "", next: current.next };
        return result;
      };
      write.disable = function () {
        disabled = true;
      };
      return write;
    };
    return TextBuilder;
  }());
  function makeUid() {
    return __strnum(Math.random().toString(16).slice(2)) + "-" + __strnum(new Date().getTime());
  }
  function doNothing() {}
  function getStandardHelpers(options, context, callback) {
    var _ref, blocks, blockWriters, blockWritersDepth, depthKey, nameKey, pending;
    blocks = {};
    blockWriters = {};
    blockWritersDepth = {};
    pending = 1;
    function pend() {
      ++pending;
    }
    function handleWriters() {
      var bestName, block, depth, maxDepth, name;
      while (pending === 1) {
        maxDepth = -1;
        bestName = void 0;
        for (name in blockWritersDepth) {
          if (__owns.call(blockWritersDepth, name)) {
            depth = blockWritersDepth[name];
            if (__num(depth) > maxDepth && (__owns.call(blocks, name) ? blocks[name] : void 0)) {
              maxDepth = depth;
              bestName = name;
            }
          }
        }
        if (bestName != null) {
          block = blocks[bestName];
          blocks[bestName] = null;
          block(blockWriters[bestName]);
        } else {
          break;
        }
      }
    }
    function fulfill() {
      --pending;
      if (pending === 0) {
        ++pending;
        handleWriters();
        --pending;
        if (pending === 0) {
          callback();
        }
      }
    }
    nameKey = makeUid();
    depthKey = makeUid();
    (_ref = __import({}, helpers))[depthKey] = 0;
    _ref[nameKey] = options.filename;
    _ref.pend = pend;
    _ref.fulfill = fulfill;
    _ref.partial = function (name, write, locals) {
      if (typeof name !== "string") {
        throw TypeError("Expected name to be a String, got " + __typeof(name));
      }
      if (typeof write !== "function") {
        throw TypeError("Expected write to be a Function, got " + __typeof(write));
      }
      if (locals == null) {
        locals = {};
      }
      if (!options.filename) {
        return callback(Error("Can only use partial if the 'filename' option is specified"));
      }
      write = write.clone();
      pend();
      findAndGetCompiled(name, options, __once(function (_e, func) {
        var _ref;
        if (_e != null) {
          throw _e;
        }
        func(write, ((_ref = __import(__create(context), locals))[nameKey] = name, _ref));
        return fulfill();
      }));
    };
    _ref["extends"] = function (name, write, locals) {
      var _this;
      _this = this;
      if (typeof name !== "string") {
        throw TypeError("Expected name to be a String, got " + __typeof(name));
      }
      if (typeof write !== "function") {
        throw TypeError("Expected write to be a Function, got " + __typeof(write));
      }
      if (locals == null) {
        locals = {};
      }
      if (!options.filename) {
        return callback(Error("Can only use extends if the 'filename' option is specified"));
      }
      write.disable();
      write = write.clone();
      pend();
      findAndGetCompiled(name, options, __once(function (_e, func) {
        var _ref;
        if (_e != null) {
          throw _e;
        }
        func(write, ((_ref = __import(__create(context), locals))[depthKey] = __num(_this[depthKey]) + 1, _ref[nameKey] = name, _ref));
        return fulfill();
      }));
    };
    _ref.block = function (name, write, inside) {
      if (typeof name !== "string") {
        throw TypeError("Expected name to be a String, got " + __typeof(name));
      }
      if (typeof write !== "function") {
        throw TypeError("Expected write to be a Function, got " + __typeof(write));
      }
      if (inside == null) {
        inside = null;
      } else if (typeof inside !== "function") {
        throw TypeError("Expected inside to be one of Function or null, got " + __typeof(inside));
      }
      if (inside != null && !__owns.call(blocks, name)) {
        blocks[name] = inside;
      }
      if (!__owns.call(blockWriters, name) || !__lte(this[depthKey], blockWritersDepth[name])) {
        blockWriters[name] = write.clone();
        blockWritersDepth[name] = this[depthKey];
      }
    };
    return _ref;
  }
  compileCache = {};
  function getCompiled(text, key, options, callback) {
    if (typeof text !== "string") {
      throw TypeError("Expected text to be a String, got " + __typeof(text));
    }
    if (options.cache && !key) {
      return callback(Error("If 'cache' is enabled, the 'filename' option must be specified"));
    }
    cache(
      options.cache,
      compileCache,
      key,
      function (cb) {
        return compile(text, options, cb);
      },
      callback
    );
  }
  function makeContext(options, data, callback) {
    var context;
    if (typeof options !== "object" || options === null) {
      throw TypeError("Expected options to be an Object, got " + __typeof(options));
    }
    if (typeof data !== "object" || data === null) {
      throw TypeError("Expected data to be an Object, got " + __typeof(data));
    }
    if (typeof callback !== "function") {
      throw TypeError("Expected callback to be a Function, got " + __typeof(callback));
    }
    context = __create(GLOBAL);
    return __import(
      __import(
        __import(context, getStandardHelpers(options, context, callback)),
        options.context || {}
      ),
      data
    );
  }
  function build(text, options, callback) {
    var compiledFunc;
    if (typeof text !== "string") {
      throw TypeError("Expected text to be a String, got " + __typeof(text));
    }
    if (options == null) {
      options = {};
    }
    if (callback == null) {
      callback = null;
    } else if (typeof callback !== "function") {
      throw TypeError("Expected callback to be one of Function or null, got " + __typeof(callback));
    }
    if (typeof options === "function" && callback == null) {
      return build(text, {}, callback);
    }
    function fetch(callback) {
      if (compiledFunc != null) {
        return callback(null, compiledFunc);
      } else {
        return getCompiled(text, options.filename, options, __once(function (_e, func) {
          if (_e != null) {
            return callback(_e);
          }
          text = null;
          compiledFunc = func;
          return callback(null, compiledFunc);
        }));
      }
    }
    function render(data, callback) {
      if (data == null) {
        data = {};
      }
      if (typeof data === "function" && callback == null) {
        return render({}, data);
      }
      if (typeof callback !== "function") {
        throw TypeError("Expected callback to be a Function, got " + __typeof(callback));
      }
      return fetch(__once(function (_e, func) {
        var builder, context;
        if (_e != null) {
          return callback(_e);
        }
        builder = TextBuilder(typeof options.escape === "function" ? options.escape : utils.escapeHTML);
        context = makeContext(options, data, __once(function () {
          return callback(null, builder.build());
        }));
        func(builder.write, context);
        return context.fulfill();
      }));
    }
    if (callback != null) {
      return fetch(__once(function (_e) {
        if (_e != null) {
          return callback(_e);
        }
        return callback(null, render);
      }));
    } else {
      return render;
    }
  }
  function buildFile(path, options, callback) {
    if (typeof path !== "string") {
      throw TypeError("Expected path to be a String, got " + __typeof(path));
    }
    if (options == null) {
      options = {};
    }
    if (typeof options === "function" && callback == null) {
      return buildFile(path, {}, options);
    }
    if (typeof callback !== "function") {
      throw TypeError("Expected callback to be a Function, got " + __typeof(callback));
    }
    options.filename = path;
    readFile(path, options.cache, __once(function (_e, text) {
      if (_e != null) {
        return callback(_e);
      }
      return build(text, options, callback);
    }));
  }
  function render(text, options, callback) {
    if (typeof text !== "string") {
      throw TypeError("Expected text to be a String, got " + __typeof(text));
    }
    if (options == null) {
      options = {};
    }
    if (typeof options === "function" && callback == null) {
      return render(text, {}, options);
    }
    if (typeof callback !== "function") {
      throw TypeError("Expected callback to be a Function, got " + __typeof(callback));
    }
    build(text, options, __once(function (_e, run) {
      if (_e != null) {
        return callback(_e);
      }
      return run(
        options.context ? {} : options,
        callback
      );
    }));
  }
  function renderFile(path, options, callback) {
    if (typeof path !== "string") {
      throw TypeError("Expected path to be a String, got " + __typeof(path));
    }
    if (options == null) {
      options = {};
    }
    if (typeof options === "function" && callback == null) {
      return renderFile(path, {}, options);
    }
    if (typeof callback !== "function") {
      throw TypeError("Expected callback to be a Function, got " + __typeof(callback));
    }
    buildFile(path, options, __once(function (_e, run) {
      if (_e != null) {
        return callback(_e);
      }
      return run(
        options.context ? {} : options,
        callback
      );
    }));
  }
  module.exports = (build.buildFile = buildFile, build.render = render, build.renderFile = renderFile, build.__express = renderFile, build);
}.call(this, typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this));
