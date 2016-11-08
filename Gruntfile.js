module.exports = function(grunt) {

  // Project tasks configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      options: {
        jshintrc: true,
        ignores: ['js/lib/modernizr*.js']
      },
      src: ['config/**/*.js', 'js/**/*.js']
    }
  });

  // Load grunt plugins
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Default task(s).
  grunt.registerTask('default', ['jshint']);
};
