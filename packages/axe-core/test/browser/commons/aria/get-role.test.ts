import { describe, it, afterEach, expect } from 'vitest';
import { flatTreeSetup } from '../../../testutils';

declare const axe: any;
describe('aria.getRole', function () {
  const aria = axe.commons.aria;
  const fixture = document.querySelector('#fixture');

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('returns valid roles', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'button');
    flatTreeSetup(node);
    expect(aria.getRole(node)).toBe('button');
  });

  it('handles case sensitivity', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'BUTTON');
    flatTreeSetup(node);
    expect(aria.getRole(node)).toBe('button');
  });

  it('handles whitespacing', function () {
    const node = document.createElement('div');
    node.setAttribute('role', ' button  ');
    flatTreeSetup(node);
    expect(aria.getRole(node)).toBe('button');
  });

  it('returns null when there is no role', function () {
    const node = document.createElement('div');
    flatTreeSetup(node);
    expect(aria.getRole(node)).toBeNull();
  });

  it('returns the explit role if it is valid and non-abstract', function () {
    const node = document.createElement('li');
    node.setAttribute('role', 'menuitem');
    flatTreeSetup(node);
    expect(aria.getRole(node)).toBe('menuitem');
  });

  it('returns the implicit role if the explicit is invalid', function () {
    fixture.innerHTML = '<ul><li id="target" role="foobar"></li></ul>';
    flatTreeSetup(fixture);
    const node = fixture.querySelector('#target');
    expect(aria.getRole(node)).toBe('listitem');
  });

  it('ignores fallback roles by default', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'spinbutton button');
    flatTreeSetup(node);
    expect(aria.getRole(node)).toBeNull();
  });

  it('accepts virtualNode objects', function () {
    const node = document.createElement('div');
    node.setAttribute('role', 'button');
    const vNode = flatTreeSetup(node)[0];
    expect(aria.getRole(vNode)).toBe('button');
  });

  it('returns null if the node is not an element', function () {
    const node = document.createTextNode('foo bar baz');
    flatTreeSetup(node);
    expect(aria.getRole(node)).toBeNull();
  });

  it('runs role resolution with role=none', function () {
    fixture.innerHTML =
      '<ul><li id="target" role="none" aria-label="foo"></li></ul>';
    flatTreeSetup(fixture);
    const node = fixture.querySelector('#target');
    expect(aria.getRole(node)).toBe('listitem');
  });

  it('runs role resolution with role=presentation', function () {
    fixture.innerHTML =
      '<ul><li id="target" role="presentation" aria-label="foo"></li></ul>';
    flatTreeSetup(fixture);
    const node = fixture.querySelector('#target');
    expect(aria.getRole(node)).toBe('listitem');
  });

  it('handles focusable element with role="none"', function () {
    fixture.innerHTML = '<button id="target" role="none"></button>';
    flatTreeSetup(fixture);
    const node = fixture.querySelector('#target');
    expect(aria.getRole(node)).toBe('button');
  });

  describe('presentational role inheritance', function () {
    it('handles presentation role inheritance for ul', function () {
      fixture.innerHTML =
        '<ul role="presentation"><li id="target">foo</li></ul>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node)).toBe('presentation');
    });

    it('handles presentation role inheritance for ol', function () {
      fixture.innerHTML =
        '<ol role="presentation"><li id="target">foo</li></ol>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node)).toBe('presentation');
    });

    it('handles presentation role inheritance for dt', function () {
      fixture.innerHTML =
        '<dl role="presentation"><dt id="target">foo</dt><dd>bar></dd></dl>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node)).toBe('presentation');
    });

    it('handles presentation role inheritance for dd', function () {
      fixture.innerHTML =
        '<dl role="presentation"><dt>foo</dt><dd id="target">bar></dd></dl>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node)).toBe('presentation');
    });

    it('handles presentation role inheritance for dt with div wrapper', function () {
      fixture.innerHTML =
        '<dl role="presentation"><div><dt id="target">foo</dt><dd>bar></dd></div></dl>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node)).toBe('presentation');
    });

    it('handles presentation role inheritance for dd with div wrapper', function () {
      fixture.innerHTML =
        '<dl role="presentation"><div><dt>foo</dt><dd id="target">bar></dd></div></dl>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node)).toBe('presentation');
    });

    it('handles presentation role inheritance for thead', function () {
      fixture.innerHTML =
        '<table role="presentation"><thead id="target"><tr><th>hi</th><th>goodbye</th></tr></thead><tbody><tr><th>hi</th><td>foo</td></tr></tbody></table>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node)).toBe('presentation');
    });

    it('handles presentation role inheritance for td', function () {
      fixture.innerHTML =
        '<table role="presentation"><thead><tr><th>hi</th><th>goodbye</th></tr></thead><tbody><tr><th>hi</th><td id="target">foo</td></tr></tbody></table>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node)).toBe('presentation');
    });

    it('handles presentation role inheritance for th', function () {
      fixture.innerHTML =
        '<table role="presentation"><thead><tr><th>hi</th><th>goodbye</th></tr></thead><tbody><tr><th id="target">hi</th><td>foo</td></tr></tbody></table>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node)).toBe('presentation');
    });

    it('handles presentation role inheritance for tbody', function () {
      fixture.innerHTML =
        '<table role="presentation"><thead><tr><th>hi</th><th>goodbye</th></tr></thead><tbody id="target"><tr><th>hi</th><td>foo</td></tr></tbody></table>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node)).toBe('presentation');
    });

    it('handles presentation role inheritance for tr', function () {
      fixture.innerHTML =
        '<table role="presentation"><thead><tr id="target"><th>hi</th><th>goodbye</th></tr></thead><tbody><tr><th>hi</th><td>foo</td></tr></tbody></table>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node)).toBe('presentation');
    });

    it('handles presentation role inheritance for tfoot', function () {
      fixture.innerHTML =
        '<table role="presentation"><thead><tr><th>hi</th><th>goodbye</th></tr></thead><tfoot id="target"><tr><th>hi</th><td>foo</td></tr></tfoot></table>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node)).toBe('presentation');
    });

    it('returns implicit role for presentation role inheritance if ancestor is not the required ancestor', function () {
      fixture.innerHTML =
        '<table role="presentation"><tr><td><ul><li id="target">foo</li></ul></td></tr></table>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node)).toBe('listitem');
    });

    it('does not override explicit role with presentation role inheritance', function () {
      fixture.innerHTML =
        '<ul role="presentation"><li id="target" role="listitem">foo</li></ul>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node)).toBe('listitem');
    });

    it('does not continue presentation role with explicit role in between', function () {
      fixture.innerHTML =
        '<table role="presentation"><tr role="row"><td id="target">foo</td></tr></table>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node)).toBe('cell');
    });

    it('handles presentation role inheritance with invalid role in between', function () {
      fixture.innerHTML =
        '<table role="presentation"><tr role="tablerow"><td id="target">foo</td></tr></table>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node)).toBe('presentation');
    });

    it('does not continue presentation role through nested layers', function () {
      fixture.innerHTML =
        '<ul role="presentation"><li><ul><li id="target">foo</li></ul></li></ul>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node)).toBe('listitem');
    });

    it('throws an error if the tree is incomplete', function () {
      fixture.innerHTML =
        '<ul role="presentation"><li id="target">foo</li></ul>';
      const node = fixture.querySelector('#target');
      flatTreeSetup(node);
      expect(function () {
        aria.getRole(node);
      }).toThrow();
    });
  });

  describe('noImplicit', function () {
    it('returns the implicit role by default', function () {
      fixture.innerHTML = '<ul><li id="target"></li></ul>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node)).toBe('listitem');
    });

    it('returns null rather than the implicit role with `noImplicit: true`', function () {
      const node = document.createElement('li');
      flatTreeSetup(node);
      expect(aria.getRole(node, { noImplicit: true })).toBeNull();
    });

    it('does not do role resolution if noImplicit: true', function () {
      const node = document.createElement('li');
      node.setAttribute('role', 'none');
      node.setAttribute('aria-label', 'foo');
      flatTreeSetup(node);
      expect(aria.getRole(node, { noImplicit: true })).toBe(null);
    });

    it('still returns the explicit role', function () {
      const node = document.createElement('li');
      node.setAttribute('role', 'button');
      flatTreeSetup(node);
      expect(aria.getRole(node, { noImplicit: true })).toBe('button');
    });

    it('returns the implicit role with `noImplicit: false`', function () {
      fixture.innerHTML = '<ul><li id="target"></li></ul>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node, { noImplicit: false })).toBe('listitem');
    });
  });

  describe('abstracts', function () {
    it('ignores abstract roles by default', function () {
      fixture.innerHTML = '<ul><li id="target" role="section"></li></ul>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node)).toBe('listitem');
    });

    it('returns abstract roles with `abstracts: true`', function () {
      const node = document.createElement('li');
      node.setAttribute('role', 'section');
      flatTreeSetup(node);
      expect(aria.getRole(node, { abstracts: true })).toBe('section');
    });

    it('does not returns abstract roles with `abstracts: false`', function () {
      fixture.innerHTML = '<ul><li id="target" role="section"></li></ul>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node, { abstracts: false })).toBe('listitem');
    });
  });

  describe('dpub', function () {
    it('ignores DPUB roles by default', function () {
      const node = document.createElement('section');
      node.setAttribute('role', 'doc-chapter');
      flatTreeSetup(node);
      expect(aria.getRole(node)).toBeNull();
    });

    it('returns DPUB roles with `dpub: true`', function () {
      const node = document.createElement('section');
      node.setAttribute('role', 'doc-chapter');
      flatTreeSetup(node);
      expect(aria.getRole(node, { dpub: true })).toBe('doc-chapter');
    });

    it('does not returns DPUB roles with `dpub: false`', function () {
      const node = document.createElement('section');
      node.setAttribute('role', 'doc-chapter');
      flatTreeSetup(node);
      expect(aria.getRole(node, { dpub: false })).toBeNull();
    });
  });

  describe('fallback', function () {
    it('returns the first valid item in the list', function () {
      const node = document.createElement('div');
      node.setAttribute('role', 'link button');
      flatTreeSetup(node);
      expect(aria.getRole(node, { fallback: true })).toBe('link');
    });

    it('skips over invalid roles', function () {
      const node = document.createElement('div');
      node.setAttribute('role', 'foobar button');
      flatTreeSetup(node);
      expect(aria.getRole(node, { fallback: true })).toBe('button');
    });

    it('returns the null if all roles are invalid and there is no implicit role', function () {
      const node = document.createElement('div');
      node.setAttribute('role', 'foo bar baz');
      flatTreeSetup(node);
      expect(aria.getRole(node, { fallback: true })).toBeNull();
    });

    it('respects the defaults', function () {
      fixture.innerHTML =
        '<ul><li id="target" role="doc-chapter section"></li></ul>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node, { fallback: true })).toBe('listitem');
    });

    it('respect the `noImplicit` option', function () {
      const node = document.createElement('li');
      node.setAttribute('role', 'doc-chapter section');
      flatTreeSetup(node);
      expect(
        aria.getRole(node, { fallback: true, noImplicit: true })
      ).toBeNull();
    });

    it('respect the `abstracts` option', function () {
      const node = document.createElement('li');
      node.setAttribute('role', 'doc-chapter section');
      flatTreeSetup(node);
      expect(aria.getRole(node, { fallback: true, abstracts: true })).toBe(
        'section'
      );
    });

    it('respect the `dpub` option', function () {
      const node = document.createElement('li');
      node.setAttribute('role', 'doc-chapter section');
      flatTreeSetup(node);
      expect(aria.getRole(node, { fallback: true, dpub: true })).toBe(
        'doc-chapter'
      );
    });
  });

  describe('noPresentational is honored', function () {
    it('handles no inheritance role = presentation', function () {
      fixture.innerHTML =
        '<ul role="presentation" id="target"><li>foo</li></ul>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node, { noPresentational: true })).toBeNull();
    });

    it('handles inheritance role = presentation', function () {
      fixture.innerHTML =
        '<ul role="presentation"><li id="target">foo</li></ul>';
      flatTreeSetup(fixture);
      const node = fixture.querySelector('#target');
      expect(aria.getRole(node, { noPresentational: true })).toBeNull();
    });

    it('handles implicit role', function () {
      const node = document.createElement('img');
      node.setAttribute('alt', '');
      flatTreeSetup(node);
      expect(aria.getRole(node, { noPresentational: true })).toBeNull();
    });

    it('handles role = none', function () {
      const node = document.createElement('div');
      node.setAttribute('role', 'none');
      flatTreeSetup(node);
      expect(aria.getRole(node, { noPresentational: true })).toBeNull();
    });
  });

  describe('SerialVirtualNode', function () {
    it('works with the SerialVirtualNode', function () {
      const vNode = new axe.SerialVirtualNode({
        nodeName: 'div',
        attributes: {
          role: 'button'
        }
      });
      expect(aria.getRole(vNode)).toBe('button');
    });

    it('does not throw for missing parent in presentational role inheritance', function () {
      const vNode = new axe.SerialVirtualNode({
        nodeName: 'li'
      });

      expect(function () {
        expect(aria.getRole(vNode)).toBe('listitem');
      }).not.toThrow();
    });
  });
});
