import { describe, it, beforeEach, afterEach, expect } from 'vitest';

declare const axe: any;
describe('color.getForegroundColor', () => {
  const { getForegroundColor, Color } = axe.commons.color;
  const { queryFixture, queryShadowFixture } = axe.testUtils;

  function assertSameColor(actual, expected, margin = 0) {
    expect(actual.red).toBeCloseTo(expected.red, margin);
    expect(actual.green).toBeCloseTo(expected.green, margin);
    expect(actual.blue).toBeCloseTo(expected.blue, margin);
    // RGB values are 0-255, alpha is 0-1, so divide margin by 255
    expect(actual.alpha).toBeCloseTo(expected.alpha, margin / 255);
  }

  beforeEach(() => {
    // This normalizes the default mocha behavior of setting a different background
    // based on prefers-color-scheme settings.
    document.body.style.background = '#fff';
  });

  afterEach(() => {
    axe.commons.color.incompleteData.clear();
    document.body.scrollTop = 0;
  });

  it('returns the CSS color property', () => {
    const target = queryFixture(
      '<div id="target" style="color: rgb(0 0 128)">Hello World</div>'
    ).actualNode;
    const fgColor = getForegroundColor(target);
    assertSameColor(fgColor, new Color(0, 0, 128));
  });

  it('returns the CSS color from inside of Shadow DOM', () => {
    const target = queryShadowFixture(
      '<div id="shadow" style="height: 40px; width: 30px; background-color: red;"></div>',
      '<div id="target" style="height:20px; width:15px; color:rgb(0 0 128); background-color:green;">Hello World</div>'
    ).actualNode;

    const fgColor = getForegroundColor(target);
    assertSameColor(fgColor, new Color(0, 0, 128));
  });

  it('returns null if containing parent has a background image and is non-opaque', () => {
    const target = queryFixture(
      '<div style="height: 40px; width: 30px;' +
        'background-color: #800000; background-image: url(image.png);">' +
        '<div id="target" style="height: 20px; width: 15px; color: blue; background-color: green; opacity: 0.5;">' +
        'Hello World' +
        '</div></div>'
    ).actualNode;
    expect(getForegroundColor(target)).toBeNull();
    expect(axe.commons.color.incompleteData.get('fgColor')).toBe('bgImage');
  });

  it('returns `-webkit-text-fill-color` over `color`', () => {
    const target = queryFixture(
      '<div id="target" style="-webkit-text-fill-color: rgb(0 0 255); color: rgb(0 0 128)">Hello World</div>'
    ).actualNode;
    const fgColor = getForegroundColor(target);
    assertSameColor(fgColor, new Color(0, 0, 255));
  });

  describe('text-stroke', () => {
    it('ignores stroke when equal to 0', () => {
      const target = queryFixture(
        '<div style="color: rgb(0 0 128); -webkit-text-stroke: 0 #CCC" id="target">Hello World</div>'
      ).actualNode;
      const options = { textStrokeEmMin: 0 };
      const fgColor = getForegroundColor(target, null, null, options);
      assertSameColor(fgColor, new Color(0, 0, 128));
    });

    it('ignores stroke when less then the minimum', () => {
      const target = queryFixture(
        '<div style="color: rgb(0 0 128); -webkit-text-stroke: 0.1em #CCC" id="target">Hello World</div>'
      ).actualNode;
      const options = { textStrokeEmMin: 0.2 };
      const fgColor = getForegroundColor(target, null, null, options);
      assertSameColor(fgColor, new Color(0, 0, 128));
    });

    it('uses stroke color when thickness is equal to the minimum', () => {
      const target = queryFixture(
        '<div style="color: #CCC; -webkit-text-stroke: 0.2em rgb(0 0 128);" id="target">Hello World</div>'
      ).actualNode;
      const options = { textStrokeEmMin: 0.2 };
      const fgColor = getForegroundColor(target, null, null, options);
      assertSameColor(fgColor, new Color(0, 0, 128));
    });

    it('blends the stroke color with `color`', () => {
      const target = queryFixture(
        '<div style="color: rgb(0 0 55); -webkit-text-stroke: 0.2em rgb(0 0 255 / 50%);" id="target">Hello World</div>'
      ).actualNode;
      const options = { textStrokeEmMin: 0.1 };
      const fgColor = getForegroundColor(target, null, null, options);
      assertSameColor(fgColor, new Color(0, 0, 155), 0.8);
    });
  });

  describe('with transparency', () => {
    it('returns the blended color if it has alpha set', () => {
      const target = queryFixture(
        '<div style="height: 40px; background-color: #800000;">' +
          '<div id="target" style="height: 40px; color: rgba(0, 0, 128, 0.5);' +
          ' background-color: rgba(0, 128, 0, 0.5);">' +
          'This is my text' +
          '</div></div>'
      ).actualNode;
      const fgColor = getForegroundColor(target);
      assertSameColor(fgColor, new Color(32, 32, 64), 0.8);
    });

    it('returns the blended color if it has opacity set', () => {
      const target = queryFixture(
        '<div style="height: 40px; background-color: #800000;">' +
          '<div id="target" style="height: 40px; color: #000080;' +
          ' background-color: green; opacity: 0.5;">' +
          'This is my text' +
          '</div></div>'
      ).actualNode;
      const fgColor = getForegroundColor(target);
      assertSameColor(fgColor, new Color(64, 0, 64));
    });

    it('does not apply opacity to node background', () => {
      const target = queryFixture(
        '<div id="target" style="color: #fff; background-color: #00633D; opacity: 0.65"><span>Hello World</span></div>'
      ).actualNode;
      const fgColor = getForegroundColor(target);
      assertSameColor(fgColor, new Color(255, 255, 255));
    });

    it('combines opacity with text stroke alpha color', () => {
      const target = queryFixture(
        `<div id="target" style="
          opacity: 0.5;
          color: transparent;
          -webkit-text-stroke: 0.05em rgb(0 255 255 / 50%);
        ">Hello world</div>`
      ).actualNode;
      const fgColor = getForegroundColor(target);
      assertSameColor(fgColor, new Color(191, 255, 255), 0.8);
    });

    it('takes into account parent opacity tree', () => {
      const target = queryFixture(
        '<div style="background-color: #fafafa">' +
          '<div style="height: 40px; opacity: 0.6">' +
          '<div id="target" style="height: 40px; color: rgba(0, 0, 0, 0.87);">' +
          'This is my text' +
          '</div></div></div>'
      ).actualNode;
      const fgColor = getForegroundColor(target);
      assertSameColor(fgColor, new Color(119.5, 119.5, 119.5), 0.8);
    });

    it('takes into account entire parent opacity tree', () => {
      const target = queryFixture(
        '<div style="background-color: #fafafa">' +
          '<div style="height: 40px; opacity: 0.75">' +
          '<div style="height: 40px; opacity: 0.8">' +
          '<div id="target" style="height: 40px; color: rgba(0, 0, 0, 0.87);">' +
          'This is my text' +
          '</div></div></div></div>'
      ).actualNode;
      const fgColor = getForegroundColor(target);
      assertSameColor(fgColor, new Color(119.5, 119.5, 119.5), 0.8);
    });
  });

  describe('test-shadow', () => {
    it('returns text shadow color if foreground is transparent', () => {
      const target = queryFixture(
        `<div style="height: 40px; width: 120px; background-color: white;">
          <div id="target" style="height: 20px; width: 120px; color: rgba(0,0,0,0); text-shadow: 0 0 0 rgba(32, 32, 64, 1)">
            This is my text
          </div>
        </div>`
      ).actualNode;
      const fgColor = getForegroundColor(target);
      assertSameColor(fgColor, new Color(32, 32, 64));
    });

    it('returns a mix of colors if there is a shadow, foreground with alpha < 1, and background color', () => {
      const target = queryFixture(
        `<div style="height: 40px; width: 120px; background-color: white;">
          <div id="target" style="height: 20px; width: 120px; color: rgba(128, 0, 0, .5); text-shadow: 0 0 0 rgba(32, 32, 64, 1)">
            This is my text
          </div>
        </div>`
      ).actualNode;

      const actual = getForegroundColor(target);
      const shadowExpected = new Color(32, 32, 64, 1);
      expect(actual.red).not.toBe(shadowExpected.red);
      expect(actual.green).not.toBe(shadowExpected.green);
      expect(actual.blue).not.toBe(shadowExpected.blue);

      const bgExpected = new Color(255, 255, 255, 1);
      expect(actual.red).not.toBe(bgExpected.red);
      expect(actual.green).not.toBe(bgExpected.green);
      expect(actual.blue).not.toBe(bgExpected.blue);

      const fgExpected = new Color(128, 0, 0, 0.5);
      expect(actual.red).not.toBe(fgExpected.red);
      expect(actual.green).not.toBe(fgExpected.green);
      expect(actual.blue).not.toBe(fgExpected.blue);
    });

    it('applies opacity to text-shadow', () => {
      const target = queryFixture(
        `<div id="target" style="
            color: transparent;
            opacity: 0.5;
            text-shadow: 0 0 0 rgb(0 255 255 / 50%)
          ">Hello world</div>`
      ).actualNode;
      const fgColor = getForegroundColor(target);
      assertSameColor(fgColor, new Color(191, 255, 255), 0.8);
    });
  });
});
