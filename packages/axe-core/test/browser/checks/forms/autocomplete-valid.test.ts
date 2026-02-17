import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('autocomplete-valid', function () {
  const fixture = document.getElementById('fixture');
  const checkSetup = axe.testUtils.checkSetup;
  const checkContext = axe.testUtils.MockCheckContext();
  const evaluate = axe.testUtils.getCheckEvaluate('autocomplete-valid');

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext.reset();
  });

  it('returns true if autocomplete is valid', function () {
    const params = checkSetup('<input autocomplete="on" id="target" />');
    expect(evaluate.apply(checkContext, params)).toBe(true);
  });

  it('returns false if autocomplete is not valid', function () {
    const params = checkSetup('<input autocomplete="foo" id="target" />');
    expect(evaluate.apply(checkContext, params)).toBe(false);
  });

  it('returns undefined (incomplete) if autocomplete is ignored', function () {
    const params = checkSetup('<input autocomplete="text" id="target" />');
    expect(evaluate.apply(checkContext, params)).toBeUndefined();
  });

  it('uses options to change what is valid autocomplete', function () {
    const options = { stateTerms: ['foo'] };
    const params = checkSetup(
      '<input autocomplete="foo" id="target" />',
      options
    );
    expect(evaluate.apply(checkContext, params)).toBe(true);
  });
});
