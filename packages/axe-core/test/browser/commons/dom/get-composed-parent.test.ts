import { describe, it, afterEach, expect } from 'vitest';

declare const axe: any;
describe('dom.getComposedParent', function () {
  const getComposedParent = axe.commons.dom.getComposedParent;
  const fixture = document.getElementById('fixture');

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('returns the parentNode normally', function () {
    fixture.innerHTML = '<div id="parent"><div id="target"></div></div>';

    const actual = getComposedParent(document.getElementById('target'));
    expect(actual).toBeInstanceOf(Node);
    expect(actual).toBe(document.getElementById('parent'));
  });

  it('returns null from the documentElement', function () {
    expect(getComposedParent(document.documentElement)).toBeNull();
  });

  it(
    'skip the slot node for slotted content',
    function () {
      fixture.innerHTML = '<div id="shadow"><div id="target"></div></div>';
      const shadowRoot = document
        .getElementById('shadow')
        .attachShadow({ mode: 'open' });
      shadowRoot.innerHTML =
        '<div id="grand-parent">' + '<slot id="parent"></slot>' + '</div>';

      const actual = getComposedParent(fixture.querySelector('#target'));
      expect(actual).toBeInstanceOf(Node);
      expect(actual).toBe(shadowRoot.querySelector('#grand-parent'));
    }
  );

  it(
    'understands explicitly slotted nodes',
    function () {
      fixture.innerHTML =
        '<div id="shadow"><div id="target" slot="bar"></div></div>';
      const shadowRoot = document
        .getElementById('shadow')
        .attachShadow({ mode: 'open' });
      shadowRoot.innerHTML =
        '<div id="grand-parent">' +
        '<slot name="foo"></slot>' +
        '<div id="parent"><slot name="bar"></slot></div>' +
        '</div>';

      const actual = getComposedParent(fixture.querySelector('#target'));
      expect(actual).toBeInstanceOf(Node);
      expect(actual).toBe(shadowRoot.querySelector('#parent'));
    }
  );

  it(
    'returns elements within a shadow tree',
    function () {
      fixture.innerHTML = '<div id="shadow"> content </div>';
      const shadowRoot = document
        .getElementById('shadow')
        .attachShadow({ mode: 'open' });
      shadowRoot.innerHTML =
        '<div id="parent">' + '<slot id="target"></slot>' + '</div>';

      const actual = getComposedParent(shadowRoot.querySelector('#target'));
      expect(actual).toBeInstanceOf(Node);
      expect(actual).toBe(shadowRoot.querySelector('#parent'));
    }
  );

  it(
    'returns the host when it reaches the shadow root',
    function () {
      fixture.innerHTML = '<div id="parent"> content </div>';
      const shadowRoot = document
        .getElementById('parent')
        .attachShadow({ mode: 'open' });
      shadowRoot.innerHTML = '<div id="target"> <slot></slot> </div>';

      const actual = getComposedParent(shadowRoot.querySelector('#target'));
      expect(actual).toBeInstanceOf(Node);
      expect(actual).toBe(fixture.querySelector('#parent'));
    }
  );
});
