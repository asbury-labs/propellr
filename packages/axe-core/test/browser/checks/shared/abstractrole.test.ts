import { describe, it, expect, afterEach } from 'vitest';
import { checks, MockCheckContext, queryFixture } from '../../../testutils';

describe('abstractrole', function () {
  const fixture = document.getElementById('fixture')!;
  const checkContext = MockCheckContext();

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext.reset();
  });

  it('should return false if applied to a concrete role', function () {
    const virtualNode = queryFixture(
      '<div id="target" role="alert">Contents</div>'
    );
    expect(
      checks.abstractrole.evaluate.call(
        checkContext,
        virtualNode.actualNode,
        'radio',
        virtualNode
      )
    ).toBe(false);
    expect(checkContext._data).toBeNull();
  });

  it('should return false if applied to a nonsensical role', function () {
    const virtualNode = queryFixture(
      '<div id="target" role="foo">Contents</div>'
    );
    expect(
      checks.abstractrole.evaluate.call(
        checkContext,
        virtualNode.actualNode,
        'radio',
        virtualNode
      )
    ).toBe(false);
    expect(checkContext._data).toBeNull();
  });

  it('should return true if applied to an abstract role', function () {
    const virtualNode = queryFixture(
      '<div id="target" role="widget">Contents</div>'
    );
    expect(
      checks.abstractrole.evaluate.call(
        checkContext,
        virtualNode.actualNode,
        'radio',
        virtualNode
      )
    ).toBe(true);
    expect(checkContext._data).toEqual(['widget']);
  });

  it('should return false if applied to multiple concrete roles', function () {
    const virtualNode = queryFixture(
      '<div id="target" role="alert button">Contents</div>'
    );
    expect(
      checks.abstractrole.evaluate.call(
        checkContext,
        virtualNode.actualNode,
        'radio',
        virtualNode
      )
    ).toBe(false);
    expect(checkContext._data).toBeNull();
  });

  it('should return true if applied to at least one abstract role', function () {
    const virtualNode = queryFixture(
      '<div id="target" role="alert widget structure">Contents</div>'
    );
    expect(
      checks.abstractrole.evaluate.call(
        checkContext,
        virtualNode.actualNode,
        'radio',
        virtualNode
      )
    ).toBe(true);
    expect(checkContext._data).toEqual(['widget', 'structure']);
  });
});
