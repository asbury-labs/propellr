import { describe, it, expect, afterEach } from 'vitest';
import { checkSetup, getCheckEvaluate, MockCheckContext } from '../../../testutils';

describe('landmark', function () {
  const fixture = document.getElementById('fixture')!;
  const checkEvaluate = getCheckEvaluate('landmark');
  const checkContext = MockCheckContext();

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext.reset();
  });

  it('should return true when role=main is found', function () {
    const checkArgs = checkSetup('<div role="main"></div>', '#fixture');
    expect(checkEvaluate.apply(checkContext, checkArgs)).toBe(true);
  });

  it('should return true when <main> is found', function () {
    const checkArgs = checkSetup('<main></main>', '#fixture');
    expect(checkEvaluate.apply(checkContext, checkArgs)).toBe(true);
  });

  it('should otherwise return false', function () {
    const checkArgs = checkSetup('<div role="contentinfo"></div>', '#fixture');
    expect(checkEvaluate.apply(checkContext, checkArgs)).toBe(false);
  });

  it(
    'should not automatically pass if there is a shadow tree',
    function () {
      const node = document.createElement('div');
      const shadow = node.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<div></div>';
      const checkArgs = checkSetup(node, '#fixture');

      expect(checkEvaluate.apply(checkContext, checkArgs)).toBe(false);
    }
  );

  it(
    'should find elements inside shadow trees',
    function () {
      const node = document.createElement('div');
      const shadow = node.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<main></main>';
      const checkArgs = checkSetup(node, '#fixture');

      expect(checkEvaluate.apply(checkContext, checkArgs)).toBe(true);
    }
  );

  it(
    'should find elements slotted in shadow trees',
    function () {
      const node = document.createElement('div');
      node.innerHTML = '<main></main>';
      const shadow = node.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<slot></slot>';
      const checkArgs = checkSetup(node, '#fixture');

      expect(checkEvaluate.apply(checkContext, checkArgs)).toBe(true);
    }
  );
});
