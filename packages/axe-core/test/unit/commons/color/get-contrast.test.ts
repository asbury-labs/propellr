import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('color.getContrast', function () {
  it('should calculate contrast sensibly', function () {
    const black = new axe.commons.color.Color(0, 0, 0, 1);
    const transparent = new axe.commons.color.Color(0, 0, 0, 0);
    const white = new axe.commons.color.Color(255, 255, 255, 1);
    const yellow = new axe.commons.color.Color(255, 255, 0, 1);

    //Same foreground/background gives 1
    expect(axe.commons.color.getContrast(black, black)).toBe(1);
    expect(axe.commons.color.getContrast(transparent, black)).toBe(1);
    expect(axe.commons.color.getContrast(white, white)).toBe(1);
    expect(axe.commons.color.getContrast(yellow, yellow)).toBe(1);

    //contrast ratio is reversible
    expect(axe.commons.color.getContrast(yellow, black)).toBe(
      axe.commons.color.getContrast(black, yellow)
    );
    expect(axe.commons.color.getContrast(yellow, white)).toBe(
      axe.commons.color.getContrast(white, yellow)
    );

    //things that are more contrasty return higher values than things that are less contrasty
    expect(
      axe.commons.color.getContrast(yellow, white) <
        axe.commons.color.getContrast(yellow, black)
    ).toBe(true);
    expect(
      axe.commons.color.getContrast(yellow, black) <
        axe.commons.color.getContrast(white, black)
    ).toBe(true);
  });
});
