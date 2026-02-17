import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('VirtualNode', () => {
  const VirtualNode = axe.VirtualNode;
  let node;

  beforeEach(() => {
    node = document.createElement('div');
  });

  it('should accept three parameters', () => {
    expect(VirtualNode).toHaveLength(3);
  });

  describe('prototype', () => {
    it('should have public properties', () => {
      const parent = {};
      const vNode = new VirtualNode(node, parent, 'foo');

      expect(vNode.shadowId).toBe('foo');
      expect(typeof vNode.children).toBe('array');
      expect(vNode.actualNode).toBe(node);
      expect(vNode.parent).toBe(parent);
    });

    it('should abstract Node properties', () => {
      node = document.createElement('input');
      node.id = 'monkeys';
      const vNode = new VirtualNode(node);

      expect(vNode.props).toBeDefined();
      expect(vNode.props.nodeType).toBe(1);
      expect(vNode.props.nodeName).toBe('input');
      expect(vNode.props.id).toBe('monkeys');
      expect(vNode.props.type).toBe('text');
    });

    for (const [prop, tagName, examplePropValue] of [
      ['value', 'input', 'test value'],
      ['selected', 'option', true],
      ['checked', 'input', true],
      ['indeterminate', 'input', true],
      ['multiple', 'select', true]
    ]) {
      describe(`props.${prop}`, () => {
        it(`should reflect a ${tagName} element's ${prop} property`, () => {
          node = document.createElement(tagName);
          let vNode = new VirtualNode(node);
          expect(vNode.props[prop]).toBe('');

          node[prop] = examplePropValue;
          vNode = new VirtualNode(node);
          expect(vNode.props[prop]).toBe(examplePropValue);
        });

        it('should be undefined for a text node', () => {
          node = document.createTextNode('text content');
          let vNode = new VirtualNode(node);
          expect(vNode.props[prop]).toBe(undefined);
        });

        // Regression test for #4316
        it(`should be resilient to text node with un-gettable ${prop} property`, () => {
          node = document.createTextNode('text content');
          Object.defineProperty(node, prop, {
            get() {
              throw new Error('Unqueryable value');
            }
          });
          let vNode = new VirtualNode(node);
          expect(() => node[prop]).toThrow();
          expect(() => vNode.props[prop]).not.toThrow();
          expect(vNode.props[prop]).toBe(undefined);
        });
      });
    }

    it('should lowercase type', () => {
      node = document.createElement('input');
      node.setAttribute('type', 'COLOR');
      const vNode = new VirtualNode(node);

      expect(vNode.props.type).toBe('color');
    });

    it('should default type to text', () => {
      node = document.createElement('input');
      const vNode = new VirtualNode(node);

      expect(vNode.props.type).toBe('text');
    });

    it('should default type to text if type is invalid', () => {
      node = document.createElement('input');
      node.setAttribute('type', 'woohoo');
      const vNode = new VirtualNode(node);

      expect(vNode.props.type).toBe('text');
    });

    it('should lowercase nodeName', () => {
      node = {
        nodeName: 'FOOBAR'
      };
      const vNode = new VirtualNode(node);

      expect(vNode.props.nodeName).toBe('foobar');
    });

    describe('attr', () => {
      it('should return the value of the given attribute', () => {
        node.setAttribute('data-foo', 'bar');
        const vNode = new VirtualNode(node);

        expect(vNode.attr('data-foo')).toBe('bar');
      });

      it('should return null for text nodes', () => {
        node.textContent = 'hello';
        const vNode = new VirtualNode(node.firstChild);

        expect(vNode.attr('data-foo')).toBeNull();
      });

      it('should return null if getAttribute is not a function', () => {
        node = {
          nodeName: 'DIV',
          getAttribute: null
        };
        const vNode = new VirtualNode(node);

        expect(vNode.attr('data-foo')).toBeNull();
      });
    });

    describe('hasAttr', () => {
      it('should return true if the element has the attribute', () => {
        node.setAttribute('foo', 'bar');
        const vNode = new VirtualNode(node);

        expect(vNode.hasAttr('foo')).toBe(true);
      });

      it('should return false if the element does not have the attribute', () => {
        const vNode = new VirtualNode(node);

        expect(vNode.hasAttr('foo')).toBe(false);
      });

      it('should return false for text nodes', () => {
        node.textContent = 'hello';
        const vNode = new VirtualNode(node.firstChild);

        expect(vNode.hasAttr('foo')).toBe(false);
      });

      it('should return false if hasAttribute is not a function', () => {
        node = {
          nodeName: 'DIV',
          hasAttribute: null
        };
        const vNode = new VirtualNode(node);

        expect(vNode.hasAttr('foo')).toBe(false);
      });
    });

    describe('attrNames', () => {
      it('should return a list of attribute names', () => {
        node.setAttribute('foo', 'bar');
        const vNode = new VirtualNode(node);

        expect(vNode.attrNames).toEqual(['foo']);
      });

      it('should work with clobbered attributes', () => {
        node = document.createElement('form');
        node.setAttribute('id', '123');
        node.innerHTML = '<select name="attributes"></select>';
        const vNode = new VirtualNode(node);

        expect(vNode.attrNames).toEqual(['id']);
      });

      it('should return an empty array if there are no attributes', () => {
        const vNode = new VirtualNode(node);
        expect(vNode.attrNames).toEqual([]);
      });
    });

    describe('nodeIndex', () => {
      it('increments nodeIndex when a parent is passed', () => {
        const vHtml = new VirtualNode({ nodeName: 'html' });
        const vHead = new VirtualNode({ nodeName: 'head' }, vHtml);
        const vTitle = new VirtualNode({ nodeName: 'title' }, vHead);
        const vBody = new VirtualNode({ nodeName: 'body' }, vHtml);

        expect(vHtml.nodeIndex).toBe(0);
        expect(vHead.nodeIndex).toBe(1);
        expect(vTitle.nodeIndex).toBe(2);
        expect(vBody.nodeIndex).toBe(3);
      });

      it('resets nodeIndex when no parent is passed', () => {
        let vHtml = new VirtualNode({ nodeName: 'html' });
        let vHead = new VirtualNode({ nodeName: 'head' }, vHtml);
        expect(vHtml.nodeIndex).toBe(0);
        expect(vHead.nodeIndex).toBe(1);

        vHtml = new VirtualNode({ nodeName: 'html' });
        vHead = new VirtualNode({ nodeName: 'head' }, vHtml);
        expect(vHtml.nodeIndex).toBe(0);
        expect(vHead.nodeIndex).toBe(1);
      });
    });

    describe('checkbox properties', () => {
      it('should reflect the checked property', () => {
        const div = document.createElement('div');
        const vDiv = new VirtualNode(div);
        expect(vDiv.props.checked).toBeUndefined();

        node = document.createElement('input');
        node.setAttribute('type', 'checkbox');
        const vUnchecked = new VirtualNode(node);
        expect(vUnchecked.props.checked).toBe(false);

        node.click();
        const vChecked = new VirtualNode(node);
        expect(vChecked.props.checked).toBe(true);
      });

      it('reflects the indeterminate property', () => {
        const div = document.createElement('div');
        const vDiv = new VirtualNode(div);
        expect(vDiv.props.indeterminate).toBeUndefined();

        node = document.createElement('input');
        node.setAttribute('type', 'checkbox');
        const vUnchecked = new VirtualNode(node);
        expect(vUnchecked.props.indeterminate).toBe(false);

        node.indeterminate = true;
        const vIndeterminate = new VirtualNode(node);
        expect(vIndeterminate.props.indeterminate).toBe(true);
      });
    });

    describe.skip('isFocusable', () => {
      let commons;

      beforeEach(() => {
        commons = axe.commons = axe.commons;
      });

      afterEach(() => {
        axe.commons = commons;
      });

      it('should call dom.isFocusable', () => {
        let called = false;
        axe.commons = {
          dom: {
            isFocusable: () => {
              called = true;
            }
          }
        };
        const vNode = new VirtualNode(node);
        vNode.isFocusable;

        expect(called).toBe(true);
      });

      it('should only call dom.isFocusable once', () => {
        let count = 0;
        axe.commons = {
          dom: {
            isFocusable: () => {
              count++;
            }
          }
        };
        const vNode = new VirtualNode(node);
        vNode.isFocusable;
        vNode.isFocusable;
        vNode.isFocusable;
        expect(count).toBe(1);
      });
    });

    describe.skip('tabbableElements', () => {
      let commons;

      beforeEach(() => {
        commons = axe.commons = axe.commons;
      });

      afterEach(() => {
        axe.commons = commons;
      });

      it('should call dom.getTabbableElements', () => {
        let called = false;
        axe.commons = {
          dom: {
            getTabbableElements: () => {
              called = true;
            }
          }
        };
        const vNode = new VirtualNode(node);
        vNode.tabbableElements;

        expect(called).toBe(true);
      });

      it('should only call dom.getTabbableElements once', () => {
        let count = 0;
        axe.commons = {
          dom: {
            getTabbableElements: () => {
              count++;
            }
          }
        };
        const vNode = new VirtualNode(node);
        vNode.tabbableElements;
        vNode.tabbableElements;
        vNode.tabbableElements;
        expect(count).toBe(1);
      });
    });

    describe('getComputedStylePropertyValue', () => {
      let computedStyle;

      beforeEach(() => {
        computedStyle = window.getComputedStyle;
      });

      afterEach(() => {
        window.getComputedStyle = computedStyle;
      });

      it('should call window.getComputedStyle and return the property', () => {
        let called = false;
        window.getComputedStyle = () => {
          called = true;
          return {
            getPropertyValue: () => {
              return 'result';
            }
          };
        };
        const vNode = new VirtualNode(node);
        const result = vNode.getComputedStylePropertyValue('prop');

        expect(called).toBe(true);
        expect(result).toBe('result');
      });

      it('should only call window.getComputedStyle and getPropertyValue once', () => {
        let computedCount = 0;
        let propertyCount = 0;
        window.getComputedStyle = () => {
          computedCount++;
          return {
            getPropertyValue: () => {
              propertyCount++;
            }
          };
        };
        const vNode = new VirtualNode(node);
        vNode.getComputedStylePropertyValue('prop');
        vNode.getComputedStylePropertyValue('prop');
        vNode.getComputedStylePropertyValue('prop');
        expect(computedCount).toBe(1);
        expect(propertyCount).toBe(1);
      });
    });

    describe('clientRects', () => {
      it('should call node.getClientRects', () => {
        let called = false;
        node.getClientRects = () => {
          called = true;
          return [];
        };
        const vNode = new VirtualNode(node);
        vNode.clientRects;

        expect(called).toBe(true);
      });

      it('should only call node.getClientRects once', () => {
        let count = 0;
        node.getClientRects = () => {
          count++;
          return [];
        };
        const vNode = new VirtualNode(node);
        vNode.clientRects;
        vNode.clientRects;
        vNode.clientRects;
        expect(count).toBe(1);
      });

      it('should filter out 0 width rects', () => {
        node.getClientRects = () => {
          return [{ width: 10 }, { width: 0 }, { width: 20 }];
        };
        const vNode = new VirtualNode(node);

        expect(vNode.clientRects).toEqual([{ width: 10 }, { width: 20 }]);
      });
    });

    describe('boundingClientRect', () => {
      it('should call node.getBoundingClientRect', () => {
        let called = false;
        node.getBoundingClientRect = () => {
          called = true;
        };
        const vNode = new VirtualNode(node);
        vNode.boundingClientRect;

        expect(called).toBe(true);
      });

      it('should only call node.getBoundingClientRect once', () => {
        let count = 0;
        node.getBoundingClientRect = () => {
          count++;
        };
        const vNode = new VirtualNode(node);
        vNode.boundingClientRect;
        vNode.boundingClientRect;
        vNode.boundingClientRect;
        expect(count).toBe(1);
      });
    });
  });
});
