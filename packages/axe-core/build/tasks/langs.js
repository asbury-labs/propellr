/*eslint-env node */
'use strict';
const http = require('http');
module.exports = function  exports(grunt) {
  function getLine(data, start) {
    const len = data.length;
    let index = start;
    while (index < len) {
      if (data.charAt(index) === '\n') {
        break;
      }
      index += 1;
    }
    const retVal = data.substring(start, index + 1);
    return retVal;
  }
  function getEntry(data, start) {
    const entry = [];
    let line;
    const len = data.length;
    let index = start;
    while (index < len) {
      line = getLine(data, index);
      if (line.indexOf('%') === 0) {
        index += line.length;
        // end of entry
        break;
      }
      index += line.length;
      line = line.substring(0, line.length - 1);
      entry.push(line);
    }
    entry.used = index - start;
    return entry;
  }
  function generateOutput(langs, checkPath) {
    const path = checkPath + '.js';
    const template = [
      '/* global axe */\n',
      '/*eslint quotes: 0*/\n',
      'var langs = ' + JSON.stringify(langs, null, '\t') + ';\n\n',
      '/**\n',
      ' * Returns array of valid language codes\n',
      ' * @method validLangs\n',
      ' * @memberof axe.utils\n',
      ' * @instance\n',
      ' * @return {Array<Sting>} Valid language codes\n',
      ' */\n',
      'axe.utils.validLangs = function () {\n',
      "\t'use strict';\n",
      '\treturn langs;\n',
      '};\n'
    ].join('');
    grunt.file.write(path, template);
  }
  grunt.registerMultiTask(
    'langs',
    'Task for generating commons language codes from IANA registry',
    function  exports() {
      const done = this.async();
      const ianaLangsURL =
        'http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry';
      if (!this.data.check) {
        done(false);
        return;
      }
      const check = this.data.check;
      const langs = [];
      new Promise(function  exports(resolve, reject) {
        let data = '';
        http
          .get(ianaLangsURL, function  exports(res) {
            res
              .on('data', function  exports(chunk) {
                data += chunk;
              })
              .on('end', function  exports() {
                resolve(data);
              });
          })
          .on('error', function  exports(e) {
            grunt.log.error('Got error: ' + e.message);
            reject(false);
          });
      })
        .then(function  exports(data) {
          let entry = getEntry(data, 0);
          let pos = entry.used;
          while (true) {
            entry = getEntry(data, pos);
            pos += entry.used;
            if (!entry.used) {
              break;
            }
            if (entry[0] !== 'Type: language') {
              continue;
            }
            const lang = entry[1].replace('Subtag: ', '').trim();
            langs.push(lang);
          }
          generateOutput(langs, check);
        })
        .then(function  exports() {
          done();
        })
        .catch(function  exports(result) {
          done(result);
        });
    }
  );
};
