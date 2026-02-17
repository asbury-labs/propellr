import { describe, it, beforeAll, afterEach, expect } from 'vitest';

declare const axe: any;
describe('aria.getAccessibleRefs', function () {
  const fixture = document.getElementById('fixture');
  const getAccessibleRefs = axe.commons.aria.getAccessibleRefs;
  const shadowSupport = axe.testUtils.shadowSupport.v1;

  function setLookup(attrs) {
    axe.configure({
      standards: {
        ariaAttrs: attrs
      }
    });
  }

  beforeAll(function () {
    axe._load({});
  });

  afterEach(function () {
    fixture.innerHTML = '';
    axe.reset();
  });

  it('returns empty array by default', function () {
    fixture.innerHTML = '<div id="foo"><div>';
    const node = document.getElementById('foo');
    expect(getAccessibleRefs(node)).toHaveLength(0);
  });

  it('returns array of nodes for IDs used in aria IDREF attributes', function () {
    setLookup({ 'aria-foo': { type: 'idref' } });
    fixture.innerHTML = '<div id="ref" aria-foo="foo"></div><i id="foo"></i>';
    const node = document.getElementById('foo');
    const ref = document.getElementById('ref');
    expect(getAccessibleRefs(node)).toEqual([ref]);
  });

  it('returns array of nodes for IDs used in aria IDREFS attributes', function () {
    setLookup({ 'aria-bar': { type: 'idrefs' } });
    fixture.innerHTML =
      '<div id="ref" aria-bar="foo bar"></div><i id="foo"></i><b id="bar"></b>';

    const node1 = document.getElementById('foo');
    const node2 = document.getElementById('bar');
    const ref = document.getElementById('ref');
    expect(getAccessibleRefs(node1)).toEqual([ref]);
    expect(getAccessibleRefs(node2)).toEqual([ref]);
  });

  it('returns array of nodes for IDs used in label[for] attributes', function () {
    setLookup({ 'aria-foo': { type: 'idref' } });
    fixture.innerHTML = '<label id="ref" for="baz">baz</label><input id="baz">';
    const node = document.getElementById('baz');
    const ref = document.getElementById('ref');
    expect(getAccessibleRefs(node)).toEqual([ref]);
  });

  it('returns all nodes used in aria IDREF attributes', function () {
    setLookup({ 'aria-bar': { type: 'idrefs' } });
    fixture.innerHTML =
      '<div id="ref1" aria-bar="foo"><div id="ref2" aria-bar="foo"></div><i id="foo"></i>';

    const node = document.getElementById('foo');
    const ref1 = document.getElementById('ref1');
    const ref2 = document.getElementById('ref2');

    expect(getAccessibleRefs(node)).toEqual([ref1, ref2]);
  });

  it('does not break on a custom .children property', function () {
    setLookup({ 'aria-foo': { type: 'idref' } });
    fixture.innerHTML = '<div id="ref" aria-foo="foo"></div><i id="foo"></i>';
    const node = document.getElementById('foo');
    const ref = document.getElementById('ref');

    Object.defineProperty(node, 'children', {
      value: ['#ref']
    });
    expect(getAccessibleRefs(node)).toEqual([ref]);
  });

  describe('when JavaScript object names are used as IDs', function () {
    const ids = [
      'prototype',
      'constructor',
      '__proto__',
      'Element',
      'nodeName',
      'valueOf',
      'toString'
    ];
    for (const id of ids) {
      it(`does not break with id="${id}"`, function () {
        setLookup({ 'aria-bar': { type: 'idrefs' } });
        fixture.innerHTML = `<div id="ref" aria-bar="${ids.join(
          ' '
        )}"></div><i id="${id}"></i>`;

        const node = document.getElementById(id);
        const ref = document.getElementById('ref');
        expect(getAccessibleRefs(node)).toEqual(
          [ref],
          `Not equal for ID ${id}`
        );
      });
    }
  });

  (shadowSupport ? it : xit)('works inside shadow DOM', function () {
    setLookup({ 'aria-bar': { type: 'idref' } });
    fixture.innerHTML = '<div id="foo"></div>';

    const shadow = document
      .getElementById('foo')
      .attachShadow({ mode: 'open' });
    shadow.innerHTML = '<div id="ref" aria-bar="bar"></div><b id="bar"></b>';

    const node = shadow.getElementById('bar');
    const ref = shadow.getElementById('ref');
    expect(getAccessibleRefs(node)).toEqual([ref]);
  });

  (shadowSupport ? it : xit)(
    'returns empty array for IDREFs inside shadow DOM',
    function () {
      setLookup({ 'aria-foo': { type: 'idrefs' } });
      fixture.innerHTML = '<div id="foo"><div id="bar"></div></div>';
      const node1 = document.getElementById('foo');
      const node2 = document.getElementById('bar');

      const shadow = node1.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<div aria-foo="foo bar"><slot></slot></div>';

      expect(getAccessibleRefs(node1)).toHaveLength(0);
      expect(getAccessibleRefs(node2)).toHaveLength(0);
    }
  );

  (shadowSupport ? it : xit)(
    'returns empty array for IDREFs outside shadow DOM',
    function () {
      setLookup({ 'aria-bar': { type: 'idref' } });
      fixture.innerHTML =
        '<div id="foo" aria-bar="bar"><div aria-bar="bar"></div></div>';

      const shadow = document
        .getElementById('foo')
        .attachShadow({ mode: 'open' });
      shadow.innerHTML = '<div id="bar"><slot></slot></div>';

      const node = shadow.getElementById('bar');
      expect(getAccessibleRefs(node)).toHaveLength(0);
    }
  );

  (shadowSupport ? it : xit)('separates IDREFs by roots', function () {
    setLookup({ 'aria-bar': { type: 'idref' } });
    fixture.innerHTML =
      '<div id="foo"></div><div id="outside" aria-bar="foo"></div><div id="shadow"></div>';

    const shadow = document
      .getElementById('shadow')
      .attachShadow({ mode: 'open' });
    shadow.innerHTML = '<div id="foo"><div id="inside" aria-bar="foo"></div>';

    const outsideNode = document.getElementById('foo');
    const outsideRef = document.getElementById('outside');
    const insideNode = shadow.getElementById('foo');
    const insideRef = shadow.getElementById('inside');
    expect(getAccessibleRefs(outsideNode)).toEqual([outsideRef]);
    expect(getAccessibleRefs(insideNode)).toEqual([insideRef]);
  });
});
