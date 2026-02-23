import { describe, it, expect } from 'vitest';
import { queryFixture } from '../../../testutils';

declare const axe: any;
describe('dom.getNodeGrid', () => {
  const getNodeGrid = axe.commons.dom.getNodeGrid;

  it('returns the grid of an vNode', () => {
    const vNode = queryFixture(`
      <section id="container" style="height: 2em; overflow: auto;">
        <p id="target" style="height: 2em;">  text  </p>
        <p id="sibling" style="height: 2em;">  text  </p>
      </section>
    `);
    const grid = getNodeGrid(vNode);
    expect(grid.container.props.id).toBe('container');
  });

  it('returns the grid of an elm', () => {
    const vNode = queryFixture(`
      <section id="container" style="height: 2em; overflow: auto;">
        <p id="target" style="height: 2em;">  text  </p>
        <p id="sibling" style="height: 2em;">  text  </p>
      </section>
    `);
    const grid = getNodeGrid(vNode.actualNode);
    expect(grid.container.props.id).toBe('container');
  });
});
