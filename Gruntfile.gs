require! path
require! fs

module.exports := #(grunt)
  grunt.init-config
    gorilla:
      build:
        options: {
          +verbose
        }
        files: [{
          expand: true
          cwd: "src/"
          src: for filter file in fs.readdir-sync('./src')
            path.extname(file) == ".gs" and not file.match(r"prelude\.gs\$")
          dest: "lib/"
          ext: ".js"
        }]
      
      "build-cov":
        options: {
          +verbose
          +coverage
        }
        files: [{
          expand: true
          cwd: "src/"
          src: for filter file in fs.readdir-sync('./src')
            path.extname(file) == ".gs" and not file.match(r"prelude\.gs\$")
          dest: "lib-cov/"
          ext: ".js"
        }]
    
    uglify:
      browser:
        files: {
          "lib/egs-browser.min.js": ["lib/egs-browser.js"]
        }
    
    mochaTest:
      test:
        options:
          timeout: 2_000_ms
          require: "test/setup"
        src: ["test/*.gs"]
      
      "test-cov":
        options:
          reporter: "html-cov"
          timeout: 2_000_ms
          require: "test/setup"
          quiet: true
        src: ["test/*.gs"]
        dest: "coverage.html"
  
  grunt.register-task "browser", "Build egs-browser.js", #
    let done = @async()
    let promise = promise!
      let filename-path = yield to-promise! fs.realpath __filename
      let src-path = path.join(path.dirname(filename-path), "src")
      let lib-path = path.join(path.dirname(filename-path), "lib")
      let parts = []
      for file in ["egs", "helpers", "utils"]
        let text = yield to-promise! fs.read-file path.join(lib-path, file & ".js"), "utf8"
        parts.push """
          require['./$file'] = function () {
            var module = { exports: this };
            var exports = this;
            $(text.split("\n").join("\n  "))
            return module.exports;
          };
          """
  
      let egs-prelude = yield to-promise! fs.read-file path.join(src-path, "egs-prelude.gs"), "utf8"
      let mutable code = """
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
            $(parts.join("\n").split("\n").join("\n    "))
            
            return require("./egs").withEgsPrelude($(JSON.stringify egs-prelude));
          };
      
          if (typeof define === "function" && define.amd) {
            define(function (require) { return EGS(require); });
          } else if (typeof module !== "undefined" && typeof require === "function") {
            module.exports = EGS(require);
          } else {
            root.EGS = EGS();
          }
        }(this));
        """
      grunt.file.write "lib/egs-browser.js", code
      grunt.log.writeln 'File "lib/egs-browser.js" created.'
    promise.then(
      #-> done()
      #(e)
        grunt.log.error e?.stack or e
        done(false))
  
  grunt.load-npm-tasks "grunt-gorilla"
  grunt.load-npm-tasks "grunt-mocha-test"
  grunt.load-npm-tasks "grunt-contrib-uglify"
  grunt.register-task "build", ["gorilla:build"]
  grunt.register-task "build-cov", ["gorilla:build-cov"]
  grunt.register-task "test", ["mochaTest:test"]
  grunt.register-task "check-env-cov", "Verify that EGS_COV is set", #
    unless process.env.EGS_COV
      grunt.log.error "You must set the EGS_COV environment variable"
      false
  grunt.register-task "test-cov", ["check-env-cov", "mochaTest:test-cov"]
  grunt.register-task "default", ["build", "test", "browser"]
  grunt.register-task "full", ["default", "uglify"]
