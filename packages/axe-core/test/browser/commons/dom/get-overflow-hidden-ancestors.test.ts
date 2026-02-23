import { describe, it, expect } from 'vitest';
import { queryFixture } from '../../../testutils';

declare const axe: any;
describe('dom.getOverflowHiddenAncestors', () => {
  const { getOverflowHiddenAncestors } = axe.commons.dom;

  function ids(vNodes) {
    return vNodes.map(vNode => vNode.props.id);
  }

  it('returns parent node', () => {
    const vNode = queryFixture(`
      <div style="overflow: hidden">
        <div id="target"></div>
      </div>
    `);

    const actual = getOverflowHiddenAncestors(vNode);
    expect(actual).toEqual([vNode.parent]);
  });

  it('returns ancestor node', () => {
    const vNode = queryFixture(`
      <div style="overflow: hidden">
        <div>
          <div id="target"></div>
        </div>
      </div>
    `);

    const actual = getOverflowHiddenAncestors(vNode);
    expect(actual).toEqual([vNode.parent.parent]);
  });

  it('returns itself', () => {
    const vNode = queryFixture(
      `<div id="target" style="overflow: hidden"></div>`
    );

    const actual = getOverflowHiddenAncestors(vNode);
    expect(actual).toEqual([vNode]);
  });

  it('returns all nodes with overflow:hidden', () => {
    const vNode = queryFixture(`
      <div id="1" style="overflow: hidden">
        <div>
          <div>
            <div id="2" style="overflow: hidden">
              <div id="target" style="overflow: hidden"></div>
            </div>
          </div>
        </div>
      </div>
    `);
    const actual = getOverflowHiddenAncestors(vNode);
    expect(ids(actual)).toEqual(['target', '2', '1']);
  });

  it('ignores other overflow types', () => {
    const vNode = queryFixture(`
      <div id="1" style="overflow: visible">
        <div>
          <div>
            <div id="2" style="overflow: hidden">
              <div id="target" style="overflow: auto"></div>
            </div>
          </div>
        </div>
      </div>
    `);
    const actual = getOverflowHiddenAncestors(vNode);
    expect(ids(actual)).toEqual(['2']);
  });
});
