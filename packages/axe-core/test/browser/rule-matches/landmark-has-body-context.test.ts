import { describe, it, expect, beforeEach } from 'vitest';
import { fixtureSetup } from '../../testutils';

declare const axe: any;
describe('landmark-has-body-context', function () {
  let rule;

  beforeEach(function () {
    rule = axe.utils.getRule('landmark-banner-is-top-level');
  });

  it('returns true for elements with a role', function () {
    fixtureSetup('<main><footer role="contentinfo"></footer></main>');

    const vNode = axe.utils.querySelectorAll(axe._tree[0], 'footer')[0];
    expect(rule.matches(vNode.actualNode, vNode)).toBe(true);
  });

  it('returns true for elements not contained in a landmark', function () {
    fixtureSetup('<div><footer role="contentinfo"></footer></div>');

    const vNode = axe.utils.querySelectorAll(axe._tree[0], 'footer')[0];
    expect(rule.matches(vNode.actualNode, vNode)).toBe(true);
  });

  it('returns false for elements contained in a landmark', function () {
    fixtureSetup('<main><footer></footer></main>');

    const vNode = axe.utils.querySelectorAll(axe._tree[0], 'footer')[0];
    expect(rule.matches(vNode.actualNode, vNode)).toBe(false);
  });

  it('returns false for elements contained in a landmark in a shadow DOM tree', function () {
    // Safari has a bug in 12.0 that throws an error when calling
    // attachShadow on <main>
    // @see https://bugs.webkit.org/show_bug.cgi?id=197726
    const article = document.createElement('article');
    const shadow = article.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<footer></footer>';

    fixtureSetup(article);
    const vNode = axe.utils.querySelectorAll(axe._tree[0], 'footer')[0];
    expect(rule.matches(vNode.actualNode, vNode)).toBe(false);
  });
});
