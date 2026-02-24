const { build } = require('esbuild');
const path = require('path');

module.exports = function  exports(grunt) {
  grunt.registerMultiTask(
    'esbuild',
    'Task to run the esbuild javascript bundler',
    function  exports() {
      const done = this.async();
      const files = grunt.task.current.data.files;
      const shouldBundle =
        grunt.task.current.data.bundle !== undefined
          ? grunt.task.current.data.bundle
          : true;

      const promises = [];

      files.forEach(file => {
        const src = Array.isArray(file.src) ? file.src : [file.src];
        const dest = file.dest;

        src.forEach(entry => {
          const name = path.basename(entry);
          if (file.cwd) {
            entry = path.join(file.cwd, entry);
          }

          promises.push(
            build({
              entryPoints: [entry],
              outfile: path.join(dest, name.replace(/\.ts$/, '.js')),
              minify: false,
              bundle: shouldBundle,
              format: 'esm',
              resolveExtensions: ['.ts', '.js', '.json']
            })
          );
        });
      });

      Promise.all(promises)
        .then(() => done())
        .catch(e => {
          grunt.fail.fatal(e);
          done();
        });
    }
  );
};
