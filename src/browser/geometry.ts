// SPDX-License-Identifier: MPL-2.0
// Adapted from axe-core v4.13.0 rect-has-minimum-size.js and get-offset.js.
// Only unobscured, single-rectangle targets are supported here. See PROVENANCE.md.
export interface Rect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
}
export function minimumSize(rect: Rect, size = 24): boolean {
  return rect.width + 0.05 >= size && rect.height + 0.05 >= size;
}
export function offsetDiameter(target: Rect, neighbor: Rect): number {
  const x = (target.left + target.right) / 2;
  const y = (target.top + target.bottom) / 2;
  const edge = Math.hypot(
    x - Math.max(neighbor.left, Math.min(x, neighbor.right)),
    y - Math.max(neighbor.top, Math.min(y, neighbor.bottom)),
  );
  const distance = minimumSize(neighbor)
    ? edge
    : Math.max(
        0,
        Math.min(
          edge,
          Math.hypot(
            x - (neighbor.left + neighbor.right) / 2,
            y - (neighbor.top + neighbor.bottom) / 2,
          ) - 12,
        ),
      );
  return (Math.round(distance * 10) / 10) * 2;
}
