// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axe = require('../../../dist/axe.js');

describe('node axe-core', function () {
  it('should run axe on a jsdom document', async function () {
    const domStr = fs.readFileSync(
      path.join(
        import.meta.dirname,
        '../../integration/full/all-rules/all-rules.html'
      ),
      'utf8'
    );
    const dom = new JSDOM(domStr);

    const results = await axe.run(dom.window.document.documentElement, {
      preload: false,
      rules: { 'color-contrast': { enabled: false } }
    });

    expect(results.violations.length).not.toBe(0);
  });
});
