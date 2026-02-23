import { describe, it, beforeAll, afterAll, afterEach, expect } from 'vitest';
import { queryFixture } from '../../../testutils';

declare const axe: any;
describe('standards.getElementSpec', function () {
  const getElementSpec = axe.commons.standards.getElementSpec;
  const fixture = document.querySelector('#fixture');

  beforeAll(function () {
    axe._load({});
  });

  afterEach(function () {
    fixture.innerHTML = '';
  });

  afterAll(function () {
    axe.reset();
  });

  it('should return a spec for an element without variants', function () {
    axe.configure({
      standards: {
        htmlElms: {
          abbr: {
            contentTypes: ['phrasing', 'flow'],
            allowedRoles: true
          }
        }
      }
    });

    const vNode = queryFixture('<abbr id="target"></abbr>');
    expect(getElementSpec(vNode)).toEqual({
      contentTypes: ['phrasing', 'flow'],
      allowedRoles: true
    });
  });

  it('should return empty object if passed an invalid element', function () {
    const vNode = queryFixture('<foo-bar id="target"></foo-bar>');
    expect(getElementSpec(vNode)).toEqual({});
  });

  describe('variants', function () {
    beforeAll(function () {
      axe.configure({
        standards: {
          htmlElms: {
            abbr: {
              variant: {
                controls: {
                  matches: '[controls]',
                  customProp: 'controls'
                },
                label: {
                  matches: '[aria-label]',
                  anotherProp: 'label'
                },
                default: {
                  customProp: 'default',
                  anotherProp: 'default'
                }
              },
              allowedRoles: false
            }
          }
        }
      });
    });

    it('should return top level properties', function () {
      const vNode = queryFixture('<abbr id="target" controls></abbr>');
      const spec = getElementSpec(vNode);
      expect(spec.allowedRoles).toBe(false);
    });

    it('should return properties from matching variant', function () {
      const vNode = queryFixture('<abbr id="target" controls></abbr>');
      const spec = getElementSpec(vNode);
      expect(spec.customProp).toBe('controls');
    });

    it('should return all properties from matching variants', function () {
      const vNode = queryFixture(
        '<abbr id="target" controls aria-label="foo"></abbr>'
      );
      const spec = getElementSpec(vNode);
      expect(spec.customProp).toBe('controls');
      expect(spec.anotherProp).toBe('label');
    });

    it('should return default props in no variants match', function () {
      const vNode = queryFixture('<abbr id="target"></abbr>');
      const spec = getElementSpec(vNode);
      expect(spec.customProp).toBe('default');
      expect(spec.anotherProp).toBe('default');
    });

    it('should return default props that were not part of other matches', function () {
      const vNode = queryFixture('<abbr id="target" controls></abbr>');
      const spec = getElementSpec(vNode);
      expect(spec.customProp).toBe('controls');
      expect(spec.anotherProp).toBe('default');
    });
  });
});
