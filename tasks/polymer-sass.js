'use strict';

let cheerio = require('cheerio');
let nodeSass = require('node-sass');

let path = require('path');

module.exports = (grunt) => {

    grunt.registerMultiTask('polymer-sass', 'Converts external SCSS files into inline CSS in Polymer components', function() {

        let options = this.options({
        });

        function parseSass($, sourcePath) {

            // set up SASS config
            let sassConfig = {
                file: sourcePath,
                outputStyle: 'compressed'
            };

            // compile the sass
            let renderedSass = nodeSass.renderSync(sassConfig).css.toString();
            renderedSass = renderedSass.replace('/n' ,'');

            return renderedSass;

        }

        function parseCss($, sourcePath){
            let content = grunt.file.read(sourcePath);
            content = content.replace('/n' ,'');
            return content;
        }

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

                let lang = ele.attr('lang');

                grunt.verbose.writeln('Lang - '  + lang);

                if (lang === undefined) {
                    return;
                }

                let relSourcePath = $(ele).attr('href');
                
                // resolve the full path of the SASS file
                let sourcePath = path.join(fileRootDir, relSourcePath);
                grunt.verbose.writeln('Full Source Path - ' + sourcePath);
    
                if (!grunt.file.exists(sourcePath)) {
                    grunt.fail.fatal('Could not find linked source file - ' + sourcePath);
                }
    
                let content;

                switch(lang){

                    case 'sass': {
                        content = parseSass($, sourcePath);
                        break;
                    }

                    case 'css': {
                        content = parseCss($, sourcePath);
                        break;
                    }

                }

                eleParent.append('<style>' + content + '</style>');
                ele.remove();

            });

            // write the destination
            grunt.file.write(files.dest, $.html());

        });

    });

};