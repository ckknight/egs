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
    
    mochaTest:
      test:
        options:
          timeout: 2_000_ms
          require: "test/setup"
        src: ["test/**/*.gs"]
      
      "test-cov":
        options:
          reporter: "html-cov"
          timeout: 2_000_ms
          require: "test/setup"
          quiet: true
        src: ["test/**/*.gs"]
        dest: "coverage.html"
  
  grunt.load-npm-tasks "grunt-gorilla"
  grunt.load-npm-tasks "grunt-mocha-test"
  grunt.register-task "build", ["gorilla:build"]
  grunt.register-task "build-cov", ["gorilla:build-cov"]
  grunt.register-task "test", ["mochaTest:test"]
  grunt.register-task "check-env-cov", "Verify that EGS_COV is set", #
    unless process.env.EGS_COV
      grunt.log.error "You must set the EGS_COV environment variable"
      false
  grunt.register-task "test-cov", ["check-env-cov", "mochaTest:test-cov"]
  grunt.register-task "default", ["build", "test"]
