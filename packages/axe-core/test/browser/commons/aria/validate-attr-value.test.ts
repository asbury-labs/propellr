import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { shadowSupport, queryFixture } from '../../../testutils';

declare const axe: any;
describe('aria.validateAttrValue', () => {
  const fixture = document.getElementById('fixture');
  let node;

  function setAttr(elm, attrName, attrValue) {
    elm.setAttribute(attrName, attrValue);
    axe.teardown();
    return axe.setup(elm);
  }

  beforeEach(() => {
    node = document.createElement('div');
  });

  afterEach(() => {
    axe.reset();
  });

  it('should return true if there is no matching attribute (future-compat???)', () => {
    setAttr(node, 'unknown-attr', 'hello');

    expect(axe.commons.aria.validateAttrValue(node, 'unknown-attr')).toBe(true);
  });

  it('works on virtual nodes', () => {
    axe.configure({
      standards: {
        ariaAttrs: {
          cats: {
            type: 'nmtoken',
            values: ['valid'],
            allowEmpty: true
          }
        }
      }
    });
    const vNode = queryFixture('<div id="target" cats="valid"></div>');
    expect(axe.commons.aria.validateAttrValue(vNode, 'cats')).toBe(true);
  });

  describe('allowEmpty', () => {
    beforeEach(() => {
      axe.configure({
        standards: {
          ariaAttrs: {
            cats: {
              type: 'nmtoken',
              values: ['valid'],
              allowEmpty: true
            },
            dogs: {
              type: 'idref',
              allowEmpty: true
            },
            goats: {
              type: 'idrefs',
              allowEmpty: true
            },
            cows: {
              type: 'string',
              allowEmpty: true
            },
            sheep: {
              type: 'decimal',
              allowEmpty: true
            },
            pigs: {
              type: 'int',
              allowEmpty: true
            },
            horses: {
              type: 'boolean',
              allowEmpty: true
            }
          }
        }
      });
    });

    it('returns true for empty attributes with allowEmpty:true', () => {
      setAttr(node, 'cats', '');
      expect(axe.commons.aria.validateAttrValue(node, 'cats')).toBe(true);

      setAttr(node, 'dogs', '');
      expect(axe.commons.aria.validateAttrValue(node, 'dogs')).toBe(true);

      setAttr(node, 'goats', '');
      expect(axe.commons.aria.validateAttrValue(node, 'goats')).toBe(true);

      setAttr(node, 'sheep', '');
      expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(true);

      setAttr(node, 'cows', '');
      expect(axe.commons.aria.validateAttrValue(node, 'cows')).toBe(true);

      setAttr(node, 'pigs', '');
      expect(axe.commons.aria.validateAttrValue(node, 'pigs')).toBe(true);

      setAttr(node, 'horses', '');
      expect(axe.commons.aria.validateAttrValue(node, 'horses')).toBe(true);
    });

    it('returns true for whitespace-only attributes with allowEmpty:true', () => {
      setAttr(node, 'cats', '  \r\n\t  ');
      expect(axe.commons.aria.validateAttrValue(node, 'cats')).toBe(true);

      setAttr(node, 'dogs', '  \r\n\t  ');
      expect(axe.commons.aria.validateAttrValue(node, 'dogs')).toBe(true);

      setAttr(node, 'goats', '  \r\n\t  ');
      expect(axe.commons.aria.validateAttrValue(node, 'goats')).toBe(true);

      setAttr(node, 'cows', '  \r\n\t  ');
      expect(axe.commons.aria.validateAttrValue(node, 'cows')).toBe(true);

      setAttr(node, 'pigs', '  \r\n\t  ');
      expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(true);

      setAttr(node, 'sheep', '  \r\n\t  ');
      expect(axe.commons.aria.validateAttrValue(node, 'pigs')).toBe(true);

      setAttr(node, 'horses', '  \r\n\t  ');
      expect(axe.commons.aria.validateAttrValue(node, 'horses')).toBe(true);
    });
  });

  describe('schema defintions', () => {
    describe('enumerated values', () => {
      beforeEach(() => {
        axe.configure({
          standards: {
            ariaAttrs: {
              cats: {
                type: 'nmtoken',
                values: ['valid']
              }
            }
          }
        });
      });

      it('should validate against enumerated .values if present', () => {
        setAttr(node, 'cats', 'valid');

        expect(axe.commons.aria.validateAttrValue(node, 'cats')).toBe(true);

        setAttr(node, 'cats', 'invalid');

        expect(axe.commons.aria.validateAttrValue(node, 'cats')).toBe(false);
      });

      it('should be case-insensitive for enumerated values', () => {
        setAttr(node, 'cats', 'vaLiD');

        expect(axe.commons.aria.validateAttrValue(node, 'cats')).toBe(true);
      });

      it('should reject empty strings', () => {
        setAttr(node, 'cats', '');

        expect(axe.commons.aria.validateAttrValue(node, 'cats')).toBe(false);
      });
    });

    describe('idref', () => {
      beforeEach(() => {
        axe.configure({
          standards: {
            ariaAttrs: {
              dogs: {
                type: 'idref'
              }
            }
          }
        });
      });

      it('should validate the referenced node exists', () => {
        fixture.innerHTML = '<div id="target"></div>';
        setAttr(node, 'dogs', 'target');
        expect(axe.commons.aria.validateAttrValue(node, 'dogs')).toBe(true);

        setAttr(node, 'dogs', 'invalid');
        expect(axe.commons.aria.validateAttrValue(node, 'dogs')).toBe(false);
      });

      it('should work in shadow DOM', () => {
        let shadEl;

        if (shadowSupport.v1) {
          // shadow DOM v1 - note: v0 is compatible with this code, so no need
          // to specifically test this
          fixture.innerHTML = '<div></div>';
          makeShadowTreeVAV(fixture.firstChild);
          axe.setup(fixture);
          shadEl = fixture.firstChild.shadowRoot.querySelector('input#myinput');
          expect(
            axe.commons.aria.validateAttrValue(shadEl, 'aria-labelledby')
          ).toBe(true);
          shadEl = fixture.firstChild.shadowRoot.querySelector('input#invalid');
          expect(
            axe.commons.aria.validateAttrValue(shadEl, 'aria-labelledby')
          ).toBe(false);
        }
      });

      it('returns false if empty without allowEmpty: true', () => {
        setAttr(node, 'dogs', '');
        expect(axe.commons.aria.validateAttrValue(node, 'dogs')).toBe(false);
      });
    });

    describe('idrefs', () => {
      beforeEach(() => {
        axe.configure({
          standards: {
            ariaAttrs: {
              goats: {
                type: 'idrefs'
              }
            }
          }
        });
      });

      it('should return false when a single referenced node is not found', () => {
        setAttr(node, 'goats', 'invalid');
        // target2 not found
        expect(axe.commons.aria.validateAttrValue(node, 'goats')).toBe(false);
      });

      it('should return false when no referenced element is found', () => {
        fixture.innerHTML = '<div id="target"></div>';
        setAttr(node, 'goats', 'target2 target3');
        // target2 not found
        expect(axe.commons.aria.validateAttrValue(node, 'goats')).toBe(false);
      });

      it('should return true when at least one referenced element is found', () => {
        fixture.innerHTML = '<div id="target"></div>';
        setAttr(node, 'goats', 'target target2');
        // target2 not found
        expect(axe.commons.aria.validateAttrValue(node, 'goats')).toBe(true);
      });

      it('should return true when all targets are found', () => {
        fixture.innerHTML = '<div id="target"></div><div id="target2"></div>';
        setAttr(node, 'goats', 'target target2');
        expect(axe.commons.aria.validateAttrValue(node, 'goats')).toBe(true);
      });

      it('should not fail on weird whitespace', () => {
        fixture.innerHTML = '<div id="target"></div><div id="target2"></div>';
        setAttr(node, 'goats', ' \t \ttarget   \t   target2      ');
        expect(axe.commons.aria.validateAttrValue(node, 'goats')).toBe(true);
      });

      it('returns false if empty without allowEmpty: true', () => {
        setAttr(node, 'goats', '');
        expect(axe.commons.aria.validateAttrValue(node, 'goats')).toBe(false);
      });
    });

    describe('string', () => {
      beforeEach(() => {
        axe.configure({
          standards: {
            ariaAttrs: {
              cows: {
                type: 'string'
              }
            }
          }
        });
      });

      it('returns true for non-empty strings', () => {
        setAttr(node, 'cows', 'hi');
        expect(axe.commons.aria.validateAttrValue(node, 'cows')).toBe(true);
      });

      it('returns false for non-empty strings without allowEmpty:true', () => {
        setAttr(node, 'cows', '');
        expect(axe.commons.aria.validateAttrValue(node, 'cows')).toBe(false);
      });
    });

    describe('decimal', () => {
      beforeEach(() => {
        axe.configure({
          standards: {
            ariaAttrs: {
              sheep: {
                type: 'decimal'
              }
            }
          }
        });
      });

      it('should allow, but not require, a preceeding sign', () => {
        setAttr(node, 'sheep', '+1.12');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(true);

        setAttr(node, 'sheep', '-1.12');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(true);

        setAttr(node, 'sheep', '1.12');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(true);
      });

      it('should make the decimal separator optional', () => {
        setAttr(node, 'sheep', '+1');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(true);

        setAttr(node, 'sheep', '-1');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(true);

        setAttr(node, 'sheep', '1');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(true);
      });

      it('should make the whole number optional', () => {
        setAttr(node, 'sheep', '+.1');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(true);

        setAttr(node, 'sheep', '-.1');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(true);

        setAttr(node, 'sheep', '.1');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(true);
      });

      it('should make the right-side optional', () => {
        setAttr(node, 'sheep', '+1.');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(true);

        setAttr(node, 'sheep', '-1.');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(true);

        setAttr(node, 'sheep', '1.');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(true);
      });

      it('should validate the entire string', () => {
        setAttr(node, 'sheep', ' +1.12 ');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(false);

        setAttr(node, 'sheep', 'invalid +1.12');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(false);

        setAttr(node, 'sheep', '+1.12 invalid');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(false);
      });

      it('should only allow for numbers', () => {
        setAttr(node, 'sheep', '+a.12');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(false);

        setAttr(node, 'sheep', '+1.b');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(false);

        setAttr(node, 'sheep', 'b1.1');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(false);
      });

      it('should require at least one number', () => {
        setAttr(node, 'sheep', '+.');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(false);

        setAttr(node, 'sheep', '-.');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(false);

        setAttr(node, 'sheep', '+');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(false);

        setAttr(node, 'sheep', '-');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(false);

        setAttr(node, 'sheep', '.');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(false);

        setAttr(node, 'sheep', '');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(false);
      });

      it('returns false for empty strings without allowEmpty:true', () => {
        setAttr(node, 'sheep', '');
        expect(axe.commons.aria.validateAttrValue(node, 'sheep')).toBe(false);
      });
    });

    describe('int', () => {
      beforeEach(() => {
        axe.configure({
          standards: {
            ariaAttrs: {
              pigs: {
                type: 'int'
              }
            }
          }
        });
      });

      it('should only allow for numbers by an optional preceding sign', () => {
        setAttr(node, 'pigs', '+1234234');
        expect(axe.commons.aria.validateAttrValue(node, 'pigs')).toBe(true);

        setAttr(node, 'pigs', '-137456745');
        expect(axe.commons.aria.validateAttrValue(node, 'pigs')).toBe(true);

        setAttr(node, 'pigs', '1234523452');
        expect(axe.commons.aria.validateAttrValue(node, 'pigs')).toBe(true);
      });

      it('should return true for value greater than or equal to minValue', () => {
        axe.configure({
          standards: {
            ariaAttrs: {
              pigs: {
                type: 'int',
                minValue: -1
              }
            }
          }
        });

        setAttr(node, 'pigs', '-1');
        expect(axe.commons.aria.validateAttrValue(node, 'pigs')).toBe(true);

        setAttr(node, 'pigs', '0');
        expect(axe.commons.aria.validateAttrValue(node, 'pigs')).toBe(true);

        setAttr(node, 'pigs', '1000');
        expect(axe.commons.aria.validateAttrValue(node, 'pigs')).toBe(true);
      });

      it('returns false for empty strings without allowEmpty:true', () => {
        setAttr(node, 'pigs', '');
        expect(axe.commons.aria.validateAttrValue(node, 'pigs')).toBe(false);
      });

      it('should return false for value less than the minValue', () => {
        axe.configure({
          standards: {
            ariaAttrs: {
              pigs: {
                type: 'int',
                minValue: 0
              }
            }
          }
        });

        setAttr(node, 'pigs', '-1');
        expect(axe.commons.aria.validateAttrValue(node, 'pigs')).toBe(false);
      });
    });

    describe('boolean', () => {
      beforeEach(() => {
        axe.configure({
          standards: {
            ariaAttrs: {
              horses: {
                type: 'boolean'
              }
            }
          }
        });
      });

      it('returns true for boolean value', () => {
        setAttr(node, 'horses', 'true');
        expect(axe.commons.aria.validateAttrValue(node, 'horses')).toBe(true);

        setAttr(node, 'horses', 'false');
        expect(axe.commons.aria.validateAttrValue(node, 'horses')).toBe(true);
      });

      it('should be case-insensitive', () => {
        setAttr(node, 'horses', 'trUE');

        expect(axe.commons.aria.validateAttrValue(node, 'horses')).toBe(true);
      });

      it('returns false for non-boolean values', () => {
        setAttr(node, 'horses', 'hi');
        expect(axe.commons.aria.validateAttrValue(node, 'horses')).toBe(false);

        setAttr(node, 'horses', '1');
        expect(axe.commons.aria.validateAttrValue(node, 'horses')).toBe(false);
      });

      it('returns false for non-empty strings without allowEmpty:true', () => {
        setAttr(node, 'horses', '');
        expect(axe.commons.aria.validateAttrValue(node, 'horses')).toBe(false);
      });
    });
  });
});

function makeShadowTreeVAV(node) {
  const root = node.attachShadow({ mode: 'open' });
  const div = document.createElement('div');
  div.className = 'parent';
  root.appendChild(div);
  div.appendChild(createContentVAV());
}

function createContentVAV() {
  const group = document.createElement('div');
  group.innerHTML =
    '<label id="mylabel">Label</label>' +
    '<input id="myinput" aria-labelledby="mylabel" type="text" />' +
    '<input id="invalid" aria-labelledby="doesnotexist" type="text" />';
  return group;
}
