import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
const fixture = document.getElementById('fixture');

describe('axe.utils.isShadowRoot', () => {
  function createStyle(box) {
    const style = document.createElement('style');
    style.textContent =
      'div.breaking { color: Red;font-size: 20px; border: 1px dashed Purple; }' +
      (box ? 'slot { display: block; }' : '') +
      'div.other { padding: 2px 0 0 0; border: 1px solid Cyan; }';
    return style;
  }

  const isShadowRoot = axe.utils.isShadowRoot;

  it('returns false if the node has no shadowRoot', () => {
    expect(isShadowRoot({ nodeName: 'DIV', shadowRoot: undefined })).toBe(
      false
    );
  });
  it('returns true if the native element allows shadow DOM', () => {
    expect(isShadowRoot({ nodeName: 'DIV', shadowRoot: {} })).toBe(true);
    expect(isShadowRoot({ nodeName: 'H1', shadowRoot: {} })).toBe(true);
    expect(isShadowRoot({ nodeName: 'ASIDE', shadowRoot: {} })).toBe(true);
  });
  it('returns true if a custom element with shadowRoot', () => {
    expect(isShadowRoot({ nodeName: 'X-BUTTON', shadowRoot: {} })).toBe(true);
    expect(
      isShadowRoot({ nodeName: 'T1000-SCHWARZENEGGER', shadowRoot: {} })
    ).toBe(true);
  });
  it('returns true if an invalid custom element with shadowRoot', () => {
    expect(isShadowRoot({ nodeName: '0-BUZZ', shadowRoot: {} })).toBe(false);
    expect(isShadowRoot({ nodeName: '--ELM--', shadowRoot: {} })).toBe(false);
  });
  it('returns false if the native element does not allow shadow DOM', () => {
    expect(isShadowRoot({ nodeName: 'IFRAME', shadowRoot: {} })).toBe(false);
    expect(isShadowRoot({ nodeName: 'STRONG', shadowRoot: {} })).toBe(false);
  });

  describe('shadow DOM v1', () => {
    afterEach(() => {
      fixture.innerHTML = '';
    });
    beforeEach(() => {
      function createStoryGroup(className, slotName) {
        const group = document.createElement('div');
        group.className = className;
        // Empty string in slot name attribute or absence thereof work the same, so no need for special handling.
        group.innerHTML =
          '<ul><slot name="' +
          slotName +
          '">fallback content<li>one</li></slot></ul>';
        return group;
      }

      function makeShadowTree(storyList) {
        const root = storyList.attachShadow({ mode: 'open' });
        root.appendChild(createStyle());
        root.appendChild(createStoryGroup('breaking', 'breaking'));
        root.appendChild(createStoryGroup('other', ''));
      }
      let str =
        '<div class="stories"><li>1</li>' +
        '<li>2</li><li class="breaking" slot="breaking">3</li>' +
        '<li>4</li><li>5</li><li class="breaking" slot="breaking">6</li></div>';
      str +=
        '<div class="stories"><li>1</li>' +
        '<li>2</li><li class="breaking" slot="breaking">3</li>' +
        '<li>4</li><li>5</li><li class="breaking" slot="breaking">6</li></div>';
      str += '<div class="stories"></div>';
      fixture.innerHTML = str;

      fixture.querySelectorAll('.stories').forEach(makeShadowTree);
    });
    it('should support shadow DOM v1', () => {
      expect(fixture.firstChild.shadowRoot).toBeDefined();
    });
  });
});
