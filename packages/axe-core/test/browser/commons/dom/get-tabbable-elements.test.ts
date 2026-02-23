import { describe, it, expect } from 'vitest';
import {
  queryFixture,
  injectIntoFixture,
  shadowSupport
} from '../../../testutils';

declare const axe: any;
describe('dom.getTabbableElements', function () {
  const shadowSupported = shadowSupport.v1;
  const getTabbableElementsFn = axe.commons.dom.getTabbableElements;

  it('returns tabbable elms when node contains tabbable element', function () {
    const virtualNode = queryFixture(
      '<div id="target">' +
        '<label>Enter description:' +
        '<textarea></textarea>' +
        '</label>' +
        '</div>'
    );
    const actual = getTabbableElementsFn(virtualNode);
    expect(actual).toHaveLength(1);
    expect(actual[0].actualNode.nodeName.toUpperCase()).toBe('TEXTAREA');
  });

  it('returns empty [] when element does not contains tabbable element (using tabindex to take element out of tab-order)', function () {
    const virtualNode = queryFixture(
      '<div id="target">' + '<input tabindex="-1">' + '</div>'
    );
    const actual = getTabbableElementsFn(virtualNode);
    expect(actual).toHaveLength(0);
  });

  it('returns empty [] when element contains disabled (tabbable) element', function () {
    const virtualNode = queryFixture(
      '<div id="target">' + '<button disabled>Submit Me</button>' + '</div>'
    );
    const actual = getTabbableElementsFn(virtualNode);
    expect(actual).toHaveLength(0);
  });

  it('returns empty [] when element does not contain tabbable element', function () {
    const virtualNode = queryFixture(
      '<div id="target">' + '<p>Some text</p>' + '</div>'
    );
    const actual = getTabbableElementsFn(virtualNode);
    expect(actual).toHaveLength(0);
  });

  (shadowSupported ? it : xit)(
    'returns tabbable elms when element contains tabbable element inside shadowDOM',
    function () {
      const fixture = injectIntoFixture('<div id="target"></div>`');
      const node = fixture.querySelector('#target');
      const shadow = node.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<button>btn</button>';
      // re build tree after shadowDOM is constructed
      axe.setup(fixture);
      const virtualNode = axe.utils.getNodeFromTree(node);
      const actual = getTabbableElementsFn(virtualNode);
      expect(actual).toHaveLength(1);
      expect(actual[0].actualNode.nodeName.toUpperCase()).toBe('BUTTON');
    }
  );

  (shadowSupported ? it : xit)(
    'returns empty [] when element contains disabled (tabbable) element inside shadowDOM',
    function () {
      const fixture = injectIntoFixture('<div id="target"></div>`');
      const node = fixture.querySelector('#target');
      const shadow = node.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<button disabled>btn</button>';
      // re build tree after shadowDOM is constructed
      axe.setup(fixture);
      const virtualNode = axe.utils.getNodeFromTree(node);
      const actual = getTabbableElementsFn(virtualNode);
      expect(actual).toHaveLength(0);
    }
  );

  (shadowSupported ? it : xit)(
    'returns empty [] when element does not contain tabbable element inside shadowDOM',
    function () {
      const fixture = injectIntoFixture('<div id="target"></div>`');
      const node = fixture.querySelector('#target');
      const shadow = node.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<p>I am not tabbable</p>';
      // re build tree after shadowDOM is constructed
      axe.setup(fixture);
      const virtualNode = axe.utils.getNodeFromTree(node);
      const actual = getTabbableElementsFn(virtualNode);
      expect(actual).toHaveLength(0);
    }
  );
});
