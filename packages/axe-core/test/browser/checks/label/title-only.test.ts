import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('title-only', function () {
  const fixture = document.getElementById('fixture');

  afterEach(function () {
    fixture.innerHTML = '';
    axe._tree = undefined;
  });

  it('should return true if an element only has a title', function () {
    const node = document.createElement('input');
    node.type = 'text';
    node.title = 'Duplicate';

    fixture.appendChild(node);

    axe.testUtils.flatTreeSetup(fixture);

    expect(
      axe.testUtils.getCheckEvaluate('title-only')(
        node,
        undefined,
        axe.utils.getNodeFromTree(node)
      )
    ).toBe(true);
    node.setAttribute('aria-label', 'woop');
    expect(
      axe.testUtils.getCheckEvaluate('title-only')(
        node,
        undefined,
        axe.utils.getNodeFromTree(node)
      )
    ).toBe(false);
  });

  it('should return true if an element only has aria-describedby', function () {
    const node = document.createElement('input');
    node.type = 'text';
    node.setAttribute('aria-describedby', 'dby');
    const dby = document.createElement('div');
    dby.id = 'dby';
    dby.innerHTML = 'woop';

    fixture.appendChild(node);
    fixture.appendChild(dby);

    axe.testUtils.flatTreeSetup(fixture);

    expect(
      axe.testUtils.getCheckEvaluate('title-only')(
        node,
        undefined,
        axe.utils.getNodeFromTree(node)
      )
    ).toBe(true);
    node.setAttribute('aria-label', 'woop');
    expect(
      axe.testUtils.getCheckEvaluate('title-only')(
        node,
        undefined,
        axe.utils.getNodeFromTree(node)
      )
    ).toBe(false);
  });
});
