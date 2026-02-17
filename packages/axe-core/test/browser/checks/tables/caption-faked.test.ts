import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('caption-faked', function () {
  const fixture = document.getElementById('fixture');

  afterEach(function () {
    fixture.innerHTML = '';
  });

  const captionFaked;
  beforeEach(function () {
    captionFaked = checks['caption-faked'];
  });

  it('returns true if the first row has multiple cells', function () {
    fixture.innerHTML =
      '<table>' +
      '  <tr> <td></td> <td></td> </tr>' +
      '  <tr> <td></td> <td></td> </tr>' +
      '</table>';

    const node = fixture.querySelector('table');
    expect(captionFaked.evaluate(node)).toBe(true);
  });

  it('returns true if the table has only one column', function () {
    fixture.innerHTML =
      '<table>' +
      '  <tr> <td></td> </tr>' +
      '  <tr> <td></td> </tr>' +
      '</table>';

    const node = fixture.querySelector('table');
    expect(captionFaked.evaluate(node)).toBe(true);
  });

  it('returns true if the table has only one <tr>', function () {
    fixture.innerHTML =
      '<table>' +
      // Accessibility: Expect the unexpected
      '  <tr> <td rowspan="2" colspan="2"></td> </tr>' +
      '</table>';

    const node = fixture.querySelector('table');
    expect(captionFaked.evaluate(node)).toBe(true);
  });

  it('returns true if the first column does not span the entire table', function () {
    fixture.innerHTML =
      '<table>' +
      '  <tr> <td></td> </tr>' +
      '  <tr> <td></td> <td></td> </tr>' +
      '</table>';

    const node = fixture.querySelector('table');
    expect(captionFaked.evaluate(node)).toBe(true);
  });

  it('returns false if the first is only a single td', function () {
    fixture.innerHTML =
      '<table>' +
      '  <tr> <td colspan="2"></td> </tr>' +
      '  <tr> <td></td> <td></td> </tr>' +
      '</table>';

    const node = fixture.querySelector('table');
    expect(captionFaked.evaluate(node)).toBe(false);
  });

  it('returns false if the first is only a single th', function () {
    fixture.innerHTML =
      '<table>' +
      '  <tr> <th colspan="2"></th> </tr>' +
      '  <tr> <td></td> <td></td> </tr>' +
      '</table>';

    const node = fixture.querySelector('table');
    expect(captionFaked.evaluate(node)).toBe(false);
  });
});
