#!/usr/bin/env node
/**
 * Migration script: Mocha/Chai/Sinon -> Vitest
 * Transforms test files from test/core/ to test/unit/core/
 *
 * Uses a balanced-parenthesis parser to correctly handle nested function calls.
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  statSync
} from 'fs';
import { join, dirname, relative, basename } from 'path';

const SRC_DIR = join(import.meta.dirname, 'test/core');
const DST_DIR = join(import.meta.dirname, 'test/unit/core');

// Collect all .js files recursively
function collectFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectFiles(full));
    } else if (entry.endsWith('.js')) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Extract balanced parenthesized arguments starting from position `start`
 * which should be the index of the opening '('.
 * Returns { args: string, end: number } where end is the index of the closing ')'.
 */
function extractBalanced(s, start) {
  if (s[start] !== '(') return null;
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplate = false;
  let escaped = false;

  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (inSingleQuote) {
      if (ch === "'") inSingleQuote = false;
      continue;
    }
    if (inDoubleQuote) {
      if (ch === '"') inDoubleQuote = false;
      continue;
    }
    if (inTemplate) {
      if (ch === '`') inTemplate = false;
      continue;
    }
    if (ch === "'") {
      inSingleQuote = true;
      continue;
    }
    if (ch === '"') {
      inDoubleQuote = true;
      continue;
    }
    if (ch === '`') {
      inTemplate = true;
      continue;
    }
    if (ch === '(') depth++;
    if (ch === ')') {
      depth--;
      if (depth === 0) {
        return { args: s.substring(start + 1, i), end: i };
      }
    }
  }
  return null;
}

/**
 * Split top-level arguments by comma, respecting nested parens/brackets/quotes.
 */
function splitArgs(argsStr) {
  const result = [];
  let depth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplate = false;
  let escaped = false;

  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (escaped) {
      escaped = false;
      current += ch;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      current += ch;
      continue;
    }
    if (inSingleQuote) {
      current += ch;
      if (ch === "'") inSingleQuote = false;
      continue;
    }
    if (inDoubleQuote) {
      current += ch;
      if (ch === '"') inDoubleQuote = false;
      continue;
    }
    if (inTemplate) {
      current += ch;
      if (ch === '`') inTemplate = false;
      continue;
    }
    if (ch === "'") {
      inSingleQuote = true;
      current += ch;
      continue;
    }
    if (ch === '"') {
      inDoubleQuote = true;
      current += ch;
      continue;
    }
    if (ch === '`') {
      inTemplate = true;
      current += ch;
      continue;
    }
    if (ch === '(' || ch === '<') depth++;
    if (ch === ')' || ch === '>') depth--;
    if (ch === '{') braceDepth++;
    if (ch === '}') braceDepth--;
    if (ch === '[') bracketDepth++;
    if (ch === ']') bracketDepth--;

    if (ch === ',' && depth === 0 && braceDepth === 0 && bracketDepth === 0) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Find and replace assert.xxx(...) patterns using balanced paren extraction.
 * `pattern` should be the text to find, e.g., 'assert.equal'
 * `replacer` is a function that takes an array of args and returns the replacement string
 */
function replaceAssertPattern(s, pattern, replacer) {
  let result = '';
  let i = 0;
  while (i < s.length) {
    // Check if pattern matches at position i
    if (s.substring(i, i + pattern.length) === pattern) {
      // Make sure it's not part of a larger identifier
      const prevChar = i > 0 ? s[i - 1] : '';
      if (/\w/.test(prevChar)) {
        result += s[i];
        i++;
        continue;
      }
      const afterPattern = i + pattern.length;
      if (afterPattern < s.length && s[afterPattern] === '(') {
        const balanced = extractBalanced(s, afterPattern);
        if (balanced) {
          const args = splitArgs(balanced.args);
          const replacement = replacer(args);
          if (replacement !== null) {
            result += replacement;
            i = balanced.end + 1;
            continue;
          }
        }
      }
    }
    result += s[i];
    i++;
  }
  return result;
}

/**
 * Replace bare `assert(...)` - careful not to match `assert.xxx`
 */
function replaceBareAssert(s) {
  let result = '';
  let i = 0;
  while (i < s.length) {
    if (s.substring(i, i + 6) === 'assert' && s[i + 6] === '(') {
      const prevChar = i > 0 ? s[i - 1] : '';
      if (/\w/.test(prevChar)) {
        result += s[i];
        i++;
        continue;
      }
      // Make sure it's not assert.something
      const balanced = extractBalanced(s, i + 6);
      if (balanced) {
        const args = splitArgs(balanced.args);
        if (args.length === 1) {
          result += `expect(${args[0]}).toBeTruthy()`;
        } else if (args.length >= 2 && args[0].trim() === 'false') {
          result += `expect(false).toBe(true) /* ${args[1]} */`;
        } else {
          result += `expect(${args[0]}).toBeTruthy()`;
        }
        i = balanced.end + 1;
        continue;
      }
    }
    result += s[i];
    i++;
  }
  return result;
}

function migrateFile(content) {
  let s = content;

  // Remove 'use strict' statements
  s = s.replace(/^\s*'use strict';\s*$/gm, '');

  // === SINON TRANSFORMATIONS ===

  // sinon.stub(obj, 'method').returns(val) -> vi.spyOn(obj, 'method').mockReturnValue(val)
  // sinon.stub(obj, 'method').callsFake(fn) -> vi.spyOn(obj, 'method').mockImplementation(fn)
  // sinon.stub(obj, 'method') -> vi.spyOn(obj, 'method')
  s = replaceAssertPattern(s, 'sinon.stub', args => {
    if (args.length === 2) {
      return `vi.spyOn(${args[0]}, ${args[1]})`;
    } else if (args.length === 0) {
      return `vi.fn()`;
    }
    return null;
  });

  // Handle .returns() and .callsFake() chained on vi.spyOn / vi.fn
  s = s.replace(
    /vi\.spyOn\(([^)]+)\)\.returns\(/g,
    'vi.spyOn($1).mockReturnValue('
  );
  s = s.replace(
    /vi\.spyOn\(([^)]+)\)\.callsFake\(/g,
    'vi.spyOn($1).mockImplementation('
  );
  s = s.replace(/vi\.fn\(\)\.returns\(/g, 'vi.fn().mockReturnValue(');
  s = s.replace(/vi\.fn\(\)\.callsFake\(/g, 'vi.fn().mockImplementation(');

  // sinon.fake.returns(val) -> vi.fn().mockReturnValue(val)
  s = s.replace(/sinon\.fake\.returns\(/g, 'vi.fn().mockReturnValue(');

  // sinon.spy(obj, 'method') -> vi.spyOn(obj, 'method')
  s = replaceAssertPattern(s, 'sinon.spy', args => {
    if (args.length === 2) {
      return `vi.spyOn(${args[0]}, ${args[1]})`;
    } else if (args.length === 0) {
      return `vi.fn()`;
    } else if (args.length === 1) {
      // sinon.spy(fn) -> vi.fn(fn)... actually just wrap it
      return `vi.fn(${args[0]})`;
    }
    return null;
  });

  // sinon.restore() -> vi.restoreAllMocks()
  s = s.replace(/sinon\.restore\(\)/g, 'vi.restoreAllMocks()');

  // stub.restore() -> stub.mockRestore() - be careful not to match axe.utils.xxx.restore etc.
  // Only replace .restore() that's likely on a mock/spy variable
  s = s.replace(/(\w+)\.restore\(\)/g, (match, varName) => {
    // Don't replace known non-mock patterns
    if (
      [
        'sinon',
        'window',
        'document',
        'axe',
        'console',
        'orig',
        'original'
      ].includes(varName)
    ) {
      return match;
    }
    return `${varName}.mockRestore()`;
  });

  // .calledOnce -> handled below via expect patterns
  // .callCount -> .mock.calls.length
  s = s.replace(/\.callCount\b/g, '.mock.calls.length');

  // .getCall(n).args -> .mock.calls[n]
  s = s.replace(/\.getCall\((\d+)\)\.args/g, '.mock.calls[$1]');

  // spy.notCalled -> not have been called
  // spy.calledOnce -> was called once
  // These need special treatment because they're used in assert.isTrue(spy.calledOnce) etc.

  // === ASSERT TRANSFORMATIONS ===
  // Use the balanced-paren approach for all assert patterns

  // assert.fail
  s = replaceAssertPattern(s, 'assert.fail', args => {
    return `expect(true).toBe(false) /* ${args.join(', ')} */`;
  });

  // assert.sameMembers
  s = replaceAssertPattern(s, 'assert.sameMembers', args => {
    return `expect(${args[0]}).toEqual(expect.arrayContaining(${args[1]})); expect(${args[1]}).toEqual(expect.arrayContaining(${args[0]}))`;
  });

  // assert.sameDeepMembers
  s = replaceAssertPattern(s, 'assert.sameDeepMembers', args => {
    return `expect(${args[0]}).toEqual(expect.arrayContaining(${args[1]})); expect(${args[1]}).toEqual(expect.arrayContaining(${args[0]}))`;
  });

  // assert.includeMembers
  s = replaceAssertPattern(s, 'assert.includeMembers', args => {
    return `expect(${args[0]}).toEqual(expect.arrayContaining(${args[1]}))`;
  });

  // assert.closeTo
  s = replaceAssertPattern(s, 'assert.closeTo', args => {
    return `expect(${args[0]}).toBeCloseTo(${args[1]}, ${args[2]})`;
  });

  // assert.instanceOf
  s = replaceAssertPattern(s, 'assert.instanceOf', args => {
    return `expect(${args[0]}).toBeInstanceOf(${args[1]})`;
  });

  // assert.lengthOf
  s = replaceAssertPattern(s, 'assert.lengthOf', args => {
    return `expect(${args[0]}).toHaveLength(${args[1]})`;
  });

  // assert.hasAllKeys
  s = replaceAssertPattern(s, 'assert.hasAllKeys', args => {
    return `expect(Object.keys(${args[0]})).toEqual(expect.arrayContaining(${args[1]}))`;
  });

  // assert.hasAnyKeys
  s = replaceAssertPattern(s, 'assert.hasAnyKeys', args => {
    return `${args[1]}.forEach(k => expect(${args[0]}).toHaveProperty(k))`;
  });

  // assert.notProperty
  s = replaceAssertPattern(s, 'assert.notProperty', args => {
    return `expect(${args[0]}).not.toHaveProperty(${args[1]})`;
  });

  // assert.property
  s = replaceAssertPattern(s, 'assert.property', args => {
    return `expect(${args[0]}).toHaveProperty(${args[1]})`;
  });

  // assert.match
  s = replaceAssertPattern(s, 'assert.match', args => {
    return `expect(${args[0]}).toMatch(${args[1]})`;
  });

  // assert.isAbove
  s = replaceAssertPattern(s, 'assert.isAbove', args => {
    return `expect(${args[0]}).toBeGreaterThan(${args[1]})`;
  });

  // assert.isBelow
  s = replaceAssertPattern(s, 'assert.isBelow', args => {
    return `expect(${args[0]}).toBeLessThan(${args[1]})`;
  });

  // assert.isAtLeast
  s = replaceAssertPattern(s, 'assert.isAtLeast', args => {
    return `expect(${args[0]}).toBeGreaterThanOrEqual(${args[1]})`;
  });

  // assert.isAtMost
  s = replaceAssertPattern(s, 'assert.isAtMost', args => {
    return `expect(${args[0]}).toBeLessThanOrEqual(${args[1]})`;
  });

  // assert.typeOf
  s = replaceAssertPattern(s, 'assert.typeOf', args => {
    // args[0] is value, args[1] is type string, args[2] is optional message
    return `expect(typeof ${args[0]}).toBe(${args[1]})`;
  });

  // assert.isString
  s = replaceAssertPattern(s, 'assert.isString', args => {
    return `expect(typeof ${args[0]}).toBe('string')`;
  });

  // assert.isNumber
  s = replaceAssertPattern(s, 'assert.isNumber', args => {
    return `expect(typeof ${args[0]}).toBe('number')`;
  });

  // assert.isArray
  s = replaceAssertPattern(s, 'assert.isArray', args => {
    return `expect(Array.isArray(${args[0]})).toBe(true)`;
  });

  // assert.isObject
  s = replaceAssertPattern(s, 'assert.isObject', args => {
    return `expect(typeof ${args[0]}).toBe('object')`;
  });

  // assert.isFunction
  s = replaceAssertPattern(s, 'assert.isFunction', args => {
    return `expect(typeof ${args[0]}).toBe('function')`;
  });

  // assert.isEmpty
  s = replaceAssertPattern(s, 'assert.isEmpty', args => {
    return `expect(${args[0]}).toHaveLength(0)`;
  });

  // assert.isNotEmpty
  s = replaceAssertPattern(s, 'assert.isNotEmpty', args => {
    return `expect(${args[0]}.length).toBeGreaterThan(0)`;
  });

  // assert.exists
  s = replaceAssertPattern(s, 'assert.exists', args => {
    return `expect(${args[0]}).toBeDefined()`;
  });

  // assert.notExists
  s = replaceAssertPattern(s, 'assert.notExists', args => {
    return `expect(${args[0]}).toBeUndefined()`;
  });

  // assert.notInclude
  s = replaceAssertPattern(s, 'assert.notInclude', args => {
    return `expect(${args[0]}).not.toContain(${args[1]})`;
  });

  // assert.include
  s = replaceAssertPattern(s, 'assert.include', args => {
    return `expect(${args[0]}).toContain(${args[1]})`;
  });

  // assert.strictEqual
  s = replaceAssertPattern(s, 'assert.strictEqual', args => {
    return `expect(${args[0]}).toBe(${args[1]})`;
  });

  // assert.notDeepEqual
  s = replaceAssertPattern(s, 'assert.notDeepEqual', args => {
    return `expect(${args[0]}).not.toEqual(${args[1]})`;
  });

  // assert.deepEqual
  s = replaceAssertPattern(s, 'assert.deepEqual', args => {
    return `expect(${args[0]}).toEqual(${args[1]})`;
  });

  // assert.notStrictEqual
  s = replaceAssertPattern(s, 'assert.notStrictEqual', args => {
    return `expect(${args[0]}).not.toBe(${args[1]})`;
  });

  // assert.notEqual
  s = replaceAssertPattern(s, 'assert.notEqual', args => {
    return `expect(${args[0]}).not.toBe(${args[1]})`;
  });

  // assert.equal (must come after notEqual, deepEqual, strictEqual)
  s = replaceAssertPattern(s, 'assert.equal', args => {
    return `expect(${args[0]}).toBe(${args[1]})`;
  });

  // assert.isTrue
  s = replaceAssertPattern(s, 'assert.isTrue', args => {
    return `expect(${args[0]}).toBe(true)`;
  });

  // assert.isFalse
  s = replaceAssertPattern(s, 'assert.isFalse', args => {
    return `expect(${args[0]}).toBe(false)`;
  });

  // assert.isNull
  s = replaceAssertPattern(s, 'assert.isNull', args => {
    return `expect(${args[0]}).toBeNull()`;
  });

  // assert.isNotNull
  s = replaceAssertPattern(s, 'assert.isNotNull', args => {
    return `expect(${args[0]}).not.toBeNull()`;
  });

  // assert.isUndefined
  s = replaceAssertPattern(s, 'assert.isUndefined', args => {
    return `expect(${args[0]}).toBeUndefined()`;
  });

  // assert.isDefined
  s = replaceAssertPattern(s, 'assert.isDefined', args => {
    return `expect(${args[0]}).toBeDefined()`;
  });

  // assert.isNotOk
  s = replaceAssertPattern(s, 'assert.isNotOk', args => {
    return `expect(${args[0]}).toBeFalsy()`;
  });

  // assert.isOk
  s = replaceAssertPattern(s, 'assert.isOk', args => {
    return `expect(${args[0]}).toBeTruthy()`;
  });

  // assert.ok
  s = replaceAssertPattern(s, 'assert.ok', args => {
    return `expect(${args[0]}).toBeTruthy()`;
  });

  // assert.doesNotThrow
  s = replaceAssertPattern(s, 'assert.doesNotThrow', args => {
    return `expect(${args[0]}).not.toThrow()`;
  });

  // assert.throws - can have 1, 2, or 3 args
  s = replaceAssertPattern(s, 'assert.throws', args => {
    if (args.length === 1) {
      return `expect(${args[0]}).toThrow()`;
    } else if (args.length === 2) {
      return `expect(${args[0]}).toThrow(${args[1]})`;
    } else if (args.length >= 3) {
      // (fn, ErrorType, message) - use the message or ErrorType
      return `expect(${args[0]}).toThrow(${args[2]})`;
    }
    return null;
  });

  // Bare assert(...)
  s = replaceBareAssert(s);

  // before( -> beforeAll(  (only standalone Mocha hooks, not method calls like .before() or beforeEach)
  // Must be preceded by start-of-line whitespace or `;` or `{` or `}`, NOT by `.`
  s = s.replace(/(?<=[{\s;,])before\((?!Each|All)/g, 'beforeAll(');
  s = s.replace(/^before\((?!Each|All)/gm, 'beforeAll(');

  // after( -> afterAll(  (only standalone Mocha hooks, not method calls like .after() or afterEach)
  s = s.replace(/(?<=[{\s;,])after\((?!Each|All)/g, 'afterAll(');
  s = s.replace(/^after\((?!Each|All)/gm, 'afterAll(');

  // Handle sinon patterns that are used in assertions:
  // expect(spy.calledOnce).toBe(true) -> expect(spy).toHaveBeenCalledTimes(1)
  s = s.replace(
    /expect\((\w+)\.calledOnce\)\.toBe\(true\)/g,
    'expect($1).toHaveBeenCalledTimes(1)'
  );
  // expect(spy.notCalled).toBe(true) -> expect(spy).not.toHaveBeenCalled()
  s = s.replace(
    /expect\((\w+)\.notCalled\)\.toBe\(true\)/g,
    'expect($1).not.toHaveBeenCalled()'
  );
  // expect(spy.called).toBe(true) -> expect(spy).toHaveBeenCalled()
  s = s.replace(
    /expect\((\w+)\.called\)\.toBe\(true\)/g,
    'expect($1).toHaveBeenCalled()'
  );

  // Determine which imports are needed
  const needs = new Set();
  if (/\bdescribe\s*[.(]/.test(s)) needs.add('describe');
  if (/\bit\s*[.(]/.test(s)) needs.add('it');
  if (/\bexpect\s*\(/.test(s)) needs.add('expect');
  if (/\bbeforeEach\s*\(/.test(s)) needs.add('beforeEach');
  if (/\bafterEach\s*\(/.test(s)) needs.add('afterEach');
  if (/\bbeforeAll\s*\(/.test(s)) needs.add('beforeAll');
  if (/\bafterAll\s*\(/.test(s)) needs.add('afterAll');
  if (/\bvi\./.test(s)) needs.add('vi');

  const imports = Array.from(needs);
  const importLine = `import { ${imports.join(', ')} } from 'vitest';\n\n`;

  s = importLine + s;

  return s;
}

// Main
const files = collectFiles(SRC_DIR);
console.log(`Found ${files.length} files to migrate`);

for (const srcFile of files) {
  const rel = relative(SRC_DIR, srcFile);
  const dir = dirname(rel);
  const base = basename(rel, '.js');
  const dstRel = join(dir, `${base}.test.js`);
  const dstFile = join(DST_DIR, dstRel);

  mkdirSync(dirname(dstFile), { recursive: true });

  const content = readFileSync(srcFile, 'utf8');
  const migrated = migrateFile(content);
  writeFileSync(dstFile, migrated, 'utf8');
  console.log(`  ${rel} -> ${dstRel}`);
}

console.log(`\nMigrated ${files.length} files`);
