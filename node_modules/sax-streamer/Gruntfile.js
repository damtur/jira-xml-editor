"use strict";

module.exports = function(grunt) {
  require("load-grunt-tasks")(grunt);

  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: ".jshintrc",
        reporter: require("jshint-stylish")
      },
      gruntfile: {
        src: "Gruntfile.js"
      },
      src: {
        src: [ "src/**/*.js" ]
      },
      test: {
        src: [ "test/**/*.js" ]
      }
    },
    simplemocha: {
      options: {
        timeout: 500,
        ignoreLeaks: false,
        ui: "bdd",
        reporter: "progress",
        globals: [ "m" ]
      },

      all: {
        src: "test/**/*.js"
      }
    }
  });

  grunt.registerTask("lint", [ "jshint" ]);

  grunt.registerTask("default", [ "build" ]);

  grunt.registerTask("build", [ "lint", "test" ]);

  grunt.registerTask("test", [ "simplemocha:all" ]);
};