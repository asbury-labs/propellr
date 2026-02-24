#!/usr/bin/env node
/**
 * Script to remove shadowSupport feature detection guards from .test.ts files.
 * This is a one-time migration script.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const testDir = join(import.meta.dirname, 'packages/axe-core/test');

function findTestFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...findTestFiles(full));
    } else if (full.endsWith('.test.ts')) {
      results.push(full);
    }
  }
  return results;
}

function processFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  const original = content;

  // Track if file uses shadowSupport at all
  if (!content.includes('shadowSupport') && !content.includes('shadowSupported') && !content.includes('shadowSupportV1')) {
    return false;
  }

  // Pattern 1: Remove `const shadowSupported = shadowSupport.v1;` declarations
  content = content.replace(/^\s*const shadowSupported = shadowSupport\.v1;\n/gm, '');

  // Pattern 1b: Remove `const shadowSupportV1 = shadowSupport.v1;` declarations
  content = content.replace(/^\s*const shadowSupportV1 = shadowSupport\.v1;\n/gm, '');

  // Pattern 1c: Remove inline shadow support detection like:
  //   const shadowSupport = typeof document.body.attachShadow === 'function';
  //   const shadowSupported = typeof document.body.attachShadow === 'function';
  content = content.replace(/^\s*const shadowSupport(?:ed)?\s*=\s*\n?\s*typeof document\.body\.attachShadow === ['"]function['"];\n/gm, '');

  // Pattern 2: `(shadowSupported ? it : xit)(` → `it(`
  content = content.replace(/\(shadowSupported \? it : xit\)\(/g, 'it(');

  // Pattern 2b: `(shadowSupportV1 ? it : xit)(` → `it(`
  content = content.replace(/\(shadowSupportV1 \? it : xit\)\(/g, 'it(');

  // Pattern 2c: `(shadowSupport.v1 ? it : xit)(` → `it(`
  content = content.replace(/\(shadowSupport\.v1 \? it : xit\)\(/g, 'it(');

  // Pattern 2d: `(shadowSupport.v0 ? it : xit)(` → delete entire test case
  // This needs special handling - we'll mark for deletion below

  // Pattern 3: `describe.skipIf(!shadowSupported)(` → `describe(`
  content = content.replace(/describe\.skipIf\(!shadowSupported\)\(/g, 'describe(');

  // Pattern 3b: `describe.skipIf(!shadowSupportV1)(` → `describe(`
  content = content.replace(/describe\.skipIf\(!shadowSupportV1\)\(/g, 'describe(');

  // Pattern 4: `const testSuite = shadowSupported ? describe : describe.skip;` → remove, replace testSuite with describe
  content = content.replace(/^\s*const testSuite = shadowSupported \? describe : describe\.skip;\n/gm, '');
  content = content.replace(/\btestSuite\(/g, 'describe(');

  // Pattern 5: `if (shadowSupported) {` wrapping if blocks - unwrap (remove if and closing })
  // Handle `if (shadowSupported) {` and `if (shadowSupportV1) {`
  content = unwrapIfBlocks(content, /^\s*if \(shadowSupport(?:ed|V1|\.v1)\) \{/);

  // Pattern 6: `if (shadowSupport.v1) {` wrapping blocks - unwrap
  content = unwrapIfBlocks(content, /^\s*if \(shadowSupport\.v1\) \{/);

  // Pattern 7: Remove `if (!shadowSupported) { return; }` early returns inside test bodies
  content = content.replace(/^\s*if \(!shadowSupported\) \{\s*\n\s*return;\s*\n\s*\}\s*\n/gm, '');

  // Delete v0 shadow DOM blocks: `if (shadowSupport.v0) { ... }`
  content = deleteIfBlocks(content, /^\s*if \(shadowSupport\.v0\) \{/);

  // Delete undefined shadow DOM blocks: `if (shadowSupport.undefined) { ... }`
  content = deleteIfBlocks(content, /^\s*if \(shadowSupport\.undefined\) \{/);

  // Remove shadowSupport from import statements
  // Pattern: import { ..., shadowSupport, ... } from '...testutils';
  content = content.replace(
    /import \{([^}]*)\bshadowSupport\b([^}]*)\} from ['"][^'"]*testutils['"];?\n/g,
    (match, before, after) => {
      // Remove shadowSupport from the import list
      let imports = (before + after)
        .split(',')
        .map(s => s.trim())
        .filter(s => s && s !== 'shadowSupport');
      if (imports.length === 0) {
        return ''; // Remove entire import
      }
      // Reconstruct
      const quote = match.includes("'") ? "'" : '"';
      const fromMatch = match.match(/from\s+(['"].*?['"])/);
      const from = fromMatch ? fromMatch[1] : '';
      const semi = match.trimEnd().endsWith(';') ? ';' : '';
      return `import { ${imports.join(', ')} } from ${from}${semi}\n`;
    }
  );

  // Also handle multiline imports
  content = content.replace(
    /import \{\n([^}]*)\bshadowSupport\b([^}]*)\} from ['"][^'"]*testutils['"];?\n/g,
    (match, before, after) => {
      let imports = (before + after)
        .split(',')
        .map(s => s.trim())
        .filter(s => s && s !== 'shadowSupport' && s !== '');
      if (imports.length === 0) {
        return '';
      }
      const fromMatch = match.match(/from\s+(['"].*?['"])/);
      const from = fromMatch ? fromMatch[1] : '';
      const semi = match.trimEnd().endsWith(';') ? ';' : '';
      if (imports.length <= 3) {
        return `import { ${imports.join(', ')} } from ${from}${semi}\n`;
      }
      return `import {\n  ${imports.join(',\n  ')}\n} from ${from}${semi}\n`;
    }
  );

  // Clean up any double blank lines left behind
  content = content.replace(/\n{3,}/g, '\n\n');

  if (content !== original) {
    writeFileSync(filePath, content);
    return true;
  }
  return false;
}

/**
 * Unwrap an if block: remove the `if (...) {` line and its matching `}`
 * while keeping the body (dedented by one level).
 */
function unwrapIfBlocks(content, pattern) {
  const lines = content.split('\n');
  const result = [];
  let i = 0;

  while (i < lines.length) {
    if (pattern.test(lines[i])) {
      const ifLine = lines[i];
      const indent = ifLine.match(/^(\s*)/)[1];
      // Find the matching closing brace
      let braceCount = 1;
      let j = i + 1;
      while (j < lines.length && braceCount > 0) {
        const line = lines[j];
        // Count braces (simple approach - works for well-formatted code)
        for (const ch of line) {
          if (ch === '{') braceCount++;
          if (ch === '}') braceCount--;
        }
        if (braceCount > 0) {
          // Dedent the body by removing one level of indentation (2 spaces)
          let dedented;
          if (lines[j].startsWith(indent + '  ')) {
            dedented = indent + lines[j].slice(indent.length + 2);
          } else {
            dedented = lines[j];
          }
          result.push(dedented);
        }
        // If braceCount is 0, this is the closing brace - skip it
        j++;
      }
      i = j;
    } else {
      result.push(lines[i]);
      i++;
    }
  }
  return result.join('\n');
}

/**
 * Delete an if block entirely: remove the `if (...) {` line and everything
 * up to and including its matching `}`.
 */
function deleteIfBlocks(content, pattern) {
  const lines = content.split('\n');
  const result = [];
  let i = 0;

  while (i < lines.length) {
    if (pattern.test(lines[i])) {
      // Find the matching closing brace and skip everything
      let braceCount = 1;
      let j = i + 1;
      while (j < lines.length && braceCount > 0) {
        for (const ch of lines[j]) {
          if (ch === '{') braceCount++;
          if (ch === '}') braceCount--;
        }
        j++;
      }
      i = j;
    } else {
      result.push(lines[i]);
      i++;
    }
  }
  return result.join('\n');
}

// Main
const files = findTestFiles(testDir);
let modified = 0;
for (const f of files) {
  if (processFile(f)) {
    modified++;
    console.log('Modified:', f.replace(testDir + '/', ''));
  }
}
console.log(`\nDone. Modified ${modified} files.`);
