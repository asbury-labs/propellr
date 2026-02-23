import { describe, it, expect, afterEach } from 'vitest';
import {
  checkSetup,
  getCheckEvaluate,
  MockCheckContext,
  shadowCheckSetup,
  shadowSupport
} from '../../../testutils';

declare const axe: any;
describe('header-present', function () {
  const fixture = document.getElementById('fixture')!;
  const shadowSupported = shadowSupport.v1;
  const checkContext = MockCheckContext();

  afterEach(function () {
    fixture.innerHTML = '';
    axe._tree = undefined;
    checkContext.reset();
  });

  it('should return true if h1-h6 is found', function () {
    const params = checkSetup('<h1 id="target">Hi</h1>');
    expect(getCheckEvaluate('header-present').apply(checkContext, params)).toBe(
      true
    );

    params = checkSetup('<h2 id="target">Hi</h2>');
    expect(getCheckEvaluate('header-present').apply(checkContext, params)).toBe(
      true
    );

    params = checkSetup('<h3 id="target">Hi</h3>');
    expect(getCheckEvaluate('header-present').apply(checkContext, params)).toBe(
      true
    );

    params = checkSetup('<h4 id="target">Hi</h4>');
    expect(getCheckEvaluate('header-present').apply(checkContext, params)).toBe(
      true
    );

    params = checkSetup('<h5 id="target">Hi</h5>');
    expect(getCheckEvaluate('header-present').apply(checkContext, params)).toBe(
      true
    );

    params = checkSetup('<h6 id="target">Hi</h6>');
    expect(getCheckEvaluate('header-present').apply(checkContext, params)).toBe(
      true
    );
  });

  it('should return true if role=heading is found', function () {
    const params = checkSetup('<div role="heading" id="target">Hi</div>');
    expect(getCheckEvaluate('header-present').apply(checkContext, params)).toBe(
      true
    );
  });

  it('should otherwise return false', function () {
    const params = checkSetup('<p id="target">Some stuff and stuff</p>');
    expect(getCheckEvaluate('header-present').apply(checkContext, params)).toBe(
      false
    );
  });

  it('should return false if heading has a different role', function () {
    const params = checkSetup(
      '<h1 role="none" id="target">Some stuff and stuff</h1>'
    );
    expect(getCheckEvaluate('header-present').apply(checkContext, params)).toBe(
      false
    );
  });

  (shadowSupported ? it : xit)(
    'should return true if heading is in shadow dom',
    function () {
      const params = shadowCheckSetup('<div id="target"><div>', '<h1></h1>');
      expect(
        getCheckEvaluate('header-present').apply(checkContext, params)
      ).toBe(true);
    }
  );
});
