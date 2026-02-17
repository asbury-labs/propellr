#!/bin/bash
# Migration script for checks and rule-matches tests from Mocha/Chai to Vitest

BASE="/Users/tk/Code/axe-core/packages/axe-core"
SRC_CHECKS="$BASE/test/checks"
SRC_RULES="$BASE/test/rule-matches"
DST_CHECKS="$BASE/test/browser/checks"
DST_RULES="$BASE/test/browser/rule-matches"

transform_file() {
  local src="$1"
  local dst="$2"

  # Determine imports needed
  local has_before_all=false
  local has_after_all=false
  local has_before_each=false
  local has_after_each=false

  grep -q '\bbefore(' "$src" && has_before_all=true
  grep -q '\bafter(' "$src" && has_after_all=true
  grep -q '\bbeforeEach(' "$src" && has_before_each=true
  grep -q '\bafterEach(' "$src" && has_after_each=true

  # Build import list
  local imports="describe, it, expect"
  if $has_before_each; then imports="$imports, beforeEach"; fi
  if $has_after_each; then imports="$imports, afterEach"; fi
  if $has_before_all; then imports="$imports, beforeAll"; fi
  if $has_after_all; then imports="$imports, afterAll"; fi

  # Check for sinon usage
  if grep -q 'sinon\.' "$src"; then
    imports="$imports, vi"
  fi

  # Create directory
  mkdir -p "$(dirname "$dst")"

  # Write import + transformed content
  {
    echo "import { $imports } from 'vitest';"
    echo ""
    cat "$src"
  } | sed \
    -e "s/assert\.strictEqual(\([^,]*\), \([^)]*\))/expect(\1).toBe(\2)/g" \
    -e "s/assert\.equal(\([^,]*\), \([^)]*\))/expect(\1).toBe(\2)/g" \
    -e "s/assert\.notEqual(\([^,]*\), \([^)]*\))/expect(\1).not.toBe(\2)/g" \
    -e "s/assert\.deepEqual(\([^,]*\), \([^)]*\))/expect(\1).toEqual(\2)/g" \
    -e "s/assert\.notDeepEqual(\([^,]*\), \([^)]*\))/expect(\1).not.toEqual(\2)/g" \
    -e "s/assert\.isTrue(\([^)]*\))/expect(\1).toBe(true)/g" \
    -e "s/assert\.isFalse(\([^)]*\))/expect(\1).toBe(false)/g" \
    -e "s/assert\.isNull(\([^)]*\))/expect(\1).toBeNull()/g" \
    -e "s/assert\.isNotNull(\([^)]*\))/expect(\1).not.toBeNull()/g" \
    -e "s/assert\.isUndefined(\([^)]*\))/expect(\1).toBeUndefined()/g" \
    -e "s/assert\.isDefined(\([^)]*\))/expect(\1).toBeDefined()/g" \
    -e "s/assert\.isNotOk(\([^)]*\))/expect(\1).toBeFalsy()/g" \
    -e "s/assert\.isOk(\([^)]*\))/expect(\1).toBeTruthy()/g" \
    -e "s/assert\.ok(\([^)]*\))/expect(\1).toBeTruthy()/g" \
    -e "s/assert\.isFunction(\([^)]*\))/expect(typeof \1).toBe('function')/g" \
    -e "s/assert\.isString(\([^)]*\))/expect(typeof \1).toBe('string')/g" \
    -e "s/assert\.isNumber(\([^)]*\))/expect(typeof \1).toBe('number')/g" \
    -e "s/assert\.isArray(\([^)]*\))/expect(Array.isArray(\1)).toBe(true)/g" \
    -e "s/assert\.isAbove(\([^,]*\), \([^)]*\))/expect(\1).toBeGreaterThan(\2)/g" \
    -e "s/assert\.isBelow(\([^,]*\), \([^)]*\))/expect(\1).toBeLessThan(\2)/g" \
    -e "s/assert\.isAtLeast(\([^,]*\), \([^)]*\))/expect(\1).toBeGreaterThanOrEqual(\2)/g" \
    -e "s/assert\.match(\([^,]*\), \([^)]*\))/expect(\1).toMatch(\2)/g" \
    -e "s/assert\.include(\([^,]*\), \([^)]*\))/expect(\1).toContain(\2)/g" \
    -e "s/assert\.notInclude(\([^,]*\), \([^)]*\))/expect(\1).not.toContain(\2)/g" \
    -e "s/assert\.lengthOf(\([^,]*\), \([^)]*\))/expect(\1).toHaveLength(\2)/g" \
    -e "s/assert\.property(\([^,]*\), \([^)]*\))/expect(\1).toHaveProperty(\2)/g" \
    -e "s/assert\.notProperty(\([^,]*\), \([^)]*\))/expect(\1).not.toHaveProperty(\2)/g" \
    -e "s/assert\.throws(\([^)]*\))/expect(\1).toThrow()/g" \
    -e "s/assert\.doesNotThrow(\([^)]*\))/expect(\1).not.toThrow()/g" \
    -e "s/assert\.exists(\([^)]*\))/expect(\1).toBeDefined()/g" \
    -e "s/assert\.notExists(\([^)]*\))/expect(\1).toBeUndefined()/g" \
    -e "s/assert\.instanceOf(\([^,]*\), \([^)]*\))/expect(\1).toBeInstanceOf(\2)/g" \
    -e "s/assert\.isEmpty(\([^)]*\))/expect(\1).toHaveLength(0)/g" \
    -e "s/assert\.isNotEmpty(\([^)]*\))/expect(\1.length).toBeGreaterThan(0)/g" \
    -e "s/assert\.closeTo(\([^,]*\), \([^,]*\), \([^)]*\))/expect(\1).toBeCloseTo(\2, \3)/g" \
    -e "s/sinon\.restore()/vi.restoreAllMocks()/g" \
    > "$dst"

  # Handle remaining patterns that sed can't easily do (multi-line safe with perl)
  # before( -> beforeAll( but NOT beforeEach(
  if $has_before_all; then
    perl -i -pe 's/\bbefore\((?!Each|All)/beforeAll(/g' "$dst"
  fi
  if $has_after_all; then
    perl -i -pe 's/\bafter\((?!Each|All)/afterAll(/g' "$dst"
  fi

  # sinon replacements
  if grep -q 'sinon\.' "$dst"; then
    # sinon.stub(obj, 'method').returns(val) -> vi.spyOn(obj, 'method').mockReturnValue(val)
    perl -i -pe "s/sinon\.stub\(([^,]+),\s*([^)]+)\)\.returns\(/vi.spyOn(\$1, \$2).mockReturnValue(/g" "$dst"
    # sinon.stub(obj, 'method').callsFake(fn) -> vi.spyOn(obj, 'method').mockImplementation(fn)
    perl -i -pe "s/sinon\.stub\(([^,]+),\s*([^)]+)\)\.callsFake\(/vi.spyOn(\$1, \$2).mockImplementation(/g" "$dst"
    # sinon.stub(obj, 'method') -> vi.spyOn(obj, 'method')
    perl -i -pe "s/sinon\.stub\(([^,]+),\s*([^)]+)\)/vi.spyOn(\$1, \$2)/g" "$dst"
    # sinon.stub().returns(val) -> vi.fn().mockReturnValue(val)
    perl -i -pe "s/sinon\.stub\(\)\.returns\(/vi.fn().mockReturnValue(/g" "$dst"
    # sinon.fake.returns(val) -> vi.fn().mockReturnValue(val)
    perl -i -pe "s/sinon\.fake\.returns\(/vi.fn().mockReturnValue(/g" "$dst"
    # sinon.spy() -> vi.fn()
    perl -i -pe "s/sinon\.spy\(\)/vi.fn()/g" "$dst"
    # sinon.stub() -> vi.fn()
    perl -i -pe "s/sinon\.stub\(\)/vi.fn()/g" "$dst"
  fi
}

# Process checks
count=0
for src in $(find "$SRC_CHECKS" -name '*.js' -type f | sort); do
  rel="${src#$SRC_CHECKS/}"
  name="${rel%.js}"
  dst="$DST_CHECKS/${name}.test.js"
  transform_file "$src" "$dst"
  count=$((count + 1))
  echo "Migrated: checks/$rel"
done

# Process rule-matches
for src in $(find "$SRC_RULES" -name '*.js' -type f | sort); do
  rel="${src#$SRC_RULES/}"
  name="${rel%.js}"
  dst="$DST_RULES/${name}.test.js"
  transform_file "$src" "$dst"
  count=$((count + 1))
  echo "Migrated: rule-matches/$rel"
done

echo ""
echo "Total files migrated: $count"
