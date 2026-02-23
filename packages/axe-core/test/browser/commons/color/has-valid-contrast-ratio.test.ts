import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('color.Color', function () {
  it('should give sensible results for WCAG compliance', function () {
    const black = new axe.commons.color.Color(0, 0, 0, 1);
    const white = new axe.commons.color.Color(255, 255, 255, 1);
    const gray = new axe.commons.color.Color(128, 128, 128, 1);

    expect(
      axe.commons.color.hasValidContrastRatio(black, white, 8, false).isValid
    ).toBe(true);
    expect(
      axe.commons.color.hasValidContrastRatio(black, white, 8, false)
        .contrastRatio > 4.5
    ).toBe(true);
    expect(
      axe.commons.color.hasValidContrastRatio(black, white, 8, false)
        .expectedContrastRatio === 4.5
    ).toBe(true);

    expect(
      axe.commons.color.hasValidContrastRatio(white, gray, 24, false).isValid
    ).toBe(true);
    expect(
      axe.commons.color.hasValidContrastRatio(white, gray, 24, false)
        .contrastRatio > 3
    ).toBe(true);
    expect(
      axe.commons.color.hasValidContrastRatio(white, gray, 24, false)
        .expectedContrastRatio === 3
    ).toBe(true);

    expect(
      axe.commons.color.hasValidContrastRatio(white, gray, 20, true).isValid
    ).toBe(true);
    expect(
      axe.commons.color.hasValidContrastRatio(white, gray, 20, true)
        .contrastRatio > 3
    ).toBe(true);
    expect(
      axe.commons.color.hasValidContrastRatio(white, gray, 20, true)
        .expectedContrastRatio === 3
    ).toBe(true);

    expect(
      axe.commons.color.hasValidContrastRatio(white, gray, 8, false).isValid
    ).toBe(false);
    expect(
      axe.commons.color.hasValidContrastRatio(white, gray, 8, false)
        .contrastRatio < 4.5
    ).toBe(true);
    expect(
      axe.commons.color.hasValidContrastRatio(white, gray, 8, false)
        .expectedContrastRatio === 4.5
    ).toBe(true);
  });

  it('should count 1-1 ratios as visually hidden', function () {
    const black = new axe.commons.color.Color(0, 0, 0, 1);

    expect(
      axe.commons.color.hasValidContrastRatio(black, black, 16, true).isValid
    ).toBe(false);
    expect(
      axe.commons.color.hasValidContrastRatio(black, black, 16, true)
        .contrastRatio === 1
    ).toBe(true);
    expect(
      axe.commons.color.hasValidContrastRatio(black, black, 16, true)
        .expectedContrastRatio === 4.5
    ).toBe(true);
  });
});
