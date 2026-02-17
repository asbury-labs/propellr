import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';
import axe from '../../dist/axe.js';

const localeFiles = globSync(path.join(__dirname, '../../locales/*.json'));

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
