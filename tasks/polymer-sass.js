'use strict';

let cheerio = require('cheerio');
let nodeSass = require('node-sass');

let path = require('path');

module.exports = (grunt) => {

    grunt.registerMultiTask('polymer-sass', 'Converts external SCSS files into inline CSS in Polymer components', function() {

        let options = this.options({
        });

        this.files.forEach((files) => {

            let fileSrc = path.resolve(files.src[0]);

            if (!grunt.file.exists(fileSrc)) {
                grunt.fail.fatal('Could not find source file - ' + fileSrc);
            }
            grunt.verbose.writeln('File - ' + fileSrc);

            // get the root folder of the file
            let fileRootDir = path.dirname(fileSrc);
            grunt.verbose.writeln('Root File Dir - ' + fileRootDir);

            // load the html file
            let $ = cheerio.load(grunt.file.read(fileSrc),{
                xml: {
                    withDomLvl1: false
                }
            });

            // find the style tags
            let styleTags = $('template').find('style');

            styleTags.each((i, rootEle) => {

                let ele = $(rootEle);
                let eleParent = ele.parent();

                let relSassPath = $(ele).attr('href');

                // resolve the full path of the SASS file
                let sassPath = path.join(fileRootDir, relSassPath);
                grunt.verbose.writeln('Full SASS Path - ' + sassPath);

                if (!grunt.file.exists(sassPath)) {
                    grunt.fail.fatal('Could not find linked SASS file - ' + sassPath);
                }

                // set up SASS config
                let sassConfig = {
                    file: sassPath,
                    outputStyle: 'compressed'
                };

                // compile the sass
                let renderedSass = nodeSass.renderSync(sassConfig).css.toString();
                renderedSass.replace('/n' ,'');

                eleParent.append('<style>' + renderedSass + '</style>');
                ele.remove();

            });

            // write the destination
            grunt.file.write(files.dest, $.html());

        });

    });

};