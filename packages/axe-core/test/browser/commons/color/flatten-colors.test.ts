import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('color.flattenColors', function () {
  const { Color, flattenColors } = axe.commons.color;

  it('should flatten colors properly', function () {
    const halfBlack = new Color(0, 0, 0, 0.5);
    const fullBlack = new Color(0, 0, 0, 1);
    const transparent = new Color(0, 0, 0, 0);
    const white = new Color(255, 255, 255, 1);
    const gray = new Color(128, 128, 128, 1);
    const halfRed = new Color(255, 0, 0, 0.5);
    const quarterLightGreen = new Color(0, 128, 0, 0.25);

    const flat = flattenColors(halfBlack, white);
    expect(flat.red).toBe(gray.red);
    expect(flat.green).toBe(gray.green);
    expect(flat.blue).toBe(gray.blue);

    const flat2 = flattenColors(fullBlack, white);
    expect(flat2.red).toBe(fullBlack.red);
    expect(flat2.green).toBe(fullBlack.green);
    expect(flat2.blue).toBe(fullBlack.blue);

    const flat3 = flattenColors(transparent, white);
    expect(flat3.red).toBe(white.red);
    expect(flat3.green).toBe(white.green);
    expect(flat3.blue).toBe(white.blue);

    const flat4 = flattenColors(halfRed, white);
    expect(flat4.red).toBe(255);
    expect(flat4.green).toBe(128);
    expect(flat4.blue).toBe(128);
    expect(flat4.alpha).toBe(1);

    const flat5 = flattenColors(quarterLightGreen, white);
    expect(flat5.red).toBe(191);
    expect(flat5.green).toBe(223);
    expect(flat5.blue).toBe(191);
    expect(flat5.alpha).toBe(1);

    const flat6 = flattenColors(quarterLightGreen, halfRed);
    expect(flat6.red).toBe(153);
    expect(flat6.green).toBe(51);
    expect(flat6.blue).toBe(0);
    expect(flat6.alpha).toBe(0.625);
  });

  it('handles two colors with alpha:0', () => {
    const transparent1 = new Color(0, 0, 0, 0);
    const transparent2 = new Color(255, 255, 255, 0);
    const transparent3 = flattenColors(transparent1, transparent2);
    expect(transparent3.toJSON()).toEqual({
      red: 0,
      green: 0,
      blue: 0,
      alpha: 0
    });
  });
});

describe('color.flattenColors ', function () {
  const colourOne = new axe.commons.color.Color(216, 22, 22, 1);
  const colourTwo = new axe.commons.color.Color(114, 129, 114, 0.25);

  const colourThree = new axe.commons.color.Color(211, 162, 180, 1);
  const colourFour = new axe.commons.color.Color(115, 255, 0, 0.5);

  it('should flatten colors correctly using blend mode: multiply', function () {
    const flatten = axe.commons.color.flattenColors(
      colourTwo,
      colourOne,
      'multiply'
    );
    expect(flatten.red).toBe(186);
    expect(flatten.green).toBe(19);
    expect(flatten.blue).toBe(19);
    expect(flatten.alpha).toBe(1);

    const flattenTwo = axe.commons.color.flattenColors(
      colourFour,
      colourThree,
      'multiply'
    );
    expect(flattenTwo.red).toBe(153);
    expect(flattenTwo.green).toBe(162);
    expect(flattenTwo.blue).toBe(90);
    expect(flattenTwo.alpha).toBe(1);
  });

  it('should flatten colors correctly using blend mode: screen', function () {
    const flatten = axe.commons.color.flattenColors(
      colourTwo,
      colourOne,
      'screen'
    );
    expect(flatten.red).toBe(220);
    expect(flatten.green).toBe(51);
    expect(flatten.blue).toBe(48);
    expect(flatten.alpha).toBe(1);

    const flattenTwo = axe.commons.color.flattenColors(
      colourFour,
      colourThree,
      'screen'
    );
    expect(flattenTwo.red).toBe(221);
    expect(flattenTwo.green).toBe(209);
    expect(flattenTwo.blue).toBe(180);
    expect(flattenTwo.alpha).toBe(1);
  });

  it('should flatten colors correctly using blend mode: overlay', function () {
    const flatten = axe.commons.color.flattenColors(
      colourTwo,
      colourOne,
      'overlay'
    );
    expect(flatten.red).toBe(215);
    expect(flatten.green).toBe(22);
    expect(flatten.blue).toBe(21);
    expect(flatten.alpha).toBe(1);
  });

  it('should flatten colors correctly using blend mode: darken', function () {
    const flatten = axe.commons.color.flattenColors(
      colourTwo,
      colourOne,
      'darken'
    );
    expect(flatten.red).toBe(191);
    expect(flatten.green).toBe(22);
    expect(flatten.blue).toBe(22);
    expect(flatten.alpha).toBe(1);

    const flattenTwo = axe.commons.color.flattenColors(
      colourFour,
      colourThree,
      'darken'
    );
    expect(flattenTwo.red).toBe(163);
    expect(flattenTwo.green).toBe(162);
    expect(flattenTwo.blue).toBe(90);
    expect(flattenTwo.alpha).toBe(1);
  });

  it('should flatten colors correctly using blend mode: lighten', function () {
    const flatten = axe.commons.color.flattenColors(
      colourTwo,
      colourOne,
      'lighten'
    );
    expect(flatten.red).toBe(216);
    expect(flatten.green).toBe(49);
    expect(flatten.blue).toBe(45);
    expect(flatten.alpha).toBe(1);

    const flattenTwo = axe.commons.color.flattenColors(
      colourFour,
      colourThree,
      'lighten'
    );
    expect(flattenTwo.red).toBe(211);
    expect(flattenTwo.green).toBe(209);
    expect(flattenTwo.blue).toBe(180);
    expect(flattenTwo.alpha).toBe(1);
  });

  it('should flatten colors correctly using blend mode: color-dodge', function () {
    const flatten = axe.commons.color.flattenColors(
      colourTwo,
      colourOne,
      'color-dodge'
    );
    expect(flatten.red).toBe(226);
    expect(flatten.green).toBe(28);
    expect(flatten.blue).toBe(26);
    expect(flatten.alpha).toBe(1);

    const flattenTwo = axe.commons.color.flattenColors(
      colourFour,
      colourThree,
      'color-dodge'
    );
    expect(flattenTwo.red).toBe(233);
    expect(flattenTwo.green).toBe(209);
    expect(flattenTwo.blue).toBe(180);
    expect(flattenTwo.alpha).toBe(1);
  });

  it('should flatten colors correctly using blend mode: color-burn', function () {
    const flatten = axe.commons.color.flattenColors(
      colourTwo,
      colourOne,
      'color-burn'
    );
    expect(flatten.red).toBe(204);
    expect(flatten.green).toBe(17);
    expect(flatten.blue).toBe(17);
    expect(flatten.alpha).toBe(1);

    const flattenTwo = axe.commons.color.flattenColors(
      colourFour,
      colourThree,
      'color-burn'
    );
    expect(flattenTwo.red).toBe(184);
    expect(flattenTwo.green).toBe(162);
    expect(flattenTwo.blue).toBe(90);
    expect(flattenTwo.alpha).toBe(1);
  });

  it('should flatten colors correctly using blend mode: hard-light', function () {
    const flatten = axe.commons.color.flattenColors(
      colourTwo,
      colourOne,
      'hard-light'
    );
    expect(flatten.red).toBe(210);
    expect(flatten.green).toBe(23);
    expect(flatten.blue).toBe(21);
    expect(flatten.alpha).toBe(1);

    const flattenTwo = axe.commons.color.flattenColors(
      colourFour,
      colourThree,
      'hard-light'
    );
    expect(flattenTwo.red).toBe(201);
    expect(flattenTwo.green).toBe(209);
    expect(flattenTwo.blue).toBe(90);
    expect(flattenTwo.alpha).toBe(1);
  });

  it('should flatten colors correctly using blend mode: soft-light', function () {
    const flatten = axe.commons.color.flattenColors(
      colourTwo,
      colourOne,
      'soft-light'
    );
    expect(flatten.red).toBe(215);
    expect(flatten.green).toBe(22);
    expect(flatten.blue).toBe(21);
    expect(flatten.alpha).toBe(1);

    const flattenTwo = axe.commons.color.flattenColors(
      colourFour,
      colourThree,
      'soft-light'
    );
    expect(flattenTwo.red).toBe(209);
    expect(flattenTwo.green).toBe(183);
    expect(flattenTwo.blue).toBe(154);
    expect(flattenTwo.alpha).toBe(1);
  });

  it('should flatten colors correctly using blend mode: difference', function () {
    const flatten = axe.commons.color.flattenColors(
      colourTwo,
      colourOne,
      'difference'
    );
    expect(flatten.red).toBe(188);
    expect(flatten.green).toBe(43);
    expect(flatten.blue).toBe(40);
    expect(flatten.alpha).toBe(1);

    const flattenTwo = axe.commons.color.flattenColors(
      colourFour,
      colourThree,
      'difference'
    );
    expect(flattenTwo.red).toBe(154);
    expect(flattenTwo.green).toBe(128);
    expect(flattenTwo.blue).toBe(180);
    expect(flattenTwo.alpha).toBe(1);
  });

  it('should flatten colors correctly using blend mode: exclusion', function () {
    const flatten = axe.commons.color.flattenColors(
      colourTwo,
      colourOne,
      'exclusion'
    );
    expect(flatten.red).toBe(196);
    expect(flatten.green).toBe(49);
    expect(flatten.blue).toBe(46);
    expect(flatten.alpha).toBe(1);

    const flattenTwo = axe.commons.color.flattenColors(
      colourFour,
      colourThree,
      'exclusion'
    );
    expect(flattenTwo.red).toBe(173);
    expect(flattenTwo.green).toBe(128);
    expect(flattenTwo.blue).toBe(180);
    expect(flattenTwo.alpha).toBe(1);
  });

  it('should flatten colors correctly using blend mode: hue', function () {
    const flatten = axe.commons.color.flattenColors(
      colourTwo,
      colourOne,
      'hue'
    );
    expect(flatten.red).toBe(162);
    expect(flatten.green).toBe(50);
    expect(flatten.blue).toBe(17);
    expect(flatten.alpha).toBe(1);

    const flattenTwo = axe.commons.color.flattenColors(
      colourFour,
      colourThree,
      'hue'
    );
    expect(flattenTwo.red).toBe(188);
    expect(flattenTwo.green).toBe(177);
    expect(flattenTwo.blue).toBe(162);
    expect(flattenTwo.alpha).toBe(1);
  });

  it('should flatten colors correctly using blend mode: saturation', function () {
    const flatten = axe.commons.color.flattenColors(
      colourTwo,
      colourOne,
      'saturation'
    );
    expect(flatten.red).toBe(185);
    expect(flatten.green).toBe(35);
    expect(flatten.blue).toBe(35);
    expect(flatten.alpha).toBe(1);

    const flattenTwo = axe.commons.color.flattenColors(
      colourFour,
      colourThree,
      'saturation'
    );
    expect(flattenTwo.red).toBe(233);
    expect(flattenTwo.green).toBe(151);
    expect(flattenTwo.blue).toBe(181);
    expect(flattenTwo.alpha).toBe(1);
  });

  it('should flatten colors correctly using blend mode: color', function () {
    const flatten = axe.commons.color.flattenColors(
      colourTwo,
      colourOne,
      'color'
    );
    expect(flatten.red).toBe(180);
    expect(flatten.green).toBe(38);
    expect(flatten.blue).toBe(34);
    expect(flatten.alpha).toBe(1);

    const flattenTwo = axe.commons.color.flattenColors(
      colourFour,
      colourThree,
      'color'
    );
    expect(flattenTwo.red).toBe(161);
    expect(flattenTwo.green).toBe(204);
    expect(flattenTwo.blue).toBe(90);
    expect(flattenTwo.alpha).toBe(1);
  });

  it('should flatten colors correctly using blend mode: luminosity', function () {
    const flatten = axe.commons.color.flattenColors(
      colourTwo,
      colourOne,
      'luminosity'
    );
    expect(flatten.red).toBe(226);
    expect(flatten.green).toBe(33);
    expect(flatten.blue).toBe(33);
    expect(flatten.alpha).toBe(1);

    const flattenTwo = axe.commons.color.flattenColors(
      colourFour,
      colourThree,
      'luminosity'
    );
    expect(flattenTwo.red).toBe(214);
    expect(flattenTwo.green).toBe(165);
    expect(flattenTwo.blue).toBe(183);
    expect(flattenTwo.alpha).toBe(1);
  });
});
