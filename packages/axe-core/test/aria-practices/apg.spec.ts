import path from 'node:path';
import fs from 'node:fs';
import { AxeBuilder } from '@axe-core/webdriverjs';
import { getWebdriver } from '../get-webdriver';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { globSync } from 'glob';

describe(
  'aria-practices',
  () => {
    // Use path.resolve rather than require.resolve because APG package.json main file does not exist
    const apgPath = path.resolve(
      import.meta.dirname,
      '../../node_modules/aria-practices/'
    );
    const filePaths = globSync(
      `${apgPath}/content/patterns/*/**/examples/*.html`,
      { posix: true }
    );
    const testFiles = filePaths.map(
      fileName => fileName.split('/aria-practices/content/patterns/')[1]
    );

    const addr = `http://localhost:9876/node_modules/aria-practices/`;
    let driver: any;
    let axeSource: string;

    beforeAll(async () => {
      const axePath = path.resolve(import.meta.dirname, '../../axe.js');
      axeSource = fs.readFileSync(axePath, 'utf8');
      driver = getWebdriver();
    });

    afterAll(async () => {
      await driver.close();
    });

    const disabledRules: Record<string, string[]> = {
      '*': [
        'color-contrast',
        'target-size',
        'heading-order', // w3c/aria-practices#2119
        'scrollable-region-focusable' // w3c/aria-practices#2114
      ]
    };

    const skippedPages = [
      'toolbar/examples/help.html', // Embedded into another page
      'tabs/examples/tabs-actions.html' // dequelabs/axe-core#4584
    ];

    it('finds examples', () => {
      expect(testFiles.length).toBeGreaterThan(0);
    });

    testFiles
      .filter(filePath => !skippedPages.includes(filePath))
      .forEach(filePath => {
        it(`finds no issue in "${filePath}"`, async () => {
          await driver.get(`${addr}content/patterns/${filePath}`);

          const builder = new AxeBuilder(driver, axeSource)
            // Support table has no title and has duplicate ids
            .exclude('#at-support')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .disableRules([
              ...disabledRules['*'],
              ...(disabledRules[filePath] || [])
            ]);

          const { violations } = await builder.analyze();
          const issues = violations.map(
            ({ id, nodes }: { id: string; nodes: any[] }) => ({
              id,
              issues: nodes.length
            })
          );
          expect(
            issues,
            issues.map(({ id }: { id: string }) => id).join(', ')
          ).toHaveLength(0);
        }, 50000);
      });
  },
  { timeout: 50000, retry: 3 }
);
