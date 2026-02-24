import { describe, it, afterEach, expect } from 'vitest';

declare const axe: any;
function createContentIDR() {
  const group = document.createElement('div');
  group.id = 'target';
  return group;
}

function makeShadowTreeIDR(node) {
  const root = node.attachShadow({ mode: 'open' });
  const div = document.createElement('div');
  div.className = 'parent';
  div.setAttribute('target', 'target');
  root.appendChild(div);
  div.appendChild(createContentIDR());
}

describe('dom.idrefs', function () {
  const fixture = document.getElementById('fixture');

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should find referenced nodes by ID', function () {
    fixture.innerHTML =
      '<div aria-cats="target1 target2" id="start"></div>' +
      '<div id="target1"></div><div id="target2"></div>';

    const start = document.getElementById('start'),
      expected = [
        document.getElementById('target1'),
        document.getElementById('target2')
      ];

    expect(axe.commons.dom.idrefs(start, 'aria-cats')).toEqual(
      expected,
      'Should find it!'
    );
  });

  it(
    'should find only referenced nodes within the current root: shadow DOM',
    function () {
      // shadow DOM v1 - note: v0 is compatible with this code, so no need
      // to specifically test this
      fixture.innerHTML = '<div target="target"><div id="target"></div></div>';
      makeShadowTreeIDR(fixture.firstChild);
      const start = fixture.firstChild.shadowRoot.querySelector('.parent');
      const expected = [fixture.firstChild.shadowRoot.getElementById('target')];

      expect(axe.commons.dom.idrefs(start, 'target')).toEqual(
        expected,
        'should only find stuff in the shadow DOM'
      );
    }
  );

  it(
    'should find only referenced nodes within the current root: document',
    function () {
      // shadow DOM v1 - note: v0 is compatible with this code, so no need
      // to specifically test this
      fixture.innerHTML =
        '<div target="target" class="parent"><div id="target"></div></div>';
      makeShadowTreeIDR(fixture.firstChild);
      const start = fixture.querySelector('.parent');
      const expected = [document.getElementById('target')];

      expect(axe.commons.dom.idrefs(start, 'target')).toEqual(
        expected,
        'should only find stuff in the document'
      );
    }
  );

  it('should insert null if a reference is not found', function () {
    fixture.innerHTML =
      '<div aria-cats="target1 target2 target3" id="start"></div>' +
      '<div id="target1"></div><div id="target2"></div>';

    const start = document.getElementById('start'),
      expected = [
        document.getElementById('target1'),
        document.getElementById('target2'),
        null
      ];

    expect(axe.commons.dom.idrefs(start, 'aria-cats')).toEqual(
      expected,
      'Should find it!'
    );
  });

  it('should not fail when extra whitespace is used', function () {
    fixture.innerHTML =
      '<div aria-cats="    \ttarget1 \n  target2  target3 \n\t" id="start"></div>' +
      '<div id="target1"></div><div id="target2"></div>';

    const start = document.getElementById('start'),
      expected = [
        document.getElementById('target1'),
        document.getElementById('target2'),
        null
      ];

    expect(axe.commons.dom.idrefs(start, 'aria-cats')).toEqual(
      expected,
      'Should find it!'
    );
  });
});
