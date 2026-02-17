import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import handler from 'serve-handler';
import { AxeBuilder } from '@axe-core/webdriverjs';
import { getWebdriver } from '../get-webdriver';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const serverPort = 9898;
const axePath = path.resolve(import.meta.dirname, '../../axe.js');
const axeSource = fs.readFileSync(axePath, 'utf8');
const actPath = path.resolve(
  import.meta.dirname,
  '../../node_modules/wcag-act-rules/'
);
const testCaseJsonPath = path.resolve(
  actPath,
  './content-assets/wcag-act-rules/testcases.json'
);

const addr = `http://localhost:${serverPort}/WAI/content-assets/wcag-act-rules/`;
const testCaseJson = JSON.parse(fs.readFileSync(testCaseJsonPath, 'utf8'));

interface ActRunnerOptions {
  id: string;
  title: string;
  axeRules: string[];
  skipTests?: string[];
}

export default ({ id, title, axeRules, skipTests = [] }: ActRunnerOptions) => {
  describe(
    `${title} (${id})`,
    () => {
      let driver: any;
      let server: http.Server;
      const testcases = testCaseJson.testcases.filter(
        ({ ruleId }: any) => ruleId === id
      );

      beforeAll(async () => {
        driver = getWebdriver();
        server = http.createServer((request, response) => {
          return handler(request, response, {
            cleanUrls: false,
            rewrites: [
              {
                source:
                  '/WAI/content-assets/wcag-act-rules/:dir?/:subDir?/:file?',
                destination:
                  '/node_modules/wcag-act-rules/content-assets/wcag-act-rules/:dir?/:subDir?/:file?'
              }
            ]
          });
        });
        await new Promise<void>(resolve => server.listen(serverPort, resolve));
      });

      afterAll(async () => {
        await driver.close();
        await new Promise<void>(r => server.close(() => r()));
      });

      testcases.forEach((testcase: any) => {
        const shouldRun =
          testcase.relativePath.match(/\.(xhtml|html?)$/) &&
          !skipTests.includes(testcase.testcaseId);

        (shouldRun ? it : it.skip)(
          testcase.testcaseTitle,
          async () => {
            await driver.get(`${addr}/${testcase.relativePath}`);

            const builder = new AxeBuilder(driver, axeSource);
            builder.withRules(axeRules);
            const results = await builder.analyze();

            if (testcase.expected !== 'failed') {
              expect(
                results.violations,
                `Expected 0 violations for testcase ${testcase.testcaseId}`
              ).toHaveLength(0);
            } else {
              const issues = results.violations[0] || results.incomplete[0];
              expect(
                issues,
                `Expected violations or incomplete for testcase ${testcase.testcaseId}`
              ).toBeDefined();
              expect(issues.nodes.length).toBeGreaterThanOrEqual(1);
            }
          },
          50000
        );
      });
    },
    { timeout: 50000, retry: 3 }
  );
};
