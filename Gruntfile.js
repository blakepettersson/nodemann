module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-jsbeautifier');

    grunt.initConfig({
        // Configure a mochaTest task
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/**/*.js', ]
            }
        },
        jsbeautifier: {
            files: ['**/*.js', '!node_modules/**/*.js'],
            options: {}
        }

    });

    grunt.registerTask('default', ['mochaTest', 'jsbeautifier']);
};
