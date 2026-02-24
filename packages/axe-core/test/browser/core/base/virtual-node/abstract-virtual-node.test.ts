import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('AbstractVirtualNode', () => {
  it('should throw an error when accessing props', () => {
    function fn() {
      const abstractNode = new axe.AbstractVirtualNode();
      if (abstractNode.props.nodeType === 1) {
        return;
      }
    }

    expect(fn).toThrow();
  });

  it('should throw an error when accessing attrNames', () => {
    function fn() {
      const abstractNode = new axe.AbstractVirtualNode();
      return abstractNode.attrNames;
    }

    expect(fn).toThrow('VirtualNode class must have an "attrNames" property');
  });

  it('should throw an error when accessing hasClass', () => {
    function fn() {
      const abstractNode = new axe.AbstractVirtualNode();
      if (abstractNode.hasClass('foo')) {
        return;
      }
    }

    expect(fn).toThrow();
  });

  it('should throw an error when accessing attr', () => {
    function fn() {
      const abstractNode = new axe.AbstractVirtualNode();
      if (abstractNode.attr('foo') === 'bar') {
        return;
      }
    }

    expect(fn).toThrow();
  });

  it('should throw an error when accessing hasAttr', () => {
    function fn() {
      const abstractNode = new axe.AbstractVirtualNode();
      if (abstractNode.hasAttr('foo')) {
        return;
      }
    }

    expect(fn).toThrow();
  });

  describe('hasClass, when attr is set', () => {
    it('should return true when the element has the class', () => {
      const vNode = new axe.AbstractVirtualNode();
      vNode.attr = () => {
        return 'my-class';
      };

      expect(vNode.hasClass('my-class')).toBe(true);
    });

    it('should return true when the element contains more than one class', () => {
      const vNode = new axe.AbstractVirtualNode();
      vNode.attr = () => {
        return 'my-class a11y-focus visually-hidden';
      };

      expect(vNode.hasClass('my-class')).toBe(true);
      expect(vNode.hasClass('a11y-focus')).toBe(true);
      expect(vNode.hasClass('visually-hidden')).toBe(true);
    });

    it('should return false when the element does not contain the class', () => {
      const vNode = new axe.AbstractVirtualNode();
      vNode.attr = () => {
        return undefined;
      };

      expect(vNode.hasClass('my-class')).toBe(false);
    });

    it('should return false when the element contains only part of the class', () => {
      const vNode = new axe.AbstractVirtualNode();
      vNode.attr = () => {
        return 'my-class';
      };
      expect(vNode.hasClass('class')).toBe(false);
    });

    it('should return false if className is not of type string', () => {
      const vNode = new axe.AbstractVirtualNode();
      vNode.attr = () => {
        return null;
      };

      expect(vNode.hasClass('my-class')).toBe(false);
    });

    it('should return true for whitespace characters', () => {
      const vNode = new axe.AbstractVirtualNode();
      vNode.attr = () => {
        return 'my-class\ta11y-focus\rvisually-hidden\ngrid\fcontainer';
      };

      expect(vNode.hasClass('my-class')).toBe(true);
      expect(vNode.hasClass('a11y-focus')).toBe(true);
      expect(vNode.hasClass('visually-hidden')).toBe(true);
      expect(vNode.hasClass('grid')).toBe(true);
      expect(vNode.hasClass('container')).toBe(true);
    });
  });
});
