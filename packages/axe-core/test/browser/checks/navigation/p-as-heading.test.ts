import { describe, it, expect, afterEach } from 'vitest';
import { checkSetup, getCheckEvaluate, MockCheckContext, shadowCheckSetup } from '../../../testutils';

declare const axe: any;
describe('p-as-heading', function () {
  const fixture = document.getElementById('fixture')!;

  const checkContext = MockCheckContext();

  const testOptions = {
    margins: [{ weight: 100 }, { italic: true }, { size: 1.2 }]
  };

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext.reset();
    axe._tree = undefined;
  });

  it('returns true if the styles are identical', function () {
    const params = checkSetup(
      '<p id="target">elm 1</p> <p>elm 2</p>',
      testOptions
    );
    expect(getCheckEvaluate('p-as-heading').apply(checkContext, params)).toBe(
      true
    );
  });

  it('returns true if there is no p element following it', function () {
    const params = checkSetup('<p id="target">lone elm</p>', testOptions);
    expect(getCheckEvaluate('p-as-heading').apply(checkContext, params)).toBe(
      true
    );
  });

  it('returns false if the font-weight is heavier', function () {
    const params = checkSetup(
      '<p id="target" style="font-weight:bold">elm 1</p>' + '<p>elm 2elm 2</p>',
      testOptions
    );
    expect(getCheckEvaluate('p-as-heading').apply(checkContext, params)).toBe(
      false
    );
  });

  it('returns false if the font-size is bigger', function () {
    const params = checkSetup(
      '<p id="target" style="font-size:150%">elm 1</p> <p>elm 2elm 2</p>',
      testOptions
    );
    expect(getCheckEvaluate('p-as-heading').apply(checkContext, params)).toBe(
      false
    );
  });

  it('returns false if the fake heading is italic and the text is not', function () {
    const params = checkSetup(
      '<p id="target" style="font-style:italic">elm 1</p> <p>elm 2elm 2</p>',
      testOptions
    );
    expect(getCheckEvaluate('p-as-heading').apply(checkContext, params)).toBe(
      false
    );
  });

  it('returns true if both texts are bold, italic and larger', function () {
    const params = checkSetup(
      '<p id="target" style="font-weight:bold; font-size:120%; font-style:italic">elm 1</p>' +
        '<p style="font: italic bold 120% bold">elm 2elm 2</p>',
      testOptions
    );
    expect(getCheckEvaluate('p-as-heading').apply(checkContext, params)).toBe(
      true
    );
  });

  it('considers styles of elements inside the paragraph', function () {
    const params = checkSetup(
      '<p id="target"><b>elm 1</b></p> <p>elm 2elm 2</p>',
      testOptions
    );
    expect(getCheckEvaluate('p-as-heading').apply(checkContext, params)).toBe(
      false
    );
  });

  it('ignores empty child element for style', function () {
    const params = checkSetup(
      '<p id="target"><span> </span><b>elm 1</b></p> <p>elm 2elm 2</p>',
      testOptions
    );
    expect(getCheckEvaluate('p-as-heading').apply(checkContext, params)).toBe(
      false
    );
  });

  it('considers styles of elements that do not contain all the text', function () {
    const params = checkSetup(
      '<p id="target"><b>elm</b> 1</p> <p>elm 2elm 2</p>',
      testOptions
    );
    expect(getCheckEvaluate('p-as-heading').apply(checkContext, params)).toBe(
      true
    );
  });

  it('returns undefined instead of false if the element is inside a blockquote', function () {
    const params = checkSetup(
      '<blockquote>' +
        '<p style="font-weight:bold" id="target">elm 1</p> <p>elm 2elm 2</p>' +
        '</blockquote>',
      testOptions
    );
    expect(
      getCheckEvaluate('p-as-heading').apply(checkContext, params)
    ).toBeUndefined();
  });

  it('returns true over undefined from within a blockquote', function () {
    const params = checkSetup(
      '<blockquote>' +
        '<p id="target">elm 1</p> <p>elm 2elm 2</p>' +
        '</blockquote>',
      testOptions
    );
    expect(getCheckEvaluate('p-as-heading').apply(checkContext, params)).toBe(
      true
    );
  });

  it('returns undefined if a previous sibling has a similar font-weight', function () {
    const params = checkSetup(
      '<p><b>elm 1</b></p>' +
        '<p id="target"><b>elm 2</b></p>' +
        '<p>elm 3</p>',
      testOptions
    );
    expect(
      getCheckEvaluate('p-as-heading').apply(checkContext, params)
    ).toBeUndefined();
  });

  it('returns true if the heading is greater than the paragraph', function () {
    const params = checkSetup(
      '<p id="target">elm1elm1</p>' + '<p>elm2</p>',
      testOptions
    );
    expect(getCheckEvaluate('p-as-heading').apply(checkContext, params)).toBe(
      true
    );
  });

  it('returns undefined if the heading is twice as long but not greater than the length of the pararaph', function () {
    const params = checkSetup(
      '<p id="target" style="font-weight:bold">elm1elm</p>' + '<p>elm2elm2</p>',
      testOptions
    );
    expect(
      getCheckEvaluate('p-as-heading').apply(checkContext, params)
    ).toBeUndefined();
  });

  describe('options.passLength and options.failLength', function () {
    it('returns true if the heading is greater than the paragraph using options.passLength', function () {
      const options = {
        margins: [{ weight: 100 }, { italic: true }, { size: 1.2 }],
        passLength: 2
      };

      const params = checkSetup(
        '<p id="target">elm1elm1elm1</p>' + '<p>elm2</p>',
        options
      );
      expect(getCheckEvaluate('p-as-heading').apply(checkContext, params)).toBe(
        true
      );
    });

    it('returns undefined if the heading is twice as long but not greater than the length of the pararaph using options.failLength ', function () {
      const options = {
        margins: [{ weight: 100 }, { italic: true }, { size: 1.2 }],
        failLength: 0.6
      };
      const params = checkSetup(
        '<p id="target" style="font-weight:bold">elm1elm</p>' +
          '<p>elm2elm2elm2</p>',
        options
      );
      expect(getCheckEvaluate('p-as-heading').apply(checkContext, params)).toBe(
        false
      );
    });
  });

  describe('option.margin', function () {
    it('passes if no margins are set', function () {
      const options = {};

      const params = checkSetup(
        '<p id="target"><b>elm 1</b></p> <p>elm 2elm 2</p>',
        options
      );
      expect(getCheckEvaluate('p-as-heading').apply(checkContext, params)).toBe(
        true
      );
    });

    it('takes an array of margins', function () {
      const options = {
        margins: [{ size: 1.2 }]
      };

      const params = checkSetup(
        '<p id="target"><b>elm 1</b></p> <p>elm 2elm 2</p>',
        options
      );
      expect(getCheckEvaluate('p-as-heading').apply(checkContext, params)).toBe(
        true
      );
    });

    it('returns false if all values in the margin are passed', function () {
      const options = {
        margins: [{ size: 1.2, weight: 100 }]
      };

      const params = checkSetup(
        '<p id="target" style="font-size:1.5em; font-weight:bold">elm 1</p>' +
          '<p>elm 2elm 2</p>',
        options
      );
      expect(getCheckEvaluate('p-as-heading').apply(checkContext, params)).toBe(
        false
      );
    });

    it('returns true if any of the values is not passed', function () {
      const options = {
        margins: [{ size: 1.2, weight: 100 }]
      };

      const params = checkSetup(
        '<p id="target" style="font-weight:bold">elm 1</p>' + '<p>elm 2</p>',
        options
      );
      expect(getCheckEvaluate('p-as-heading').apply(checkContext, params)).toBe(
        true
      );
    });

    it('returns false if any of the margins is passed', function () {
      const options = {
        margins: [{ size: 1.2, weight: 100 }, { size: 1.5 }, { italic: true }]
      };

      const params = checkSetup(
        '<p id="target" style="font-style:italic">elm 1</p>' +
          '<p>elm 2elm 2</p>',
        options
      );
      expect(getCheckEvaluate('p-as-heading').apply(checkContext, params)).toBe(
        false
      );
    });

    it('returns true if none of the set margins is passed', function () {
      /*eslint indent: 0*/
      const options = {
        margins: [
          { size: 1.2, weight: 100 },
          { size: 1.5 },
          { size: 1.2, italic: true }
        ]
      };

      const params = checkSetup(
        '<p id="target" style="font-size:1.5em">elm 1</p>' + '<p>elm 2</p>',
        options
      );
      expect(getCheckEvaluate('p-as-heading').apply(checkContext, params)).toBe(
        true
      );
    });
  });

  it(
    'returns undefined instead of false if the element is inside a blockquote in light dom',
    function () {
      const params = shadowCheckSetup(
        '<blockquote></blockquote>',
        '<p style="font-weight:bold" id="target">elm 1</p> <p>elm 2</p>',
        testOptions
      );
      expect(
        getCheckEvaluate('p-as-heading').apply(checkContext, params)
      ).toBeUndefined();
    }
  );

  it(
    'returns true over undefined from within a blockquote in light dom',
    function () {
      const params = shadowCheckSetup(
        '<blockquote></blockquote>',
        '<p id="target">elm 1</p> <p>elm 2</p>',
        testOptions
      );
      expect(getCheckEvaluate('p-as-heading').apply(checkContext, params)).toBe(
        true
      );
    }
  );
});
