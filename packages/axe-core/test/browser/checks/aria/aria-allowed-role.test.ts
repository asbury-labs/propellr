import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('aria-allowed-role', function () {
  const queryFixture = axe.testUtils.queryFixture;
  const checkContext = axe.testUtils.MockCheckContext();

  afterEach(function () {
    checkContext.reset();
  });

  it('returns true if given element is an ignoredTag in options', function () {
    const vNode = queryFixture(
      '<article id="target" role="presentation"></article>'
    );
    const options = {
      ignoredTags: ['article']
    };
    const actual = axe.testUtils
      .getCheckEvaluate('aria-allowed-role')
      .call(checkContext, null, options, vNode);
    const expected = true;
    expect(actual).toBe(expected);
    expect(checkContext._data).toBeNull();
  });

  it('returns false with implicit role of row for TR when allowImplicit is set to false via options', function () {
    const vNode = queryFixture(
      '<table role="grid"><tr id="target" role="row"></tr></table>'
    );
    const options = {
      allowImplicit: false
    };
    const outcome = axe.testUtils
      .getCheckEvaluate('aria-allowed-role')
      .call(checkContext, null, options, vNode);

    expect(outcome).toBe(false);
    expect(checkContext._data).toEqual(['row']);
  });

  it('returns undefined (needs review) when element is hidden and has unallowed role', function () {
    const vNode = queryFixture(
      '<button id="target" type="button" aria-hidden="true"' +
        'role="presentation"></button>'
    );
    const actual = axe.testUtils
      .getCheckEvaluate('aria-allowed-role')
      .call(checkContext, null, null, vNode);
    expect(actual).toBeUndefined();
  });

  it('returns undefined (needs review) when element is with in hidden parent and has unallowed role', function () {
    const vNode = queryFixture(
      '<div style="display:none">' +
        '<button id="target" class="mm-tabstart" type="button"' +
        'role="presentation"></button>' +
        '</div>'
    );
    const actual = axe.testUtils
      .getCheckEvaluate('aria-allowed-role')
      .call(checkContext, null, null, vNode);
    expect(actual).toBeUndefined();
  });

  it('returns true when BUTTON has type menu and role as menuitem', function () {
    const vNode = queryFixture(
      '<button id="target" type="menu" role="menuitem"></button>'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('returns true when img has no alt and role="presentation"', function () {
    const vNode = queryFixture('<img id="target" role="presentation"/>');
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
    expect(checkContext._data).toEqual(null);
  });

  it('returns true when img has no alt and role="none"', function () {
    const vNode = queryFixture('<img id="target" role="none"/>');
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
    expect(checkContext._data).toEqual(null);
  });

  it('returns true when img has empty alt and role="presentation"', function () {
    const vNode = queryFixture('<img id="target" alt="" role="presentation"/>');
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
    expect(checkContext._data).toEqual(null);
  });

  it('returns true when img has empty alt and role="none"', function () {
    const vNode = queryFixture('<img id="target" alt="" role="none"/>');
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
    expect(checkContext._data).toEqual(null);
  });

  it('returns false when img has alt and role="presentation"', function () {
    const vNode = queryFixture(
      '<img id="target" alt="not empty" role="presentation"/>'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
    expect(checkContext._data).toEqual(['presentation']);
  });

  it('returns false when img has alt and role="none"', function () {
    const vNode = queryFixture(
      '<img id="target" alt="not empty" role="none"/>'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
    expect(checkContext._data).toEqual(['none']);
  });

  it('returns true when img has aria-label and a valid role, role="button"', function () {
    const vNode = queryFixture(
      '<img id="target" aria-label="foo" role="button"/>'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
    expect(checkContext._data).toBeNull();
  });

  it('returns false when img has aria-label and a invalid role, role="alert"', function () {
    const vNode = queryFixture(
      '<img id="target" aria-label="foo" role="alert"/>'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
    expect(checkContext._data).toEqual(['alert']);
  });

  it('returns true when img has aria-labelledby and a valid role, role="menuitem"', function () {
    const vNode = queryFixture(
      '<div id="foo">hello world</div>' +
        '<img id="target" aria-labelledby="foo" role="menuitem"/>'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
    expect(checkContext._data).toBeNull();
  });

  it('returns false when img has aria-labelledby and a invalid role, role="rowgroup"', function () {
    const vNode = queryFixture(
      '<div id="foo">hello world</div>' +
        '<img id="target" aria-labelledby="foo" role="rowgroup"/>'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
    expect(checkContext._data).toEqual(['rowgroup']);
  });

  it('returns true when img has title and a valid role, role="link"', function () {
    const vNode = queryFixture(
      '<div id="foo">hello world</div>' +
        '<img id="target" title="foo" role="link"/>'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
    expect(checkContext._data).toBeNull();
  });

  it('returns false when img has title and a invalid role, role="radiogroup"', function () {
    const vNode = queryFixture(
      '<div id="foo">hello world</div>' +
        '<img id="target" title="foo" role="radiogroup"/>'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
    expect(checkContext._data).toEqual(['radiogroup']);
  });

  it('returns true when input of type image and no role', function () {
    const vNode = queryFixture('<input id="target" type="image"/>');
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
    expect(checkContext._data).toBeNull();
  });

  it('returns true when INPUT type is checkbox and has aria-pressed attribute', function () {
    const vNode = queryFixture(
      '<input id="target" type="checkbox" aria-pressed="">'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('returns true when INPUT type is text with role combobox', function () {
    const vNode = queryFixture(
      '<input id="target" type="text" role="combobox">'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('returns true when INPUT type is tel with role combobox', function () {
    const vNode = queryFixture(
      '<input id="target" type="tel" role="combobox">'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('returns true when INPUT type is url with role combobox', function () {
    const vNode = queryFixture(
      '<input id="target" type="url" role="combobox">'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('returns true when INPUT type is search with role combobox', function () {
    const vNode = queryFixture(
      '<input id="target" type="search" role="combobox">'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('returns true when INPUT type is email with role combobox', function () {
    const vNode = queryFixture(
      '<input id="target" type="email" role="combobox">'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('returns true when INPUT type is text with role spinbutton', function () {
    const vNode = queryFixture(
      '<input id="target" type="text" role="spinbutton">'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('returns true when INPUT type is number with role spinbutton', function () {
    const vNode = queryFixture(
      '<input id="target" type="number" role="spinbutton">'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('returns true when INPUT type is tel with role spinbutton', function () {
    const vNode = queryFixture(
      '<input id="target" type="tel" role="spinbutton">'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('returns true when INPUT type is text with role searchbox', function () {
    const vNode = queryFixture(
      '<input id="target" type="text" role="searchbox">'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('returns false when a role is set on an element that does not allow any role', function () {
    const vNode = queryFixture('<dd id="target" role="link">');
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
    expect(checkContext._data).toEqual(['link']);
  });

  it('returns true when a role is set on an element that can have any role', function () {
    const vNode = queryFixture('<div id="target" role="link"></dd>');
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('returns true an <a> without a href to have any role', function () {
    const vNode = queryFixture('<a id="target" role="presentation"></a>');
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('returns true <a> with a empty href to have any valid role', function () {
    const vNode = queryFixture('<a id="target" role="link" href=""></a>');
    const actual = axe.testUtils
      .getCheckEvaluate('aria-allowed-role')
      .call(checkContext, null, null, vNode);
    expect(actual).toBe(true);
  });

  it('returns true <img> with a non-empty alt', function () {
    const vNode = queryFixture(
      '<img id="target" role="button" alt="some text">'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should allow <select> without a multiple and size attribute to have a menu role', function () {
    const vNode = queryFixture('<select id="target" role="menu">');
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
    expect(checkContext._data).toBeNull();
  });

  it('returns true custom element <my-navbar> with a role of navigation', function () {
    const vNode = queryFixture('<my-navbar id="target" role="navigation">');
    const actual = axe.testUtils
      .getCheckEvaluate('aria-allowed-role')
      .call(checkContext, null, null, vNode);
    expect(actual).toBe(true);
    expect(checkContext._data).toBeNull();
  });

  it('returns false if a dpub role’s type is not the element’s implicit role', function () {
    const vNode = queryFixture('<article id="target" role="doc-biblioref">');
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('returns true if a dpub role’s type is the element’s implicit role', function () {
    const vNode = queryFixture(
      '<a id="target" href="foo" role="doc-biblioref">'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('aria-allowed-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });
});
