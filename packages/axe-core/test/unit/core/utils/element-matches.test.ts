import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('utils.matchesSelector', () => {
  const matchesSelector = axe.utils.matchesSelector;

  function mockMethod(method, returnValue) {
    const result = {};
    result[method] = () => {
      return returnValue;
    };
    result.ownerDocument = {
      defaultView: {
        Element: {
          prototype: {}
        }
      }
    };
    result.ownerDocument.defaultView.Element.prototype[method] = () => {};

    return result;
  }

  it('should check the prototype of the Element object for matching methods', () => {
    expect(matchesSelector(mockMethod('matches', 'test1'))).toBe('test1');
    expect(matchesSelector(mockMethod('matchesSelector', 'test2'))).toBe(
      'test2'
    );
    expect(matchesSelector(mockMethod('mozMatchesSelector', 'test3'))).toBe(
      'test3'
    );
    expect(matchesSelector(mockMethod('webkitMatchesSelector', 'test4'))).toBe(
      'test4'
    );
    expect(matchesSelector(mockMethod('msMatchesSelector', 'test5'))).toBe(
      'test5'
    );
  });

  it('should actually work', () => {
    let target,
      fixture = document.getElementById('fixture');

    fixture.innerHTML = '<div id="test">Hi</div>';
    target = document.getElementById('test');
    expect(matchesSelector(target, '#test')).toBeTruthy();

    fixture.innerHTML = '';
  });

  it('should return false if the element does not have a matching method', () => {
    let target,
      fixture = document.getElementById('fixture');

    fixture.innerHTML = '<div id="test">Hi</div>';
    target = document.getElementById('test');

    target.matches = null;
    target.matchesSelector = null;
    target.mozMatchesSelector = null;
    target.webkitMatchesSelector = null;
    target.msMatchesSelector = null;

    expect(matchesSelector(target, '#test')).toBe(false);

    fixture.innerHTML = '';
  });
});
