import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
function setShadowId(vNode, shadowId) {
  vNode.shadowId = shadowId;
  for (let i = 0; i < vNode.children.length; i++) {
    setShadowId(vNode.children[i], shadowId);
  }
}

function getTestDom() {
  const html = document.createElement('html');
  html.innerHTML =
    '' +
    '<body>' +
    '<div class="first" data-a11yhero="faulkner">' +
    '<ul>' +
    '<li class="breaking"></li>' +
    '<li class="breaking"></li>' +
    '</ul>' +
    '</div>' +
    '<div id="one"></div>' +
    '<div class="second third">' +
    '<ul>' +
    '<li role="tab" id="one"></li>' +
    '<li role="button" id="one"></li>' +
    '</ul>' +
    '</div>' +
    '<span class="fourth">' +
    '<span>' +
    '<span>' +
    '<span></span>' +
    '<span></span>' +
    '</span>' +
    '</span>' +
    '</span>' +
    '</body>';

  // remove the head node
  const head = html.querySelector('head');
  if (head) {
    head.parentNode.removeChild(head);
  }

  const tree = axe.utils.getFlattenedTree(html);

  // setup shadowIds for testing
  const first = axe.utils.getNodeFromTree(html.querySelector('.first'));
  const second = axe.utils.getNodeFromTree(html.querySelector('.second'));
  setShadowId(first, 'a');
  setShadowId(second, 'b');
  axe.utils.getNodeFromTree(html.querySelector('[role="button"]')).shadowId =
    'c';

  return tree;
}

describe('axe.utils.querySelectorAllFilter', () => {
  let dom;
  afterEach(() => {});

  const tests = ['without cache', 'with cache'];
  for (let i = 0; i < tests.length; i++) {
    const describeName = tests[i];
    describe(describeName, () => {
      afterEach(() => {});

      if (describeName === 'without cache') {
        beforeEach(() => {
          dom = getTestDom();

          // prove we're using the DOM by deleting the cache
          delete dom[0]._selectorCache;
        });

        it('should not have a primed cache', () => {
          expect(dom[0]._selectorCache).toBeUndefined();
        });
      } else {
        beforeEach(() => {
          dom = getTestDom();

          // prove we're using the cache by deleting all the children
          dom[0].children = [];
        });

        it('should not use the cache if not using the top-level node', () => {
          const nodes = axe.utils.querySelectorAllFilter(dom, 'ul');

          // this would return 4 nodes if we were still using the
          // top-level cache
          const result = axe.utils.querySelectorAllFilter(nodes[0], 'li');
          expect(result.length).toBe(2);
        });
      }

      it('should find nodes using just the tag', () => {
        const result = axe.utils.querySelectorAllFilter(dom, 'li');
        expect(result.length).toBe(4);
      });
      it('should find nodes using parent selector', () => {
        const result = axe.utils.querySelectorAllFilter(dom, 'ul > li');
        expect(result.length).toBe(4);
      });
      it('should NOT find nodes using parent selector', () => {
        const result = axe.utils.querySelectorAllFilter(dom, 'div > li');
        expect(result.length).toBe(0);
      });
      it('should find nodes using nested parent selectors', () => {
        const result = axe.utils.querySelectorAllFilter(
          dom,
          'span > span > span > span'
        );
        expect(result.length).toBe(2);
      });
      it('should find nodes using hierarchical selector', () => {
        const result = axe.utils.querySelectorAllFilter(dom, 'div li');
        expect(result.length).toBe(4);
      });
      it('should find nodes using class selector', () => {
        const result = axe.utils.querySelectorAllFilter(dom, '.breaking');
        expect(result.length).toBe(2);
      });
      it('should find nodes using hierarchical class selector', () => {
        const result = axe.utils.querySelectorAllFilter(dom, '.first .breaking');
        expect(result.length).toBe(2);
      });
      it('should NOT find nodes using hierarchical class selector', () => {
        const result = axe.utils.querySelectorAllFilter(dom, '.second .breaking');
        expect(result.length).toBe(0);
      });
      it('should find nodes using multiple class selector', () => {
        const result = axe.utils.querySelectorAllFilter(dom, '.second.third');
        expect(result.length).toBe(1);
      });
      it('should find nodes using id', () => {
        const result = axe.utils.querySelectorAllFilter(dom, '#one');
        expect(result.length).toBe(1);
      });

      // can only select shadow dom nodes when we're not using the
      // top-level node. but since the top-level node is the one
      // with the cache, this only works when we are testing the full
      // tree (i.e. without cache)
      if (describeName === 'without cache') {
        it('should find nodes using id, but not in shadow DOM', () => {
          const result = axe.utils.querySelectorAllFilter(
            dom[0].children[0],
            '#one'
          );
          expect(result.length).toBe(1);
        });
        it('should find nodes using id, within a shadow DOM', () => {
          const result = axe.utils.querySelectorAllFilter(
            dom[0].children[0].children[2],
            '#one'
          );
          expect(result.length).toBe(1);
        });
      }

      it('should find nodes using attribute', () => {
        const result = axe.utils.querySelectorAllFilter(dom, '[role]');
        expect(result.length).toBe(2);
      });
      it('should find nodes using attribute with value', () => {
        const result = axe.utils.querySelectorAllFilter(dom, '[role=tab]');
        expect(result.length).toBe(1);
      });
      it('should find nodes using attribute with value', () => {
        const result = axe.utils.querySelectorAllFilter(dom, '[role="button"]');
        expect(result.length).toBe(1);
      });
      it('should find nodes using parent attribute with value', () => {
        const result = axe.utils.querySelectorAllFilter(
          dom,
          '[data-a11yhero="faulkner"] > ul'
        );
        expect(result.length).toBe(1);
      });
      it('should find nodes using hierarchical attribute with value', () => {
        const result = axe.utils.querySelectorAllFilter(
          dom,
          '[data-a11yhero="faulkner"] li'
        );
        expect(result.length).toBe(2);
      });
      it('should find nodes using :not selector with class', () => {
        const result = axe.utils.querySelectorAllFilter(dom, 'div:not(.first)');
        expect(result.length).toBe(2);
      });
      it('should find nodes using :not selector with matching id', () => {
        const result = axe.utils.querySelectorAllFilter(dom, 'div:not(#one)');
        expect(result.length).toBe(2);
      });
      it('should find nodes using :not selector with matching attribute selector', () => {
        const result = axe.utils.querySelectorAllFilter(
          dom,
          'div:not([data-a11yhero])'
        );
        expect(result.length).toBe(2);
      });
      it('should find nodes using :not selector with matching attribute selector with value', () => {
        const result = axe.utils.querySelectorAllFilter(
          dom,
          'div:not([data-a11yhero=faulkner])'
        );
        expect(result.length).toBe(2);
      });
      it('should find nodes using :not selector with bogus attribute selector with value', () => {
        const result = axe.utils.querySelectorAllFilter(
          dom,
          'div:not([data-a11yhero=wilco])'
        );
        expect(result.length).toBe(3);
      });
      it('should find nodes using :not selector with bogus id', () => {
        const result = axe.utils.querySelectorAllFilter(dom, 'div:not(#thangy)');
        expect(result.length).toBe(3);
      });
      it('should find nodes using :not selector with attribute', () => {
        const result = axe.utils.querySelectorAllFilter(dom, 'div:not([id])');
        expect(result.length).toBe(2);
      });
      it('should find nodes hierarchically using :not selector', () => {
        const result = axe.utils.querySelectorAllFilter(
          dom,
          'div:not(.first) li'
        );
        expect(result.length).toBe(2);
      });
      it('should find same nodes hierarchically using more :not selector', () => {
        const result = axe.utils.querySelectorAllFilter(
          dom,
          'div:not(.first) li:not(.breaking)'
        );
        expect(result.length).toBe(2);
      });
      it('should NOT find nodes hierarchically using :not selector', () => {
        const result = axe.utils.querySelectorAllFilter(
          dom,
          'div:not(.second) li:not(.breaking)'
        );
        expect(result.length).toBe(0);
      });
      it('should find nodes using ^= attribute selector', () => {
        const result = axe.utils.querySelectorAllFilter(dom, '[class^="sec"]');
        expect(result.length).toBe(1);
      });
      it('should find nodes using $= attribute selector', () => {
        const result = axe.utils.querySelectorAllFilter(dom, '[id$="ne"]');
        expect(result.length).toBe(3);
      });
      it('should find nodes using *= attribute selector', () => {
        const result = axe.utils.querySelectorAllFilter(dom, '[role*="t"]');
        expect(result.length).toBe(2);
      });
      it('should put it all together', () => {
        const result = axe.utils.querySelectorAllFilter(
          dom,
          '.first[data-a11yhero="faulkner"] > ul li.breaking'
        );
        expect(result.length).toBe(2);
      });
      it('should find an element only once', () => {
        const divs = axe.utils.querySelectorAllFilter(dom, 'div');
        const ones = axe.utils.querySelectorAllFilter(dom, '#one');
        const divOnes = axe.utils.querySelectorAllFilter(dom, 'div, #one');

        expect(divOnes.length).toBeLessThan(divs.length + ones.length);
      });
      it('should return nodes sorted by document position', () => {
        const result = axe.utils.querySelectorAllFilter(dom, 'ul, #one');
        expect(result[0].actualNode.nodeName).toBe('UL');
        expect(result[1].actualNode.nodeName).toBe('DIV');
        expect(result[2].actualNode.nodeName).toBe('UL');
      });
      it('should filter the returned nodes when passed a filter function', () => {
        const result = axe.utils.querySelectorAllFilter(dom, 'ul, #one', node => {
          return node.actualNode.nodeName !== 'UL';
        });
        expect(result[0].actualNode.nodeName).toBe('DIV');
        expect(result.length).toBe(1);
      });
    });
  }
});

describe('axe.utils.querySelectorAll', () => {
  let dom;
  afterEach(() => {});
  beforeEach(() => {
    dom = getTestDom();
  });
  it('should find nodes using just the tag', () => {
    const result = axe.utils.querySelectorAll(dom, 'li');
    expect(result.length).toBe(4);
  });
});
