import { describe, it, beforeAll, expect } from 'vitest';

declare const axe: any;
describe('text.isIconLigature', () => {
  const isIconLigature = axe.commons.text.isIconLigature;
  const queryFixture = axe.testUtils.queryFixture;
  const fontApiSupport = !!document.fonts;

  beforeAll(done => {
    if (!fontApiSupport) {
      done();
    }

    const firaFont = new FontFace(
      'Fira Code',
      'url(/test/assets/FiraCode-Regular.woff)'
    );
    const ligatureFont = new FontFace(
      'LigatureSymbols',
      'url(/test/assets/LigatureSymbols.woff)'
    );
    const materialFont = new FontFace(
      'Material Icons',
      'url(/test/assets/MaterialIcons.woff2)'
    );
    const robotoFont = new FontFace('Roboto', 'url(/test/assets/Roboto.woff2)');
    const zeroWidth0CharFont = new FontFace(
      'ZeroWidth0Char',
      'url(/test/assets/ZeroWidth0Char.woff)'
    );

    window.Promise.all([
      firaFont.load(),
      ligatureFont.load(),
      materialFont.load(),
      robotoFont.load(),
      zeroWidth0CharFont.load()
    ]).then(() => {
      document.fonts.add(firaFont);
      document.fonts.add(ligatureFont);
      document.fonts.add(materialFont);
      document.fonts.add(robotoFont);
      document.fonts.add(zeroWidth0CharFont);
      done();
    });
  });

  it('should return false for normal text', () => {
    const target = queryFixture('<div id="target">Normal text</div>');
    expect(isIconLigature(target.children[0])).toBe(false);
  });

  it('should return false for emoji', () => {
    const target = queryFixture('<div id="target">🌎</div>');
    expect(isIconLigature(target.children[0])).toBe(false);
  });

  it('should return false for non-bmp unicode', () => {
    const target = queryFixture('<div id="target">◓</div>');
    expect(isIconLigature(target.children[0])).toBe(false);
  });

  it('should return false for whitespace strings', () => {
    const target = queryFixture('<div id="target">     </div>');
    expect(isIconLigature(target.children[0])).toBe(false);
  });

  (fontApiSupport ? it : it.skip)(
    'should return false for common ligatures (fi)',
    () => {
      const target = queryFixture(
        '<div id="target" style="font-family: Roboto">figure</div>'
      );
      expect(isIconLigature(target.children[0])).toBe(false);
    }
  );

  (fontApiSupport ? it : it.skip)(
    'should return false for common ligatures (ff)',
    () => {
      const target = queryFixture(
        '<div id="target" style="font-family: Roboto">ffugative</div>'
      );
      expect(isIconLigature(target.children[0])).toBe(false);
    }
  );

  (fontApiSupport ? it : it.skip)(
    'should return false for common ligatures (fl)',
    () => {
      const target = queryFixture(
        '<div id="target" style="font-family: Roboto">flu shot</div>'
      );
      expect(isIconLigature(target.children[0])).toBe(false);
    }
  );

  (fontApiSupport ? it : it.skip)(
    'should return false for common ligatures (ffi)',
    () => {
      const target = queryFixture(
        '<div id="target" style="font-family: Roboto">ffigure</div>'
      );
      expect(isIconLigature(target.children[0])).toBe(false);
    }
  );

  (fontApiSupport ? it : it.skip)(
    'should return false for common ligatures (ffl)',
    () => {
      const target = queryFixture(
        '<div id="target" style="font-family: Roboto">fflu shot</div>'
      );
      expect(isIconLigature(target.children[0])).toBe(false);
    }
  );

  (fontApiSupport ? it : it.skip)(
    'should return true for an icon ligature',
    () => {
      const target = queryFixture(
        '<div id="target" style="font-family: \'Material Icons\'">delete</div>'
      );
      expect(isIconLigature(target.children[0])).toBe(true);
    }
  );

  (fontApiSupport ? it : it.skip)('should trim the string', () => {
    const target = queryFixture(
      '<div id="target" style="font-family: Roboto">  fflu shot  </div>'
    );
    expect(isIconLigature(target.children[0])).toBe(false);
  });

  (fontApiSupport ? it : it.skip)(
    'should return true for a font that has no character data',
    () => {
      const target = queryFixture(
        '<div id="target" style="font-family: \'Material Icons\'">f</div>'
      );
      expect(isIconLigature(target.children[0])).toBe(true);
    }
  );

  (fontApiSupport ? it : it.skip)(
    'should return true for a font that has zero width characters',
    () => {
      const target = queryFixture(
        '<div id="target" style="font-family: \'ZeroWidth0Char\'">0</div>'
      );
      expect(isIconLigature(target.children[0])).toBe(true);
    }
  );

  (fontApiSupport ? it : it.skip)(
    'should return false for a programming text ligature',
    () => {
      const target = queryFixture(
        '<div id="target" style="font-family: Fira Code">!==</div>'
      );
      expect(isIconLigature(target.children[0])).toBe(false);
    }
  );

  (fontApiSupport ? it : it.skip)(
    'should return true for an icon ligature with low pixel difference',
    () => {
      const target = queryFixture(
        '<div id="target" style="font-family: \'Material Icons\'">keyboard_arrow_left</div>'
      );
      expect(isIconLigature(target.children[0])).toBe(true);
    }
  );

  (fontApiSupport ? it : it.skip)(
    'should return true after the 3rd time the font is an icon',
    () => {
      const target = queryFixture(
        '<div id="target" style="font-family: \'LigatureSymbols\'">delete</div>'
      );

      isIconLigature(target.children[0]);
      isIconLigature(target.children[0]);
      isIconLigature(target.children[0]);

      // change text to non-icon
      target.children[0].actualNode.textContent = '__non-icon text__';
      expect(isIconLigature(target.children[0])).toBe(true);
    }
  );

  (fontApiSupport ? it : it.skip)(
    'should return false after the 3rd time the font is not an icon',
    () => {
      const target = queryFixture(
        '<div id="target" style="font-family: \'Roboto\'">__non-icon text__</div>'
      );

      isIconLigature(target.children[0]);
      isIconLigature(target.children[0]);
      isIconLigature(target.children[0]);

      // change text to icon
      target.children[0].actualNode.textContent = 'delete';
      expect(isIconLigature(target.children[0])).toBe(false);
    }
  );

  describe('pixelThreshold', () => {
    (fontApiSupport ? it : it.skip)(
      'should allow higher percent (will not flag icon ligatures)',
      () => {
        const target = queryFixture(
          '<div id="target" style="font-family: \'LigatureSymbols\'">delete</div>'
        );

        // every pixel must be different to flag as icon
        expect(isIconLigature(target.children[0], 1)).toBe(false);
      }
    );

    (fontApiSupport ? it : it.skip)(
      'should allow lower percent (will flag text ligatures)',
      () => {
        const target = queryFixture(
          '<div id="target" style="font-family: Roboto">figure</div>'
        );
        expect(isIconLigature(target.children[0], 0)).toBe(true);
      }
    );
  });

  describe('occurrenceThreshold', () => {
    (fontApiSupport ? it : it.skip)(
      'should change the number of times a font is seen before returning',
      () => {
        const target = queryFixture(
          '<div id="target" style="font-family: \'LigatureSymbols\'">delete</div>'
        );

        isIconLigature(target.children[0]);

        // change text to non-icon
        target.children[0].actualNode.textContent = '__non-icon text__';
        expect(isIconLigature(target.children[0], 0.1, 1)).toBe(true);
        expect(isIconLigature(target.children[0])).toBe(false);
      }
    );
  });
});
