import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('aria-required-attr', () => {
  const { queryFixture, checkSetup } = axe.testUtils;
  const checkContext = axe.testUtils.MockCheckContext();
  const requiredAttrCheck =
    axe.testUtils.getCheckEvaluate('aria-required-attr');

  afterEach(() => {
    checkContext.reset();
  });

  it('returns true for valid attributes', () => {
    const params = checkSetup(
      '<div id="target" role="switch" tabindex="1" aria-checked="false">'
    );
    expect(requiredAttrCheck.apply(checkContext, params)).toBe(true);
    expect(checkContext._data).toBeNull();
  });

  it('returns false for missing attributes', () => {
    const params = checkSetup('<div id="target" role="switch" tabindex="1">');
    expect(requiredAttrCheck.apply(checkContext, params)).toBe(false);
    expect(checkContext._data).toEqual(['aria-checked']);
  });

  it('returns false for null attributes', () => {
    const params = checkSetup(
      '<div id="target" role="switch" tabindex="1" aria-checked>'
    );
    expect(requiredAttrCheck.apply(checkContext, params)).toBe(false);
    expect(checkContext._data).toEqual(['aria-checked']);
  });

  it('returns false for empty attributes', () => {
    const params = checkSetup(
      '<div id="target" role="switch" tabindex="1" aria-checked="">'
    );
    expect(requiredAttrCheck.apply(checkContext, params)).toBe(false);
    expect(checkContext._data).toEqual(['aria-checked']);
  });

  it('returns true if there is no role', () => {
    const params = checkSetup('<div id="target"></div>');
    expect(requiredAttrCheck.apply(checkContext, params)).toBe(true);
    expect(checkContext._data).toBeNull();
  });

  it('passes aria-valuenow if element has value property', () => {
    const params = checkSetup('<input id="target" type="range" role="slider">');
    expect(requiredAttrCheck.apply(checkContext, params)).toBe(true);
  });

  it('passes aria-valuenow if element has aria-valuetext', () => {
    const params = checkSetup(
      '<div id="target" role="slider" aria-valuetext="foo"></div>'
    );
    expect(requiredAttrCheck.apply(checkContext, params)).toBe(true);
  });

  it('passes aria-checkbox if element has checked property', () => {
    const params = checkSetup(
      '<input id="target" type="checkbox" role="switch">'
    );
    expect(requiredAttrCheck.apply(checkContext, params)).toBe(true);
  });

  describe('separator', () => {
    it('fails a focusable separator', () => {
      const params = checkSetup(
        '<div id="target" role="separator" tabindex="0"></div>'
      );
      expect(requiredAttrCheck.apply(checkContext, params)).toBe(false);
    });

    it('passes a non-focusable separator', () => {
      const params = checkSetup('<div id="target" role="separator"></div>');
      expect(requiredAttrCheck.apply(checkContext, params)).toBe(true);
    });
  });

  describe('combobox', () => {
    it('passes comboboxes that have aria-expanded="false"', () => {
      const params = checkSetup(
        '<div id="target" role="combobox" aria-expanded="false"></div>'
      );
      expect(requiredAttrCheck.apply(checkContext, params)).toBe(true);
    });

    it('fails comboboxes without aria-controls and with an invalid aria-expanded', () => {
      const params = checkSetup(
        '<div id="target" role="combobox" aria-expanded="invalid-value"></div>'
      );
      expect(requiredAttrCheck.apply(checkContext, params)).toBe(false);
    });

    it('fails comboboxes that has aria-owns without aria-controls', () => {
      const params = checkSetup(
        '<div id="target" role="combobox" aria-expanded="true" aria-owns="ownedchild"></div>'
      );
      expect(requiredAttrCheck.apply(checkContext, params)).toBe(false);
    });

    it('passes comboboxes that have aria-controls and aria-expanded', () => {
      const params = checkSetup(
        '<div id="target" role="combobox" aria-expanded="true" aria-controls="test"></div>'
      );

      expect(requiredAttrCheck.apply(checkContext, params)).toBe(true);
    });

    it('fails comboboxes that have no required attributes', () => {
      const params = checkSetup('<div id="target" role="combobox"></div>');

      expect(requiredAttrCheck.apply(checkContext, params)).toBe(false);
    });

    it('fails comboboxes that have aria-expanded only', () => {
      const params = checkSetup(
        '<div id="target" role="combobox" aria-expanded="true"></div>'
      );

      expect(requiredAttrCheck.apply(checkContext, params)).toBe(false);
    });

    it('reports missing of multiple attributes correctly', () => {
      axe.configure({
        standards: {
          ariaRoles: {
            combobox: {
              requiredAttrs: ['aria-expanded', 'aria-label', 'aria-controls']
            }
          }
        }
      });

      const params = checkSetup(
        '<div id="target" role="combobox" aria-expanded="true"></div>'
      );
      expect(requiredAttrCheck.apply(checkContext, params)).toBe(false);
      expect(checkContext._data).toEqual(['aria-label', 'aria-controls']);
    });
  });

  describe('options', () => {
    it('requires provided attribute names for a role', () => {
      axe.configure({
        standards: {
          ariaRoles: {
            mccheddarton: {
              requiredAttrs: ['aria-valuemax']
            }
          }
        }
      });

      const vNode = queryFixture('<div role="mccheddarton" id="target"></div>');
      const options = {
        mccheddarton: ['aria-snuggles']
      };
      expect(
        requiredAttrCheck.call(checkContext, vNode.actualNode, options, vNode)
      ).toBe(false);
      expect(checkContext._data).toEqual(['aria-snuggles', 'aria-valuemax']);
    });
  });
});
