import { describe, it, expect } from 'vitest';
import { queryFixture } from '../../../testutils';

declare const axe: any;
describe('aria.arialabelledbyText', function () {
  const aria = axe.commons.aria;

  it('returns the accessible name of the aria-labelledby references', function () {
    const target = queryFixture(
      '<div role="heading" id="target" aria-labelledby="foo"></div>' +
        '<div id="foo">Foo text</div>'
    );
    const accName = aria.arialabelledbyText(target);
    expect(accName).toBe('Foo text');
  });

  it('works with virtual nodes', function () {
    const target = queryFixture(
      '<div role="heading" id="target" aria-labelledby="foo"></div>' +
        '<div id="foo">Foo text</div>'
    );
    const accName = aria.arialabelledbyText(target);
    expect(accName).toBe('Foo text');
  });

  it('returns references in order', function () {
    const target = queryFixture(
      '<div role="heading" id="target" aria-labelledby="bar baz foo"></div>' +
        '<div id="foo">Foo</div>' +
        '<div id="bar">Bar</div>' +
        '<div id="baz">Baz</div>'
    );
    const accName = aria.arialabelledbyText(target);
    expect(accName).toBe('Bar Baz Foo');
  });

  it('returns "" if the node is not an element', function () {
    const target = queryFixture('<div id="target">foo</div>');
    const accName = aria.arialabelledbyText(target.actualNode.firstChild);
    expect(accName).toBe('');
  });

  it('returns "" with context.inLabelledByContext: true', function () {
    const target = queryFixture(
      '<div role="heading" id="target" aria-labelledby="foo"></div>' +
        '<div id="foo">Foo text</div>'
    );
    const accName = aria.arialabelledbyText(target, {
      inLabelledByContext: true
    });
    expect(accName).toBe('');
  });

  it('returns "" with context.inControlContext: true', function () {
    const target = queryFixture(
      '<div role="heading" id="target" aria-labelledby="foo"></div>' +
        '<div id="foo">Foo text</div>'
    );
    const accName = aria.arialabelledbyText(target, {
      inControlContext: true
    });
    expect(accName).toBe('');
  });

  it('returns content of a aria-hidden reference', function () {
    const target = queryFixture(
      '<div role="heading" id="target" aria-labelledby="foo"></div>' +
        '<div id="foo" aria-hidden="true">Foo text</div>'
    );
    const accName = aria.arialabelledbyText(target);
    expect(accName).toBe('Foo text');
  });

  it('returns content of a `display:none` reference', function () {
    const target = queryFixture(
      '<div role="heading" id="target" aria-labelledby="foo"></div>' +
        '<div id="foo" style="display:none">Foo text</div>'
    );
    const accName = aria.arialabelledbyText(target);
    expect(accName).toBe('Foo text');
  });

  it('returns does not return hidden content of a visible reference', function () {
    const target = queryFixture(
      '<div role="heading" id="target" aria-labelledby="foo"></div>' +
        '<div id="foo"><div style="display:none">Foo text</div></div>'
    );
    const accName = aria.arialabelledbyText(target);
    expect(accName).toBe('');
  });

  it('does not follow more than one aria-labelledy reference', function () {
    const target = queryFixture(
      '<div role="heading" id="target" aria-labelledby="foo"></div>' +
        '<div id="foo"><div aria-labelledby="bar" role="heading"></div></div>' +
        '<div id="bar">Foo text</div>'
    );
    const accName = aria.arialabelledbyText(target, {
      inControlContext: true
    });
    expect(accName).toBe('');
  });

  it('preserves spacing', function () {
    const target = queryFixture(
      '<div role="heading" id="target" aria-labelledby="foo"></div>' +
        '<div id="foo"> \t Foo \n text \t </div>'
    );
    const accName = aria.arialabelledbyText(target);
    expect(accName).toBe(' \t Foo \n text \t ');
  });
});
