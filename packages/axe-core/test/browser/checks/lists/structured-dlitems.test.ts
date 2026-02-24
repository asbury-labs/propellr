import { describe, it, expect, afterEach } from 'vitest';
import { checkSetup, getCheckEvaluate } from '../../../testutils';

describe('structured-dlitems', function () {
  const fixture = document.getElementById('fixture')!;

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should return false if the list has no contents', function () {
    const checkArgs = checkSetup('<dl id="target"></dl>');
    expect(getCheckEvaluate('structured-dlitems').apply(null, checkArgs)).toBe(
      false
    );
  });

  it('should return true if the list has only a dd', function () {
    const checkArgs = checkSetup('<dl id="target"><dd>A list</dd></dl>');
    expect(getCheckEvaluate('structured-dlitems').apply(null, checkArgs)).toBe(
      true
    );
  });

  it('should return true if the list has only a dt', function () {
    const checkArgs = checkSetup('<dl id="target"><dt>A list</dt></dl>');

    expect(getCheckEvaluate('structured-dlitems').apply(null, checkArgs)).toBe(
      true
    );
  });

  it('should return true if the list has dt and dd in the incorrect order', function () {
    const checkArgs = checkSetup(
      '<dl id="target"><dd>A list</dd><dt>An item</dt></dl>'
    );

    expect(getCheckEvaluate('structured-dlitems').apply(null, checkArgs)).toBe(
      true
    );
  });

  it('should return true if the list has dt and dd in the correct order as non-child descendants', function () {
    const checkArgs = checkSetup(
      '<dl id="target"><dd><dl><dt>An item</dt><dd>A list</dd></dl></dd></dl>'
    );

    expect(getCheckEvaluate('structured-dlitems').apply(null, checkArgs)).toBe(
      true
    );
  });

  it('should return false if the list has dt and dd in the correct order', function () {
    const checkArgs = checkSetup(
      '<dl id="target"><dt>An item</dt><dd>A list</dd></dl>'
    );

    expect(getCheckEvaluate('structured-dlitems').apply(null, checkArgs)).toBe(
      false
    );
  });

  it('should return false if the list has a correctly-ordered dt and dd with other content', function () {
    const checkArgs = checkSetup(
      '<dl id="target"><dt>Stuff</dt><dt>Item one</dt><dd>Description</dd><p>Not a list</p></dl>'
    );

    expect(getCheckEvaluate('structured-dlitems').apply(null, checkArgs)).toBe(
      false
    );
  });

  it(
    'should return false in a shadow DOM pass',
    function () {
      const node = document.createElement('div');
      node.innerHTML = '<dt>Grayhound bus</dt><dd>at dawn</dd>';
      const shadow = node.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<dl><slot></slot></dl>';

      const checkArgs = checkSetup(node, 'dl');
      expect(
        getCheckEvaluate('structured-dlitems').apply(null, checkArgs)
      ).toBe(false);
    }
  );

  it(
    'should return true in a shadow DOM fail',
    function () {
      const node = document.createElement('div');
      node.innerHTML = '<dd>Galileo</dd><dt>Figaro</dt>';
      const shadow = node.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<dl><slot></slot></dl>';

      const checkArgs = checkSetup(node, 'dl');
      expect(
        getCheckEvaluate('structured-dlitems').apply(null, checkArgs)
      ).toBe(true);
    }
  );
});
