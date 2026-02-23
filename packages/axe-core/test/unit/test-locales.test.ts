// @vitest-environment node
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'node:module';
import { globSync } from 'glob';

const require = createRequire(import.meta.url);
const axe = require('../../dist/axe.js');

const localeFiles = globSync(
  path.join(import.meta.dirname, '../../locales/*.json')
);

describe('locales', function () {
  localeFiles.forEach(function (localeFile) {
    const localeName = path.basename(localeFile);
    it(localeName + ' should be valid', function () {
      const localeData = fs.readFileSync(localeFile, 'utf-8');
      const locale = JSON.parse(localeData);
      function fn() {
        axe.configure({ locale: locale });
      }

      expect(fn).not.toThrow();
    });
  });
});
