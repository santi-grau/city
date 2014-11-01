module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		requirejs: {
			compile: {
				options: {
					name: "main",
					baseUrl : "./public/js",
					mainConfigFile: "./public/js/main.js",
					out: "./public/js/main-min.js"
				}
			}
		}
	});
	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-requirejs');
	// Default task(s).
	grunt.registerTask('default', ['requirejs']);
};