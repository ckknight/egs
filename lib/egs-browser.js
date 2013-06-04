;(function (root) {
  "use strict";
  var EGS = function (realRequire) {
    function require(path) {
      var has = Object.prototype.hasOwnProperty;
      if (has.call(require._cache, path)) {
        return require._cache[path];
      } else if (has.call(require, path)) {
        var func = require[path];
        delete require[path];
        return require._cache[path] = func.call({});
      } else if (realRequire) {
        return realRequire(path);
      }
    }
    require._cache = {};
    require['./egs'] = function () {
      var module = { exports: this };
      var exports = this;
      (function (GLOBAL) {
        "use strict";
        var __create, __defer, __fromPromise, __generatorToPromise, __import, __in,
            __isArray, __owns, __promise, __promiseLoop, __slice, __toArray,
            __toPromise, __typeof, _ref, _this, compile, compileCode, compileFile,
            compilePackage, EgsError, findAllExtensionedFilepaths, findAndCompileFile,
            fs, getAstPipe, getGorillascript, getPreludeMacros, guessFilepath,
            helpers, helpersProto, makeHelpersFactory, Package, path, render,
            renderFile, setImmediate, simpleHelpersProto, utils, withEgsPrelude;
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
        __in = typeof Array.prototype.indexOf === "function"
          ? (function () {
            var indexOf;
            indexOf = Array.prototype.indexOf;
            return function (child, parent) {
              return indexOf.call(parent, child) !== -1;
            };
          }())
          : function (child, parent) {
            var i, len;
            len = +parent.length;
            i = -1;
            while (++i < len) {
              if (child === parent[i] && i in parent) {
                return true;
              }
            }
            return false;
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
            factory.maybeSync = function () {
              return __generatorToPromise(
                value.apply(this, arguments),
                true
              );
            };
            return factory;
          } else {
            return __generatorToPromise(value, allowSync);
          }
        };
        __promiseLoop = function (limit, length, body) {
          var defer, done, index, result, slotsUsed;
          if (typeof limit !== "number") {
            throw TypeError("Expected limit to be a Number, got " + __typeof(limit));
          }
          if (typeof length !== "number") {
            throw TypeError("Expected length to be a Number, got " + __typeof(length));
          }
          if (typeof body !== "function") {
            throw TypeError("Expected body to be a Function, got " + __typeof(body));
          }
          if (limit < 1 || limit !== limit) {
            limit = 1/0;
          }
          result = [];
          done = false;
          slotsUsed = 0;
          defer = __defer();
          index = 0;
          function handle(index) {
            ++slotsUsed;
            return body(index).then(
              function (value) {
                result[index] = value;
                --slotsUsed;
                return flush();
              },
              function (reason) {
                done = true;
                return defer.reject(reason);
              }
            );
          }
          function flush() {
            for (; !done && slotsUsed < limit && index < length; ++index) {
              handle(index);
            }
            if (!done && index >= length && slotsUsed === 0) {
              done = true;
              return defer.fulfill(result);
            }
          }
          setImmediate(flush);
          return defer.promise;
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
        function memoize(func) {
          var result;
          return function () {
            if (func) {
              result = func();
              func = null;
            }
            return result;
          };
        }
        getGorillascript = memoize(function () {
          var defer, fromRequire;
          fromRequire = require("gorillascript");
          if (fromRequire != null) {
            return __defer.fulfilled(fromRequire);
          } else if (typeof define === "function" && define.amd) {
            defer = __defer();
            realRequire(["gorillascript"], function (gorillascript) {
              return defer.fulfill(gorillascript);
            });
            return defer.promise;
          } else if (typeof root === "object" && root !== null) {
            if (root.GorillaScript) {
              return __defer.fulfilled(root.GorillaScript);
            } else {
              return __defer.rejected(Error("GorillaScript must be available before EGS requests it"));
            }
          } else {
            return __defer.rejected(Error("Unable to detect environment, cannot load GorillaScript"));
          }
        });
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
        _ref = (function () {
          var egsPreludeCode, getEgsPreludeP, preludePathCache;
          getEgsPreludeP = memoize(__promise(function () {
            var _e, _send, _state, _step, _throw, gorillascript, result, text;
            _state = 0;
            function _close() {
              _state = 6;
            }
            function _step(_received) {
              while (true) {
                switch (_state) {
                case 0:
                  text = egsPreludeCode;
                  _state = text ? 3 : 1;
                  break;
                case 1:
                  ++_state;
                  return {
                    done: false,
                    value: __toPromise(fs.readFile, fs, [__dirname + "/../src/egs-prelude.gs", "utf8"])
                  };
                case 2:
                  text = _received;
                  ++_state;
                case 3:
                  ++_state;
                  return { done: false, value: getGorillascript() };
                case 4:
                  gorillascript = _received;
                  ++_state;
                  return { done: false, value: gorillascript.parse(text) };
                case 5:
                  result = _received;
                  ++_state;
                  return { done: true, value: result.macros };
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
          }));
          preludePathCache = {};
          return [
            function (preludePath) {
              var egsPreludeP;
              if (preludePath == null) {
                preludePath = null;
              }
              egsPreludeP = getEgsPreludeP();
              if (!preludePath) {
                return egsPreludeP;
              } else if (!__owns.call(preludePathCache, preludePath)) {
                return preludePathCache[preludePath] = __generatorToPromise((function () {
                  var _e, _send, _state, _step, _throw, egsPrelude, gorillascript,
                      result, text;
                  _state = 0;
                  function _close() {
                    _state = 5;
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
                        return { done: false, value: getGorillascript() };
                      case 3:
                        gorillascript = _received;
                        ++_state;
                        return {
                          done: false,
                          value: gorillascript.parse(text, { macros: egsPrelude })
                        };
                      case 4:
                        result = _received;
                        ++_state;
                        return { done: true, value: result.macros };
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
              } else {
                return preludePathCache[preludePath];
              }
            },
            function (code) {
              egsPreludeCode = code;
              return this;
            }
          ];
        }());
        getPreludeMacros = _ref[0];
        withEgsPrelude = _ref[1];
        getAstPipe = (function () {
          var makeGetAstPipe;
          makeGetAstPipe = memoize(__promise(function () {
            var _e, _send, _state, _step, _throw, addHelpersToParams, ast,
                canBeNumeric, changeContextToHelpers, convertLastWrite,
                convertWriteToStringConcat, convertWriteTrueToWriteEscape,
                gorillascript, hasExtends, isCall, isContextCall, mergeWrites,
                prepend, removeContextNullCheck, removeWritesAfterExtends,
                removeWritesInFunction, unwrapEscapeH;
            _state = 0;
            function _close() {
              _state = 2;
            }
            function _step(_received) {
              while (true) {
                switch (_state) {
                case 0:
                  ++_state;
                  return { done: false, value: getGorillascript() };
                case 1:
                  gorillascript = _received;
                  ast = gorillascript.AST;
                  isCall = function (node, functionName) {
                    var func;
                    if (node instanceof ast.Call) {
                      func = node.func;
                      return func instanceof ast.Ident && func.name === functionName;
                    }
                  };
                  isContextCall = function (node, functionName) {
                    var func, left, right;
                    if (node instanceof ast.Call) {
                      func = node.func;
                      if (func instanceof ast.Binary && func.op === ".") {
                        left = func.left;
                        right = func.right;
                        return left instanceof ast.Ident && left.name === "context" && right.isConst() && right.constValue() === functionName;
                      }
                    }
                    return false;
                  };
                  convertWriteTrueToWriteEscape = function (node) {
                    if (isCall(node, "write") && node.args.length === 2 && node.args[1].isConst() && node.args[1].constValue()) {
                      return ast.Call(node.pos, node.func, [
                        ast.Call(
                          node.pos,
                          ast.Access(
                            node.pos,
                            ast.Ident(node.pos, "context"),
                            ast.Const(node.pos, "escape")
                          ),
                          [node.args[0]]
                        )
                      ]);
                    }
                  };
                  unwrapEscapeH = function (node) {
                    var arg;
                    if (isContextCall(node, "escape") && node.args.length === 1) {
                      arg = node.args[0];
                      if (arg && (isContextCall(arg, "h") || isContextCall(arg, "html")) && arg.args.length === 1) {
                        return arg.args[0];
                      }
                    }
                  };
                  canBeNumeric = function (node) {
                    var _ref;
                    if (node.isConst()) {
                      return typeof node.constValue() !== "string";
                    } else if (node instanceof ast.Binary) {
                      if (node.op === "+") {
                        return canBeNumeric(node.left) && canBeNumeric(node.right);
                      } else {
                        return true;
                      }
                    } else if (node instanceof ast.IfExpression) {
                      return canBeNumeric(node.whenTrue) || canBeNumeric(node.whenFalse);
                    } else if (node instanceof ast.BlockExpression || node instanceof ast.BlockStatement) {
                      return canBeNumeric((_ref = node.body)[_ref.length - 1]);
                    } else {
                      return !isContextCall(node, "escape");
                    }
                  };
                  mergeWrites = function (node) {
                    var _arr, _len, body, changed, i, left, newSubnode, right,
                        subnode, whenFalse, whenTrue;
                    if (node instanceof ast.BlockExpression || node instanceof ast.BlockStatement) {
                      body = node.body.slice();
                      changed = false;
                      for (_arr = __toArray(body), i = 0, _len = _arr.length; i < _len; ++i) {
                        subnode = _arr[i];
                        newSubnode = subnode.walkWithThis(mergeWrites);
                        body[i] = newSubnode;
                        if (newSubnode !== subnode) {
                          changed = true;
                        }
                      }
                      i = 0;
                      while (i < body.length - 1) {
                        left = body[i];
                        right = body[i + 1];
                        if (isCall(left, "write") && left.args.length === 1 && isCall(right, "write") && right.args.length === 1) {
                          changed = true;
                          body.splice(i, 2, ast.Call(left.pos, left.func, [
                            ast.Binary(
                              left.pos,
                              canBeNumeric(left.args[0]) && canBeNumeric(right.args[0])
                                ? ast.Binary(
                                  left.pos,
                                  ast.Const(left.pos, ""),
                                  "+",
                                  left.args[0]
                                )
                                : left.args[0],
                              "+",
                              right.args[0]
                            )
                          ]));
                        } else {
                          ++i;
                        }
                      }
                      if (changed) {
                        return ast.Block(node.pos, body, node.label);
                      }
                    } else if ((node instanceof ast.IfStatement || node instanceof ast.IfExpression) && !node.label) {
                      whenTrue = node.whenTrue.walkWithThis(mergeWrites);
                      whenFalse = node.whenFalse.walkWithThis(mergeWrites);
                      if (isCall(whenTrue, "write") && (isCall(whenFalse, "write") || whenFalse.isNoop())) {
                        return ast.Call(node.pos, whenTrue.func, [
                          ast.IfExpression(node.pos, node.test.walkWithThis(mergeWrites), whenTrue.args[0], whenFalse.isNoop() ? ast.Const(whenFalse.pos, "") : whenFalse.args[0])
                        ]);
                      }
                    }
                  };
                  hasExtends = function (node) {
                    var FOUND;
                    FOUND = {};
                    try {
                      node.walk(function (subnode) {
                        if (subnode instanceof ast.Func) {
                          return subnode;
                        } else if (isContextCall(subnode, "extends")) {
                          throw FOUND;
                        }
                      });
                    } catch (e) {
                      if (e === FOUND) {
                        return true;
                      } else {
                        throw e;
                      }
                    }
                    return false;
                  };
                  removeWritesInFunction = function (node) {
                    if (node instanceof ast.Func) {
                      return node;
                    } else if (isCall(node, "write")) {
                      return ast.Noop(node.pos);
                    }
                  };
                  removeWritesAfterExtends = function (node) {
                    if (node instanceof ast.Func && hasExtends(node)) {
                      return node.walk(removeWritesInFunction);
                    }
                  };
                  convertWriteToStringConcat = function (node) {
                    if (isCall(node, "write")) {
                      return ast.Binary(node.pos, node.func, "+=", node.args[0]).walkWithThis(convertWriteToStringConcat);
                    }
                  };
                  prepend = function (left, node) {
                    if (node instanceof ast.Binary && node.op === "+") {
                      return ast.Binary(
                        left.pos,
                        prepend(left, node.left),
                        "+",
                        node.right
                      );
                    } else {
                      return ast.Binary(left.pos, left, "+", node);
                    }
                  };
                  convertLastWrite = function (node) {
                    var _ref, beforeLast, last;
                    if (node instanceof ast.BlockStatement) {
                      last = (_ref = node.body)[_ref.length - 1];
                      if (last instanceof ast.Return && last.node instanceof ast.Ident && last.node.name === "write") {
                        beforeLast = (_ref = node.body)[_ref.length - 2];
                        if (beforeLast && beforeLast instanceof ast.Binary && beforeLast.op === "+=" && beforeLast.left instanceof ast.Ident && beforeLast.left.name === "write") {
                          return ast.BlockStatement(
                            node.pos,
                            __toArray(__slice.call(node.body, 0, -2)).concat([
                              ast.Return(beforeLast.pos, prepend(beforeLast.left, beforeLast.right))
                            ]),
                            node.label
                          );
                        }
                      }
                    }
                  };
                  removeContextNullCheck = function (node) {
                    if (node instanceof ast.Binary && node.op === "==" && node.left instanceof ast.Ident && node.left.name === "context" && node.right.isConst() && node.right.constValue() == null) {
                      return ast.Const(node.pos, false);
                    }
                  };
                  changeContextToHelpers = function (helperNames) {
                    return function (node) {
                      if (node instanceof ast.Binary && node.op === "." && node.left instanceof ast.Ident && node.left.name === "context" && node.right.isConst() && __in(node.right.constValue(), helperNames)) {
                        return ast.Binary(
                          node.pos,
                          ast.Ident(node.left.pos, "helpers"),
                          ".",
                          node.right
                        );
                      }
                    };
                  };
                  addHelpersToParams = function (node) {
                    if (node instanceof ast.Func && node.params.length === 2 && node.params[0].name === "write" && node.params[1].name === "context") {
                      return ast.Func(
                        node.pos,
                        node.name,
                        [
                          node.params[0],
                          node.params[1],
                          ast.Ident(node.pos, "helpers")
                        ],
                        node.variables,
                        node.body,
                        node.declarations
                      );
                    }
                  };
                  ++_state;
                  return {
                    done: true,
                    value: function (helperNames) {
                      return function (root) {
                        return root.walk(convertWriteTrueToWriteEscape).walk(unwrapEscapeH).walk(mergeWrites).walk(removeWritesAfterExtends).walk(convertWriteToStringConcat).walk(convertLastWrite).walk(removeContextNullCheck).walk(changeContextToHelpers(helperNames)).walk(addHelpersToParams);
                      };
                    }
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
          }));
          return __promise(function (helperNames) {
            var _e, _send, _state, _step, _throw, getAstPipe;
            _state = 0;
            function _close() {
              _state = 2;
            }
            function _step(_received) {
              while (true) {
                switch (_state) {
                case 0:
                  ++_state;
                  return { done: false, value: makeGetAstPipe() };
                case 1:
                  getAstPipe = _received;
                  ++_state;
                  return { done: true, value: getAstPipe(helperNames) };
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
        }());
        compileCode = __promise(function (egsCode, compileOptions, helperNames) {
          var _e, _err, _ref, _send, _state, _step, _throw, _tmp, astPipe, code,
              gorillascript, isGenerator, macros, options;
          _state = 0;
          function _close() {
            _state = 9;
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
                return { done: false, value: getAstPipe(helperNames) };
              case 2:
                astPipe = _received;
                _ref = __import({}, compileOptions);
                _ref.embedded = true;
                _ref.noindent = true;
                _ref.macros = macros;
                _ref.prelude = null;
                _ref.astPipe = astPipe;
                options = _ref;
                isGenerator = false;
                ++_state;
                return { done: false, value: getGorillascript() };
              case 3:
                gorillascript = _received;
                ++_state;
              case 4:
                ++_state;
                return {
                  done: false,
                  value: gorillascript.compile(egsCode, options)
                };
              case 5:
                _tmp = _received;
                code = _tmp.code;
                _state = 8;
                break;
              case 6:
                options.embeddedGenerator = true;
                isGenerator = true;
                ++_state;
                return {
                  done: false,
                  value: gorillascript.compile(egsCode, options)
                };
              case 7:
                _tmp = _received;
                code = _tmp.code;
                ++_state;
              case 8:
                ++_state;
                return {
                  done: true,
                  value: { isGenerator: isGenerator, code: code }
                };
              case 9:
                return { done: true, value: void 0 };
              default: throw Error("Unknown state: " + _state);
              }
            }
          }
          function _throw(_e) {
            if (_state === 4 || _state === 5) {
              _err = _e;
              _state = 6;
            } else {
              _close();
              throw _e;
            }
          }
          function _send(_received) {
            while (true) {
              try {
                return _step(_received);
              } catch (_e) {
                _throw(_e);
              }
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
        compile = __promise(function (egsCode, compileOptions, helperNames) {
          var _e, _ref, _send, _state, _step, _throw, code, isGenerator;
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
                  value: compileCode(egsCode, compileOptions, helperNames)
                };
              case 1:
                _ref = _received;
                isGenerator = _ref.isGenerator;
                code = _ref.code;
                ++_state;
                return {
                  done: true,
                  value: {
                    func: isGenerator ? __promise(Function("return " + code)()) : Function("return " + code)(),
                    isSimple: (function () {
                      var _arr, _every, _i, _len, special;
                      _every = true;
                      for (_arr = ["extends", "partial", "block"], _i = 0, _len = _arr.length; _i < _len; ++_i) {
                        special = _arr[_i];
                        if (code.indexOf("helpers." + special) !== -1 || code.indexOf('helpers["' + special + '"]') !== -1) {
                          _every = false;
                          break;
                        }
                      }
                      return _every;
                    }())
                  }
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
        function makeCacheKey(options) {
          var _arr, _i, _len, key, parts;
          parts = [];
          for (_arr = [
            "open",
            "openWrite",
            "openComment",
            "close",
            "closeWrite",
            "closeComment",
            "cache",
            "prelude"
          ], _i = 0, _len = _arr.length; _i < _len; ++_i) {
            key = _arr[_i];
            parts.push(options[key] || "\u0000");
          }
          return parts.join("\u0000");
        }
        function returnSame(value) {
          return function () {
            return value;
          };
        }
        compileFile = (function () {
          var cache;
          cache = {};
          return function (filepath, compileOptions, helperNames) {
            var _ref, innerCache;
            if (__owns.call(cache, filepath)) {
              innerCache = cache[filepath];
            } else {
              innerCache = cache[filepath] = {};
            }
            if (!__owns.call(innerCache, _ref = makeCacheKey(compileOptions) + "\u0000" + helperNames.join("\u0000"))) {
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
                          value: compile(egsCode, compileOptions, helperNames)
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
                  return returnSame(recompileFile());
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
                  return __promise(function () {
                    var _e, _send, _state, _step, _throw, _tmp, newTimeP;
                    _state = 0;
                    function _close() {
                      _state = 4;
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
              }());
            } else {
              return innerCache[_ref];
            }
          };
        }());
        findAndCompileFile = __promise(function (name, fromFilepath, compileOptions, helperNames) {
          var _e, _send, _state, _step, _throw, compiled, filepath;
          _state = 0;
          function _close() {
            _state = 2;
          }
          function _step(_received) {
            while (true) {
              switch (_state) {
              case 0:
                if (compileOptions == null) {
                  compileOptions = {};
                }
                filepath = guessFilepath(name, fromFilepath);
                ++_state;
                return {
                  done: false,
                  value: compileFile(filepath, compileOptions, helperNames)()
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
        function getCompileOptions(options) {
          if (options == null) {
            options = {};
          }
          return {
            filename: options.filename,
            embeddedOpen: options.open,
            embeddedOpenWrite: options.openWrite,
            embeddedOpenComment: options.openComment,
            embeddedClose: options.close,
            embeddedCloseWrite: options.closeWrite,
            embeddedCloseComment: options.closeComment,
            prelude: options.prelude,
            cache: options.cache
          };
        }
        function toMaybeSync(promiseFactory) {
          var k, maybeSync, v;
          maybeSync = promiseFactory.maybeSync;
          for (k in promiseFactory) {
            if (__owns.call(promiseFactory, k)) {
              v = promiseFactory[k];
              maybeSync[k] = v;
            }
          }
          return maybeSync;
        }
        simpleHelpersProto = __import({}, helpers);
        _ref = __import({}, helpers);
        _ref["extends"] = function (name, locals) {
          if (!this.__currentFilepath$) {
            throw EgsError("Can only use extends if the 'filename' option is specified");
          }
          if (this.__inPartial$) {
            throw EgsError("Cannot use extends when in a partial");
          }
          if (this.__extendedBy$) {
            throw EgsError("Cannot use extends more than once");
          }
          this.__extendedBy$ = this.__fetchCompiled$(name);
          this.__extendedByLocals$ = locals;
        };
        _ref.partial = toMaybeSync(__promise(function (name, write, locals) {
          var _e, _o, _ref, _send, _state, _step, _this, _throw, filepath, func,
              partialHelpers;
          _this = this;
          _state = 0;
          function _close() {
            _state = 5;
          }
          function _step(_received) {
            while (true) {
              switch (_state) {
              case 0:
                if (locals == null) {
                  locals = {};
                }
                if (!_this.__currentFilepath$) {
                  throw EgsError("Can only use partial if the 'filename' option is specified");
                }
                name = path.join(path.dirname(name), "" + _this.__partialPrefix$ + path.basename(name));
                ++_state;
                return { done: false, value: _this.__fetchCompiled$(name) };
              case 1:
                _ref = _received;
                filepath = _ref.filepath;
                func = _ref.compiled.func;
                _o = __create(_this);
                _o.__currentFilepath$ = filepath;
                _o.__inPartial$ = true;
                partialHelpers = _o;
                _state = func.maybeSync ? 2 : 4;
                break;
              case 2:
                ++_state;
                return {
                  done: false,
                  value: func.maybeSync(write, locals, partialHelpers)
                };
              case 3:
                _state = 5;
                return { done: true, value: _received };
              case 4:
                ++_state;
                return {
                  done: true,
                  value: func(write, locals, partialHelpers)
                };
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
        }));
        _ref.block = toMaybeSync(__promise(function (name, write, inside) {
          var _e, _send, _state, _step, _this, _throw, block, blocks, result,
              rootHelpers;
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
                if (_this.__inPartial$) {
                  throw EgsError("Cannot use block when in a partial");
                }
                blocks = _this.__blocks$;
                rootHelpers = _this.__helpers$;
                _state = _this.__extendedBy$ && !rootHelpers.__inBlock$ ? 1 : 2;
                break;
              case 1:
                if (inside != null && !__owns.call(blocks, name)) {
                  blocks[name] = inside;
                }
                _state = 6;
                return { done: true, value: write };
              case 2:
                block = __owns.call(blocks, name) && blocks[name] || inside;
                result = write;
                _state = block ? 3 : 5;
                break;
              case 3:
                rootHelpers.__inBlock$ = true;
                ++_state;
                return {
                  done: false,
                  value: __promise(block(write), true)
                };
              case 4:
                result = _received;
                rootHelpers.__inBlock$ = false;
                ++_state;
              case 5:
                ++_state;
                return { done: true, value: result };
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
        }));
        _ref.__handleExtends$ = toMaybeSync(__promise(function (currentWrite) {
          var _e, _o, _ref, _send, _state, _step, _this, _throw, filepath, func,
              locals, newHelpers, text;
          _this = this;
          _state = 0;
          function _close() {
            _state = 9;
          }
          function _step(_received) {
            while (true) {
              switch (_state) {
              case 0:
                ++_state;
                return { done: false, value: _this.__extendedBy$ };
              case 1:
                _ref = _received;
                filepath = _ref.filepath;
                func = _ref.compiled.func;
                _o = __create(_this);
                _o.__currentFilepath$ = filepath;
                _o.__extendedBy$ = null;
                _o.__extendedByLocals$ = null;
                newHelpers = _o;
                locals = _this.__extendedByLocals$ || {};
                _state = func.maybeSync ? 2 : 4;
                break;
              case 2:
                ++_state;
                return {
                  done: false,
                  value: func.maybeSync("", locals, newHelpers)
                };
              case 3:
                text = _received;
                _state = 5;
                break;
              case 4:
                text = func("", locals, newHelpers);
                ++_state;
              case 5:
                _state = newHelpers.__extendedBy$ ? 6 : 8;
                break;
              case 6:
                ++_state;
                return {
                  done: false,
                  value: newHelpers.__handleExtends$(newHelpers, text)
                };
              case 7:
                _state = 9;
                return { done: true, value: _received };
              case 8:
                ++_state;
                return { done: true, value: text };
              case 9:
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
        }));
        helpersProto = _ref;
        makeHelpersFactory = (function () {
          function makeFactory(partialPrefix, currentFilepath, fetchCompiled, escaper, optionsContext) {
            var baseHelpers, simpleHelpers;
            baseHelpers = __create(helpersProto);
            baseHelpers.__currentFilepath$ = currentFilepath;
            baseHelpers.__partialPrefix$ = partialPrefix;
            baseHelpers.__fetchCompiled$ = fetchCompiled;
            baseHelpers.__extendedBy$ = null;
            baseHelpers.__extendedByLocals$ = null;
            baseHelpers.__inPartial$ = false;
            baseHelpers.__inBlock$ = false;
            baseHelpers.escape = escaper;
            simpleHelpers = __create(simpleHelpersProto);
            simpleHelpers.__currentFilepath$ = currentFilepath;
            simpleHelpers.escape = escaper;
            if (optionsContext) {
              __import(simpleHelpers, optionsContext);
              __import(baseHelpers, optionsContext);
            }
            return function (isSimple) {
              var helpers;
              if (isSimple) {
                return simpleHelpers;
              } else {
                helpers = __create(baseHelpers);
                helpers.__helpers$ = helpers;
                helpers.__blocks$ = {};
                return helpers;
              }
            };
          }
          return function (options, helperNames) {
            return makeFactory(
              typeof options.partialPrefix === "string" ? options.partialPrefix : "_",
              options.filename,
              (function () {
                var compileOptions, inPackage;
                inPackage = options.__inPackage$;
                if (inPackage) {
                  return function (name) {
                    return inPackage._find(name, this.__currentFilepath$);
                  };
                } else {
                  compileOptions = getCompileOptions(options);
                  return function (name) {
                    return findAndCompileFile(name, this.__currentFilepath$, compileOptions, helperNames);
                  };
                }
              }()),
              typeof options.escape === "function" ? options.escape : utils.escapeHTML,
              __owns.call(options, "context") ? options.context : options
            );
          };
        }());
        function makeTemplate(getCompilationP, makeHelpers, cacheCompilation) {
          var compilation, template;
          if (cacheCompilation == null) {
            cacheCompilation = false;
          }
          template = __promise(function (data) {
            var _e, _send, _state, _step, _throw, extension, helpers, result, tmp;
            _state = 0;
            function _close() {
              _state = 10;
            }
            function _step(_received) {
              while (true) {
                switch (_state) {
                case 0:
                  tmp = cacheCompilation && compilation;
                  _state = !tmp ? 1 : 3;
                  break;
                case 1:
                  ++_state;
                  return { done: false, value: getCompilationP() };
                case 2:
                  tmp = _received;
                  if (cacheCompilation) {
                    compilation = tmp;
                  }
                  ++_state;
                case 3:
                  helpers = makeHelpers(tmp.isSimple);
                  result = tmp.func("", data || {}, helpers);
                  _state = result && result.then ? 4 : 6;
                  break;
                case 4:
                  ++_state;
                  return { done: false, value: result };
                case 5:
                  result = _received;
                  ++_state;
                case 6:
                  _state = helpers.__extendedBy$ ? 7 : 9;
                  break;
                case 7:
                  extension = helpers.__handleExtends$;
                  ++_state;
                  return {
                    done: false,
                    value: extension.maybeSync.call(helpers, result)
                  };
                case 8:
                  _state = 10;
                  return { done: true, value: _received };
                case 9:
                  ++_state;
                  return { done: true, value: result };
                case 10:
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
          template.sync = function (data) {
            var func, helpers, result, tmp;
            tmp = cacheCompilation && compilation;
            if (!tmp) {
              tmp = getCompilationP().sync();
              if (cacheCompilation) {
                compilation = tmp;
              }
            }
            helpers = makeHelpers(tmp.isSimple);
            func = tmp.func;
            result = (func.sync || func)("", data || {}, helpers);
            if (typeof result !== "string") {
              result = result.sync();
            }
            if (helpers.__extendedBy$) {
              return helpers.__handleExtends$.sync.call(helpers, result);
            } else {
              return result;
            }
          };
          template.ready = __promise(function () {
            var _e, _send, _state, _step, _throw, func, helpers;
            _state = 0;
            function _close() {
              _state = 6;
            }
            function _step(_received) {
              while (true) {
                switch (_state) {
                case 0:
                  _state = cacheCompilation ? 1 : 5;
                  break;
                case 1:
                  _state = !compilation ? 2 : 4;
                  break;
                case 2:
                  ++_state;
                  return { done: false, value: getCompilationP() };
                case 3:
                  compilation = _received;
                  ++_state;
                case 4:
                  func = compilation.func;
                  if (func.sync) {
                    func = func.sync;
                  }
                  if (compilation.isSimple) {
                    helpers = makeHelpers(true);
                    template.sync = function (data) {
                      var result;
                      result = func("", data || {}, helpers);
                      if (typeof result !== "string") {
                        return result.sync();
                      } else {
                        return result;
                      }
                    };
                  }
                  _state = 6;
                  break;
                case 5:
                  ++_state;
                  return { done: false, value: getCompilationP() };
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
          return template;
        }
        function siftOptions(options) {
          return {
            filename: options.filename,
            open: options.open,
            openWrite: options.openWrite,
            openComment: options.openComment,
            close: options.close,
            closeWrite: options.closeWrite,
            closeComment: options.closeComment,
            cache: options.cache,
            escape: options.escape,
            partialPrefix: options.partialPrefix,
            prelude: options.prelude,
            context: null
          };
        }
        function getHelperNames(options) {
          var context, k, result;
          if (__owns.call(options, "context")) {
            context = options.context;
          } else {
            context = options;
          }
          result = ["escape", "extends", "partial", "block"];
          for (k in helpers) {
            if (__owns.call(helpers, k) && !__in(k, result)) {
              result.push(k);
            }
          }
          if (context) {
            for (k in context) {
              if (__owns.call(context, k) && !__in(k, result)) {
                result.push(k);
              }
            }
          }
          return result.sort();
        }
        function compileTemplate(egsCode, options) {
          var helperNames;
          if (options == null) {
            options = { context: null };
          }
          helperNames = getHelperNames(options);
          return makeTemplate(
            returnSame(compile(egsCode, getCompileOptions(options), helperNames)),
            makeHelpersFactory(options, helperNames),
            true
          );
        }
        function compileTemplateFromFile(filepath, options) {
          var helperNames;
          if (options == null) {
            options = { context: null };
          }
          options.filename = filepath;
          helperNames = getHelperNames(options);
          return makeTemplate(
            compileFile(filepath, getCompileOptions(options), helperNames),
            makeHelpersFactory(options, helperNames),
            options.cache
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
                  options = { context: null };
                }
                template = compileTemplate(egsCode, siftOptions(options));
                if (!context) {
                  if (__owns.call(options, "context")) {
                    context = options.context;
                  } else {
                    context = options;
                  }
                }
                ++_state;
                return { done: false, value: template.maybeSync(context) };
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
                  options = { context: null };
                }
                options.filename = filepath;
                template = compileTemplateFromFile(filepath, siftOptions(options));
                if (!context) {
                  if (__owns.call(options, "context")) {
                    context = options.context;
                  } else {
                    context = options;
                  }
                }
                ++_state;
                return { done: false, value: template.maybeSync(context) };
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
            options = { context: null };
          }
          __fromPromise(renderFile(path, options))(callback);
        }
        findAllExtensionedFilepaths = __promise(function (dirpath, ext) {
          var _e, _send, _state, _step, _throw, paths, result;
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
                  value: __toPromise(fs.readdir, fs, [dirpath])
                };
              case 1:
                paths = _received;
                result = [];
                ++_state;
                return {
                  done: false,
                  value: __promiseLoop(3, +paths.length, __promise(function (_i) {
                    var _arr, _e2, _send2, _state2, _step2, _throw2, joinedPath, p,
                        stat;
                    _state2 = 0;
                    function _close2() {
                      _state2 = 6;
                    }
                    function _step2(_received) {
                      while (true) {
                        switch (_state2) {
                        case 0:
                          p = paths[_i];
                          joinedPath = path.join(dirpath, p);
                          ++_state2;
                          return {
                            done: false,
                            value: __toPromise(fs.stat, fs, [joinedPath])
                          };
                        case 1:
                          stat = _received;
                          _state2 = stat.isDirectory() ? 2 : 4;
                          break;
                        case 2:
                          _arr = [];
                          ++_state2;
                          return {
                            done: false,
                            value: findAllExtensionedFilepaths(joinedPath, ext)
                          };
                        case 3:
                          _arr.push.apply(_arr, __toArray(_received));
                          _state2 = 6;
                          return {
                            done: true,
                            value: result.push.apply(result, _arr)
                          };
                        case 4:
                          _state2 = stat.isFile() && path.extname(p) === ext ? 5 : 6;
                          break;
                        case 5:
                          ++_state2;
                          return { done: true, value: result.push(joinedPath) };
                        case 6:
                          return { done: true, value: void 0 };
                        default: throw Error("Unknown state: " + _state2);
                        }
                      }
                    }
                    function _throw2(_e2) {
                      _close2();
                      throw _e2;
                    }
                    function _send2(_received) {
                      try {
                        return _step2(_received);
                      } catch (_e2) {
                        _throw2(_e2);
                      }
                    }
                    return {
                      close: _close2,
                      iterator: function () {
                        return this;
                      },
                      next: function () {
                        return _send2(void 0);
                      },
                      send: _send2,
                      "throw": function (_e2) {
                        _throw2(_e2);
                        return _send2(void 0);
                      }
                    };
                  }))
                };
              case 2:
                ++_state;
                return { done: true, value: result.sort() };
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
        compilePackage = __promise(function (inputDirpath, outputFilepath, options) {
          var _e, _send, _state, _step, _throw, astPipe, dirstat, fullAstPipe,
              gorillascript, inputFilepaths, macros;
          _state = 0;
          function _close() {
            _state = 7;
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
                  value: __toPromise(fs.stat, fs, [inputDirpath])
                };
              case 1:
                dirstat = _received;
                if (!dirstat.isDirectory()) {
                  throw Error("Expected '" + inputDirpath + "' to be a directory.");
                }
                ++_state;
                return {
                  done: false,
                  value: findAllExtensionedFilepaths(inputDirpath, ".egs")
                };
              case 2:
                inputFilepaths = _received;
                ++_state;
                return { done: false, value: getGorillascript() };
              case 3:
                gorillascript = _received;
                ++_state;
                return { done: false, value: getPreludeMacros(options.prelude) };
              case 4:
                macros = _received;
                ++_state;
                return { done: false, value: getAstPipe(getHelperNames({})) };
              case 5:
                astPipe = _received;
                fullAstPipe = function (root, _p, ast) {
                  var filesAssigned;
                  filesAssigned = {};
                  function isDoWrap(node) {
                    var _ref;
                    return node instanceof ast.Call && (node.func instanceof ast.Func || node.func instanceof ast.Binary && node.func.op === "." && node.func.left instanceof ast.Func && node.func.right.isConst() && ((_ref = node.func.right.constValue()) === "call" || _ref === "apply"));
                  }
                  function assignFiles(node) {
                    if (node.pos.file && !__owns.call(filesAssigned, node.pos.file) && isDoWrap(node)) {
                      filesAssigned[node.pos.file] = true;
                      return ast.Call(
                        node.pos,
                        ast.Access(
                          node.pos,
                          ast.Ident(node.pos, "templates"),
                          ast.Const(node.pos, "set")
                        ),
                        [
                          ast.Const(node.pos, path.relative(inputDirpath, node.pos.file)),
                          node
                        ]
                      );
                    }
                  }
                  root = astPipe(root).walk(assignFiles);
                  return ast.Root(
                    root.pos,
                    ast.Call(
                      root.pos,
                      ast.Access(
                        root.pos,
                        ast.Func(
                          root.pos,
                          null,
                          [ast.Ident(root.pos, "factory")],
                          [],
                          ast.IfStatement(
                            root.pos,
                            ast.And(
                              root.pos,
                              ast.Binary(
                                root.pos,
                                ast.Unary(root.pos, "typeof", ast.Ident(root.pos, "module")),
                                "!==",
                                ast.Const(root.pos, "undefined")
                              ),
                              ast.Access(
                                root.pos,
                                ast.Ident(root.pos, "module"),
                                ast.Const(root.pos, "exports")
                              )
                            ),
                            ast.Assign(
                              root.pos,
                              ast.Access(
                                root.pos,
                                ast.Ident(root.pos, "module"),
                                ast.Const(root.pos, "exports")
                              ),
                              ast.Call(
                                root.pos,
                                ast.Ident(root.pos, "factory"),
                                [
                                  ast.Call(
                                    root.pos,
                                    ast.Ident(root.pos, "require"),
                                    [ast.Const(root.pos, "egs")]
                                  )
                                ]
                              )
                            ),
                            ast.IfStatement(
                              root.pos,
                              ast.And(
                                root.pos,
                                ast.Binary(
                                  root.pos,
                                  ast.Unary(root.pos, "typeof", ast.Ident(root.pos, "define")),
                                  "===",
                                  ast.Const(root.pos, "function")
                                ),
                                ast.Access(
                                  root.pos,
                                  ast.Ident(root.pos, "define"),
                                  ast.Const(root.pos, "amd")
                                )
                              ),
                              ast.Call(
                                root.pos,
                                ast.Ident(root.pos, "define"),
                                [
                                  ast.Arr(root.pos, [ast.Const(root.pos, "egs")]),
                                  ast.Ident(root.pos, "factory")
                                ]
                              ),
                              ast.Assign(
                                root.pos,
                                ast.Access(root.pos, ast.This(root.pos), ast.Const(root.pos, options.globalExport || "EGSTemplates")),
                                ast.Call(
                                  root.pos,
                                  ast.Ident(root.pos, "factory"),
                                  [
                                    ast.Access(root.pos, ast.This(root.pos), ast.Const(root.pos, "EGS"))
                                  ]
                                )
                              )
                            )
                          )
                        ),
                        ast.Const(root.pos, "call")
                      ),
                      [
                        ast.This(root.pos),
                        ast.Func(
                          root.pos,
                          null,
                          [ast.Ident(root.pos, "EGS")],
                          ["templates"],
                          ast.Block(root.pos, [
                            ast.IfStatement(
                              root.pos,
                              ast.Unary(root.pos, "!", ast.Ident(root.pos, "EGS")),
                              ast.Throw(root.pos, ast.Call(
                                root.pos,
                                ast.Ident(root.pos, "Error"),
                                [ast.Const(root.pos, "Expected EGS to be available")]
                              ))
                            ),
                            ast.Assign(
                              root.pos,
                              ast.Ident(root.pos, "templates"),
                              ast.Call(
                                root.pos,
                                ast.Access(
                                  root.pos,
                                  ast.Ident(root.pos, "EGS"),
                                  ast.Const(root.pos, "Package")
                                ),
                                []
                              )
                            ),
                            root.body,
                            ast.Return(root.pos, ast.Ident(root.pos, "templates"))
                          ])
                        )
                      ]
                    ),
                    [],
                    []
                  );
                };
                ++_state;
                return {
                  done: false,
                  value: gorillascript.compileFile({
                    input: inputFilepaths,
                    output: outputFilepath,
                    embedded: true,
                    embeddedGenerator: true,
                    noindent: true,
                    macros: macros,
                    astPipe: fullAstPipe
                  })
                };
              case 6:
                ++_state;
                return { done: true, value: _received };
              case 7:
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
            var factory;
            if (options == null) {
              options = {};
            }
            filepath = withLeadingSlash(filepath);
            factory = this.factories[filepath] = __promise(generator);
            this.templates[filepath] = makeTemplate(
              returnSame(__defer.fulfilled({ func: factory, isSimple: false })),
              makeHelpersFactory(__import(
                __import(
                  { __inPackage$: this, filename: filepath },
                  this.options
                ),
                options
              )),
              true
            );
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
          _Package_prototype.renderSync = function (filepath, data) {
            var template;
            if (data == null) {
              data = {};
            }
            template = this.get(filepath);
            return template.sync(data);
          };
          _Package_prototype._find = function (name, fromFilepath) {
            var factories, filepath;
            filepath = guessFilepath(name, fromFilepath);
            factories = this.factories;
            if (!__owns.call(factories, filepath)) {
              return __defer.rejected(EgsError("Cannot find '" + name + "' from '" + filepath + "', tried '" + filepath + "'"));
            } else {
              return __defer.fulfilled({
                filepath: filepath,
                compiled: { func: factories[filepath], isSimple: false }
              });
            }
          };
          _Package_prototype.express = function () {
            var _this;
            _this = this;
            return function (path, data, callback) {
              __fromPromise(_this.render(path, data))(callback);
            };
          };
          return Package;
        }());
        compileTemplate.version = "0.1.4";
        compileTemplate.fromFile = compileTemplateFromFile;
        compileTemplate.render = render;
        compileTemplate.renderFile = renderFile;
        compileTemplate.withEgsPrelude = withEgsPrelude;
        compileTemplate.compilePackage = compilePackage;
        compileTemplate.Package = Package;
        compileTemplate.EgsError = EgsError;
        compileTemplate.compile = function (egsCode, options, helperNames) {
          if (egsCode == null) {
            egsCode = "";
          }
          if (options == null) {
            options = {};
          }
          if (helperNames == null) {
            helperNames = [];
          }
          return compileCode(egsCode, getCompileOptions(options), helperNames);
        };
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
      
      return module.exports;
    };
    require['./helpers'] = function () {
      var module = { exports: this };
      var exports = this;
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
      
      return module.exports;
    };
    require['./utils'] = function () {
      var module = { exports: this };
      var exports = this;
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
      
      return module.exports;
    };

    return require("./egs").withEgsPrelude("macro extends(name, locals)\n  let new-context = if locals and not locals.is-const()\n    ASTE {} <<< context <<< $locals\n  else\n    ASTE context\n  ASTE context.extends $name, $new-context\n\nmacro block\n  syntax ident as Identifier, body as GeneratorBody?\n    let name = @const @name(ident)\n    if body?\n      ASTE! write := yield context.block $name, write, #(write)*\n        $body\n        write\n    else\n      ASTE! write := yield context.block $name, write\n\nmacro partial(name, locals)\n  let new-context = if locals and not locals.is-const()\n    ASTE {} <<< context <<< $locals\n  else\n    ASTE context\n  ASTE! write := yield context.partial $name, write, $new-context\n");
  };

  if (typeof define === "function" && define.amd) {
    define(function (require) { return EGS(require); });
  } else if (typeof module !== "undefined" && typeof require === "function") {
    module.exports = EGS(require);
  } else {
    root.EGS = EGS();
  }
}(this));