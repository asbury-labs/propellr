import { describe, it, expect } from 'vitest';
import { fixtureSetup } from '../../../testutils';

declare const axe: any;
describe('hasVisualOverlap', function () {
  const hasVisualOverlap = axe.commons.math.hasVisualOverlap;

  it('returns false if there is no overlap', function () {
    const rootNode = fixtureSetup('<a>foo</a><b>bar</b>');
    const vNodeA = rootNode.children[0];
    const vNodeB = rootNode.children[1];
    expect(hasVisualOverlap(vNodeA, vNodeB)).toBe(false);
  });

  it('returns true if B overlaps A', function () {
    const rootNode = fixtureSetup('<a><b>bar</b></a>');
    const vNodeA = rootNode.children[0];
    const vNodeB = vNodeA.children[0];
    expect(hasVisualOverlap(vNodeA, vNodeB)).toBe(true);
  });

  it('returns true A overlaps B', function () {
    const rootNode = fixtureSetup('<b><a>bar</a></b>');
    const vNodeB = rootNode.children[0];
    const vNodeA = vNodeB.children[0];
    expect(hasVisualOverlap(vNodeA, vNodeB)).toBe(false);
  });
});
