module.exports = function (grunt) {
  grunt.initConfig({
    gorilla: {
      dist: {
        files: {
          "lib/prism_gs.js": ["src/prism_gs.gs"],
          "lib/prism_egs.js": ["src/prism_egs.gs"],
          "lib/index.js": ["src/index.gs"],
          "lib/examples.js": ["src/examples.gs"]
        }
      }
    },
    concat: {
      dist: {
        src: [
          "src/prism.js",
          "lib/prism_gs.js",
          "lib/prism_egs.js",
          "node_modules/gorillascript/extras/gorillascript.js",
          "node_modules/egs/extras/egs-runtime.js",
          "node_modules/egs/extras/egs.js",
          "lib/index.js",
          "lib/examples.js"
        ],
        dest: "lib/code.js"
      }
    },
    uglify: {
      dist: {
        files: {
          "lib/code.min.js": ["lib/code.js"]
        }
      }
    }
  });
  grunt.loadNpmTasks("grunt-gorilla");
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask("default", ["gorilla", "concat", "uglify"]);
};
