import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.getNodeAttributes', () => {
  it('should return the list of attributes', () => {
    let node = document.createElement('div');
    node.setAttribute('class', 'foo bar');
    let actual = axe.utils.getNodeAttributes(node);
    expect(actual instanceof window.NamedNodeMap).toBe(true);
    expect(actual.length).toBe(1);
    expect(actual[0].name).toBe('class');
  });

  it('should return the list of attributes when the DOM is clobbered', () => {
    let node = document.createElement('form');
    node.setAttribute('id', '123');
    node.innerHTML = '<select name="attributes"></select>';

    // eslint-disable-next-line no-restricted-syntax
    expect(node.attributes instanceof window.NamedNodeMap).toBe(false);

    let actual = axe.utils.getNodeAttributes(node);
    expect(actual instanceof window.NamedNodeMap).toBe(true);
    expect(actual.length).toBe(1);
    expect(actual[0].name).toBe('id');
  });
});
