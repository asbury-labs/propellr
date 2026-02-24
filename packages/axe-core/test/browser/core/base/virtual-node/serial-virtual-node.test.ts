import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('SerialVirtualNode', () => {
  const SerialVirtualNode = axe.SerialVirtualNode;

  it('extends AbstractVirtualNode', () => {
    const vNode = new SerialVirtualNode({
      nodeName: 'div'
    });
    expect(vNode).toBeInstanceOf(axe.AbstractVirtualNode);
  });

  describe('props', () => {
    it('assigns any properties to .props', () => {
      const props = {
        nodeType: 1,
        nodeName: 'div',
        someType: 'bar',
        somethingElse: 'baz'
      };
      const vNode = new SerialVirtualNode(props);
      expect(vNode.props).toEqual(props);
    });

    it('returns a frozen object', () => {
      const vNode = new SerialVirtualNode({ nodeName: 'div' });
      expect(Object.isFrozen(vNode.props)).toBe(true);
    });

    it('takes 1 as its nodeType', () => {
      const vNode = new SerialVirtualNode({
        nodeType: 1,
        nodeName: 'div'
      });
      expect(vNode.props.nodeType).toBe(1);
    });

    it('takes 3 as its nodeType', () => {
      const vNode = new SerialVirtualNode({
        nodeType: 3,
        nodeName: '#text'
      });
      expect(vNode.props.nodeType).toBe(3);
    });

    it('has a default nodeType of 1', () => {
      const vNode = new SerialVirtualNode({ nodeName: 'div' });
      expect(vNode.props.nodeType).toBe(1);
    });

    it('does not throw if nodeType is falsy', () => {
      [null, undefined].forEach(nonThrowingNodeType => {
        expect(() => {
          // eslint-disable-next-line no-new
          new SerialVirtualNode({
            nodeType: nonThrowingNodeType,
            nodeName: 'div'
          });
        }).not.toThrow();
      });
    });

    it('throws if nodeType is a not a number', () => {
      [true, 'one', '1', { foo: 'bar' }].forEach(throwingNodeType => {
        expect(() => {
          // eslint-disable-next-line no-new
          new SerialVirtualNode({
            nodeType: throwingNodeType,
            nodeName: 'div'
          });
        }).toThrow();
      });
    });

    it('converts nodeNames to lower case', () => {
      const htmlNodes = [
        'DIV',
        'SPAN',
        'INPUT',
        'HeAdEr',
        'TABLE',
        'TITLE',
        'BUTTON',
        'Foo'
      ];
      htmlNodes.forEach(nodeName => {
        const vNode = new SerialVirtualNode({ nodeName: nodeName });
        expect(vNode.props.nodeName).toBe(nodeName.toLowerCase());
      });
    });

    it('defaults to the correct nodeType for certain nodeNames', () => {
      const vNode1 = new SerialVirtualNode({ nodeName: 'DIV' });
      expect(vNode1.props.nodeType).toBe(1);
      const vNode2 = new SerialVirtualNode({ nodeName: '#cdata-section' });
      expect(vNode2.props.nodeType).toBe(2);
      const vNode3 = new SerialVirtualNode({ nodeName: '#text' });
      expect(vNode3.props.nodeType).toBe(3);
      const vNode8 = new SerialVirtualNode({ nodeName: '#comment' });
      expect(vNode8.props.nodeType).toBe(8);
      const vNode9 = new SerialVirtualNode({ nodeName: '#document' });
      expect(vNode9.props.nodeType).toBe(9);
      const vNode11 = new SerialVirtualNode({ nodeName: '#document-fragment' });
      expect(vNode11.props.nodeType).toBe(11);
    });

    it('defaults to the correct nodeName for certain nodeTypes', () => {
      const vNode2 = new SerialVirtualNode({ nodeType: 2 });
      expect(vNode2.props.nodeName).toBe('#cdata-section');
      const vNode3 = new SerialVirtualNode({ nodeType: 3 });
      expect(vNode3.props.nodeName).toBe('#text');
      const vNode8 = new SerialVirtualNode({ nodeType: 8 });
      expect(vNode8.props.nodeName).toBe('#comment');
      const vNode9 = new SerialVirtualNode({ nodeType: 9 });
      expect(vNode9.props.nodeName).toBe('#document');
      const vNode11 = new SerialVirtualNode({ nodeType: 11 });
      expect(vNode11.props.nodeName).toBe('#document-fragment');
    });

    it('throws if nodeName is not a string', () => {
      [123, true, null, {}, undefined, []].forEach(notAString => {
        expect(() => {
          // eslint-disable-next-line no-new
          new SerialVirtualNode({ nodeName: notAString });
        }).toThrow();
      });
    });

    it('ignores the `attributes` property', () => {
      const vNode = new SerialVirtualNode({
        nodeName: 'div',
        attributes: {
          foo: 'foo',
          bar: 'bar',
          baz: 'baz'
        }
      });
      expect(vNode.props.attributes).toBeUndefined();
    });

    it('converts type prop to lower case', () => {
      const types = ['text', 'COLOR', 'Month', 'uRL'];
      types.forEach(type => {
        const vNode = new SerialVirtualNode({
          nodeName: 'input',
          type: type
        });
        expect(vNode.props.type).toBe(type.toLowerCase());
      });
    });

    it('converts type attribute to lower case', () => {
      const types = ['text', 'COLOR', 'Month', 'uRL'];
      types.forEach(type => {
        const vNode = new SerialVirtualNode({
          nodeName: 'input',
          attributes: {
            type: type
          }
        });
        expect(vNode.props.type).toBe(type.toLowerCase());
      });
    });

    it('defaults type prop to "text"', () => {
      const vNode = new SerialVirtualNode({
        nodeName: 'input'
      });
      expect(vNode.props.type).toBe('text');
    });

    it('default type prop to "text" if type is invalid', () => {
      const vNode = new SerialVirtualNode({
        nodeName: 'input',
        attributes: {
          type: 'woohoo'
        }
      });
      expect(vNode.props.type).toBe('text');
    });

    it('uses the type property over the type attribute', () => {
      const vNode = new SerialVirtualNode({
        nodeName: 'input',
        type: 'month',
        attributes: {
          type: 'color'
        }
      });
      expect(vNode.props.type).toBe('month');
    });

    it('reflects checkbox properties', () => {
      const vNode = new SerialVirtualNode({
        nodeName: 'input',
        type: 'checkbox',
        checked: true,
        indeterminate: true
      });
      expect(vNode.props.checked).toBe(true);
      expect(vNode.props.indeterminate).toBe(true);
    });
  });

  describe('attr', () => {
    it('returns a string value for the attribute', () => {
      const vNode = new SerialVirtualNode({
        nodeName: 'div',
        attributes: {
          foo: 'foo',
          bar: 123,
          baz: true,
          qux: ''
        }
      });
      expect(vNode.attr('foo')).toBe('foo');
      expect(vNode.attr('bar')).toBe('123');
      expect(vNode.attr('baz')).toBe('true');
      expect(vNode.attr('qux')).toBe('');
    });

    it('returns null if the attribute is null', () => {
      const vNode = new SerialVirtualNode({
        nodeName: 'div',
        attributes: { foo: null }
      });
      expect(vNode.attr('foo')).toBeNull();
    });

    it('returns null if the attribute is not set', () => {
      const vNode = new SerialVirtualNode({
        nodeName: 'div'
      });
      expect(vNode.attr('foo')).toBeNull();
    });

    it('throws if the value is an object (for except null)', () => {
      [{}, [], /foo/].forEach(someObject => {
        expect(() => {
          // eslint-disable-next-line no-new
          new SerialVirtualNode({
            nodeName: 'div',
            attributes: { foo: someObject }
          });
        }).toThrow();
      });
    });

    it('converts `className` to `class`', () => {
      const vNode = new SerialVirtualNode({
        nodeName: 'div',
        attributes: {
          className: 'foo bar baz'
        }
      });
      expect(vNode.attr('class')).toBe('foo bar baz');
    });

    it('converts `htmlFor` to `for`', () => {
      const vNode = new SerialVirtualNode({
        nodeName: 'div',
        attributes: {
          htmlFor: 'foo'
        }
      });
      expect(vNode.attr('for')).toBe('foo');
    });
  });

  describe('hasAttr', () => {
    it('returns true if the attribute has a value', () => {
      const vNode = new SerialVirtualNode({
        nodeName: 'div',
        attributes: {
          foo: '',
          bar: 0,
          baz: false
        }
      });
      expect(vNode.hasAttr('foo')).toBe(true);
      expect(vNode.hasAttr('bar')).toBe(true);
      expect(vNode.hasAttr('baz')).toBe(true);
    });

    it('returns true if the attribute is null', () => {
      const vNode = new SerialVirtualNode({
        nodeName: 'div',
        attributes: { foo: null }
      });
      expect(vNode.hasAttr('foo')).toBe(true);
    });

    it('returns false if the attribute is undefined', () => {
      const vNode = new SerialVirtualNode({
        nodeName: 'div',
        attributes: { foo: undefined }
      });
      expect(vNode.hasAttr('foo')).toBe(false);
      expect(vNode.hasAttr('bar')).toBe(false);
    });

    it('converts `htmlFor` to `for`', () => {
      const nodeWithoutFor = new SerialVirtualNode({
        nodeName: 'div',
        attributes: {}
      });
      const nodeWithFor = new SerialVirtualNode({
        nodeName: 'div',
        attributes: { htmlFor: 'foo' }
      });

      expect(nodeWithoutFor.hasAttr('for')).toBe(false);
      expect(nodeWithFor.hasAttr('for')).toBe(true);
    });

    it('converts `className` to `class`', () => {
      const nodeWithoutClass = new SerialVirtualNode({
        nodeName: 'div',
        attributes: {}
      });
      const nodeWithClass = new SerialVirtualNode({
        nodeName: 'div',
        attributes: { className: 'foo bar baz' }
      });

      expect(nodeWithoutClass.hasAttr('class')).toBe(false);
      expect(nodeWithClass.hasAttr('class')).toBe(true);
    });
  });

  describe('attrNames', () => {
    it('should return a list of attribute names', () => {
      const vNode = new SerialVirtualNode({
        nodeName: 'div',
        attributes: { foo: 'bar' }
      });

      expect(vNode.attrNames).toEqual(['foo']);
    });

    it('should return an empty array if there are no attributes', () => {
      const vNode = new SerialVirtualNode({
        nodeName: 'div'
      });
      expect(vNode.attrNames).toEqual([]);
    });
  });
});
