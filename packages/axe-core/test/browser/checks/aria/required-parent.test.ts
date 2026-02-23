import { describe, it, expect, afterEach } from 'vitest';
import {
  checkSetup,
  flatTreeSetup,
  getCheckEvaluate,
  MockCheckContext,
  shadowSupport
} from '../../../testutils';

declare const axe: any;
describe('aria-required-parent', function () {
  const fixture = document.getElementById('fixture')!;
  const shadowSupported = shadowSupport.v1;
  const checkContext = MockCheckContext();

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext.reset();
    axe._tree = undefined;
  });

  it('should detect missing required parent', function () {
    const params = checkSetup(
      '<div><p role="listitem" id="target">Nothing here.</p></div>'
    );
    expect(
      getCheckEvaluate('aria-required-parent').apply(checkContext, params)
    ).toBe(false);
    expect(checkContext._data).toEqual(['list']);
  });

  (shadowSupported ? it : xit)(
    'should detect missing required parent across shadow boundary',
    function () {
      fixture.innerHTML = '<div id="target"></div>';

      const shadowRoot = document
        .querySelector('#target')
        .attachShadow({ mode: 'open' });
      shadowRoot.innerHTML = '<p role="listitem" id="target">Nothing here.</p>';

      flatTreeSetup(fixture);
      const shadowContent = shadowRoot.querySelector('#target');
      const virtualTarget = axe.utils.getNodeFromTree(shadowContent);

      const params = [shadowContent, undefined, virtualTarget];
      expect(
        getCheckEvaluate('aria-required-parent').apply(checkContext, params)
      ).toBe(false);
      expect(checkContext._data).toEqual(['list']);
    }
  );

  it('should pass when required parent is present in an ancestral aria-owns context', function () {
    const snippet =
      '<div role="list"><div aria-owns="parent"></div></div>' +
      '<div id="parent"><p role="listitem" id="target">Nothing here.</p></div>';
    const params = checkSetup(snippet);
    expect(
      getCheckEvaluate('aria-required-parent').apply(checkContext, params)
    ).toBe(true);
  });

  it('should fail when wrong role is present in an aria-owns context', function () {
    const params = checkSetup(
      '<div role="menu"><div aria-owns="target"></div></div>' +
        '<div><p role="listitem" id="target">Nothing here.</p></div>'
    );
    expect(
      getCheckEvaluate('aria-required-parent').apply(checkContext, params)
    ).toBe(false);
    expect(checkContext._data).toEqual(['list']);
  });

  it('should pass when required parent is present in an aria-owns context', function () {
    const params = checkSetup(
      '<div role="list" aria-owns="target"></div><div><p role="listitem" id="target">Nothing here.</p></div>'
    );
    expect(
      getCheckEvaluate('aria-required-parent').apply(checkContext, params)
    ).toBe(true);
  });

  it('should pass when at least one required parent of multiple is present', function () {
    const params = checkSetup(
      '<div role="grid"><p role="row" id="target">Nothing here.</p></div>'
    );
    expect(
      getCheckEvaluate('aria-required-parent').apply(checkContext, params)
    ).toBe(true);
  });

  it('should pass when required parent is present', function () {
    const params = checkSetup(
      '<div role="list"><p role="listitem" id="target">Nothing here.</p></div>'
    );
    expect(
      getCheckEvaluate('aria-required-parent').apply(checkContext, params)
    ).toBe(true);
  });

  it('should fail when there is an intermediate role between the child and parent', function () {
    const params = checkSetup(
      '<div role="list"><div role="tabpanel"><p role="listitem" id="target">Nothing here.</p></div></div>'
    );
    expect(
      getCheckEvaluate('aria-required-parent').apply(checkContext, params)
    ).toBe(false);
  });

  it('should pass when intermediate node is role=presentation', function () {
    const params = checkSetup(
      '<div role="list"><div role="presentation"><p role="listitem" id="target">Nothing here.</p></div></div>'
    );
    expect(
      getCheckEvaluate('aria-required-parent').apply(checkContext, params)
    ).toBe(true);
  });

  it('should pass when intermediate node is role=group and required parent is present', function () {
    const params = checkSetup(
      '<ul role="menu"><li role="group"><button role="menuitem" id="target">Nothing here.</button></li></ul>'
    );
    expect(
      getCheckEvaluate('aria-required-parent').apply(checkContext, params)
    ).toBe(true);
  });

  it('should fail when intermediate node is role=group but required parent is missing', function () {
    const params = checkSetup(
      '<ul role="none"><li role="group"><button role="menuitem" id="target">Nothing here.</button></li></ul>'
    );
    expect(
      getCheckEvaluate('aria-required-parent').apply(checkContext, params)
    ).toBe(false);
    expect(checkContext._data).toEqual(['menu', 'menubar']);
  });

  it('should fail when intermediate node is role=group but this not an allowed context', function () {
    const params = checkSetup(
      '<div role="menu"><div role="group"><p role="listitem" id="target">Nothing here.</p></div></div>'
    );
    expect(
      getCheckEvaluate('aria-required-parent').apply(checkContext, params)
    ).toBe(false);
  });

  describe('group with ownGroupRoles', function () {
    it('should pass when the role and grand parent role is in ownGroupRoles', function () {
      const params = checkSetup(
        '<div role="tree">' +
          '<div role="treeitem">' +
          '<div role="group">' +
          '<div role="treeitem" id="target">' +
          '</div></div></div></div>',
        {
          ownGroupRoles: ['treeitem']
        }
      );

      expect(
        getCheckEvaluate('aria-required-parent').apply(checkContext, params)
      ).toBe(true);
    });

    it('should fail when the role and grand parent role is in ownGroupRoles', function () {
      const params = checkSetup(
        '<div role="menu">' +
          '<div role="menuitem">' +
          '<div role="group">' +
          '<div role="menuitem" id="target">' +
          '</div></div></div></div>',
        {
          ownGroupRoles: ['listitem']
        }
      );

      expect(
        getCheckEvaluate('aria-required-parent').apply(checkContext, params)
      ).toBe(false);
    });

    it('should fail when the role is not in a group', function () {
      const params = checkSetup(
        '<div role="list">' +
          '<div role="listitem">' +
          '<div role="none">' +
          '<div role="listitem" id="target">' +
          '</div></div></div></div>',
        {
          ownGroupRoles: ['listitem']
        }
      );

      expect(
        getCheckEvaluate('aria-required-parent').apply(checkContext, params)
      ).toBe(false);
    });
  });

  it('should pass when intermediate node is role=none', function () {
    const params = checkSetup(
      '<div role="list"><div role="none"><p role="listitem" id="target">Nothing here.</p></div></div>'
    );
    expect(
      getCheckEvaluate('aria-required-parent').apply(checkContext, params)
    ).toBe(true);
  });

  it('should pass when intermediate node is not owned by parent', function () {
    const params = checkSetup(
      '<div role="list" aria-owns="target"><div role="navigation"><p role="listitem" id="target">Nothing here.</p></div></div>'
    );
    expect(
      getCheckEvaluate('aria-required-parent').apply(checkContext, params)
    ).toBe(true);
  });

  it('should pass for multiple group and presentational roles', function () {
    const params = checkSetup(
      '<div role="tree"><div role="none"><div role="group"><div role="none"><div role="group"><div role="treeitem" id="target">Nothing here.</div></div></div></div></div></div>'
    );
    expect(
      getCheckEvaluate('aria-required-parent').apply(checkContext, params)
    ).toBe(true);
  });

  (shadowSupported ? it : xit)(
    'should pass when required parent is present across shadow boundary',
    function () {
      fixture.innerHTML = '<div role="list" id="parent"></div>';

      const shadowRoot = document
        .querySelector('#parent')
        .attachShadow({ mode: 'open' });
      shadowRoot.innerHTML = '<p role="listitem" id="target">Nothing here.</p>';

      flatTreeSetup(fixture);
      const shadowContent = shadowRoot.querySelector('#target');
      const virtualTarget = axe.utils.getNodeFromTree(shadowContent);

      const params = [shadowContent, undefined, virtualTarget];
      expect(
        getCheckEvaluate('aria-required-parent').apply(checkContext, params)
      ).toBe(true);
    }
  );

  (shadowSupported ? it : xit)(
    'should fail when aria-owns context crosses shadow boundary',
    function () {
      fixture.innerHTML =
        '<div id="parent"><div role="list" aria-owns="target"></div></div>';

      const shadowRoot = document
        .querySelector('#parent')
        .attachShadow({ mode: 'open' });
      shadowRoot.innerHTML = '<p role="listitem" id="target">Nothing here.</p>';

      flatTreeSetup(fixture);
      const shadowContent = shadowRoot.querySelector('#target');
      const virtualTarget = axe.utils.getNodeFromTree(shadowContent);

      const params = [shadowContent, undefined, virtualTarget];
      expect(
        getCheckEvaluate('aria-required-parent').apply(checkContext, params)
      ).toBe(false);
    }
  );
});
