(function (GLOBAL) {
  "use strict";
  var __create, __defer, __fromPromise, __generator, __generatorToPromise, __import, __isArray, __owns, __promise, __slice, __strnum, __toArray, __toPromise, __typeof, buildFromFile, compile, findAndGetCompiled, findFile, fs, getCompiled, getPreludeMacros, gorillascript, handleExtendsKey, helpers, path, readFile, render, renderFile, setImmediate, utils, writeKey;
  __create = typeof Object.create === "function" ? Object.create
    : function (x) {
      function F() {}
      F.prototype = x;
      return new F();
    };
  __defer = (function () {
    function __defer() {
      var deferred, isError, value;
      isError = false;
      value = null;
      deferred = [];
      function complete(newIsError, newValue) {
        var funcs;
        if (deferred) {
          funcs = deferred;
          deferred = null;
          isError = newIsError;
          value = newValue;
          if (funcs.length) {
            setImmediate(function () {
              var _end, i;
              for (i = 0, _end = funcs.length; i < _end; ++i) {
                funcs[i]();
              }
            });
          }
        }
      }
      return {
        promise: {
          then: function (onFulfilled, onRejected, allowSync) {
            var _ref, fulfill, promise, reject;
            if (allowSync !== true) {
              allowSync = void 0;
            }
            promise = (_ref = __defer()).promise;
            fulfill = _ref.fulfill;
            reject = _ref.reject;
            function step() {
              var f, result;
              try {
                if (isError) {
                  f = onRejected;
                } else {
                  f = onFulfilled;
                }
                if (typeof f === "function") {
                  result = f(value);
                  if (result && typeof result.then === "function") {
                    result.then(fulfill, reject, allowSync);
                  } else {
                    fulfill(result);
                  }
                } else {
                  (isError ? reject : fulfill)(value);
                }
              } catch (e) {
                reject(e);
              }
            }
            if (deferred) {
              deferred.push(step);
            } else if (allowSync) {
              step();
            } else {
              setImmediate(step);
            }
            return promise;
          },
          sync: function () {
            var result, state;
            state = 0;
            result = 0;
            this.then(
              function (ret) {
                state = 1;
                return result = ret;
              },
              function (err) {
                state = 2;
                return result = err;
              },
              true
            );
            switch (state) {
            case 0: throw Error("Promise did not execute synchronously");
            case 1: return result;
            case 2: throw result;
            default: throw Error("Unknown state");
            }
          }
        },
        fulfill: function (value) {
          complete(false, value);
        },
        reject: function (reason) {
          complete(true, reason);
        }
      };
    }
    __defer.fulfilled = function (value) {
      var d;
      d = __defer();
      d.fulfill(value);
      return d.promise;
    };
    __defer.rejected = function (reason) {
      var d;
      d = __defer();
      d.reject(reason);
      return d.promise;
    };
    return __defer;
  }());
  __fromPromise = function (promise) {
    if (typeof promise !== "object" || promise === null) {
      throw TypeError("Expected promise to be an Object, got " + __typeof(promise));
    } else if (typeof promise.then !== "function") {
      throw TypeError("Expected promise.then to be a Function, got " + __typeof(promise.then));
    }
    return function (callback) {
      promise.then(
        function (value) {
          return setImmediate(callback, null, value);
        },
        function (reason) {
          return setImmediate(callback, reason);
        }
      );
    };
  };
  __generator = function (func) {
    return function () {
      var _this, data;
      _this = this;
      data = [this, __slice.call(arguments)];
      return {
        iterator: function () {
          return this;
        },
        send: function () {
          var tmp;
          return {
            done: true,
            value: data ? (tmp = data, data = null, func.apply(tmp[0], tmp[1])) : void 0
          };
        },
        next: function () {
          return this.send();
        },
        "throw": function (err) {
          data = null;
          throw err;
        }
      };
    };
  };
  __generatorToPromise = function (generator, allowSync) {
    if (typeof generator !== "object" || generator === null) {
      throw TypeError("Expected generator to be an Object, got " + __typeof(generator));
    } else {
      if (typeof generator.send !== "function") {
        throw TypeError("Expected generator.send to be a Function, got " + __typeof(generator.send));
      }
      if (typeof generator["throw"] !== "function") {
        throw TypeError("Expected generator.throw to be a Function, got " + __typeof(generator["throw"]));
      }
    }
    if (allowSync == null) {
      allowSync = false;
    } else if (typeof allowSync !== "boolean") {
      throw TypeError("Expected allowSync to be a Boolean, got " + __typeof(allowSync));
    }
    function continuer(verb, arg) {
      var item;
      try {
        item = generator[verb](arg);
      } catch (e) {
        return __defer.rejected(e);
      }
      if (item.done) {
        return __defer.fulfilled(item.value);
      } else {
        return item.value.then(callback, errback, allowSync);
      }
    }
    function callback(value) {
      return continuer("send", value);
    }
    function errback(value) {
      return continuer("throw", value);
    }
    return callback(void 0);
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
  __owns = Object.prototype.hasOwnProperty;
  __promise = function (value, allowSync) {
    var factory;
    if (allowSync == null) {
      allowSync = false;
    } else if (typeof allowSync !== "boolean") {
      throw TypeError("Expected allowSync to be a Boolean, got " + __typeof(allowSync));
    }
    if (typeof value === "function") {
      factory = function () {
        return __generatorToPromise(value.apply(this, arguments));
      };
      factory.sync = function () {
        return __generatorToPromise(
          value.apply(this, arguments),
          true
        ).sync();
      };
      return factory;
    } else {
      return __generatorToPromise(value, allowSync);
    }
  };
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
  __toPromise = function (func, context, args) {
    var d;
    if (typeof func !== "function") {
      throw TypeError("Expected func to be a Function, got " + __typeof(func));
    }
    d = __defer();
    func.apply(context, __toArray(args).concat([
      function (err, value) {
        if (err != null) {
          d.reject(err);
        } else {
          d.fulfill(value);
        }
      }
    ]));
    return d.promise;
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
  setImmediate = typeof GLOBAL.setImmediate === "function" ? GLOBAL.setImmediate
    : typeof process !== "undefined" && typeof process.nextTick === "function"
    ? (function () {
      var nextTick;
      nextTick = process.nextTick;
      return function (func) {
        var args;
        if (typeof func !== "function") {
          throw TypeError("Expected func to be a Function, got " + __typeof(func));
        }
        args = __slice.call(arguments, 1);
        if (args.length) {
          return nextTick(function () {
            func.apply(void 0, __toArray(args));
          });
        } else {
          return nextTick(func);
        }
      };
    }())
    : function (func) {
      var args;
      if (typeof func !== "function") {
        throw TypeError("Expected func to be a Function, got " + __typeof(func));
      }
      args = __slice.call(arguments, 1);
      if (args.length) {
        return setTimeout(
          function () {
            func.apply(void 0, __toArray(args));
          },
          0
        );
      } else {
        return setTimeout(func, 0);
      }
    };
  gorillascript = require("gorillascript");
  fs = require("fs");
  path = require("path");
  helpers = require("./helpers");
  utils = require("./utils");
  readFile = (function () {
    var fileCache;
    function read(path) {
      return __toPromise(fs.readFile, fs, [path, "utf8"]);
    }
    fileCache = {};
    return function (path, shouldCache) {
      if (shouldCache) {
        if (__owns.call(fileCache, path)) {
          return fileCache[path];
        } else {
          return fileCache[path] = read(path);
        }
      } else {
        return read(path);
      }
    };
  }());
  findFile = (function () {
    var find, findFileCache;
    find = __promise(__generator(function (name, fromFilename) {
      var match;
      if (!path.extname(name)) {
        match = /(\.[^\/\\]*$)/.exec(path.basename(fromFilename));
        if (match) {
          name = __strnum(name) + __strnum(match[1]);
        }
      }
      return path.join(path.dirname(fromFilename), name);
    }));
    findFileCache = {};
    return function (name, fromFilename, shouldCache) {
      var _ref;
      if (shouldCache) {
        if (__owns.call(findFileCache, _ref = __strnum(name) + "\u0000" + __strnum(fromFilename))) {
          return findFileCache[_ref];
        } else {
          return findFileCache[_ref] = find(name, fromFilename);
        }
      } else {
        return find(name, fromFilename);
      }
    };
  }());
  getPreludeMacros = (function () {
    var cache;
    return function () {
      if (cache != null) {
        return cache;
      }
      return cache = __generatorToPromise((function () {
        var _e, _send, _state, _step, result, text;
        _state = 0;
        function _close() {
          _state = 3;
        }
        function _step(_received) {
          while (true) {
            switch (_state) {
            case 0:
              ++_state;
              return {
                done: false,
                value: __toPromise(fs.readFile, fs, [__strnum(__dirname) + "/../src/egs-prelude.gs", "utf8"])
              };
            case 1:
              text = _received;
              ++_state;
              return {
                done: false,
                value: __toPromise(gorillascript.parse, gorillascript, [text])
              };
            case 2:
              result = _received;
              ++_state;
              return { done: true, value: result.macros };
            case 3:
              return { done: true, value: void 0 };
            default: throw Error("Unknown state: " + _state);
            }
          }
        }
        function _send(_received) {
          try {
            return _step(_received);
          } catch (_e) {
            _close();
            throw _e;
          }
        }
        return {
          close: _close,
          iterator: function () {
            return this;
          },
          next: function () {
            return _send(void 0);
          },
          send: _send,
          "throw": function (e) {
            _close();
            throw e;
          }
        };
      }()));
    };
  }());
  compile = __promise(function (text, options) {
    var _e, _ref, _send, _state, _step, macros, result;
    _state = 0;
    function _close() {
      _state = 3;
    }
    function _step(_received) {
      while (true) {
        switch (_state) {
        case 0:
          if (typeof text !== "string") {
            throw TypeError("Expected text to be a String, got " + __typeof(text));
          }
          if (typeof options !== "object" || options === null) {
            throw TypeError("Expected options to be an Object, got " + __typeof(options));
          }
          ++_state;
          return { done: false, value: getPreludeMacros() };
        case 1:
          macros = _received;
          ++_state;
          return {
            done: false,
            value: __toPromise(gorillascript.compile, gorillascript, [
              text,
              ((_ref = __import({}, options)).embedded = true, _ref.embeddedGenerator = true, _ref.noindent = true, _ref.macros = macros, _ref)
            ])
          };
        case 2:
          result = _received;
          ++_state;
          return { done: true, value: Function("return " + __strnum(result.code))() };
        case 3:
          return { done: true, value: void 0 };
        default: throw Error("Unknown state: " + _state);
        }
      }
    }
    function _send(_received) {
      try {
        return _step(_received);
      } catch (_e) {
        _close();
        throw _e;
      }
    }
    return {
      close: _close,
      iterator: function () {
        return this;
      },
      next: function () {
        return _send(void 0);
      },
      send: _send,
      "throw": function (e) {
        _close();
        throw e;
      }
    };
  });
  getCompiled = (function () {
    var compileCache;
    compileCache = {};
    return function (text, key, options) {
      if (typeof text !== "string") {
        throw TypeError("Expected text to be a String, got " + __typeof(text));
      }
      if (options == null) {
        options = {};
      }
      if (options.cache && !key) {
        throw Error("If 'cache' is enabled, the 'filename' option must be specified");
      }
      if (options.cache) {
        if (__owns.call(compileCache, key)) {
          return compileCache[key];
        } else {
          return compileCache[key] = compile(text, options);
        }
      } else {
        return compile(text, options);
      }
    };
  }());
  findAndGetCompiled = __promise(function (name, fromFilename, options) {
    var _e, _send, _state, _step, compiled, filename, text;
    _state = 0;
    function _close() {
      _state = 4;
    }
    function _step(_received) {
      while (true) {
        switch (_state) {
        case 0:
          if (options == null) {
            options = {};
          }
          ++_state;
          return {
            done: false,
            value: findFile(name, fromFilename, options.cache)
          };
        case 1:
          filename = _received;
          ++_state;
          return {
            done: false,
            value: readFile(filename, options.cache)
          };
        case 2:
          text = _received;
          ++_state;
          return {
            done: false,
            value: getCompiled(text, filename, options)
          };
        case 3:
          compiled = _received;
          ++_state;
          return {
            done: true,
            value: { filename: filename, compiled: compiled }
          };
        case 4:
          return { done: true, value: void 0 };
        default: throw Error("Unknown state: " + _state);
        }
      }
    }
    function _send(_received) {
      try {
        return _step(_received);
      } catch (_e) {
        _close();
        throw _e;
      }
    }
    return {
      close: _close,
      iterator: function () {
        return this;
      },
      next: function () {
        return _send(void 0);
      },
      send: _send,
      "throw": function (e) {
        _close();
        throw e;
      }
    };
  });
  function makeTextWriter(escape) {
    var data;
    data = [];
    function write(value, shouldEscape) {
      if (data) {
        return data.push(String(shouldEscape ? escape(value) : value));
      }
    }
    write.disable = function () {
      data = null;
    };
    write.isDisabled = function () {
      return data === null;
    };
    write.build = function () {
      return data.join("");
    };
    return write;
  }
  function makeUid() {
    return __strnum(Math.random().toString(16).slice(2)) + "-" + __strnum(new Date().getTime());
  }
  handleExtendsKey = makeUid();
  writeKey = makeUid();
  function makeStandardHelpers(options) {
    var _ref, blocks, escape, extendedByKey, extendedByLocalsKey, inPartialKey, nameKey, write;
    nameKey = makeUid();
    extendedByKey = makeUid();
    extendedByLocalsKey = makeUid();
    inPartialKey = makeUid();
    blocks = {};
    if (typeof options.escape === "function") {
      escape = options.escape;
    } else {
      escape = utils.escapeHTML;
    }
    write = makeTextWriter(escape);
    (_ref = __import({}, helpers))[nameKey] = options.filename;
    _ref[extendedByKey] = null;
    _ref[extendedByLocalsKey] = null;
    _ref[inPartialKey] = false;
    _ref[writeKey] = write;
    _ref["extends"] = function (name, locals) {
      if (typeof name !== "string") {
        throw TypeError("Expected name to be a String, got " + __typeof(name));
      }
      if (locals == null) {
        locals = {};
      }
      if (!options.filename) {
        throw Error("Can only use extends if the 'filename' option is specified");
      }
      if (this[inPartialKey]) {
        throw Error("Cannot use extends when in a partial");
      }
      if (this[extendedByKey]) {
        throw Error("Cannot use extends more than once");
      }
      this[writeKey].disable();
      this[extendedByKey] = findAndGetCompiled(name, this[nameKey], options);
      this[extendedByLocalsKey] = locals;
    };
    _ref.partial = __promise(function (name, write, locals) {
      var _e, _ref, _send, _state, _step, _this, compiled, filename, partialPrefix;
      _this = this;
      _state = 0;
      function _close() {
        _state = 2;
      }
      function _step(_received) {
        while (true) {
          switch (_state) {
          case 0:
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
              throw Error("Can only use partial if the 'filename' option is specified");
            }
            if (typeof options.partialPrefix === "string") {
              partialPrefix = options.partialPrefix;
            } else {
              partialPrefix = "_";
            }
            name = path.join(path.dirname(name), "" + partialPrefix + path.basename(name));
            ++_state;
            return {
              done: false,
              value: findAndGetCompiled(name, _this[nameKey], options)
            };
          case 1:
            _ref = _received;
            filename = _ref.filename;
            compiled = _ref.compiled;
            ++_state;
            return {
              done: false,
              value: __promise(compiled(write, ((_ref = __import(__create(_this), locals))[nameKey] = filename, _ref[inPartialKey] = true, _ref)))
            };
          case 2:
            return { done: true, value: void 0 };
          default: throw Error("Unknown state: " + _state);
          }
        }
      }
      function _send(_received) {
        try {
          return _step(_received);
        } catch (_e) {
          _close();
          throw _e;
        }
      }
      return {
        close: _close,
        iterator: function () {
          return this;
        },
        next: function () {
          return _send(void 0);
        },
        send: _send,
        "throw": function (e) {
          _close();
          throw e;
        }
      };
    });
    _ref.block = __promise(function (name, write, inside) {
      var _e, _send, _state, _step, _this, block;
      _this = this;
      _state = 0;
      function _close() {
        _state = 4;
      }
      function _step(_received) {
        while (true) {
          switch (_state) {
          case 0:
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
            if (_this[inPartialKey]) {
              throw Error("Cannot use block when in a partial");
            }
            _state = write.isDisabled() ? 1 : 2;
            break;
          case 1:
            if (inside != null && !__owns.call(blocks, name)) {
              blocks[name] = inside;
            }
            _state = 4;
            break;
          case 2:
            block = __owns.call(blocks, name) && blocks[name] || inside;
            _state = block ? 3 : 4;
            break;
          case 3:
            ++_state;
            return { done: false, value: __promise(block(write)) };
          case 4:
            return { done: true, value: void 0 };
          default: throw Error("Unknown state: " + _state);
          }
        }
      }
      function _send(_received) {
        try {
          return _step(_received);
        } catch (_e) {
          _close();
          throw _e;
        }
      }
      return {
        close: _close,
        iterator: function () {
          return this;
        },
        next: function () {
          return _send(void 0);
        },
        send: _send,
        "throw": function (e) {
          _close();
          throw e;
        }
      };
    });
    _ref[handleExtendsKey] = __promise(function (locals) {
      var _e, _ref, _send, _state, _step, _this, compiled, extendedBy, filename, newContext, write;
      _this = this;
      _state = 0;
      function _close() {
        _state = 6;
      }
      function _step(_received) {
        while (true) {
          switch (_state) {
          case 0:
            if (locals == null) {
              locals = {};
            }
            extendedBy = _this[extendedByKey];
            _state = !extendedBy ? 1 : 2;
            break;
          case 1:
            _state = 6;
            return { done: true, value: _this[writeKey].build() };
          case 2:
            write = makeTextWriter(escape);
            ++_state;
            return { done: false, value: extendedBy };
          case 3:
            _ref = _received;
            filename = _ref.filename;
            compiled = _ref.compiled;
            (_ref = __import(__create(_this), _this[extendedByLocalsKey]))[nameKey] = filename;
            _ref[extendedByKey] = null;
            _ref[extendedByLocalsKey] = null;
            _ref[writeKey] = write;
            newContext = _ref;
            ++_state;
            return {
              done: false,
              value: __promise(compiled(write, newContext))
            };
          case 4:
            ++_state;
            return { done: false, value: newContext[handleExtendsKey]() };
          case 5:
            ++_state;
            return { done: true, value: _received };
          case 6:
            return { done: true, value: void 0 };
          default: throw Error("Unknown state: " + _state);
          }
        }
      }
      function _send(_received) {
        try {
          return _step(_received);
        } catch (_e) {
          _close();
          throw _e;
        }
      }
      return {
        close: _close,
        iterator: function () {
          return this;
        },
        next: function () {
          return _send(void 0);
        },
        send: _send,
        "throw": function (e) {
          _close();
          throw e;
        }
      };
    });
    return _ref;
  }
  function makeContext(options, data) {
    if (typeof options !== "object" || options === null) {
      throw TypeError("Expected options to be an Object, got " + __typeof(options));
    }
    if (typeof data !== "object" || data === null) {
      throw TypeError("Expected data to be an Object, got " + __typeof(data));
    }
    return __import(
      __import(
        __import(__create(GLOBAL), makeStandardHelpers(options)),
        options.context || options
      ),
      data
    );
  }
  function build(text, options) {
    var funcP;
    if (typeof text !== "string") {
      throw TypeError("Expected text to be a String, got " + __typeof(text));
    }
    if (options == null) {
      options = {};
    }
    funcP = __generatorToPromise((function () {
      var _e, _send, _state, _step;
      _state = 0;
      function _close() {
        _state = 2;
      }
      function _step(_received) {
        while (true) {
          switch (_state) {
          case 0:
            ++_state;
            return {
              done: false,
              value: getCompiled(text, options.filename, options)
            };
          case 1:
            ++_state;
            return { done: true, value: _received };
          case 2:
            return { done: true, value: void 0 };
          default: throw Error("Unknown state: " + _state);
          }
        }
      }
      function _send(_received) {
        try {
          return _step(_received);
        } catch (_e) {
          _close();
          throw _e;
        }
      }
      return {
        close: _close,
        iterator: function () {
          return this;
        },
        next: function () {
          return _send(void 0);
        },
        send: _send,
        "throw": function (e) {
          _close();
          throw e;
        }
      };
    }()));
    return __promise(function (data) {
      var _e, _send, _state, _step, context, func, text;
      _state = 0;
      function _close() {
        _state = 4;
      }
      function _step(_received) {
        while (true) {
          switch (_state) {
          case 0:
            if (data == null) {
              data = {};
            }
            ++_state;
            return { done: false, value: funcP };
          case 1:
            func = _received;
            context = makeContext(options, data);
            ++_state;
            return {
              done: false,
              value: __promise(func(context[writeKey], context))
            };
          case 2:
            ++_state;
            return { done: false, value: context[handleExtendsKey]() };
          case 3:
            text = _received;
            ++_state;
            return { done: true, value: text };
          case 4:
            return { done: true, value: void 0 };
          default: throw Error("Unknown state: " + _state);
          }
        }
      }
      function _send(_received) {
        try {
          return _step(_received);
        } catch (_e) {
          _close();
          throw _e;
        }
      }
      return {
        close: _close,
        iterator: function () {
          return this;
        },
        next: function () {
          return _send(void 0);
        },
        send: _send,
        "throw": function (e) {
          _close();
          throw e;
        }
      };
    });
  }
  function makeCacheKey(options) {
    var _arr, _i, _len, key, parts;
    parts = [];
    for (_arr = [
      "filename",
      "embeddedOpen",
      "embeddedOpenWrite",
      "embeddedOpenComment",
      "embeddedClose",
      "embeddedCloseWrite",
      "embeddedCloseComment"
    ], _i = 0, _len = _arr.length; _i < _len; ++_i) {
      key = _arr[_i];
      parts.push(options[key] || "");
    }
    if (typeof options.partialPrefix === "string") {
      parts.push(options.partialPrefix);
    } else {
      parts.push("_");
    }
    return parts.join("\u0000");
  }
  buildFromFile = (function () {
    var buildFromFileCache;
    function getBuilder(path, options) {
      var buildP;
      buildP = __generatorToPromise((function () {
        var _e, _send, _state, _step, text;
        _state = 0;
        function _close() {
          _state = 2;
        }
        function _step(_received) {
          while (true) {
            switch (_state) {
            case 0:
              ++_state;
              return {
                done: false,
                value: readFile(path, options.cache)
              };
            case 1:
              text = _received;
              ++_state;
              return {
                done: true,
                value: build(text, options)
              };
            case 2:
              return { done: true, value: void 0 };
            default: throw Error("Unknown state: " + _state);
            }
          }
        }
        function _send(_received) {
          try {
            return _step(_received);
          } catch (_e) {
            _close();
            throw _e;
          }
        }
        return {
          close: _close,
          iterator: function () {
            return this;
          },
          next: function () {
            return _send(void 0);
          },
          send: _send,
          "throw": function (e) {
            _close();
            throw e;
          }
        };
      }()));
      return __promise(function (data) {
        var _e, _send, _state, _step, builder;
        _state = 0;
        function _close() {
          _state = 3;
        }
        function _step(_received) {
          while (true) {
            switch (_state) {
            case 0:
              if (data == null) {
                data = {};
              }
              ++_state;
              return { done: false, value: buildP };
            case 1:
              builder = _received;
              ++_state;
              return { done: false, value: builder(data) };
            case 2:
              ++_state;
              return { done: true, value: _received };
            case 3:
              return { done: true, value: void 0 };
            default: throw Error("Unknown state: " + _state);
            }
          }
        }
        function _send(_received) {
          try {
            return _step(_received);
          } catch (_e) {
            _close();
            throw _e;
          }
        }
        return {
          close: _close,
          iterator: function () {
            return this;
          },
          next: function () {
            return _send(void 0);
          },
          send: _send,
          "throw": function (e) {
            _close();
            throw e;
          }
        };
      });
    }
    buildFromFileCache = {};
    return function (path, options) {
      var _ref;
      if (typeof path !== "string") {
        throw TypeError("Expected path to be a String, got " + __typeof(path));
      }
      if (options == null) {
        options = {};
      }
      options.filename = path;
      if (options.cache) {
        if (__owns.call(buildFromFileCache, _ref = makeCacheKey(options))) {
          return buildFromFileCache[_ref];
        } else {
          return buildFromFileCache[_ref] = getBuilder(path, options);
        }
      } else {
        return getBuilder(path, options);
      }
    };
  }());
  render = __promise(function (text, options, data) {
    var _e, _send, _state, _step, template;
    _state = 0;
    function _close() {
      _state = 2;
    }
    function _step(_received) {
      while (true) {
        switch (_state) {
        case 0:
          if (typeof text !== "string") {
            throw TypeError("Expected text to be a String, got " + __typeof(text));
          }
          if (options == null) {
            options = {};
          }
          template = build(text, options);
          ++_state;
          return { done: false, value: template(data) };
        case 1:
          ++_state;
          return { done: true, value: _received };
        case 2:
          return { done: true, value: void 0 };
        default: throw Error("Unknown state: " + _state);
        }
      }
    }
    function _send(_received) {
      try {
        return _step(_received);
      } catch (_e) {
        _close();
        throw _e;
      }
    }
    return {
      close: _close,
      iterator: function () {
        return this;
      },
      next: function () {
        return _send(void 0);
      },
      send: _send,
      "throw": function (e) {
        _close();
        throw e;
      }
    };
  });
  renderFile = __promise(function (path, options, data) {
    var _e, _send, _state, _step, template;
    _state = 0;
    function _close() {
      _state = 2;
    }
    function _step(_received) {
      while (true) {
        switch (_state) {
        case 0:
          if (typeof path !== "string") {
            throw TypeError("Expected path to be a String, got " + __typeof(path));
          }
          if (options == null) {
            options = {};
          }
          template = buildFromFile(path, options);
          ++_state;
          return { done: false, value: template(data) };
        case 1:
          ++_state;
          return { done: true, value: _received };
        case 2:
          return { done: true, value: void 0 };
        default: throw Error("Unknown state: " + _state);
        }
      }
    }
    function _send(_received) {
      try {
        return _step(_received);
      } catch (_e) {
        _close();
        throw _e;
      }
    }
    return {
      close: _close,
      iterator: function () {
        return this;
      },
      next: function () {
        return _send(void 0);
      },
      send: _send,
      "throw": function (e) {
        _close();
        throw e;
      }
    };
  });
  module.exports = (build.fromFile = buildFromFile, build.render = render, build.renderFile = renderFile, build.__express = function (path, options, callback) {
    var fun;
    if (typeof path !== "string") {
      throw TypeError("Expected path to be a String, got " + __typeof(path));
    }
    if (options == null) {
      options = {};
    }
    if (typeof callback !== "function") {
      throw TypeError("Expected callback to be a Function, got " + __typeof(callback));
    }
    fun = __fromPromise(renderFile(path, options));
    fun(callback);
  }, build);
}.call(this, typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this));
