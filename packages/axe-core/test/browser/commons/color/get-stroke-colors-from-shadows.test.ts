import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.commons.color.getStrokeColorsFromShadow', () => {
  const { getStrokeColorsFromShadows, parseTextShadows } = axe.commons.color;

  it('should return an empty array if no shadows are passed', () => {
    const colors = getStrokeColorsFromShadows([]);
    expect(colors).toEqual([]);
  });

  it('combines multiple shadows without blur into a single stroke', () => {
    const shadows = parseTextShadows(`
      0 -2px #F00,
      2px 0 #F00, 
      0 2px #F00,
      -2px 0 #F00
    `);
    const shadowColors = getStrokeColorsFromShadows(shadows);
    expect(shadowColors).toHaveLength(1);
    expect(shadowColors[0].toJSON()).toEqual({
      red: 255,
      green: 0,
      blue: 0,
      alpha: 1
    });
  });

  it('returns empty when only one side is covered by the shadow', () => {
    const shadows = parseTextShadows(`0 1px #000`);
    const shadowColors = getStrokeColorsFromShadows(shadows);
    expect(shadowColors).toHaveLength(0);
  });

  it('returns null when two sides is covered by the shadow', () => {
    const shadows = parseTextShadows(`1px 0 #000, 0 1px #000`);
    const shadowColors = getStrokeColorsFromShadows(shadows);
    expect(shadowColors).toBeNull();
  });

  it('returns null when three sides is covered by the shadow', () => {
    const shadows = parseTextShadows(`1px 0 #000, 0 1px #000, -1px 0 #000`);
    const shadowColors = getStrokeColorsFromShadows(shadows);
    expect(shadowColors).toBeNull();
  });

  it('skips shadows offset with 0.5px or less', () => {
    const shadows = parseTextShadows(`
      .5px 0 #000,
      0 .4px #000,
      -0.3px 0 #000,
      0 -0.2px #000
    `);
    const shadowColors = getStrokeColorsFromShadows(shadows);
    expect(shadowColors).toHaveLength(0);
  });

  it('applies an alpha value to shadows of 1.5px or less', () => {
    const shadows = parseTextShadows(`
      0 -1.5px #000,
      1.4px 0 #000,
      0 1.3px #000,
      -1.2px 0 #000
    `);
    const shadowColors = getStrokeColorsFromShadows(shadows);
    expect(shadowColors).toHaveLength(1);
    expect(shadowColors[0].red).toBe(0);
    expect(shadowColors[0].green).toBe(0);
    expect(shadowColors[0].blue).toBe(0);
    expect(shadowColors[0].alpha).toBeCloseTo(0.46, 0.01);
  });

  it('applies an alpha value if not all shadows are offset by more than 1.5px', () => {
    const shadows = parseTextShadows(`
      0 -2px #000,
      2px 0 #000,
      0 1.5px #000,
      -1.5px 0 #000
    `);
    const shadowColors = getStrokeColorsFromShadows(shadows);
    expect(shadowColors).toHaveLength(1);
    expect(shadowColors[0].red).toBe(0);
    expect(shadowColors[0].green).toBe(0);
    expect(shadowColors[0].blue).toBe(0);
    expect(shadowColors[0].alpha).toBeCloseTo(0.46, 0.01);
  });

  it('multiplies alpha value for each shadow', () => {
    const shadows = parseTextShadows(`
      0 -1px #000,
      0 -1px #000,
      1px 0 #000,
      1px 0 #000,
      0 1px #000,
      0 1px #000,
      -1px 0 #000,
      -1px 0 #000
    `);
    const shadowColors = getStrokeColorsFromShadows(shadows);
    expect(shadowColors).toHaveLength(1);
    expect(shadowColors[0].red).toBe(0);
    expect(shadowColors[0].green).toBe(0);
    expect(shadowColors[0].blue).toBe(0);
    expect(shadowColors[0].alpha).toBeCloseTo(0.7, 0.01);
  });

  it('double-counts shadows on corners', () => {
    // Corner-shadows overlap on the sides of letters, increasing alpha
    const shadows = parseTextShadows(`
      -1px -1px #000,
      1px -1px #000,
      1px 1px #000,
      -1px 1px #000
    `);
    const shadowColors = getStrokeColorsFromShadows(shadows);
    expect(shadowColors).toHaveLength(1);
    expect(shadowColors[0].red).toBe(0);
    expect(shadowColors[0].green).toBe(0);
    expect(shadowColors[0].blue).toBe(0);
    expect(shadowColors[0].alpha).toBeCloseTo(0.7, 0.01);
  });

  it('applies an alpha value if not all sides are offset by more than 1.5px', () => {
    const shadows = parseTextShadows(`
      -1.5px -2px #000,
      2px 1.5px #000
    `);
    const shadowColors = getStrokeColorsFromShadows(shadows);
    expect(shadowColors).toHaveLength(1);
    expect(shadowColors[0].red).toBe(0);
    expect(shadowColors[0].green).toBe(0);
    expect(shadowColors[0].blue).toBe(0);
    expect(shadowColors[0].alpha).toBeCloseTo(0.46, 0.01);
  });

  describe('options.ignoreEdgeCount: true', () => {
    it('returns empty when two sides is covered by the shadow', () => {
      const shadows = parseTextShadows(`1px 0 #000, 0 1px #000`);
      const shadowColors = getStrokeColorsFromShadows(shadows, {
        ignoreEdgeCount: true
      });
      expect(shadowColors).toEqual([]);
    });

    it('returns empty when three sides is covered by the shadow', () => {
      const shadows = parseTextShadows(`1px 0 #000, 0 1px #000, -1px 0 #000`);
      const shadowColors = getStrokeColorsFromShadows(shadows, {
        ignoreEdgeCount: true
      });
      expect(shadowColors).toEqual([]);
    });
  });
});
