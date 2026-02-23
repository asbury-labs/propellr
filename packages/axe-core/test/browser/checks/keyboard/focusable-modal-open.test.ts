import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { checkSetup, checks, MockCheckContext } from '../../../testutils';

declare const axe: any;
describe('focusable-modal-open', function () {
  let check;
  const fixture = document.getElementById('fixture')!;
  const checkContext = MockCheckContext();

  beforeAll(function () {
    check = checks['focusable-modal-open'];
  });

  afterEach(function () {
    fixture.innerHTML = '';
    axe._tree = undefined;
    axe._selectorData = undefined;
    checkContext.reset();
  });

  it('returns true when no modal is open', function () {
    const params = checkSetup(
      '<div id="target" aria-hidden="true">' +
        '<button>Some button</button>' +
        '</div>'
    );
    const actual = check.evaluate.apply(checkContext, params);
    expect(actual).toBe(true);
  });

  it('returns undefined if a modal is open', function () {
    const params = checkSetup(
      '<div id="target" aria-hidden="true">' +
        '<button>Some button</button>' +
        '</div>' +
        '<div role="dialog">Modal</div>'
    );
    const actual = check.evaluate.apply(checkContext, params);
    expect(actual).toBeUndefined();
  });

  it('sets the tabbable elements as related nodes', function () {
    const params = checkSetup(
      '<div id="target" aria-hidden="true">' +
        '<button>Some button</button>' +
        '</div>' +
        '<div role="dialog">Modal</div>'
    );
    check.evaluate.apply(checkContext, params);
    expect(checkContext._relatedNodes).toHaveLength(1);
    expect(checkContext._relatedNodes).toEqual(
      Array.from(fixture.querySelectorAll('button'))
    );
  });
});
