import fs from 'fs';
import path from 'path';

const TEST_DIR = 'test/browser/core';
const AVAILABLE_EXPORTS = new Set([
  'MockCheckContext',
  'shadowSupport',
  'getFixture',
  'injectIntoFixture',
  'fixtureSetup',
  'checkSetup',
  'queryShadowFixture',
  'shadowCheckSetup',
  'flatTreeSetup',
  'awaitNestedLoad',
  'addStyleSheet',
  'addStyleSheets',
  'removeStyleSheets',
  'assertStylesheet',
  'queryFixture',
  'getCheckEvaluate',
  'captureError',
  'runPartialRecursive',
  'shadowQuerySelector',
  'createNestedShadowDom',
  'html',
  'assertResultsDeepEqual',
  'registerTestHooks',
  'checks',
  'commons'
]);

function getRelativeImportPath(filePath) {
  const dir = path.dirname(filePath);
  const rel = path.relative(dir, 'test/browser');
  return rel + '/testutils';
}

function findAllTestFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findAllTestFiles(full));
    } else if (entry.name.endsWith('.test.ts')) {
      results.push(full);
    }
  }
  return results;
}

function transformFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const neededImports = new Set();

  // 1. Handle destructuring: const { X, Y } = axe.testUtils;
  content = content.replace(
    /(?:const|let|var)\s+\{([^}]+)\}\s*=\s*axe\.testUtils;?\n?/g,
    (full, names) => {
      const nameList = names
        .split(',')
        .map(n => n.trim())
        .filter(Boolean);
      for (const name of nameList) {
        if (AVAILABLE_EXPORTS.has(name)) {
          neededImports.add(name);
        }
      }
      return '';
    }
  );

  // 2. Handle single assignments: const/let X = axe.testUtils.X;
  content = content.replace(
    /(?:const|let|var)\s+(\w+)\s*=\s*axe\.testUtils\.(\w+);?\n?/g,
    (full, localName, testUtilName) => {
      if (AVAILABLE_EXPORTS.has(testUtilName)) {
        neededImports.add(testUtilName);
        return '';
      }
      return full;
    }
  );

  // 3. Handle inline axe.testUtils.X references
  const inlinePattern = /axe\.testUtils\.(\w+)/g;
  let match;
  while ((match = inlinePattern.exec(content)) !== null) {
    const name = match[1];
    if (AVAILABLE_EXPORTS.has(name)) {
      neededImports.add(name);
    }
  }
  content = content.replace(/axe\.testUtils\.(\w+)/g, (full, name) => {
    if (AVAILABLE_EXPORTS.has(name)) {
      return name;
    }
    return full;
  });

  // 4. Handle reporters/helpers special cases
  if (filePath.includes('reporters/helpers/000_runfirst')) {
    content = `import { it } from 'vitest';

declare const axe: any;
// HACK: make "helpers" a global, as the tests rely on it.
(globalThis as any).helpers = axe._thisWillBeDeletedDoNotUse.helpers;
`;
  } else if (
    filePath.includes('reporters/helpers/') &&
    !filePath.includes('000_runfirst')
  ) {
    content = content.replace(
      /(?:const\s+)?helpers\s*=\s*axe\._thisWillBeDeletedDoNotUse\.helpers;?/g,
      'const helpers = (axe as any)._thisWillBeDeletedDoNotUse.helpers;'
    );
  }

  // 5. Add imports if needed
  if (neededImports.size > 0) {
    const importPath = getRelativeImportPath(filePath);
    const importNames = Array.from(neededImports).sort().join(', ');
    const importLine = `import { ${importNames} } from '${importPath}';\n`;

    const existingImport =
      /import\s+\{([^}]+)\}\s+from\s+['"][^'"]*testutils['"];?\n?/;
    const existingMatch = content.match(existingImport);
    if (existingMatch) {
      const existingNames = existingMatch[1]
        .split(',')
        .map(n => n.trim())
        .filter(Boolean);
      const allNames = new Set([...existingNames, ...neededImports]);
      const merged = Array.from(allNames).sort().join(', ');
      content = content.replace(
        existingImport,
        `import { ${merged} } from '${importPath}';\n`
      );
    } else {
      // Add import after last import line
      const importRegex = /^import\s+.*?[;\n]/gm;
      let lastImportEnd = 0;
      let m;
      while ((m = importRegex.exec(content)) !== null) {
        lastImportEnd = m.index + m[0].length;
      }
      if (lastImportEnd > 0) {
        // insert after the newline following last import
        content =
          content.slice(0, lastImportEnd) +
          '\n' +
          importLine +
          content.slice(lastImportEnd);
      } else {
        content = importLine + content;
      }
    }
  }

  // 6. Remove `declare const axe: any;` ONLY if axe is no longer referenced elsewhere
  const declarePattern = /declare const axe: any;?\n?/;
  if (declarePattern.test(content)) {
    const withoutDeclare = content.replace(declarePattern, '');
    // Check if 'axe' is still used (not in import paths or comments)
    // Simple check: look for axe. or axe[ or axe) etc.
    const axeStillUsed = /\baxe\b/.test(
      withoutDeclare
        .replace(/from\s+['"][^'"]*['"];?/g, '') // remove import paths
        .replace(/\/\/.*$/gm, '') // remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // remove multi-line comments
    );
    if (!axeStillUsed) {
      content = content.replace(declarePattern, '');
      // Clean up extra blank lines
      content = content.replace(/\n{3,}/g, '\n\n');
    }
  }

  // 7. Fix const in traditional for-loops
  content = content.replace(
    /for\s*\(\s*const\s+(\w+)\s*=\s*(\d+)\s*;/g,
    'for (let $1 = $2;'
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

const files = findAllTestFiles(TEST_DIR);
let changed = 0;
for (const f of files) {
  if (transformFile(f)) {
    changed++;
    console.log('Changed: ' + f);
  }
}
console.log('\nTotal: ' + files.length + ' files, ' + changed + ' changed');
