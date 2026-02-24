import { describe, it, expect } from 'vitest';
import { fixtureSetup } from '../../../testutils';

declare const axe: any;
describe('dom.findElmsInContext', function () {
  const findElmsInContext = axe.commons.dom.findElmsInContext;

  it('returns an array or elements in the same context', function () {
    const rootNode = fixtureSetup(
      '<b name="foo">1</b>' +
        '<b name="foo">2</b>' +
        '<b name="bar">3</b>' +
        '<i name="foo">4</i>'
    );

    expect(
      findElmsInContext({
        elm: 'b',
        attr: 'name',
        value: 'foo',
        context: rootNode.actualNode
      })
    ).toEqual(Array.from(document.querySelectorAll('b[name=foo]')));
  });

  it(
    'ignores elements inside shadow tree',
    function () {
      const node = document.createElement('div');
      node.innerHTML = '<b name="foo">1</b>';
      const shadow = node.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<b name="foo">2</b> <slot></slot>';
      const rootNode = fixtureSetup(node);

      const result = findElmsInContext({
        elm: 'b',
        attr: 'name',
        value: 'foo',
        context: rootNode.actualNode
      });
      expect(result).toHaveLength(1);
      expect(result[0].innerText).toBe('1');
    }
  );

  it(
    'can search elements limited to the shadow tree',
    function () {
      const node = document.createElement('div');
      node.innerHTML = '<b name="foo">1</b>';
      const shadow = node.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<b name="foo">2</b><slot></slot>';
      fixtureSetup(node);

      const result = findElmsInContext({
        elm: 'b',
        attr: 'name',
        value: 'foo',
        context: shadow
      });

      expect(result).toHaveLength(1);
      expect(result[0].innerText).toBe('2');
    }
  );
});
