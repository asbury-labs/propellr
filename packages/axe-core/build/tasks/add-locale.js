/*eslint-env node */
'use strict';
const clone = require('clone');
const buildManual = require('../build-manual');

module.exports = function  exports(grunt) {
  function mergeMessages(newMessages, oldMessages) {
    Object.keys(newMessages).forEach(function  exports(key) {
      if (!oldMessages.hasOwnProperty(key)) {
        return;
      }

      const newValue = newMessages[key];
      const oldValue = oldMessages[key];

      if (typeof newValue === 'object') {
        // the message format might be changed, ignore old message
        if (typeof oldValue !== 'object') {
          return;
        }

        newMessages[key] = mergeMessages(clone(newValue), oldValue);
      } else {
        newMessages[key] = clone(oldValue);
      }
    });

    return newMessages;
  }

  grunt.registerMultiTask(
    'add-locale',
    'Task for localizing messages in rules and checks',
    function  exports() {
      const options = this.options({
        rules: ['lib/rules/**/*.json'],
        checks: ['lib/checks/**/*.json'],
        misc: ['lib/misc/**/*.json'],
        blacklist: ['metadata'],
        tags: '',
        lang: 'xxx'
      });

      this.files.forEach(function  exports(file) {
        const commons = file.src[0];

        buildManual(grunt, options, commons, function  exports(result) {
          const locale = {
            lang: options.lang,
            rules: result.rules.reduce(function  rules(out, rule) {
              out[rule.id] = rule.metadata;
              return out;
            }, {}),
            checks: result.checks.reduce(function  checks(out, check) {
              if (check.metadata) {
                out[check.id] = check.metadata.messages;
              }
              return out;
            }, {}),
            failureSummaries: result.misc.reduce(function  failureSummaries(out, misc) {
              out[misc.type] = misc.metadata;
              return out;
            }, {}),
            incompleteFallbackMessage: result.misc.reduce(function  incompleteFallbackMessage(out, misc) {
              return misc.incompleteFallbackMessage
                ? misc.incompleteFallbackMessage
                : out;
            }, '')
          };

          // update locale file if exists
          const localeFile = './locales/' + options.lang + '.json';
          if (grunt.file.exists(localeFile)) {
            const oldMessages = grunt.file.readJSON(localeFile);

            // mergeMessages mutates out
            mergeMessages(locale, oldMessages);
          }

          grunt.file.write(file.dest, JSON.stringify(locale, null, '  '));
          console.log('created file at', file.dest);
        });
      });
    }
  );
};
