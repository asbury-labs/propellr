import { describe, it, expect, afterEach } from 'vitest';
import {
  checkSetup,
  fixtureSetup,
  getCheckEvaluate,
  MockCheckContext,
  shadowSupport
} from '../../../testutils';

describe('listitem', function () {
  const checkContext = MockCheckContext();
  const checkEvaluate = getCheckEvaluate('listitem');

  afterEach(function () {
    checkContext.reset();
  });

  it('should pass if the listitem has a parent <ol>', function () {
    const params = checkSetup('<ol><li id="target">My list item</li></ol>');
    const result = checkEvaluate.apply(checkContext, params);
    expect(result).toBe(true);
  });

  it('should pass if the listitem has a parent <ul>', function () {
    const params = checkSetup('<ul><li id="target">My list item</li></ul>');
    const result = checkEvaluate.apply(checkContext, params);
    expect(result).toBe(true);
  });

  it('should pass if the listitem has a parent role=list', function () {
    const params = checkSetup(
      '<div role="list"><li id="target">My list item</li></div>'
    );
    const result = checkEvaluate.apply(checkContext, params);
    expect(result).toBe(true);
  });

  it('should pass if the listitem has a parent role=none', function () {
    const params = checkSetup(
      '<ul role="none"><li id="target">My list item</li></ul>'
    );
    const result = checkEvaluate.apply(checkContext, params);
    expect(result).toBe(true);
  });

  it('should pass if the listitem has a parent role=presentation', function () {
    const params = checkSetup(
      '<ul role="presentation"><li id="target">My list item</li></ul>'
    );
    const result = checkEvaluate.apply(checkContext, params);
    expect(result).toBe(true);
  });

  it('should fail if the listitem has an incorrect parent', function () {
    const params = checkSetup('<div><li id="target">My list item</li></div>');
    const result = checkEvaluate.apply(checkContext, params);
    expect(result).toBe(false);
  });

  it('should fail if the listitem has a parent <ol> with changed role', function () {
    const params = checkSetup(
      '<ol role="menubar"><li id="target">My list item</li></ol>'
    );
    const result = checkEvaluate.apply(checkContext, params);
    expect(result).toBe(false);
    expect(checkContext._data.messageKey).toBe('roleNotValid');
  });

  it('should pass if the listitem has a parent <ol> with an invalid role', function () {
    const params = checkSetup(
      '<ol role="invalid-role"><li id="target">My list item</li></ol>'
    );
    const result = checkEvaluate.apply(checkContext, params);
    expect(result).toBe(true);
  });

  it('should pass if the listitem has a parent <ol> with an abstract role', function () {
    const params = checkSetup(
      '<ol role="section"><li id="target">My list item</li></ol>'
    );
    const result = checkEvaluate.apply(checkContext, params);
    expect(result).toBe(true);
  });

  (shadowSupport.v1 ? it : xit)(
    'should return true in a shadow DOM pass',
    function () {
      const node = document.createElement('div');
      node.innerHTML = '<li id="target">My list item </li>';
      const shadow = node.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<ul><slot></slot></ul>';
      fixtureSetup(node);
      const target = node.querySelector('#target');
      const virtualTarget = axe.utils.getNodeFromTree(target);
      const result = checkEvaluate.apply(checkContext, [
        target,
        {},
        virtualTarget
      ]);
      expect(result).toBe(true);
    }
  );

  (shadowSupport.v1 ? it : xit)(
    'should return false in a shadow DOM fail',
    function () {
      const node = document.createElement('div');
      node.innerHTML = '<li id="target">My list item </li>';
      const shadow = node.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<div><slot></slot></div>';
      fixtureSetup(node);
      const target = node.querySelector('#target');
      const virtualTarget = axe.utils.getNodeFromTree(target);
      const result = checkEvaluate.apply(checkContext, [
        target,
        {},
        virtualTarget
      ]);
      expect(result).toBe(false);
    }
  );
});
