import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
declare const checks: any;
describe('invalidrole', function () {
  const fixture = document.getElementById('fixture');
  const queryFixture = axe.testUtils.queryFixture;
  const checkContext = axe.testUtils.MockCheckContext();

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext.reset();
  });

  it('should return true if applied to an empty role', function () {
    const virtualNode = queryFixture('<div id="target" role="">Contents</div>');
    expect(
      checks.invalidrole.evaluate.call(
        checkContext,
        virtualNode.actualNode,
        null,
        virtualNode
      )
    ).toBe(true);
    expect(checkContext._data).toEqual(['']);
  });

  it('should return true if applied to a nonsensical role', function () {
    const virtualNode = queryFixture(
      '<div id="target" role="foo">Contents</div>'
    );
    expect(
      checks.invalidrole.evaluate.call(
        checkContext,
        virtualNode.actualNode,
        null,
        virtualNode
      )
    ).toBe(true);
    expect(checkContext._data).toEqual(['foo']);
  });

  it('should return false if applied to a concrete role', function () {
    const virtualNode = queryFixture(
      '<div id="target" role="alert">Contents</div>'
    );
    expect(
      checks.invalidrole.evaluate.call(
        checkContext,
        virtualNode.actualNode,
        null,
        virtualNode
      )
    ).toBe(false);
    expect(checkContext._data).toBeNull();
  });

  it('should return false if applied to an abstract role', function () {
    const virtualNode = queryFixture(
      '<div id="target" role="widget">Contents</div>'
    );
    expect(
      checks.invalidrole.evaluate.call(
        checkContext,
        virtualNode.actualNode,
        null,
        virtualNode
      )
    ).toBe(false);
    expect(checkContext._data).toBeNull();
  });

  it('should return false if applied to multiple valid roles', function () {
    const virtualNode = queryFixture(
      '<div id="target" role="alert button">Contents</div>'
    );
    expect(
      checks.invalidrole.evaluate.call(
        checkContext,
        virtualNode.actualNode,
        null,
        virtualNode
      )
    ).toBe(false);
    expect(checkContext._data).toBeNull();
  });

  it('should return false if atleast one role is valid', function () {
    const virtualNode = queryFixture(
      '<div id="target" role="alert button foo bar">Contents</div>'
    );
    expect(
      checks.invalidrole.evaluate.call(
        checkContext,
        virtualNode.actualNode,
        null,
        virtualNode
      )
    ).toBe(false);
  });

  it('should return true if all roles are invalid', function () {
    const virtualNode = queryFixture(
      '<div id="target" role="foo bar">Contents</div>'
    );
    expect(
      checks.invalidrole.evaluate.call(
        checkContext,
        virtualNode.actualNode,
        null,
        virtualNode
      )
    ).toBe(true);
    expect(checkContext._data).toEqual(['foo', 'bar']);
  });

  it('should return true if applied to an uppercase nonsensical role', function () {
    const virtualNode = queryFixture(
      '<div id="target" role="FOO">Contents</div>'
    );
    expect(
      checks.invalidrole.evaluate.call(
        checkContext,
        virtualNode.actualNode,
        null,
        virtualNode
      )
    ).toBe(true);
    expect(checkContext._data).toEqual(['FOO']);
  });

  it('should return false if applied to an uppercase valid role', function () {
    const virtualNode = queryFixture(
      '<div id="target" role="BUTTON">Contents</div>'
    );
    expect(
      checks.invalidrole.evaluate.call(
        checkContext,
        virtualNode.actualNode,
        null,
        virtualNode
      )
    ).toBe(false);
  });
});
