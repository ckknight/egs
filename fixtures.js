(function (factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory(require("egs"));
  } else if (typeof define === "function" && define.amd) {
    define(["egs"], factory);
  } else {
    this.EGSTemplates = factory(this.EGS);
  }
}.call(this, function (EGS) {
  var templates;
  if (!EGS) {
    throw Error("Expected EGS to be available");
  }
  templates = EGS.Package();
  (function () {
    "use strict";
    var __generator, __import, __owns, __slice;
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
    __import = function (dest, source) {
      var k;
      for (k in source) {
        if (__owns.call(source, k)) {
          dest[k] = source[k];
        }
      }
      return dest;
    };
    __owns = Object.prototype.hasOwnProperty;
    __slice = Array.prototype.slice;
    templates.set("_quote-text.egs", (function () {
      return __generator(function (write, context, helpers) {
        return write + '"' + helpers.escape(context.text) + '"';
      });
    }.call(this)));
    templates.set("_render-other-partial.egs", (function () {
      var _e, _send, _state, _step, _throw;
      return function (write, context, helpers) {
        var _e, _send, _state, _step, _throw;
        _state = 0;
        function _close() {
          _state = 2;
        }
        function _step(_received) {
          while (true) {
            switch (_state) {
            case 0:
              write += "(";
              ++_state;
              return {
                done: false,
                value: helpers.partial(context.partialName, write, __import(
                  __import({}, context),
                  context.partialLocals
                ))
              };
            case 1:
              write = _received;
              write += ")";
              ++_state;
              return { done: true, value: write };
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
          },
          flush: function () {
            var flushed;
            flushed = write;
            write = "";
            return flushed;
          }
        };
      };
    }.call(this)));
    templates.set("hello-curly.egs", (function () {
      return __generator(function (write, context, helpers) {
        return write + "Hello, {{ name }}!";
      });
    }.call(this)));
    templates.set("hello.egs", (function () {
      return __generator(function (write, context, helpers) {
        return write + "Hello, " + helpers.escape(context.name) + "!";
      });
    }.call(this)));
    templates.set("layout.egs", (function () {
      var _e, _send, _state, _step, _throw;
      return function (write, context, helpers) {
        var _e, _send, _state, _step, _throw;
        _state = 0;
        function _close() {
          _state = 4;
        }
        function _step(_received) {
          while (true) {
            switch (_state) {
            case 0:
              write += "header[";
              ++_state;
              return {
                done: false,
                value: helpers.block("header", write, __generator(function (write) {
                  return write + "Default header";
                }))
              };
            case 1:
              write = _received;
              write += "]\nbody[";
              ++_state;
              return {
                done: false,
                value: helpers.block("body", write)
              };
            case 2:
              write = _received;
              write += "]\nfooter[";
              ++_state;
              return {
                done: false,
                value: helpers.block("footer", write, __generator(function (write) {
                  return write + "Default footer";
                }))
              };
            case 3:
              write = _received;
              write += "]";
              ++_state;
              return { done: true, value: write };
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
          },
          flush: function () {
            var flushed;
            flushed = write;
            write = "";
            return flushed;
          }
        };
      };
    }.call(this)));
    templates.set("sublayout.egs", (function () {
      var _e, _send, _state, _step, _throw;
      return function (write, context, helpers) {
        var _e, _send, _state, _step, _throw;
        _state = 0;
        function _close() {
          _state = 2;
        }
        function _step(_received) {
          while (true) {
            switch (_state) {
            case 0:
              helpers["extends"]("layout", context);
              ++_state;
              return {
                done: false,
                value: helpers.block("body", write, function (write) {
                  var _e2, _send2, _state2, _step2, _throw2;
                  _state2 = 0;
                  function _close2() {
                    _state2 = 2;
                  }
                  function _step2(_received) {
                    while (true) {
                      switch (_state2) {
                      case 0:
                        write += "sub-body[";
                        ++_state2;
                        return {
                          done: false,
                          value: helpers.block("subBody", write)
                        };
                      case 1:
                        write = _received;
                        write += "]";
                        ++_state2;
                        return { done: true, value: write };
                      case 2:
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
                })
              };
            case 1:
              write = _received;
              ++_state;
              return { done: true, value: write };
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
          },
          flush: function () {
            var flushed;
            flushed = write;
            write = "";
            return flushed;
          }
        };
      };
    }.call(this)));
    templates.set("use-layout.egs", (function () {
      var _e, _send, _state, _step, _throw;
      return function (write, context, helpers) {
        var _e, _send, _state, _step, _throw;
        _state = 0;
        function _close() {
          _state = 3;
        }
        function _step(_received) {
          while (true) {
            switch (_state) {
            case 0:
              helpers["extends"]("layout", context);
              ++_state;
              return {
                done: false,
                value: helpers.block("body", write, __generator(function (write) {
                  return write + "Overridden body";
                }))
              };
            case 1:
              write = _received;
              ++_state;
              return {
                done: false,
                value: helpers.block("header", write, __generator(function (write) {
                  return write + "Overridden header";
                }))
              };
            case 2:
              write = _received;
              ++_state;
              return { done: true, value: write };
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
          },
          flush: function () {
            var flushed;
            flushed = write;
            write = "";
            return flushed;
          }
        };
      };
    }.call(this)));
    templates.set("use-partial.egs", (function () {
      var _e, _send, _state, _step, _throw;
      return function (write, context, helpers) {
        var _e, _send, _state, _step, _throw;
        _state = 0;
        function _close() {
          _state = 2;
        }
        function _step(_received) {
          while (true) {
            switch (_state) {
            case 0:
              write += "[";
              ++_state;
              return {
                done: false,
                value: helpers.partial(context.partialName, write, __import(
                  __import({}, context),
                  context.partialLocals
                ))
              };
            case 1:
              write = _received;
              write += "]";
              ++_state;
              return { done: true, value: write };
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
          },
          flush: function () {
            var flushed;
            flushed = write;
            write = "";
            return flushed;
          }
        };
      };
    }.call(this)));
    templates.set("use-sublayout.egs", (function () {
      var _e, _send, _state, _step, _throw;
      return function (write, context, helpers) {
        var _e, _send, _state, _step, _throw;
        _state = 0;
        function _close() {
          _state = 3;
        }
        function _step(_received) {
          while (true) {
            switch (_state) {
            case 0:
              helpers["extends"]("sublayout", context);
              ++_state;
              return {
                done: false,
                value: helpers.block("subBody", write, __generator(function (write) {
                  return write + "Overridden sub-body";
                }))
              };
            case 1:
              write = _received;
              ++_state;
              return {
                done: false,
                value: helpers.block("header", write, __generator(function (write) {
                  return write + "Overridden header";
                }))
              };
            case 2:
              write = _received;
              ++_state;
              return { done: true, value: write };
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
          },
          flush: function () {
            var flushed;
            flushed = write;
            write = "";
            return flushed;
          }
        };
      };
    }.call(this)));
  }.call(this));
  return templates;
}));
