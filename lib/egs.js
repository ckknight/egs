(function (GLOBAL) {
  "use strict";
  var __create, __defer, __fromPromise, __generator, __generatorToPromise,
      __import, __isArray, __owns, __promise, __slice, __toArray, __toPromise,
      __typeof, _this, compile, compileFile, EgsError, findAndCompileFile, fs,
      getPreludeMacros, gorillascript, guessFilepath, handleExtendsKey, helpers,
      Package, packageKey, path, render, renderFile, setImmediate, utils,
      writeKey;
  _this = this;
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
            _ref = __defer();
            promise = _ref.promise;
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
  __toArray = function (x) {
    if (x == null) {
      throw TypeError("Expected an object, got " + __typeof(x));
    } else if (__isArray(x)) {
      return x;
    } else if (typeof x === "string") {
      return x.split("");
    } else if (typeof x.length === "number") {
      return __slice.call(x);
    } else {
      throw TypeError("Expected an object with a length property, got " + __typeof(x));
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
  EgsError = (function (Error) {
    var _EgsError_prototype, _Error_prototype;
    function EgsError(message) {
      var _this, err;
      _this = this instanceof EgsError ? this : __create(_EgsError_prototype);
      if (message == null) {
        message = "";
      }
      _this.message = message;
      err = Error.call(_this, message);
      if (typeof Error.captureStackTrace === "function") {
        Error.captureStackTrace(_this, EgsError);
      } else if ("stack" in err) {
        _this.stack = err.stack;
      }
      return _this;
    }
    _Error_prototype = Error.prototype;
    _EgsError_prototype = EgsError.prototype = __create(_Error_prototype);
    _EgsError_prototype.constructor = EgsError;
    EgsError.displayName = "EgsError";
    if (typeof Error.extended === "function") {
      Error.extended(EgsError);
    }
    _EgsError_prototype.name = "EgsError";
    return EgsError;
  }(Error));
  function fullExtname(filename) {
    var match;
    match = /^[^\.]+(\..*)$/.exec(path.basename(filename));
    if (match) {
      return match[1];
    } else {
      return "";
    }
  }
  guessFilepath = (function () {
    var cache;
    cache = {};
    return function (name, fromFilepath) {
      var filename, inner;
      if (__owns.call(cache, fromFilepath)) {
        inner = cache[fromFilepath];
      } else {
        inner = cache[fromFilepath] = {};
      }
      if (!__owns.call(inner, name)) {
        filename = name;
        if (!path.extname(filename)) {
          filename += "" + fullExtname(fromFilepath);
        }
        return inner[name] = path.resolve(path.dirname(fromFilepath), filename);
      } else {
        return inner[name];
      }
    };
  }());
  getPreludeMacros = (function () {
    var egsPreludeP, preludePathCache;
    preludePathCache = {};
    return function (preludePath) {
      if (preludePath == null) {
        preludePath = null;
      }
      if (egsPreludeP == null) {
        egsPreludeP = __generatorToPromise((function () {
          var _e, _send, _state, _step, _throw, result, text;
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
                  value: __toPromise(fs.readFile, fs, [__dirname + "/../src/egs-prelude.gs", "utf8"])
                };
              case 1:
                text = _received;
                ++_state;
                return { done: false, value: gorillascript.parse(text) };
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
          function _throw(_e) {
            _close();
            throw _e;
          }
          function _send(_received) {
            try {
              return _step(_received);
            } catch (_e) {
              _throw(_e);
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
            "throw": function (_e) {
              _throw(_e);
              return _send(void 0);
            }
          };
        }()));
      }
      if (!preludePath) {
        return egsPreludeP;
      } else if (!__owns.call(preludePathCache, preludePath)) {
        return preludePathCache[preludePath] = __generatorToPromise((function () {
          var _e, _send, _state, _step, _throw, egsPrelude, result, text;
          _state = 0;
          function _close() {
            _state = 4;
          }
          function _step(_received) {
            while (true) {
              switch (_state) {
              case 0:
                ++_state;
                return { done: false, value: egsPreludeP };
              case 1:
                egsPrelude = _received;
                ++_state;
                return {
                  done: false,
                  value: __toPromise(fs.readFile, fs, [preludePath, "utf8"])
                };
              case 2:
                text = _received;
                ++_state;
                return {
                  done: false,
                  value: gorillascript.parse(text, { macros: egsPrelude })
                };
              case 3:
                result = _received;
                ++_state;
                return { done: true, value: result.macros };
              case 4:
                return { done: true, value: void 0 };
              default: throw Error("Unknown state: " + _state);
              }
            }
          }
          function _throw(_e) {
            _close();
            throw _e;
          }
          function _send(_received) {
            try {
              return _step(_received);
            } catch (_e) {
              _throw(_e);
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
            "throw": function (_e) {
              _throw(_e);
              return _send(void 0);
            }
          };
        }()));
      } else {
        return preludePathCache[preludePath];
      }
    };
  }());
  compile = __promise(function (egsCode, compileOptions) {
    var _e, _ref, _send, _state, _step, _throw, macros, result;
    _state = 0;
    function _close() {
      _state = 3;
    }
    function _step(_received) {
      while (true) {
        switch (_state) {
        case 0:
          ++_state;
          return { done: false, value: getPreludeMacros(compileOptions.prelude) };
        case 1:
          macros = _received;
          ++_state;
          return {
            done: false,
            value: gorillascript.compile(egsCode, ((_ref = __import({}, compileOptions)).embedded = true, _ref.embeddedGenerator = true, _ref.noindent = true, _ref.macros = macros, _ref.prelude = null, _ref))
          };
        case 2:
          result = _received;
          ++_state;
          return { done: true, value: __promise(Function("return " + result.code)()) };
        case 3:
          return { done: true, value: void 0 };
        default: throw Error("Unknown state: " + _state);
        }
      }
    }
    function _throw(_e) {
      _close();
      throw _e;
    }
    function _send(_received) {
      try {
        return _step(_received);
      } catch (_e) {
        _throw(_e);
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
      "throw": function (_e) {
        _throw(_e);
        return _send(void 0);
      }
    };
  });
  function makeCacheKey(options) {
    var _arr, _i, _len, key, parts;
    parts = [];
    for (_arr = [
      "embeddedOpen",
      "embeddedOpenWrite",
      "embeddedOpenComment",
      "embeddedClose",
      "embeddedCloseWrite",
      "embeddedCloseComment",
      "cache",
      "prelude"
    ], _i = 0, _len = _arr.length; _i < _len; ++_i) {
      key = _arr[_i];
      parts.push(options[key] || "\u0000");
    }
    return parts.join("\u0000");
  }
  compileFile = (function () {
    var cache;
    cache = {};
    return function (filepath, compileOptions) {
      var _ref, innerCache;
      if (__owns.call(cache, filepath)) {
        innerCache = cache[filepath];
      } else {
        innerCache = cache[filepath] = {};
      }
      if (!__owns.call(innerCache, _ref = makeCacheKey(compileOptions))) {
        return innerCache[_ref] = (function () {
          var currentCompilationP, currentTimeP, recompileFile, retime;
          recompileFile = __promise(function () {
            var _e, _send, _state, _step, _throw, egsCode;
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
                    value: __toPromise(fs.readFile, fs, [filepath, "utf8"])
                  };
                case 1:
                  egsCode = _received;
                  ++_state;
                  return {
                    done: false,
                    value: compile(egsCode, compileOptions)
                  };
                case 2:
                  ++_state;
                  return { done: true, value: _received };
                case 3:
                  return { done: true, value: void 0 };
                default: throw Error("Unknown state: " + _state);
                }
              }
            }
            function _throw(_e) {
              _close();
              throw _e;
            }
            function _send(_received) {
              try {
                return _step(_received);
              } catch (_e) {
                _throw(_e);
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
              "throw": function (_e) {
                _throw(_e);
                return _send(void 0);
              }
            };
          });
          if (compileOptions.cache) {
            return recompileFile();
          } else {
            retime = __promise(function () {
              var _e, _send, _state, _step, _throw, stat;
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
                      value: __toPromise(fs.stat, fs, [filepath])
                    };
                  case 1:
                    stat = _received;
                    ++_state;
                    return { done: true, value: stat.mtime.getTime() };
                  case 2:
                    return { done: true, value: void 0 };
                  default: throw Error("Unknown state: " + _state);
                  }
                }
              }
              function _throw(_e) {
                _close();
                throw _e;
              }
              function _send(_received) {
                try {
                  return _step(_received);
                } catch (_e) {
                  _throw(_e);
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
                "throw": function (_e) {
                  _throw(_e);
                  return _send(void 0);
                }
              };
            });
            currentCompilationP = recompileFile();
            currentTimeP = retime();
            return __generatorToPromise(__generator(function () {
              return function () {
                var _this, args;
                _this = this;
                args = __slice.call(arguments);
                return __generatorToPromise((function () {
                  var _e, _send, _state, _step, _throw, _tmp, func, newTimeP;
                  _state = 0;
                  function _close() {
                    _state = 5;
                  }
                  function _step(_received) {
                    while (true) {
                      switch (_state) {
                      case 0:
                        newTimeP = retime();
                        ++_state;
                        return { done: false, value: currentTimeP };
                      case 1:
                        _tmp = _received;
                        ++_state;
                        return { done: false, value: newTimeP };
                      case 2:
                        _tmp = _tmp !== _received;
                        if (_tmp) {
                          currentCompilationP = recompileFile();
                          currentTimeP = newTimeP;
                        }
                        ++_state;
                        return { done: false, value: currentCompilationP };
                      case 3:
                        func = _received;
                        ++_state;
                        return {
                          done: false,
                          value: func.apply(_this, __toArray(args))
                        };
                      case 4:
                        ++_state;
                        return { done: true, value: _received };
                      case 5:
                        return { done: true, value: void 0 };
                      default: throw Error("Unknown state: " + _state);
                      }
                    }
                  }
                  function _throw(_e) {
                    _close();
                    throw _e;
                  }
                  function _send(_received) {
                    try {
                      return _step(_received);
                    } catch (_e) {
                      _throw(_e);
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
                    "throw": function (_e) {
                      _throw(_e);
                      return _send(void 0);
                    }
                  };
                }()));
              };
            })());
          }
        }());
      } else {
        return innerCache[_ref];
      }
    };
  }());
  findAndCompileFile = __promise(function (name, fromFilepath, options) {
    var _e, _send, _state, _step, _throw, compiled, filepath;
    _state = 0;
    function _close() {
      _state = 2;
    }
    function _step(_received) {
      while (true) {
        switch (_state) {
        case 0:
          if (options == null) {
            options = {};
          }
          filepath = guessFilepath(name, fromFilepath);
          ++_state;
          return {
            done: false,
            value: compileFile(filepath, options)
          };
        case 1:
          compiled = _received;
          ++_state;
          return {
            done: true,
            value: { filepath: filepath, compiled: compiled }
          };
        case 2:
          return { done: true, value: void 0 };
        default: throw Error("Unknown state: " + _state);
        }
      }
    }
    function _throw(_e) {
      _close();
      throw _e;
    }
    function _send(_received) {
      try {
        return _step(_received);
      } catch (_e) {
        _throw(_e);
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
      "throw": function (_e) {
        _throw(_e);
        return _send(void 0);
      }
    };
  });
  function makeTextWriter(escaper) {
    var data;
    data = [];
    function write(value, shouldEscape) {
      if (data) {
        data.push(String(shouldEscape ? escaper(value) : value));
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
    return Math.random().toString(16).slice(2) + "-" + new Date().getTime();
  }
  handleExtendsKey = makeUid();
  writeKey = makeUid();
  packageKey = makeUid();
  function makeStandardHelpers(options) {
    var _ref, blocks, escaper, extendedByKey, extendedByLocalsKey,
        fetchCompiled, filepathKey, inPartialKey, write;
    filepathKey = makeUid();
    extendedByKey = makeUid();
    extendedByLocalsKey = makeUid();
    inPartialKey = makeUid();
    blocks = {};
    if (typeof options.escape === "function") {
      escaper = options.escape;
    } else {
      escaper = utils.escapeHTML;
    }
    write = makeTextWriter(escaper);
    if (options[packageKey]) {
      fetchCompiled = function (context, name) {
        return options[packageKey]._find(name, context[filepathKey]);
      };
    } else {
      fetchCompiled = function (context, name) {
        return findAndCompileFile(name, context[filepathKey], options);
      };
    }
    (_ref = __import({}, helpers))[filepathKey] = options.filename;
    _ref[extendedByKey] = null;
    _ref[extendedByLocalsKey] = null;
    _ref[inPartialKey] = false;
    _ref[writeKey] = write;
    _ref["extends"] = function (name, locals) {
      if (locals == null) {
        locals = {};
      }
      if (!options.filename) {
        throw EgsError("Can only use extends if the 'filename' option is specified");
      }
      if (this[inPartialKey]) {
        throw EgsError("Cannot use extends when in a partial");
      }
      if (this[extendedByKey]) {
        throw EgsError("Cannot use extends more than once");
      }
      this[writeKey].disable();
      this[extendedByKey] = fetchCompiled(this, name);
      this[extendedByLocalsKey] = locals;
    };
    _ref.partial = __promise(function (name, write, locals) {
      var _e, _ref, _send, _state, _step, _this, _throw, compiled, filepath,
          partialPrefix;
      _this = this;
      _state = 0;
      function _close() {
        _state = 3;
      }
      function _step(_received) {
        while (true) {
          switch (_state) {
          case 0:
            if (locals == null) {
              locals = {};
            }
            if (!options.filename) {
              throw EgsError("Can only use partial if the 'filename' option is specified");
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
              value: fetchCompiled(_this, name)
            };
          case 1:
            _ref = _received;
            filepath = _ref.filepath;
            compiled = _ref.compiled;
            ++_state;
            return {
              done: false,
              value: compiled(write, ((_ref = __import(__create(_this), locals))[filepathKey] = filepath, _ref[inPartialKey] = true, _ref))
            };
          case 2:
            ++_state;
            return { done: true, value: _received };
          case 3:
            return { done: true, value: void 0 };
          default: throw Error("Unknown state: " + _state);
          }
        }
      }
      function _throw(_e) {
        _close();
        throw _e;
      }
      function _send(_received) {
        try {
          return _step(_received);
        } catch (_e) {
          _throw(_e);
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
        "throw": function (_e) {
          _throw(_e);
          return _send(void 0);
        }
      };
    });
    _ref.block = __promise(function (name, write, inside) {
      var _e, _send, _state, _step, _this, _throw, block;
      _this = this;
      _state = 0;
      function _close() {
        _state = 6;
      }
      function _step(_received) {
        while (true) {
          switch (_state) {
          case 0:
            if (inside == null) {
              inside = null;
            }
            if (_this[inPartialKey]) {
              throw EgsError("Cannot use block when in a partial");
            }
            _state = write.isDisabled() ? 1 : 3;
            break;
          case 1:
            _state = inside != null && !__owns.call(blocks, name) ? 2 : 6;
            break;
          case 2:
            _state = 6;
            return { done: true, value: blocks[name] = inside };
          case 3:
            block = __owns.call(blocks, name) && blocks[name] || inside;
            _state = block ? 4 : 6;
            break;
          case 4:
            ++_state;
            return { done: false, value: __promise(block(write)) };
          case 5:
            ++_state;
            return { done: true, value: _received };
          case 6:
            return { done: true, value: void 0 };
          default: throw Error("Unknown state: " + _state);
          }
        }
      }
      function _throw(_e) {
        _close();
        throw _e;
      }
      function _send(_received) {
        try {
          return _step(_received);
        } catch (_e) {
          _throw(_e);
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
        "throw": function (_e) {
          _throw(_e);
          return _send(void 0);
        }
      };
    });
    _ref[handleExtendsKey] = __promise(function (locals) {
      var _e, _ref, _send, _state, _step, _this, _throw, compiled, extendedBy,
          filepath, newContext, write;
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
            write = makeTextWriter(escaper);
            ++_state;
            return { done: false, value: extendedBy };
          case 3:
            _ref = _received;
            filepath = _ref.filepath;
            compiled = _ref.compiled;
            (_ref = __import(__create(_this), _this[extendedByLocalsKey]))[filepathKey] = filepath;
            _ref[extendedByKey] = null;
            _ref[extendedByLocalsKey] = null;
            _ref[writeKey] = write;
            newContext = _ref;
            ++_state;
            return {
              done: false,
              value: compiled(write, newContext)
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
      function _throw(_e) {
        _close();
        throw _e;
      }
      function _send(_received) {
        try {
          return _step(_received);
        } catch (_e) {
          _throw(_e);
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
        "throw": function (_e) {
          _throw(_e);
          return _send(void 0);
        }
      };
    });
    return _ref;
  }
  function makeContext(options, data) {
    return __import(
      __import(
        __import(__create(GLOBAL), makeStandardHelpers(options)),
        options.context || options
      ),
      data
    );
  }
  function makeTemplate(compilationP, options) {
    return __promise(function (data) {
      var _e, _send, _state, _step, _throw, context, func, result;
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
            return { done: false, value: compilationP };
          case 1:
            func = _received;
            context = makeContext(options, data);
            result = func(context[writeKey], context);
            ++_state;
            return { done: false, value: result };
          case 2:
            ++_state;
            return { done: false, value: context[handleExtendsKey]() };
          case 3:
            ++_state;
            return { done: true, value: _received };
          case 4:
            return { done: true, value: void 0 };
          default: throw Error("Unknown state: " + _state);
          }
        }
      }
      function _throw(_e) {
        _close();
        throw _e;
      }
      function _send(_received) {
        try {
          return _step(_received);
        } catch (_e) {
          _throw(_e);
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
        "throw": function (_e) {
          _throw(_e);
          return _send(void 0);
        }
      };
    });
  }
  function siftOptions(options) {
    return {
      filename: options.filename,
      embeddedOpen: options.embeddedOpen,
      embeddedOpenWrite: options.embeddedOpenWrite,
      embeddedOpenComment: options.embeddedOpenComment,
      embeddedClose: options.embeddedClose,
      embeddedCloseWrite: options.embeddedCloseWrite,
      embeddedCloseComment: options.embeddedCloseComment,
      cache: options.cache,
      escape: options.escape,
      partialPrefix: options.partialPrefix,
      prelude: options.prelude,
      context: {}
    };
  }
  function compileTemplate(egsCode, options) {
    if (options == null) {
      options = {};
    }
    return makeTemplate(
      compile(egsCode, siftOptions(options)),
      options
    );
  }
  function compileTemplateFromFile(filepath, options) {
    if (options == null) {
      options = {};
    }
    options.filename = filepath;
    return makeTemplate(
      compileFile(filepath, siftOptions(options)),
      options
    );
  }
  render = __promise(function (egsCode, options, context) {
    var _e, _send, _state, _step, _throw, template;
    _state = 0;
    function _close() {
      _state = 2;
    }
    function _step(_received) {
      while (true) {
        switch (_state) {
        case 0:
          if (options == null) {
            options = {};
          }
          template = compileTemplate(egsCode, siftOptions(options));
          ++_state;
          return { done: false, value: template(context || options.context || options) };
        case 1:
          ++_state;
          return { done: true, value: _received };
        case 2:
          return { done: true, value: void 0 };
        default: throw Error("Unknown state: " + _state);
        }
      }
    }
    function _throw(_e) {
      _close();
      throw _e;
    }
    function _send(_received) {
      try {
        return _step(_received);
      } catch (_e) {
        _throw(_e);
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
      "throw": function (_e) {
        _throw(_e);
        return _send(void 0);
      }
    };
  });
  renderFile = __promise(function (filepath, options, context) {
    var _e, _send, _state, _step, _throw, template;
    _state = 0;
    function _close() {
      _state = 2;
    }
    function _step(_received) {
      while (true) {
        switch (_state) {
        case 0:
          if (options == null) {
            options = {};
          }
          options.filename = filepath;
          template = compileTemplateFromFile(filepath, siftOptions(options));
          ++_state;
          return { done: false, value: template(context || options.context || options) };
        case 1:
          ++_state;
          return { done: true, value: _received };
        case 2:
          return { done: true, value: void 0 };
        default: throw Error("Unknown state: " + _state);
        }
      }
    }
    function _throw(_e) {
      _close();
      throw _e;
    }
    function _send(_received) {
      try {
        return _step(_received);
      } catch (_e) {
        _throw(_e);
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
      "throw": function (_e) {
        _throw(_e);
        return _send(void 0);
      }
    };
  });
  function express(path, options, callback) {
    if (options == null) {
      options = {};
    }
    __fromPromise(renderFile(path, options))(callback);
  }
  Package = (function () {
    var _Package_prototype;
    function Package(options) {
      var _this;
      _this = this instanceof Package ? this : __create(_Package_prototype);
      if (options == null) {
        options = {};
      }
      _this.options = options;
      _this.factories = {};
      _this.templates = {};
      return _this;
    }
    _Package_prototype = Package.prototype;
    Package.displayName = "Package";
    function withLeadingSlash(filepath) {
      if (filepath.charCodeAt(0) !== 47) {
        return "/" + filepath;
      } else {
        return filepath;
      }
    }
    _Package_prototype.set = function (filepath, generator, options) {
      var _o, factory;
      if (options == null) {
        options = {};
      }
      filepath = withLeadingSlash(filepath);
      factory = this.factories[filepath] = __promise(generator);
      this.templates[filepath] = makeTemplate(__defer.fulfilled(factory), __import(
        __import(
          (_o = {}, _o[packageKey] = this, _o.filename = filepath, _o),
          this.options
        ),
        options
      ));
      return this;
    };
    _Package_prototype.get = function (filepath) {
      var templates;
      filepath = withLeadingSlash(filepath);
      templates = this.templates;
      if (!__owns.call(templates, filepath)) {
        throw EgsError("Unknown filepath: '" + filepath + "'");
      } else {
        return templates[filepath];
      }
    };
    _Package_prototype.render = __promise(function (filepath, data) {
      var _e, _send, _state, _step, _this, _throw, template;
      _this = this;
      _state = 0;
      function _close() {
        _state = 2;
      }
      function _step(_received) {
        while (true) {
          switch (_state) {
          case 0:
            if (data == null) {
              data = {};
            }
            template = _this.get(filepath);
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
      function _throw(_e) {
        _close();
        throw _e;
      }
      function _send(_received) {
        try {
          return _step(_received);
        } catch (_e) {
          _throw(_e);
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
        "throw": function (_e) {
          _throw(_e);
          return _send(void 0);
        }
      };
    });
    _Package_prototype._find = function (name, fromFilepath) {
      var factories, filepath;
      filepath = guessFilepath(name, fromFilepath);
      factories = this.factories;
      if (!__owns.call(factories, filepath)) {
        return __defer.rejected(EgsError("Cannot find '" + name + "' from '" + filepath + "', tried '" + filepath + "'"));
      } else {
        return __defer.fulfilled({ filepath: filepath, compiled: factories[filepath] });
      }
    };
    return Package;
  }());
  compileTemplate.fromFile = compileTemplateFromFile;
  compileTemplate.render = render;
  compileTemplate.renderFile = renderFile;
  compileTemplate.Package = Package;
  compileTemplate.EgsError = EgsError;
  compileTemplate.__express = express;
  compileTemplate.express = function (options) {
    if (options == null) {
      options = {};
    }
    return function (path, suboptions, callback) {
      if (suboptions == null) {
        suboptions = {};
      }
      express(
        path,
        __import(
          __import({}, options),
          suboptions
        ),
        callback
      );
    };
  };
  module.exports = compileTemplate;
}.call(this, typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this));
