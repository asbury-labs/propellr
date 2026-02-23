import { describe, it, afterEach, expect } from 'vitest';
import { flatTreeSetup } from '../../../testutils';

declare const axe: any;
describe('aria.implicitRole', function () {
  const implicitRole = axe.commons.aria.implicitRole;
  const fixture = document.querySelector('#fixture');

  afterEach(function () {
    fixture.innerHTML = '';
  });

  // test string role (don't need to test all of them just that
  // one works)
  it('should return button for button', function () {
    fixture.innerHTML = '<button id="target"></button>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('button');
  });

  it('should error if element is not in the tree', function () {
    fixture.innerHTML = '<button id="target"></button>';
    const node = fixture.querySelector('#target');
    expect(function () {
      implicitRole(node);
    }).toThrow();
  });

  it('should return null if there is no implicit role', function () {
    fixture.innerHTML = '<div id="target"></div>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBeNull();
  });

  it('should return null if there is no implicit role when not considering chromium', function () {
    fixture.innerHTML = '<canvas id="target" aria-label="hello"></canvas>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBeNull();
  });

  it('should return the chromium implicit role for elements that have one', function () {
    fixture.innerHTML = '<canvas id="target" aria-label="hello"></canvas>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node, { chromium: true })).toBe('Canvas');
  });

  it('should return link for "a[href]"', function () {
    fixture.innerHTML = '<a id="target" href>link</a>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('link');
  });

  it('should return null for "a:not([href])"', function () {
    fixture.innerHTML = '<a id="target">link</a>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBeNull();
  });

  it('should return link for "area[href]"', function () {
    fixture.innerHTML = '<area id="target" href>link</area>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('link');
  });

  it('should return null for "area:not([href])"', function () {
    fixture.innerHTML = '<area id="target">link</area>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBeNull();
  });

  it('should return contentinfo for "body footer"', function () {
    fixture.innerHTML = '<footer id="target"></footer>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('contentinfo');
  });

  it('should return null for footer with sectioning or main parent', function () {
    const nodes = ['article', 'aside', 'main', 'nav', 'section'];
    const roles = ['article', 'complementary', 'main', 'navigation', 'region'];

    for (const i = 0; i < nodes.length; i++) {
      fixture.innerHTML =
        '<' + nodes[i] + '><footer id="target"></footer></' + nodes[i] + '>';
      const node = fixture.querySelector('#target');
      flatTreeSetup(fixture);
      expect(implicitRole(node), nodes[i] + ' not null').toBeNull();
    }

    for (const i = 0; i < roles.length; i++) {
      fixture.innerHTML =
        '<div role="' + roles[i] + '"><footer id="target"></footer></div>';
      const node = fixture.querySelector('#target');
      flatTreeSetup(fixture);
      expect(implicitRole(node), '[' + roles[i] + '] not null').toBeNull();
    }
  });

  it('should return form for form with accessible name aria-label', function () {
    fixture.innerHTML = '<form id="target" aria-label="foo"></form>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('form');
  });

  it('should return form for form with accessible name aria-labelledby', function () {
    fixture.innerHTML =
      '<div id="foo">foo</div><form id="target" aria-labelledby="foo"></form>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('form');
  });

  it('should return null for form with accessible name title', function () {
    fixture.innerHTML = '<form id="target" title="foo"></form>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBeNull();
  });

  it('should return null for form without accessible name', function () {
    fixture.innerHTML = '<form id="target"></form>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBeNull();
  });

  it('should return complementary for aside scoped to body', function () {
    fixture.innerHTML = '<aside id="target"></aside>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('complementary');
  });

  it('should return complementary for aside scoped to main', function () {
    fixture.innerHTML = '<main><aside id="target"></aside></main>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('complementary');
  });

  it('should return complementary for aside scoped to element with role=main', function () {
    fixture.innerHTML =
      '<article role="main"><aside id="target"></aside></article>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('complementary');
  });

  it('should return null for aside with sectioning parent', function () {
    const nodes = ['article', 'aside', 'nav', 'section'];
    const roles = ['article', 'complementary', 'navigation', 'region'];

    for (const i = 0; i < nodes.length; i++) {
      fixture.innerHTML =
        '<' + nodes[i] + '><header id="target"></header></' + nodes[i] + '>';
      const node = fixture.querySelector('#target');
      flatTreeSetup(fixture);
      expect(implicitRole(node), nodes[i] + ' not null').toBeNull();
    }

    for (const i = 0; i < roles.length; i++) {
      fixture.innerHTML =
        '<div role="' + roles[i] + '"><header id="target"></header></div>';
      const node = fixture.querySelector('#target');
      flatTreeSetup(fixture);
      expect(implicitRole(node), '[' + roles[i] + '] not null').toBeNull();
    }
  });

  it('should return complementary for aside with sectioning parent if aside has aria-label', function () {
    const nodes = ['article', 'aside', 'nav', 'section'];
    const roles = ['article', 'complementary', 'navigation', 'region'];

    for (const i = 0; i < nodes.length; i++) {
      fixture.innerHTML =
        '<' +
        nodes[i] +
        '><aside id="target" aria-label="test label"></aside></' +
        nodes[i] +
        '>';
      const node = fixture.querySelector('#target');
      flatTreeSetup(fixture);
      expect(implicitRole(node)).toBe('complementary');
    }

    for (const i = 0; i < roles.length; i++) {
      fixture.innerHTML =
        '<div role="' +
        roles[i] +
        '"><aside id="target" aria-label="test label"></aside></div>';
      const node = fixture.querySelector('#target');
      flatTreeSetup(fixture);
      expect(implicitRole(node)).toBe('complementary');
    }
  });

  it('should return null for sectioned aside with empty aria-label', function () {
    fixture.innerHTML =
      '<section><aside id="target" aria-label=" "></aside></section>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBeNull();
  });

  it('should return complementary for sectioned aside with title', function () {
    fixture.innerHTML =
      '<section><aside id="target" title="test title"></aside></section>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('complementary');
  });

  it('should return null for sectioned aside with empty title', function () {
    fixture.innerHTML =
      '<section><aside id="target" title=" "></aside></section>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBeNull();
  });

  it('should return banner for "body header"', function () {
    fixture.innerHTML = '<header id="target"></header>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('banner');
  });

  it('should return null for header with sectioning or main parent', function () {
    const nodes = ['article', 'aside', 'main', 'nav', 'section'];
    const roles = ['article', 'complementary', 'main', 'navigation', 'region'];

    for (const i = 0; i < nodes.length; i++) {
      fixture.innerHTML =
        '<' + nodes[i] + '><header id="target"></header></' + nodes[i] + '>';
      const node = fixture.querySelector('#target');
      flatTreeSetup(fixture);
      expect(implicitRole(node), nodes[i] + ' not null').toBeNull();
    }

    for (const i = 0; i < roles.length; i++) {
      fixture.innerHTML =
        '<div role="' + roles[i] + '"><header id="target"></header></div>';
      const node = fixture.querySelector('#target');
      flatTreeSetup(fixture);
      expect(implicitRole(node), '[' + roles[i] + '] not null').toBeNull();
    }
  });

  it('should return img for "img[alt]"', function () {
    fixture.innerHTML = '<img id="target" alt="value"></img>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('img');
  });

  it('should return img for "img:not([alt])"', function () {
    fixture.innerHTML = '<img id="target"></img>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('img');
  });

  it('should return presentation for "img" with empty alt', function () {
    fixture.innerHTML = '<img id="target" alt=""></img>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('presentation');
  });

  it('should return img for "img" with empty alt and global aria attribute', function () {
    fixture.innerHTML = '<img id="target" alt="" aria-label></img>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('img');
  });

  it('should return img for "img" with empty alt and focusable', function () {
    fixture.innerHTML = '<img id="target" alt="" tabindex="0"></img>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('img');
  });

  it('should return button for "input[type=button]"', function () {
    fixture.innerHTML = '<input id="target" type="button"/>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('button');
  });

  it('should return button for "input[type=image]"', function () {
    fixture.innerHTML = '<input id="target" type="image"/>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('button');
  });

  it('should return button for "input[type=reset]"', function () {
    fixture.innerHTML = '<input id="target" type="reset"/>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('button');
  });

  it('should return button for "input[type=submit]"', function () {
    fixture.innerHTML = '<input id="target" type="submit"/>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('button');
  });

  it('should return checkbox for "input[type=checkbox]"', function () {
    fixture.innerHTML = '<input id="target" type="checkbox"/>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('checkbox');
  });

  it('should return textbox for "input[type=email]"', function () {
    fixture.innerHTML = '<input id="target" type="email"/>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('textbox');
  });

  it('should return textbox for "input[type=tel]"', function () {
    fixture.innerHTML = '<input id="target" type="tel"/>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('textbox');
  });

  it('should return textbox for "input[type=text]"', function () {
    fixture.innerHTML = '<input id="target" type="text"/>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('textbox');
  });

  it('should return textbox for "input[type=url]"', function () {
    fixture.innerHTML = '<input id="target" type="url"/>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('textbox');
  });

  it('should return textbox for "input[type=password]"', function () {
    fixture.innerHTML = '<input id="target" type="password"/>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('textbox');
  });

  it('should return textbox for "input[type=time]"', function () {
    fixture.innerHTML = '<input id="target" type="time"/>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('textbox');
  });

  it('should return textbox for "input[type=date]"', function () {
    fixture.innerHTML = '<input id="target" type="date"/>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('textbox');
  });

  it('should return textbox for "input:not([type])"', function () {
    fixture.innerHTML = '<input id="target"/>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('textbox');
  });

  it('should return combobox for "input[list]" that points to a datalist', function () {
    fixture.innerHTML =
      '<input id="target" list="list"/><datalist id="list"></datalist>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('combobox');
  });

  it('should return textbox for "input[list]" that does not point to a datalist', function () {
    fixture.innerHTML = '<input id="target" list="list"/><div id="list"></div>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('textbox');
  });

  it('should return textbox for "input[type=password][list]"', function () {
    fixture.innerHTML =
      '<input id="target" type="password" list="list"/>' +
      '<datalist id="list"></datalist>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('textbox');
  });

  it('should return spinbutton for "input[type=number]"', function () {
    fixture.innerHTML = '<input id="target" type="number"/>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('spinbutton');
  });

  it('should return radio for "input[type=radio]"', function () {
    fixture.innerHTML = '<input id="target" type="radio"/>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('radio');
  });

  it('should return slider for "input[type=range]"', function () {
    fixture.innerHTML = '<input id="target" type="range"/>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('slider');
  });

  it('should return searchbox for "input[type=search]"', function () {
    fixture.innerHTML = '<input id="target" type="search"/>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('searchbox');
  });

  it('should return combobox for "input[type=search][list]"', function () {
    fixture.innerHTML =
      '<input id="target" type="search" list="list"/><datalist id="list"></datalist>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('combobox');
  });

  it('should return textbox for "input[type=invalid]"', function () {
    fixture.innerHTML = '<input id="target" type="invalid"/>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('textbox');
  });

  it('should return region for "section" with accessible name aria-label', function () {
    fixture.innerHTML = '<section id="target" aria-label="foo"></section>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('region');
  });

  it('should return region for section with accessible name aria-labelledby', function () {
    fixture.innerHTML =
      '<div id="foo">foo</div><section id="target" aria-labelledby="foo"></section>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('region');
  });

  it('should return null for section with accessible name title', function () {
    fixture.innerHTML = '<section id="target" title="foo"></section>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBeNull();
  });

  it('should return null for "section" without accessible name', function () {
    fixture.innerHTML = '<section id="target"></section>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBeNull();
  });

  it('should return null for "section" with empty aria-label', function () {
    fixture.innerHTML = '<section id="target" aria-label=" "></section>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBeNull();
  });

  it('should return null for "section" with empty aria-labelledby', function () {
    fixture.innerHTML =
      '<div id="foo"> </div><section id="target" aria-labelledby="foo"></section>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBeNull();
  });

  it('should return null for "section" with empty title', function () {
    fixture.innerHTML = '<section id="target" title=" "></section>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBeNull();
  });

  it('should return listbox for "select[multiple]"', function () {
    fixture.innerHTML = '<select id="target" multiple></select>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('listbox');
  });

  it('should return listbox for "select[size]" > 1', function () {
    fixture.innerHTML = '<select id="target" size="3"></select>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('listbox');
  });

  it('should return combobox for "select[size]" <= 1', function () {
    fixture.innerHTML = '<select id="target" size="1"></select>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('combobox');
  });

  it('should return combobox for "select"', function () {
    fixture.innerHTML = '<select id="target"></select>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('combobox');
  });

  it('should return cell for "td"', function () {
    fixture.innerHTML = '<table><td id="target"></td></table>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('cell');
  });

  it('should return gridcell for "td" with grid parent', function () {
    fixture.innerHTML = '<table role="grid"><td id="target"></td></table>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('gridcell');
  });

  it('should return gridcell for "td" with treegrid parent', function () {
    fixture.innerHTML = '<table role="treegrid"><td id="target"></td></table>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('gridcell');
  });

  it('should return rowheader for "th[scope=row]"', function () {
    fixture.innerHTML = '<table><th id="target" scope="row"></th></table>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('rowheader');
  });

  it('should return columnheader for "th[scope=col]"', function () {
    fixture.innerHTML = '<table><th id="target" scope="col"></th></table>';
    const node = fixture.querySelector('#target');
    flatTreeSetup(fixture);
    expect(implicitRole(node)).toBe('columnheader');
  });
});
