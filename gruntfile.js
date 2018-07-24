module.exports = function(grunt) {

    grunt.initConfig({

        clean: {
            dist: ['dist/html', '*.html', 'dist/json', '*.json'],
            tmp: ['templates/tmp'],

        },

        includes: {
            html: {
                cwd: 'templates',
                src: ['html/*.html'],
                dest: 'dist/',
                options: {

                    flatten: true,
                    includePath: 'templates'
                }
            },

            json: {
                cwd: 'templates/json',
                src: ['*.json'],
                dest: 'templates/tmp/',
                options: {

                    flatten: true,
                    includePath: 'templates'
                }
            }
        },


        copy: {
            html: {
                expand: true,
                flatten: true,
                src: ['dist/html/*.html'],
                dest: '',
                filter: 'isFile',
            },
            json: {
                expand: true,
                flatten: true,
                src: ['templates/tmp/*.json'],
                dest: 'dist/json',
                filter: 'isFile',
            }


        },



        "jsbeautifier": {
            files: ["templates/tmp/*.json"],
            options: {}
        }





    });

    grunt.loadNpmTasks('grunt-includes');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks("grunt-jsbeautifier");

    // grunt.registerTask('json', 'jsbeautifier');
    grunt.registerTask('build', ['clean:dist', 'includes:json', 'jsbeautifier', 'includes:html',  'copy:html',  'copy:json', 'clean:tmp']);
    grunt.registerTask('default', ['build']);
};