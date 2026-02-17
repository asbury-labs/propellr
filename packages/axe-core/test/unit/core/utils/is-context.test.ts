import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils isContext* methods', () => {
  const { isContextProp, isContextObject, isContextSpec } = axe.utils;

  const methods = [
    { name: 'isLabelledShadowDomSelector', prop: 'fromShadowDom' },
    { name: 'isLabelledFramesSelector', prop: 'fromFrames' }
  ];

  methods.forEach(({ name, prop }) => {
    describe(name, () => {
      const method = axe.utils[name];
      it(`is true for an object with '${prop}'`, () => {
        expect(method({ [prop]: true })).toBe(true);
      });

      it('is false for an object without `fromShadowDom`', () => {
        expect(method({})).toBe(false);
      });

      it('is false for non-objects', () => {
        expect(method('string')).toBe(false);
        expect(method(1)).toBe(false);
        expect(method([])).toBe(false);
        expect(method(null)).toBe(false);
      });

      it('is false if the property comes from the prototype', () => {
        expect(method(Object.create({ [prop]: true }))).toBe(false);
      });
    });
  });

  describe('isContextProp', () => {
    it('is true for a string', () => {
      expect(isContextProp('string')).toBe(true);
    });

    it('is true for a Node', () => {
      expect(isContextProp(document.createElement('div'))).toBe(true);
    });

    it('is true for an array', () => {
      expect(isContextProp([])).toBe(true);
    });

    it('is true for an object with .length', () => {
      expect(isContextProp({ length: 1 })).toBe(true);
    });

    it('is true for an object with `fromFrames`', () => {
      expect(isContextProp({ fromFrames: true })).toBe(true);
    });

    it('is true for an object with `fromShadowDom`', () => {
      expect(isContextProp({ fromShadowDom: true })).toBe(true);
    });

    it('is false for other objects', () => {
      expect(isContextProp({})).toBe(false);
      expect(isContextProp({ exclude: [] })).toBe(false);
      expect(isContextProp({ include: true })).toBe(false);
      expect(isContextProp({ runOnly: 'rules' })).toBe(false);
    });

    it('is false for other types', () => {
      expect(isContextProp(1)).toBe(false);
      expect(isContextProp(null)).toBe(false);
      expect(isContextProp(undefined)).toBe(false);
    });
  });

  describe('isContextObject', () => {
    it('is false if not an object `include` or `exclude`', () => {
      expect(isContextObject(true)).toBe(false);
      expect(isContextObject(null)).toBe(false);
      expect(isContextObject(1)).toBe(false);
      expect(isContextObject({ foo: 'bar' })).toBe(false);
    });

    it('is true for an object with `include` with a context prop', () => {
      expect(isContextObject({ include: 'string' })).toBe(true);
      expect(isContextObject({ include: document.createElement('div') })).toBe(
        true
      );
      expect(isContextObject({ include: [] })).toBe(true);
      expect(isContextObject({ include: { length: 1 } })).toBe(true);
      expect(isContextObject({ include: { fromFrames: true } })).toBe(true);
      expect(isContextObject({ include: { fromShadowDom: true } })).toBe(true);
    });

    it('is false for an object with `include` that is not a context prop', () => {
      expect(isContextObject({ include: false })).toBe(false);
      expect(isContextObject({ include: null })).toBe(false);
      expect(isContextObject({ include: 123 })).toBe(false);
      expect(isContextObject({ include: { something: 'else' } })).toBe(false);
    });

    it('is true for an object with `exclude` with a context prop', () => {
      expect(isContextObject({ exclude: 'string' })).toBe(true);
      expect(isContextObject({ exclude: document.createElement('div') })).toBe(
        true
      );
      expect(isContextObject({ exclude: [] })).toBe(true);
      expect(isContextObject({ exclude: { length: 1 } })).toBe(true);
      expect(isContextObject({ exclude: { fromFrames: true } })).toBe(true);
      expect(isContextObject({ exclude: { fromShadowDom: true } })).toBe(true);
    });

    it('is false for an object with `exclude` that is not a context prop', () => {
      expect(isContextObject({ exclud: false })).toBe(false);
      expect(isContextObject({ exclud: null })).toBe(false);
      expect(isContextObject({ exclud: 123 })).toBe(false);
      expect(isContextObject({ exclude: { something: 'else' } })).toBe(false);
    });

    it('is false if `include` is on the prototype', () => {
      expect(isContextObject(Object.create({ include: 'string' }))).toBe(false);
    });

    it('is false if `exclude` is on the prototype', () => {
      expect(isContextObject(Object.create({ exclude: 'string' }))).toBe(false);
    });

    it('is true for an object with both `include` and `exclude`', () => {
      expect(isContextObject({ include: 'string', exclude: 'string' })).toBe(
        true
      );
    });

    it('is true for an object with a valid `include` and invalid `exclude`', () => {
      expect(isContextObject({ include: [], exclude: 1 })).toBe(true);
    });

    it('is true for an object with a valid `exclude` and invalid `include`', () => {
      expect(isContextObject({ exclude: [], include: 1 })).toBe(true);
    });
  });

  describe('isContextSpec', () => {
    it('is true for a context object', () => {
      expect(isContextSpec({ include: 'string' })).toBe(true);
      expect(isContextSpec({ exclude: ['string'] })).toBe(true);
    });

    it('is true for a context prop', () => {
      expect(isContextSpec('string')).toBe(true);
    });

    it('is false for other types', () => {
      expect(isContextSpec(true)).toBe(false);
      expect(isContextSpec(null)).toBe(false);
      expect(isContextSpec(1)).toBe(false);
      expect(isContextSpec({})).toBe(false);
      expect(isContextSpec({ include: null })).toBe(false);
      expect(isContextSpec({ runOnly: 'foo' })).toBe(false);
      expect(isContextSpec(Object.create({ include: 'foo' }))).toBe(false);
    });
  });
});
