import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename, relative } from 'path';

const BASE = '/Users/tk/Code/axe-core/packages/axe-core';
const SRC_CHECKS = join(BASE, 'test/checks');
const SRC_RULES = join(BASE, 'test/rule-matches');
const DST_CHECKS = join(BASE, 'test/browser/checks');
const DST_RULES = join(BASE, 'test/browser/rule-matches');

function findJsFiles(dir) {
  const results = [];
  function walk(d) {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (entry.endsWith('.js')) results.push(full);
    }
  }
  walk(dir);
  return results.sort();
}

function transformFile(src) {
  let content = readFileSync(src, 'utf8');

  // Determine needed imports
  const imports = ['describe', 'it', 'expect'];
  if (/\bbeforeEach\s*\(/.test(content)) imports.push('beforeEach');
  if (/\bafterEach\s*\(/.test(content)) imports.push('afterEach');
  const beforeMatches = content.match(/\bbefore\s*\(/g) || [];
  const beforeEachMatches = content.match(/\bbeforeEach\s*\(/g) || [];
  if (beforeMatches.length > beforeEachMatches.length) imports.push('beforeAll');
  const afterMatches = content.match(/\bafter\s*\(/g) || [];
  const afterEachMatches = content.match(/\bafterEach\s*\(/g) || [];
  if (afterMatches.length > afterEachMatches.length) imports.push('afterAll');

  if (/sinon\./.test(content)) imports.push('vi');

  const importLine = 'import { ' + imports.join(', ') + " } from 'vitest';\n\n";

  // Handle multi-line assert patterns by first normalizing some common patterns

  // assert.closeTo(a, b, delta)
  content = content.replace(/assert\.closeTo\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g,
    'expect($1).toBeCloseTo($2, $3)');

  // assert.sameMembers(a, b)
  content = content.replace(/assert\.sameMembers\(([^,]+),\s*([^)]+)\)/g,
    'expect($1).toEqual(expect.arrayContaining($2)); expect($2).toEqual(expect.arrayContaining($1))');

  // assert.includeMembers(a, b)
  content = content.replace(/assert\.includeMembers\(([^,]+),\s*([^)]+)\)/g,
    'expect($1).toEqual(expect.arrayContaining($2))');

  // assert.typeOf(a, 'type')
  content = content.replace(/assert\.typeOf\(([^,]+),\s*('[^']+')[^)]*\)/g,
    'expect(typeof $1).toBe($2)');

  // assert.hasAnyKeys - rare, handle if present
  content = content.replace(/assert\.hasAnyKeys\(([^,]+),\s*(\[[^\]]+\])\)/g,
    function(match, obj, keys) { return keys + '.forEach(k => expect(' + obj + ').toHaveProperty(k))'; });

  // Two-arg assert patterns (order matters - longer names first)
  var twoArgReplacements = [
    ['assert.strictEqual', 'expect($1).toBe($2)'],
    ['assert.notDeepEqual', 'expect($1).not.toEqual($2)'],
    ['assert.deepEqual', 'expect($1).toEqual($2)'],
    ['assert.notEqual', 'expect($1).not.toBe($2)'],
    ['assert.equal', 'expect($1).toBe($2)'],
    ['assert.include', 'expect($1).toContain($2)'],
    ['assert.notInclude', 'expect($1).not.toContain($2)'],
    ['assert.lengthOf', 'expect($1).toHaveLength($2)'],
    ['assert.notProperty', 'expect($1).not.toHaveProperty($2)'],
    ['assert.property', 'expect($1).toHaveProperty($2)'],
    ['assert.instanceOf', 'expect($1).toBeInstanceOf($2)'],
    ['assert.isAbove', 'expect($1).toBeGreaterThan($2)'],
    ['assert.isBelow', 'expect($1).toBeLessThan($2)'],
    ['assert.isAtLeast', 'expect($1).toBeGreaterThanOrEqual($2)'],
    ['assert.match', 'expect($1).toMatch($2)'],
  ];

  for (var pair of twoArgReplacements) {
    content = replaceFnCall(content, pair[0], 2, pair[1]);
  }

  // One-arg assert patterns
  var oneArgReplacements = [
    ['assert.isTrue', 'expect($1).toBe(true)'],
    ['assert.isFalse', 'expect($1).toBe(false)'],
    ['assert.isNull', 'expect($1).toBeNull()'],
    ['assert.isNotNull', 'expect($1).not.toBeNull()'],
    ['assert.isUndefined', 'expect($1).toBeUndefined()'],
    ['assert.isDefined', 'expect($1).toBeDefined()'],
    ['assert.isNotOk', 'expect($1).toBeFalsy()'],
    ['assert.isOk', 'expect($1).toBeTruthy()'],
    ['assert.ok', 'expect($1).toBeTruthy()'],
    ['assert.isFunction', "expect(typeof $1).toBe('function')"],
    ['assert.isString', "expect(typeof $1).toBe('string')"],
    ['assert.isNumber', "expect(typeof $1).toBe('number')"],
    ['assert.isArray', 'expect(Array.isArray($1)).toBe(true)'],
    ['assert.isObject', "expect(typeof $1).toBe('object')"],
    ['assert.throws', 'expect($1).toThrow()'],
    ['assert.doesNotThrow', 'expect($1).not.toThrow()'],
    ['assert.exists', 'expect($1).toBeDefined()'],
    ['assert.notExists', 'expect($1).toBeUndefined()'],
    ['assert.isEmpty', 'expect($1).toHaveLength(0)'],
    ['assert.isNotEmpty', 'expect($1.length).toBeGreaterThan(0)'],
  ];

  for (var pair of oneArgReplacements) {
    content = replaceFnCall(content, pair[0], 1, pair[1]);
  }

  // Handle bare assert(false, msg) -> expect(false).toBe(true)
  content = content.replace(/\bassert\(false,\s*[^)]+\)/g, 'expect(false).toBe(true)');

  // sinon replacements
  content = content.replace(/sinon\.stub\(([^,)]+),\s*([^)]+)\)\.returns\(/g,
    'vi.spyOn($1, $2).mockReturnValue(');
  content = content.replace(/sinon\.stub\(([^,)]+),\s*([^)]+)\)\.callsFake\(/g,
    'vi.spyOn($1, $2).mockImplementation(');
  content = content.replace(/sinon\.stub\(([^,)]+),\s*([^)]+)\)/g,
    'vi.spyOn($1, $2)');
  content = content.replace(/sinon\.stub\(\)\.returns\(/g,
    'vi.fn().mockReturnValue(');
  content = content.replace(/sinon\.fake\.returns\(/g,
    'vi.fn().mockReturnValue(');
  content = content.replace(/sinon\.spy\(\)/g, 'vi.fn()');
  content = content.replace(/sinon\.stub\(\)/g, 'vi.fn()');
  content = content.replace(/sinon\.restore\(\)/g, 'vi.restoreAllMocks()');

  // before( -> beforeAll(  (but not beforeEach)
  content = content.replace(/\bbefore\((?!Each|All)/g, 'beforeAll(');
  content = content.replace(/\bafter\((?!Each|All)/g, 'afterAll(');

  return importLine + content;
}

// Replace function calls handling nested parentheses
function replaceFnCall(content, fnName, argCount, template) {
  var escaped = fnName.replace(/\./g, '\\.');
  var regex = new RegExp(escaped + '\\(', 'g');
  var match;
  var replacements = [];

  while ((match = regex.exec(content)) !== null) {
    var startIdx = match.index;
    var argsStart = match.index + match[0].length;

    // Parse arguments handling nested parens
    var args = parseArgs(content, argsStart, argCount);
    if (!args) continue;

    var endIdx = args.endIdx;
    var original = content.substring(startIdx, endIdx + 1);

    var replacement = template;
    for (var i = 0; i < args.args.length; i++) {
      replacement = replacement.replace(new RegExp('\\$' + (i + 1), 'g'), args.args[i].trim());
    }

    replacements.push({ start: startIdx, end: endIdx + 1, original: original, replacement: replacement });
  }

  // Apply replacements in reverse order to preserve indices
  for (var i = replacements.length - 1; i >= 0; i--) {
    var r = replacements[i];
    content = content.substring(0, r.start) + r.replacement + content.substring(r.end);
  }

  return content;
}

function parseArgs(content, startIdx, expectedArgCount) {
  var depth = 1;
  var pos = startIdx;
  var args = [];
  var argStart = pos;
  var bracketDepth = 0;
  var braceDepth = 0;
  var inString = false;
  var stringChar = '';

  while (pos < content.length && depth > 0) {
    var ch = content[pos];

    if (inString) {
      if (ch === '\\') {
        pos += 2;
        continue;
      }
      if (ch === stringChar) {
        // For template literals, handle differently
        inString = false;
      }
      pos++;
      continue;
    }

    if (ch === "'" || ch === '"' || ch === '`') {
      inString = true;
      stringChar = ch;
      pos++;
      continue;
    }

    if (ch === '(') {
      depth++;
    } else if (ch === ')') {
      depth--;
      if (depth === 0) {
        if (pos > argStart) {
          args.push(content.substring(argStart, pos));
        }
        if (args.length >= expectedArgCount) {
          return { args: args.slice(0, expectedArgCount), endIdx: pos };
        }
        if (args.length >= 1 && expectedArgCount === 1) {
          return { args: args, endIdx: pos };
        }
        return null;
      }
    } else if (ch === '[') {
      bracketDepth++;
    } else if (ch === ']') {
      bracketDepth--;
    } else if (ch === '{') {
      braceDepth++;
    } else if (ch === '}') {
      braceDepth--;
    } else if (ch === ',' && depth === 1 && bracketDepth === 0 && braceDepth === 0) {
      args.push(content.substring(argStart, pos));
      if (args.length >= expectedArgCount) {
        // Find closing paren for the rest
        var remaining = depth;
        var p = pos + 1;
        var inStr2 = false;
        var sc2 = '';
        while (p < content.length && remaining > 0) {
          var c = content[p];
          if (inStr2) {
            if (c === '\\') { p += 2; continue; }
            if (c === sc2) inStr2 = false;
            p++; continue;
          }
          if (c === "'" || c === '"' || c === '`') { inStr2 = true; sc2 = c; p++; continue; }
          if (c === '(') remaining++;
          else if (c === ')') { remaining--; if (remaining === 0) { return { args: args, endIdx: p }; } }
          p++;
        }
        return null;
      }
      argStart = pos + 1;
    }

    pos++;
  }

  return null;
}

// Process checks
var count = 0;
var checkFiles = findJsFiles(SRC_CHECKS);
for (var src of checkFiles) {
  var rel = relative(SRC_CHECKS, src);
  var name = rel.replace(/\.js$/, '');
  var dst = join(DST_CHECKS, name + '.test.js');
  mkdirSync(dirname(dst), { recursive: true });
  var transformed = transformFile(src);
  writeFileSync(dst, transformed);
  count++;
  console.log('Migrated: checks/' + rel);
}

// Process rule-matches
var ruleFiles = findJsFiles(SRC_RULES);
for (var src of ruleFiles) {
  var rel = relative(SRC_RULES, src);
  var name = rel.replace(/\.js$/, '');
  var dst = join(DST_RULES, name + '.test.js');
  mkdirSync(dirname(dst), { recursive: true });
  var transformed = transformFile(src);
  writeFileSync(dst, transformed);
  count++;
  console.log('Migrated: rule-matches/' + rel);
}

console.log('\nTotal files migrated: ' + count);
