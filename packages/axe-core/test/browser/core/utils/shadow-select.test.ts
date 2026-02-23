import { describe, it, expect, afterEach } from 'vitest';
import { shadowSupport } from '../../../testutils';

declare const axe: any;
const shadowSupported = shadowSupport.v1;
const testSuite = shadowSupported ? describe : describe.skip;

testSuite('utils.shadowSelect', () => {
  const shadowSelect = axe.utils.shadowSelect;
  const fixture = document.querySelector('#fixture');

  afterEach(() => {
    fixture.innerHTML = '';
  });

  it('throws when not passed a string or array', () => {
    expect(() => {
      shadowSelect(123);
    }).toThrow();
  });

  it('throws when passed an array with non-string values', () => {
    expect(() => {
      shadowSelect([123]);
    }).toThrow();
  });

  describe('given a string', () => {
    it('returns null if no node is found', () => {
      fixture.innerHTML = '<b class="hello"></b>';
      expect(shadowSelect('.goodbye')).toBeNull();
    });

    it('returns the first matching element in the document', () => {
      fixture.innerHTML = '<b class="hello"></b><i class="hello"></i>';
      let node = shadowSelect('.hello');
      expect(node.nodeName.toLowerCase()).toBe('b');
    });
  });

  describe('given an array of string', () => {
    function appendShadowTree(parentNode, nodeName) {
      let node = document.createElement(nodeName);
      parentNode.appendChild(node);
      return node.attachShadow({ mode: 'open' });
    }

    it('returns null given an empty array', () => {
      expect(shadowSelect([])).toBeNull();
    });

    it('returns null if the node does not exist in the shadow tree', () => {
      let shadowRoot = appendShadowTree(fixture, 'div');
      shadowRoot.innerHTML = '<b class="hello"></b>';
      expect(shadowSelect(['#fixture > div', '.goodbye'])).toBeNull();
    });

    it('returns null if an intermediate node is not a shadow root', () => {
      let shadowRoot = appendShadowTree(fixture, 'article');
      shadowRoot.innerHTML = '<section><p class="hello"></p></section>';
      expect(shadowSelect(['#fixture > article', 'section', 'p'])).toBeNull();
    });

    it('returns from Document with a length of 1', () => {
      fixture.innerHTML = '<b class="hello"></b><i class="hello"></i>';
      let node = shadowSelect(['.hello']);
      expect(node.nodeName.toLowerCase()).toBe('b');
    });

    it('returns from a shadow tree with length 2', () => {
      let shadowRoot = appendShadowTree(fixture, 'div');
      shadowRoot.innerHTML = '<b class="hello"></b><i class="hello"></i>';

      let node = shadowSelect(['#fixture > div', '.hello']);
      expect(node.nodeName.toLowerCase()).toBe('b');
    });

    it('returns a node from multiple trees deep', () => {
      let root = fixture;
      const nodes = ['article', 'section', 'div', 'p'];
      nodes.forEach(nodeName => {
        root = appendShadowTree(root, nodeName);
      });
      root.innerHTML = '<b class="hello"></b><i class="hello"></i>';

      let node = shadowSelect([
        '#fixture > article',
        'section',
        'div',
        'p',
        '.hello'
      ]);
      expect(node.nodeName.toLowerCase()).toBe('b');
    });
  });
});
