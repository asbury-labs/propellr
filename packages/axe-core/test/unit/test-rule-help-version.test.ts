import { describe, it, expect } from 'vitest';

declare const axe: any;
import https from 'https';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJSON = require(path.join(__dirname, '../../package.json'));

const versions = packageJSON.version.split('.');
const version = versions[0] + '.' + versions[1];

describe('rule help version', function () {
  it(
    'latest axe version (' + version + ') rule help docs should be active',
    function () {
      return new Promise(function (resolve, reject) {
        https.get(
          'https://dequeuniversity.com/rules/axe/' + version,
          function (res) {
            try {
              expect(res.statusCode).toBeGreaterThanOrEqual(200);
              expect(res.statusCode).toBeLessThanOrEqual(299);
              resolve();
            } catch (err) {
              reject(err);
            }
          }
        );
      });
    }
  );
});
