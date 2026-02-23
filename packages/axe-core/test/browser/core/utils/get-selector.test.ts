import { describe, it, expect, afterEach } from 'vitest';
import { fixtureSetup, shadowSupport } from '../../../testutils';

declare const axe: any;
function createContentGetSelector() {
  const group = document.createElement('div');
  group.innerHTML =
    '<label id="mylabel">Label</label><input id="myinput" aria-labelledby="mylabel" type="text" />';
  return group;
}

function makeShadowTreeGetSelector(node) {
  const root = node.attachShadow({ mode: 'open' });
  const div = document.createElement('div');
  div.className = 'parent';
  root.appendChild(div);
  div.appendChild(createContentGetSelector());
}

function makeNonunique(fixture) {
  let nonUnique = '<div><div><div></div></div></div>';
  fixture.innerHTML =
    '<main>' + nonUnique + nonUnique + nonUnique + '<div><div></div></div>';
  let node = document.createElement('div');
  let parent = fixture.querySelector('div:nth-child(4) > div');
  parent.appendChild(node);
  return node;
}

function makeNonuniqueLongAttributes(fixture) {
  let nonUnique = '<div><div><div></div></div></div>';
  fixture.innerHTML =
    '<main>' + nonUnique + nonUnique + nonUnique + '<div><div></div></div>';
  let node = document.createElement('div');
  node.setAttribute('data-att', 'ddfkjghlkdddfkjghlkdddfkjghlkdddfkjghlkd');
  let parent = fixture.querySelector('div:nth-child(4) > div');
  parent.appendChild(node);
  return node;
}

describe('axe.utils.getSelector', () => {
  const fixture = document.getElementById('fixture');
  const shadowSupported = shadowSupport.v1;

  afterEach(() => {
    fixture.innerHTML = '';
    axe._tree = undefined;
    axe._selectorData = undefined;
  });

  it('throws if axe._selectorData is undefined', () => {
    expect(() => {
      let node = document.createElement('div');
      fixture.appendChild(node);
      axe.utils.getSelector(node);
    }).toThrow();
  });

  it('should generate a unique CSS selector', () => {
    let node = document.createElement('div');
    fixtureSetup(node);
    let sel = axe.utils.getSelector(node);

    let result = document.querySelectorAll(sel);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(node);
  });

  it('should still work if an element has nothing but whitespace as a className', () => {
    let node = document.createElement('div');
    node.className = '    ';
    fixtureSetup(node);
    let sel = axe.utils.getSelector(node);

    let result = document.querySelectorAll(sel);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(node);
  });

  it('should handle special characters in IDs', () => {
    let node = document.createElement('div');
    node.id = 'monkeys#are.animals\\ok';
    fixtureSetup(node);

    let result = document.querySelectorAll(axe.utils.getSelector(node));
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(node);
  });

  it('should handle special characters in classNames', () => {
    let node = document.createElement('div');
    node.className = '.  bb-required';
    fixtureSetup(node);

    let result = document.querySelectorAll(axe.utils.getSelector(node));
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(node);
  });

  it('should be able to fall back to positional selectors', () => {
    let node, expected;
    const nodes = [];
    for (var i = 0; i < 10; i++) {
      node = document.createElement('div');
      nodes.push(node);
      if (i === 5) {
        expected = node;
      }
    }
    fixtureSetup(nodes);
    let result = document.querySelectorAll(axe.utils.getSelector(expected));
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(expected);
  });

  it('should use a unique ID', () => {
    let node = document.createElement('div');
    node.id = 'monkeys';
    fixtureSetup(node);

    let sel = axe.utils.getSelector(node);

    expect(sel).toBe('#monkeys');

    let result = document.querySelectorAll(sel);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(node);
  });

  it('should not use ids if they are not unique', () => {
    let node1 = document.createElement('div');
    let node2 = document.createElement('div');
    node1.id = 'monkeys';
    node2.id = 'monkeys';

    fixtureSetup([node1, node2]);
    let sel = axe.utils.getSelector(node2);

    expect(sel).not.toContain('#monkeys');
    let result = document.querySelectorAll(sel);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(node2);
  });

  it('should use classes if available and unique', () => {
    let node1 = document.createElement('div');
    let node2 = document.createElement('div');
    node1.className = 'monkeys simian';
    node2.className = 'dogs cats';

    fixtureSetup([node1, node2]);
    let sel = axe.utils.getSelector(node2);

    expect(sel).toBe('.dogs');

    let result = document.querySelectorAll(sel);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(node2);
  });

  it('should use classes if more unique than the tag', () => {
    let node1 = document.createElement('p');
    let node2 = document.createElement('p');
    node1.className = 'monkeys simian cats';
    node2.className = 'dogs cats';

    fixtureSetup([node1, node2]);
    let sel = axe.utils.getSelector(node2);
    expect(sel).toBe('.dogs');

    let result = document.querySelectorAll(sel);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(node2);
  });

  it('should NOT use classes if they are more common than the tag', () => {
    let node1 = document.createElement('p');
    let node2 = document.createElement('p');
    node1.className = 'dogs cats';
    node2.className = 'dogs cats';

    fixtureSetup([node1, node2]);
    let sel = axe.utils.getSelector(node2);

    expect(sel.indexOf('.dogs') === -1).toBe(true);
    expect(sel.indexOf('p') === 0).toBe(true);

    let result = document.querySelectorAll(sel);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(node2);
  });

  it('should use the most unique class', () => {
    let node1 = document.createElement('div');
    let node2 = document.createElement('div');
    node1.className = 'dogs';
    node2.className = 'dogs cats';

    fixtureSetup([node1, node2]);
    let sel = axe.utils.getSelector(node2);
    expect(sel).toBe('.cats');

    let result = document.querySelectorAll(sel);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(node2);
  });

  it('should use the most unique class and not the unique attribute', () => {
    let node1 = document.createElement('div');
    let node2 = document.createElement('div');

    node1.className = 'dogs';
    node2.className = 'dogs cats';
    node2.setAttribute('data-axe', 'hello');

    fixtureSetup([node1, node2]);
    let sel = axe.utils.getSelector(node2);

    expect(sel).toBe('.cats');

    let result = document.querySelectorAll(sel);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(node2);
  });

  it('should use only a single unique attribute', () => {
    let node1 = document.createElement('div');
    let node2 = document.createElement('div');

    node1.setAttribute('data-thing', 'hello');
    node2.setAttribute('data-thing', 'hello');
    node2.setAttribute('data-axe', 'hello');

    fixtureSetup([node1, node2]);
    let sel = axe.utils.getSelector(node2);

    expect(sel).toBe('div[data-axe="hello"]');

    let result = document.querySelectorAll(sel);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(node2);
  });

  it('should use three uncommon but not unique features', () => {
    let node1 = document.createElement('div');
    node1.setAttribute('data-axe', 'hello');
    node1.setAttribute('data-thing', 'hello');
    node1.className = 'thing';

    let node2 = document.createElement('div');
    node2.setAttribute('data-axe', 'hello');
    node2.setAttribute('data-thing', 'hello');
    node2.className = 'thing';

    fixtureSetup([node1, node2]);
    let sel = axe.utils.getSelector(node2);
    const clsIndex = sel.indexOf('.thing');
    const attIndex = Math.min(
      sel.indexOf('[data-axe="hello"]'),
      sel.indexOf('[data-thing="hello"]')
    );

    expect(clsIndex !== -1).toBe(true);
    expect(sel.indexOf('[data-axe="hello"]') !== -1).toBe(true);
    expect(sel.indexOf('[data-thing="hello"]') !== -1).toBe(true);

    expect(clsIndex < attIndex, 'classes first').toBe(true);

    let result = document.querySelectorAll(sel);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(node2);
  });

  it('should use only three uncommon but not unique features', () => {
    let node1 = document.createElement('div');
    node1.setAttribute('data-axe', 'hello');
    node1.setAttribute('data-thing', 'hello');
    node1.setAttribute('data-thang', 'hello');
    node1.className = 'thing thang';

    let node2 = document.createElement('div');
    node2.setAttribute('data-axe', 'hello');
    node2.setAttribute('data-thing', 'hello');
    node2.setAttribute('data-thang', 'hello');
    node2.className = 'thing thang';

    fixtureSetup([node1, node2]);
    let sel = axe.utils.getSelector(node2);
    let parts = sel.split('.');
    parts = parts
      .reduce((val, item) => {
        let its = item.split('[');
        return val.concat(its);
      }, [])
      .filter(item => {
        return item !== '';
      });
    expect(parts.length).toBe(3);

    let result = document.querySelectorAll(sel);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(node2);
  });

  it('should use only three uncommon but not unique classes', () => {
    let node1 = document.createElement('div');
    let node2 = document.createElement('div');
    node1.className = 'thing thang thug thick';
    node2.className = 'thing thang thug thick';

    fixtureSetup([node1, node2]);
    let sel = axe.utils.getSelector(node2);
    let parts = sel.split('.');
    parts = parts
      .reduce((val, item) => {
        let its = item.split('[');
        return val.concat(its);
      }, [])
      .filter(item => {
        return item !== '';
      });
    expect(parts.length).toBe(3);

    let result = document.querySelectorAll(sel);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(node2);
  });

  it('should use only three uncommon but not unique attributes', () => {
    let node1 = document.createElement('div');
    node1.setAttribute('data-axe', 'hello');
    node1.setAttribute('data-thug', 'hello');
    node1.setAttribute('data-thing', 'hello');
    node1.setAttribute('data-thang', 'hello');

    let node2 = document.createElement('div');
    node2.setAttribute('data-axe', 'hello');
    node2.setAttribute('data-thing', 'hello');
    node2.setAttribute('data-thang', 'hello');
    node2.setAttribute('data-thug', 'hello');

    fixtureSetup([node1, node2]);
    let sel = axe.utils.getSelector(node2);
    let parts = sel.split('.');
    parts = parts
      .reduce((val, item) => {
        let its = item.split('[');
        return val.concat(its);
      }, [])
      .filter(item => {
        return item !== '';
      });
    expect(parts.length).toBe(4);

    let result = document.querySelectorAll(sel);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(node2);
  });

  it('should not use long attributes', () => {
    let node = makeNonuniqueLongAttributes(fixture);
    fixtureSetup();
    let sel = axe.utils.getSelector(node, {});
    expect(sel.indexOf('data-att') === -1).toBe(true);
  });

  it('should use :root when not unique html element', () => {
    let node = document.createElement('html');
    node.setAttribute('lang', 'en');
    fixtureSetup(node);

    let sel = axe.utils.getSelector(document.documentElement, {});
    expect(sel).toBe(':root');
  });

  it('should use position if classes are not unique', () => {
    let node1 = document.createElement('div');
    node1.className = 'monkeys simian';

    let node2 = document.createElement('div');
    node2.className = 'monkeys simian';

    fixtureSetup([node1, node2]);
    let sel = axe.utils.getSelector(node2);

    expect(sel).toBe('.monkeys.simian:nth-child(2)');

    let result = document.querySelectorAll(sel);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(node2);
  });

  it('should work on the documentElement', () => {
    fixtureSetup();

    let sel = axe.utils.getSelector(document.documentElement);
    let result = document.querySelectorAll(sel);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(document.documentElement);
  });

  it('should work on the documentElement with classes', () => {
    const orig = document.documentElement.className;
    document.documentElement.className = 'stuff and other things';
    fixtureSetup();

    let sel = axe.utils.getSelector(document.documentElement);
    let result = document.querySelectorAll(sel);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(document.documentElement);
    document.documentElement.className = orig;
  });

  it('should work on the body', () => {
    fixtureSetup();
    let sel = axe.utils.getSelector(document.body);
    let result = document.querySelectorAll(sel);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(document.body);
  });

  it('should work on namespaced elements', () => {
    fixtureSetup('<hx:include>Hello</hx:include>');
    let node = fixture.firstChild;

    let sel = axe.utils.getSelector(node);
    let result = document.querySelectorAll(sel);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(node);
  });

  it('should work on complex namespaced elements', () => {
    fixtureSetup(
      '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML">' +
        '<m:mi>x</m:mi>' +
        '<m:annotation-xml encoding="MathML-Content">' +
        '<m:ci>x</m:ci>' +
        '</m:annotation-xml>' +
        '</m:math>'
    );

    let node = fixture.querySelector('m\\:ci');
    let sel = axe.utils.getSelector(node);
    let result = document.querySelectorAll(sel);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(node);
  });

  it('should not use ignored attributes', () => {
    let node = document.createElement('div');
    const ignoredAttributes = [
      'style',
      'selected',
      'checked',
      'disabled',
      'tabindex',
      'aria-checked',
      'aria-selected',
      'aria-invalid',
      'aria-activedescendant',
      'aria-busy',
      'aria-disabled',
      'aria-expanded',
      'aria-grabbed',
      'aria-pressed',
      'aria-valuenow',
      'xmlns'
    ];
    ignoredAttributes.forEach(att => {
      node.setAttribute(att, 'true');
    });
    fixtureSetup(node);

    expect(axe.utils.getSelector(node).indexOf('[') === -1).toBe(true);
  });

  it('should use href and src attributes, shortened', () => {
    let link1 = document.createElement('a');
    link1.setAttribute('href', '//deque.com/thang/');

    let link2 = document.createElement('a');
    link2.setAttribute('href', '//deque.com/about/');

    const img1 = document.createElement('img');
    img1.setAttribute('src', '//deque.com/thang.png');
    const img2 = document.createElement('img');
    img2.setAttribute('src', '//deque.com/logo.png');

    fixtureSetup([link1, link2, img1, img2]);
    expect(axe.utils.getSelector(link2)).toBe('a[href$="about/"]');
    expect(axe.utils.getSelector(img2)).toBe('img[src$="logo.png"]');
  });

  it('should escape href attributes', () => {
    let link1 = document.createElement('a');
    link1.setAttribute('href', '//deque.com/about/');

    let link2 = document.createElement('a');
    link2.setAttribute('href', '//deque.com/child/ \n\n\n');

    fixtureSetup([link1, link2]);
    expect(axe.utils.getSelector(link2)).toBe(
      'a[href="//deque.com/child/ \\a \\a \\a "]'
    );
  });

  it('should not URL encode or token escape href attribute', () => {
    let link1 = document.createElement('a');
    link1.setAttribute('href', '3 Seater');

    let link2 = document.createElement('a');
    link2.setAttribute('href', '1 Seater');

    let expected = 'a[href$="1 Seater"]';
    fixtureSetup([link1, link2]);
    expect(axe.utils.getSelector(link2)).toBe(expected);
    expect(axe.utils.matchesSelector(link2, expected)).toBe(true);
  });

  it('should escape certain special characters in attribute', () => {
    let div1 = document.createElement('div');
    div1.setAttribute('data-thing', 'foobar');

    let div2 = document.createElement('div');
    div2.setAttribute('data-thing', '!@#$%^&*()_+[]\\;\',./{}|:"<>?');

    let expected = 'div[data-thing="!@#$%^&*()_+[]\\\\;\',./{}|:\\"<>?"]';
    fixtureSetup([div1, div2]);
    expect(axe.utils.getSelector(div2)).toBe(expected);
    expect(axe.utils.matchesSelector(div2, expected)).toBe(true);
  });

  it('should escape newline characters in attribute', () => {
    let div1 = document.createElement('div');
    div1.setAttribute('data-thing', 'foobar');

    let div2 = document.createElement('div');
    div2.setAttribute('data-thing', '  \n\n\n');

    let expected = 'div[data-thing="  \\a \\a \\a "]';
    fixtureSetup([div1, div2]);
    expect(axe.utils.getSelector(div2)).toBe(expected);
    expect(axe.utils.matchesSelector(div2, expected)).toBe(true);
  });

  it('should not generate universal selectors', () => {
    let node = document.createElement('div');
    node.setAttribute('role', 'menuitem');
    fixtureSetup(node);

    expect(axe.utils.getSelector(node)).toBe('div[role="menuitem"]');
  });

  it('should work correctly when a URL attribute cannot be shortened', () => {
    const href1 = 'mars2.html?a=be_bold';
    let node1 = document.createElement('a');
    node1.setAttribute('href', href1);

    const href2 = 'mars2.html?a=be_italic';
    let node2 = document.createElement('a');
    node2.setAttribute('href', href2);
    fixtureSetup([node1, node2]);

    expect(axe.utils.getSelector(node1)).toContain('mars2.html?a=be_bold');
    expect(axe.utils.getSelector(node2)).toContain('mars2.html?a=be_italic');
  });

  // shadow DOM v1 - note: v0 is compatible with this code, so no need
  // to specifically test this
  (shadowSupported ? it : xit)(
    'no options: should work with shadow DOM',
    () => {
      let shadEl;
      fixture.innerHTML = '<div></div>';
      makeShadowTreeGetSelector(fixture.firstChild);
      fixtureSetup();

      shadEl = fixture.firstChild.shadowRoot.querySelector('input#myinput');
      expect(axe.utils.getSelector(shadEl)).toEqual([
        '#fixture > div',
        '#myinput'
      ]);
    }
  );

  // shadow DOM v1 - note: v0 is compatible with this code, so no need
  // to specifically test this
  (shadowSupported ? it : xit)('toRoot: should work with shadow DOM', () => {
    let shadEl;
    fixture.innerHTML = '<div></div>';
    makeShadowTreeGetSelector(fixture.firstChild);
    axe._tree = axe.utils.getFlattenedTree(document);
    axe._selectorData = axe.utils.getSelectorData(axe._tree);

    shadEl = fixture.firstChild.shadowRoot.querySelector('input#myinput');
    expect(axe.utils.getSelector(shadEl, { toRoot: true })).toEqual([
      'html > body > #fixture > div',
      '.parent > div > #myinput'
    ]);
  });

  it('should correctly calculate unique selector when no discernable features', () => {
    let node = makeNonunique(fixture);
    fixtureSetup();

    let sel = axe.utils.getSelector(node, {});
    const mine = document.querySelector(sel);
    expect(mine === node).toBe(true);
  });

  it('should not traverse further up than required when no discernable features', () => {
    let node = makeNonunique(fixture);
    fixtureSetup();

    const top = fixture.querySelector('div:nth-child(4)');
    let sel = axe.utils.getSelector(node, {});
    sel = sel.substring(0, sel.indexOf(' >'));
    const test = document.querySelector(sel);
    expect(test === top).toBe(true);
  });

  it('should not error if fragment is no longer in the DOM', () => {
    const fragment = document.createDocumentFragment();
    let node = document.createElement('div');
    fragment.appendChild(node);
    fixtureSetup();
    expect(() => {
      axe.utils.getSelector(node);
    }).not.toThrow();
  });
});
