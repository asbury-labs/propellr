import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.commons.color.parseTextShadows', () => {
  const { parseTextShadows } = axe.commons.color;

  it('should return an empty array if no text-shadow is provided', () => {
    const shadows = parseTextShadows(' \t\n');
    expect(shadows.length).toBe(0);
  });

  it('should return an array of objects with `pixels` and `colorStr` properties', () => {
    const shadows = parseTextShadows('1px 2px 3px #000, 4px 5px 6px #fff');
    expect(shadows.length).toBe(2);

    expect(shadows[0]).toEqual({
      pixels: [1, 2, 3],
      colorStr: '#000'
    });

    expect(shadows[1]).toEqual({
      pixels: [4, 5, 6],
      colorStr: '#fff'
    });
  });

  it('accepts color at the start of the shadow', () => {
    const shadows = parseTextShadows('#000 1px 2px 3px, #fff 4px 5px 6px');
    expect(shadows[0]).toEqual({
      pixels: [1, 2, 3],
      colorStr: '#000'
    });
    expect(shadows[1]).toEqual({
      pixels: [4, 5, 6],
      colorStr: '#fff'
    });
  });

  it('accepts named colors', () => {
    const shadows = parseTextShadows('red 1px 2px 3px, blue 4px 5px 6px');
    expect(shadows[0]).toEqual({
      pixels: [1, 2, 3],
      colorStr: 'red'
    });
    expect(shadows[1]).toEqual({
      pixels: [4, 5, 6],
      colorStr: 'blue'
    });
  });

  it('accepts different color functions', () => {
    const shadows = parseTextShadows(`
      rgb(0, 202, 148) 0px 0px,
      hsl(165.58deg 100% 35.07% / .5) 0px 0px,
      lch(65 49.19 167.45) 0px 0px,
      oklch(60% 0.57 181) 0px 0px,
      lab(65 -48.01 10.69) 0px 0px,
      color(xyz-d65 0.26 0.44 0.35 / 1) 0px 0px,
    `);
    expect(shadows[0].colorStr).toBe('rgb(0, 202, 148)');
    expect(shadows[1].colorStr).toBe('hsl(165.58deg 100% 35.07% / .5)');
    expect(shadows[2].colorStr).toBe('lch(65 49.19 167.45)');
    expect(shadows[3].colorStr).toBe('oklch(60% 0.57 181)');
    expect(shadows[4].colorStr).toBe('lab(65 -48.01 10.69)');
    expect(shadows[5].colorStr).toBe('color(xyz-d65 0.26 0.44 0.35 / 1)');
  });

  it('sets default blur to 0 when omitted', () => {
    const shadows = parseTextShadows('1px 2px #000, 4px 5px #fff');
    expect(shadows[0]).toEqual({
      pixels: [1, 2, 0],
      colorStr: '#000'
    });
    expect(shadows[1]).toEqual({
      pixels: [4, 5, 0],
      colorStr: '#fff'
    });
  });
});
