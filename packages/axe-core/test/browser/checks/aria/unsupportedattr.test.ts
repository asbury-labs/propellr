import { describe, it, expect, afterEach } from 'vitest';
import { checkSetup, checks, MockCheckContext } from '../../../testutils';

declare const axe: any;
describe('unsupportedattr', function () {
  const checkContext = MockCheckContext();
  const check = checks['aria-unsupported-attr'];

  afterEach(function () {
    checkContext.reset();
    axe.reset();
  });

  it('should return true if applied to an unsupported attribute', function () {
    axe.configure({
      standards: {
        ariaAttrs: {
          'aria-mccheddarton': {
            unsupported: true
          }
        }
      }
    });

    const params = checkSetup(
      '<div id="target" aria-mccheddarton="true">Contents</div>'
    );
    expect(check.evaluate.apply(checkContext, params)).toBe(true);
  });

  it('should return true with multiple unsupported and supported attributes', function () {
    axe.configure({
      standards: {
        ariaAttrs: {
          'aria-mccheddarton': {
            unsupported: true
          },
          'aria-bagleypants': {
            unsupported: true
          }
        }
      }
    });
    const params = checkSetup(
      '<div id="target" aria-mccheddarton="true" aria-bagleypants="false" aria-label="Nope">Contents</div>'
    );
    expect(check.evaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._data).toEqual([
      'aria-mccheddarton',
      'aria-bagleypants'
    ]);
  });

  it('should return false if applied to a supported attribute', function () {
    const params = checkSetup(
      '<div id="target" aria-label="This is fine">Contents</div>'
    );
    expect(check.evaluate.apply(checkContext, params)).toBe(false);
  });

  it('should return false if all ARIA attributes are supported', function () {
    const params = checkSetup(
      '<div id="target" aria-label="This is fine" aria-haspopup="true">Contents</div>'
    );
    expect(check.evaluate.apply(checkContext, params)).toBe(false);
  });

  it('should return false if applied to an element that matches the unsupported "exceptions" list', function () {
    axe.configure({
      standards: {
        ariaAttrs: {
          'aria-mccheddarton': {
            unsupported: {
              exceptions: ['button']
            }
          }
        }
      }
    });
    const params = checkSetup(
      '<button id="target" aria-mccheddarton="true">Contents</button>'
    );
    expect(check.evaluate.apply(checkContext, params)).toBe(false);
  });

  it('should return false if applied to an element that matches the unsupported "exceptions" list using complex conditions', function () {
    axe.configure({
      standards: {
        ariaAttrs: {
          'aria-mccheddarton': {
            unsupported: {
              exceptions: [
                {
                  nodeName: 'input',
                  properties: {
                    type: 'checkbox'
                  }
                }
              ]
            }
          }
        }
      }
    });
    const params = checkSetup(
      '<input type="checkbox" id="target" aria-mccheddarton="true">'
    );
    expect(check.evaluate.apply(checkContext, params)).toBe(false);
  });

  it('should return true if applied to an element that does not match the unsupported "exceptions" list', function () {
    axe.configure({
      standards: {
        ariaAttrs: {
          'aria-mccheddarton': {
            unsupported: {
              exceptions: ['button']
            }
          }
        }
      }
    });
    const params = checkSetup(
      '<div id="target" aria-mccheddarton="true">Contents</div>'
    );
    expect(check.evaluate.apply(checkContext, params)).toBe(true);
  });

  it('should return true if applied to an element that does not match the unsupported "exceptions" list using complex conditions', function () {
    axe.configure({
      standards: {
        ariaAttrs: {
          'aria-mccheddarton': {
            unsupported: {
              exceptions: [
                {
                  nodeName: 'input',
                  properties: {
                    type: 'checkbox'
                  }
                }
              ]
            }
          }
        }
      }
    });
    const params = checkSetup(
      '<input type="radio" id="target" aria-mccheddarton="true">'
    );
    expect(check.evaluate.apply(checkContext, params)).toBe(true);
  });
});
