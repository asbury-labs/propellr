import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('color.Color', () => {
  const Color = axe.commons.color.Color;

  it('can be constructed without alpha', () => {
    const c1 = new Color(4, 3, 2);
    expect(c1.red).toBe(4);
    expect(c1.green).toBe(3);
    expect(c1.blue).toBe(2);
    expect(c1.alpha).toBe(1);
  });

  it('can be constructed from a Color', () => {
    const c1 = new Color(4, 3, 2, 0.5);
    const c2 = new Color(c1);
    expect(c2.red).toBe(4);
    expect(c2.green).toBe(3);
    expect(c2.blue).toBe(2);
    expect(c2.alpha).toBe(0.5);
  });

  it('clamps out of gamut values for red, green, blue', () => {
    const c1 = new Color(-255, 0, 510, 0.5);
    expect(c1.red).toBe(0);
    expect(c1.green).toBe(0);
    expect(c1.blue).toBe(255);
    expect(c1.alpha).toBe(0.5);
  });

  it('retains out of gamut values for r, g, b', () => {
    const c1 = new Color(-255, 0, 510, 0.5);
    expect(c1.r).toBe(-1);
    expect(c1.g).toBe(0);
    expect(c1.b).toBe(2);
    expect(c1.alpha).toBe(0.5);
  });

  it('can be constructed from a Color preserving out of gamut values', () => {
    const c1 = new Color(-255, 0, 510, 0.5);
    const c2 = new Color(c1);
    expect(c2.r).toBe(-1);
    expect(c2.g).toBe(0);
    expect(c2.b).toBe(2);
    expect(c2.alpha).toBe(0.5);
  });

  it('has a toJSON method', () => {
    const c1 = new Color(255, 128, 0);
    expect(c1.toJSON()).toEqual({
      red: 255,
      green: 128,
      blue: 0,
      alpha: 1
    });
  });

  describe('parseColorFnString', () => {
    describe('with rgb()', () => {
      it('should set values properly via RGB', () => {
        const c = new Color();
        c.parseColorFnString('rgb(17, 34,  51)');
        expect(c.red).toBe(17);
        expect(c.green).toBe(34);
        expect(c.blue).toBe(51);
        expect(c.alpha).toBe(1);
      });

      it('should set values properly via RGBA', () => {
        const c = new Color();
        c.parseColorFnString('rgba(17, 34,51,  0.2)');
        expect(c.red).toBe(17);
        expect(c.green).toBe(34);
        expect(c.blue).toBe(51);
        expect(c.alpha).toBeCloseTo(0.2, 0.01);
      });

      it('allows decimal values, with and without the integer', () => {
        const c = new Color();
        c.parseColorFnString('rgba(.1, 23.4, 56.7, .89)');
        expect(c.red).toBe(0);
        expect(c.green).toBe(23);
        expect(c.blue).toBe(57);
        expect(c.alpha).toBeCloseTo(0.89, 0.01);
      });

      it('allows percentages', () => {
        const c = new Color();
        c.parseColorFnString('rgba(100%, 100%, 0%, 50%)');
        expect(c.red).toBe(255);
        expect(c.green).toBe(255);
        expect(c.blue).toBe(0);
        expect(c.alpha).toBe(0.5);
      });

      it.skip('allows exponent numbers', () => {
        const c = new Color();
        c.parseColorFnString('rgb(2e0, 2e1, 2e2)');
        expect(c.red).toBe(2);
        expect(c.green).toBe(20);
        expect(c.blue).toBe(200);
        expect(c.alpha).toBe(1);
      });

      it('supports space separated notation', () => {
        const c = new Color();
        c.parseColorFnString('rgba(255 128 0 / 50%)');
        expect(c.red).toBe(255);
        expect(c.green).toBe(128);
        expect(c.blue).toBe(0);
        expect(c.alpha).toBe(0.5);
      });

      it('allows alpha values', () => {
        const c = new Color();
        c.parseColorFnString('rgb(255 128 0 / 50%)');
        expect(c.red).toBe(255);
        expect(c.green).toBe(128);
        expect(c.blue).toBe(0);
        expect(c.alpha).toBe(0.5);
      });
    });

    describe('with hsl(a)', () => {
      it('allows hsl', () => {
        const c = new Color();
        c.parseColorFnString('hsl(160, 40%, 50%)');
        expect(c.red).toBe(77);
        expect(c.green).toBe(179);
        expect(c.blue).toBe(144);
        expect(c.alpha).toBe(1);
      });

      it('allows hsla', () => {
        const c = new Color();
        c.parseColorFnString('hsla(160, 40%, 50%, .5)');
        expect(c.red).toBe(77);
        expect(c.green).toBe(179);
        expect(c.blue).toBe(144);
        expect(c.alpha).toBe(0.5);
      });

      it('allows hsl with space notation', () => {
        const c = new Color();
        c.parseColorFnString('hsl(160 40% 50% / 5%)');
        expect(c.red).toBe(77);
        expect(c.green).toBe(179);
        expect(c.blue).toBe(144);
        expect(c.alpha).toBe(0.05);
      });

      it('supports deg on hue', () => {
        const c = new Color();
        c.parseColorFnString('hsl(160deg, 40%, 50%)');
        expect(c.red).toBe(77);
        expect(c.green).toBe(179);
        expect(c.blue).toBe(144);
        expect(c.alpha).toBe(1);
      });

      it('supports rad on hue', () => {
        const c = new Color();
        c.parseColorFnString('hsl(2.79rad, 40%, 50%)');
        expect(c.red).toBe(77);
        expect(c.green).toBe(179);
        expect(c.blue).toBe(144);
        expect(c.alpha).toBe(1);
      });

      it('supports negative rad on hue', () => {
        const c = new Color();
        c.parseColorFnString('hsl(-3.49rad, 40%, 50%)');
        expect(c.red).toBe(77);
        expect(c.green).toBe(179);
        expect(c.blue).toBe(145);
        expect(c.alpha).toBe(1);
      });

      it('supports turn on hue', () => {
        const c = new Color();
        c.parseColorFnString('hsl(0.444turn, 40%, 50%)');
        expect(c.red).toBe(77);
        expect(c.green).toBe(179);
        expect(c.blue).toBe(144);
        expect(c.alpha).toBe(1);
      });

      it('supports negative turn on hue', () => {
        const c = new Color();
        c.parseColorFnString('hsl(-0.556turn, 40%, 50%)');
        expect(c.red).toBe(77);
        expect(c.green).toBe(179);
        expect(c.blue).toBe(144);
        expect(c.alpha).toBe(1);
      });
    });

    describe('with hwb()', () => {
      it('allows hwb', () => {
        const c = new Color();
        c.parseColorFnString('hwb(160, 40%, 50%)');
        expect(c.red).toBe(102);
        expect(c.green).toBe(128);
        expect(c.blue).toBe(119);
        expect(c.alpha).toBe(1);
      });

      it('allows alpha values', () => {
        const c = new Color();
        c.parseColorFnString('hwb(160, 40%, 50% / 50%)');
        expect(c.red).toBe(102);
        expect(c.green).toBe(128);
        expect(c.blue).toBe(119);
        expect(c.alpha).toBe(0.5);
      });

      it('allows hsl with space notation', () => {
        const c = new Color();
        c.parseColorFnString('hwb(160 40% 50% / 50%)');
        expect(c.red).toBe(102);
        expect(c.green).toBe(128);
        expect(c.blue).toBe(119);
        expect(c.alpha).toBe(0.5);
      });
    });

    describe('with lab()', () => {
      it('allows lab', () => {
        const c = new Color();
        c.parseColorFnString('lab(66.26 -37.50 8.58)');
        expect(c.red).toBe(77);
        expect(c.green).toBe(179);
        expect(c.blue).toBe(144);
        expect(c.alpha).toBe(1);
      });

      it('allows alpha values', () => {
        const c = new Color();
        c.parseColorFnString('lab(66.26 -37.50 8.58 / 50%)');
        expect(c.red).toBe(77);
        expect(c.green).toBe(179);
        expect(c.blue).toBe(144);
        expect(c.alpha).toBe(0.5);
      });
    });

    describe('with lch()', () => {
      it('allows lch', () => {
        const c = new Color();
        c.parseColorFnString('lch(66.26 38.47 167.1)');
        expect(c.red).toBe(77);
        expect(c.green).toBe(179);
        expect(c.blue).toBe(144);
        expect(c.alpha).toBe(1);
      });

      it('allows alpha values', () => {
        const c = new Color();
        c.parseColorFnString('lch(66.26 38.47 167.1 / 50%)');
        expect(c.red).toBe(77);
        expect(c.green).toBe(179);
        expect(c.blue).toBe(144);
        expect(c.alpha).toBe(0.5);
      });
    });

    describe('with oklab()', () => {
      it('allows oklab', () => {
        const c = new Color();
        c.parseColorFnString('oklab(0.697 -0.107 0.023)');
        expect(c.red).toBe(77);
        expect(c.green).toBe(179);
        expect(c.blue).toBe(144);
        expect(c.alpha).toBe(1);
      });

      it('allows alpha values', () => {
        const c = new Color();
        c.parseColorFnString('oklab(0.697 -0.107 0.023 / 50%)');
        expect(c.red).toBe(77);
        expect(c.green).toBe(179);
        expect(c.blue).toBe(144);
        expect(c.alpha).toBe(0.5);
      });
    });

    describe('with oklch()', () => {
      it('allows oklch', () => {
        const c = new Color();
        c.parseColorFnString('oklch(0.6967 0.109 167.711)');
        expect(c.red).toBe(77);
        expect(c.green).toBe(179);
        expect(c.blue).toBe(144);
        expect(c.alpha).toBe(1);
      });

      it('allows alpha values', () => {
        const c = new Color();
        c.parseColorFnString('oklch(0.6967 0.109 167.711 / 50%)');
        expect(c.red).toBe(77);
        expect(c.green).toBe(179);
        expect(c.blue).toBe(144);
        expect(c.alpha).toBe(0.5);
      });

      it('clips out of gamut values', () => {
        const c = new Color();
        c.parseColorFnString('oklch(25% 0.75 345)');
        expect(c.red).toBe(186);
        expect(c.green).toBe(0);
        expect(c.blue).toBe(103);
        expect(c.alpha).toBe(1);

        expect(c.red).toBe(Math.round(c.r * 255));
        expect(c.green).toBe(Math.round(c.g * 255));
        expect(c.blue).toBe(Math.round(c.b * 255));
      });
    });
  });

  describe('parseHexString', () => {
    it('returns values from a 6 digit hex string', () => {
      const color = new Color();
      color.parseHexString('#123Abc');
      expect(color.red).toBe(18);
      expect(color.green).toBe(58);
      expect(color.blue).toBe(188);
      expect(color.alpha).toBe(1);
    });

    it('returns values from a 3 digit hex string', () => {
      const color = new Color();
      color.parseHexString('#19E');
      expect(color.red).toBe(17);
      expect(color.green).toBe(153);
      expect(color.blue).toBe(238);
      expect(color.alpha).toBe(1);
    });

    it('returns values from a 8 digit hex string', () => {
      const color = new Color();
      color.parseHexString('#123ABCde');
      expect(color.red).toBe(18);
      expect(color.green).toBe(58);
      expect(color.blue).toBe(188);
      expect(color.alpha).toBeCloseTo(222 / 255, 0.001);
    });

    it('returns values from a 4 digit hex string', () => {
      const color = new Color();
      color.parseHexString('#19EC');
      expect(color.red).toBe(17);
      expect(color.green).toBe(153);
      expect(color.blue).toBe(238);
      expect(color.alpha).toBeCloseTo(204 / 255, 0.01);
    });

    it('does nothing when passed an invalid string', () => {
      const color = new Color(1, 2, 3, 0.4);
      const values = ['abcdef', '#abcde', '#XYZ', '#0123456789'];
      values.forEach(function (val) {
        color.parseHexString(val);
        expect(color.red).toBe(1);
        expect(color.green).toBe(2);
        expect(color.blue).toBe(3);
        expect(color.alpha).toBe(0.4);
      });
    });
  });

  describe('parseString', () => {
    it('sets the value of a named color', () => {
      const color = new Color();
      color.parseString('chocolate');
      expect(color.red).toBe(210);
      expect(color.green).toBe(105);
      expect(color.blue).toBe(30);
      expect(color.alpha).toBe(1);
    });

    it('returns everything on 0 with transparent', () => {
      const color = new Color(255, 255, 255, 1);
      color.parseString('transparent');
      expect(color.red).toBe(0);
      expect(color.green).toBe(0);
      expect(color.blue).toBe(0);
      expect(color.alpha).toBe(0);
    });

    it('sets hex colors', () => {
      const color = new Color();
      color.parseString('#F00C');
      expect(color.red).toBe(255);
      expect(color.green).toBe(0);
      expect(color.blue).toBe(0);
      expect(color.alpha).toBeCloseTo(204 / 255, 0.01);
    });

    it('sets rgb colors', () => {
      const color = new Color();
      color.parseString('rgb(10, 20, 30)');
      expect(color.red).toBe(10);
      expect(color.green).toBe(20);
      expect(color.blue).toBe(30);
      expect(color.alpha).toBe(1);
    });

    it('sets rgba colors', () => {
      const color = new Color();
      color.parseString('rgba(10, 20, 30, 0.4)');
      expect(color.red).toBe(10);
      expect(color.green).toBe(20);
      expect(color.blue).toBe(30);
      expect(color.alpha).toBe(0.4);
    });

    it('allows hsl', () => {
      const c = new Color();
      c.parseString('hsl(160, 40%, 50%)');
      expect(c.red).toBe(77);
      expect(c.green).toBe(179);
      expect(c.blue).toBe(144);
      expect(c.alpha).toBe(1);
    });

    it('allows hsla', () => {
      const c = new Color();
      c.parseString('hsla(160, 40%, 50%, .5)');
      expect(c.red).toBe(77);
      expect(c.green).toBe(179);
      expect(c.blue).toBe(144);
      expect(c.alpha).toBe(0.5);
    });
  });

  describe('toHexString', () => {
    it('should return hex values properly', () => {
      const black = new Color(0, 0, 0, 1);
      const white = new Color(255, 255, 255, 1);
      const yellow = new Color(255, 255, 0, 1);
      const darkyellow = new Color(128, 128, 0, 1);
      const blue = new Color(0, 0, 255, 1);
      expect(black.toHexString()).toBe('#000000');
      expect(white.toHexString()).toBe('#ffffff');
      expect(yellow.toHexString()).toBe('#ffff00');
      expect(darkyellow.toHexString()).toBe('#808000');
      expect(blue.toHexString()).toBe('#0000ff');
    });

    it('should return hex values properly when they are non-integery', () => {
      const black = new Color(0, 0, 0, 1);
      const white = new Color(255, 255, 255, 0.1);
      const grayish = axe.commons.color.flattenColors(white, black);
      expect(grayish.toHexString()).toBe('#1a1a1a');
    });
  });

  describe('getRelativeLuminance', () => {
    it('should calculate luminance sensibly', () => {
      const black = new Color(0, 0, 0, 1);
      const white = new Color(255, 255, 255, 1);
      const yellow = new Color(255, 255, 0, 1);
      const darkyellow = new Color(128, 128, 0, 1);
      const blue = new Color(0, 0, 255, 1);
      const lBlack = black.getRelativeLuminance();
      const lWhite = white.getRelativeLuminance();
      const lYellow = yellow.getRelativeLuminance();
      const lDarkyellow = darkyellow.getRelativeLuminance();
      const lBlue = blue.getRelativeLuminance();

      //values range from zero to one
      expect(lBlack).toBe(0);
      expect(lWhite).toBe(1);

      //brighter values are more luminant than darker ones
      expect(lWhite > lYellow).toBe(true);
      expect(lYellow > lDarkyellow).toBe(true);
      expect(lYellow > lBlue).toBe(true);
      expect(lBlue > lBlack).toBe(true);
    });
  });

  describe('getLuminosity', () => {
    it('returns luminosity of the Color', () => {
      const L = new Color(128, 128, 0, 1).getLuminosity();
      expect(L).toBe(0.44674509803921564);
    });
  });

  describe('setLuminosity', () => {
    it('sets the luminosity of the Color', () => {
      const color = new Color(0, 0, 0, 1).setLuminosity(0.5);
      expect(color.toJSON()).toEqual({
        red: 128,
        green: 128,
        blue: 128,
        alpha: 1
      });
    });

    it('returns a new Color', () => {
      const black = new Color(0, 0, 0, 1);
      const nBlack = black.setLuminosity(0.5);
      expect(black).not.toBe(nBlack);
    });
  });

  describe('getSaturation', () => {
    it('returns the saturation of the Color', () => {
      const s = new Color(255, 128, 200, 1).getSaturation();
      expect(s).toBe(0.4980392156862745);
    });
  });

  describe('setSaturation', () => {
    it('sets the saturation of the Color', () => {
      const color = new Color(128, 100, 0, 1).setSaturation(0.8);
      expect(color.toJSON()).toEqual({
        red: 204,
        green: 159,
        blue: 0,
        alpha: 1
      });
    });

    it('returns a new Color', () => {
      const black = new Color(0, 0, 0, 1);
      const nBlack = black.setSaturation(0.5);
      expect(black).not.toBe(nBlack);
    });
  });

  describe('clip', () => {
    it('clips to the lower bound', () => {
      const color = new Color(255, 0, -1, 1).clip();
      expect(color.r).toBe(0.9909493297254295);
      expect(color.g).toBe(0.003870895819239939);
      expect(color.b).toBe(0);
    });

    it('clips to the upper bound', () => {
      const color = new Color(255, 0, 256, 1).clip();
      expect(color.r).toBe(0.9961043436801178);
      expect(color.g).toBe(0.002711982110142841);
      expect(color.b).toBe(1);
    });

    it('clips both the lower and upper bounds', () => {
      const color = new Color(-1, 0, 256, 1).clip();
      expect(color.r).toBe(0.00047889410870861904);
      expect(color.g).toBe(0.004247986549875488);
      expect(color.b).toBe(0.9691356514885925);
    });

    it('returns a new Color', () => {
      const black = new Color(0, 0, 0, 1);
      const nBlack = black.clip();
      expect(black).not.toBe(nBlack);
    });
  });
});
