import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
declare const checks: any;
describe('fallbackrole', function () {
  const fixture = document.getElementById('fixture');
  const queryFixture = axe.testUtils.queryFixture;

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should return true if fallback role is used', function () {
    const virtualNode = queryFixture(
      '<div id="target" role="button foobar">Foo</div>'
    );
    expect(
      checks.fallbackrole.evaluate(virtualNode.actualNode, null, virtualNode)
    ).toBe(true);
  });

  it('should return false if fallback role is not used', function () {
    const virtualNode = queryFixture(
      '<div id="target" role="button">Foo</div>'
    );
    expect(
      checks.fallbackrole.evaluate(virtualNode.actualNode, null, virtualNode)
    ).toBe(false);
  });

  it('should return false if applied to an invalid role', function () {
    const virtualNode = queryFixture(
      '<div id="target" role="foobar">Foo</div>'
    );
    expect(
      checks.fallbackrole.evaluate(virtualNode.actualNode, null, virtualNode)
    ).toBe(false);
  });

  it('should return false if applied to an invalid role', function () {
    const virtualNode = queryFixture(
      '<div id="target" role="foobar">Foo</div>'
    );
    expect(
      checks.fallbackrole.evaluate(virtualNode.actualNode, null, virtualNode)
    ).toBe(false);
  });

  it('should return undefined/needs review if an element with no implicit role uses both none and presentation', function () {
    const virtualNode = queryFixture(
      '<div id="target" role="none presentation">Foo</div>'
    );
    expect(
      checks.fallbackrole.evaluate(virtualNode.actualNode, null, virtualNode)
    ).toBeUndefined();
  });

  it('should return undefined/needs review if an element with no implicit role uses both presentation and none', function () {
    const virtualNode = queryFixture(
      '<div id="target" role="presentation none">Foo</div>'
    );
    expect(
      checks.fallbackrole.evaluate(virtualNode.actualNode, null, virtualNode)
    ).toBeUndefined();
  });

  it('should return true if an element with an implicit role uses both presentation and none', function () {
    const virtualNode = queryFixture(
      '<input type="text" id="target" role="presentation none"/>'
    );
    expect(
      checks.fallbackrole.evaluate(virtualNode.actualNode, null, virtualNode)
    ).toBe(true);
  });
});
