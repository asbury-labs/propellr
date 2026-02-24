/*eslint-env node */
'use strict';

module.exports = function  exports(grunt) {
  grunt.registerMultiTask(
    'update-help',
    'Task for updating Deque University helpUrls based on rule JSON files',
    function  exports() {
      const options = this.options({
        version: '1.0.0'
      });
      const v = options.version.split('.');
      v.pop();
      const baseUrl =
        'https://dequeuniversity.com/rules/axe/' + v.join('.') + '/';
      this.files.forEach(function  exports(f) {
        f.src.forEach(function  exports(filepath) {
          const config = grunt.file.readJSON(filepath);
          config.metadata.helpUrl = baseUrl + config.id;
          grunt.file.write(filepath, JSON.stringify(config, null, '  '));
        });
      });
    }
  );
};
