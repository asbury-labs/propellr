import { describe, it, expect, afterEach } from 'vitest';
import {
  checkSetup,
  getCheckEvaluate,
  MockCheckContext
} from '../../../testutils';

describe('target-offset tests', () => {
  const checkContext = MockCheckContext();
  const checkEvaluate = getCheckEvaluate('target-offset');

  afterEach(() => {
    checkContext.reset();
  });

  it('returns true when there are no other nearby targets', () => {
    const checkArgs = checkSetup(
      '<a href="#" id="target" style="' +
        'display: inline-block; width:16px; height:16px;' +
        '">x</a>'
    );

    expect(checkEvaluate.apply(checkContext, checkArgs)).toBe(true);
    expect(checkContext._data.minOffset).toBe(24);
    expect(checkContext._data.closestOffset).toBeCloseTo(24, 0.2);
  });

  it('returns true when the offset is 24px', () => {
    const checkArgs = checkSetup(
      '<a href="#" id="target" style="' +
        'display: inline-block; width:16px; height:16px; margin-right: 8px' +
        '">x</a>' +
        '<a href="#" style="' +
        'display: inline-block; width:16px; height:16px;' +
        '">x</a>'
    );

    expect(checkEvaluate.apply(checkContext, checkArgs)).toBe(true);
    expect(checkContext._data.minOffset).toBe(24);
    expect(checkContext._data.closestOffset).toBeCloseTo(24, 0.2);
  });

  describe('when the offset is insufficient', () => {
    it('returns false for targets in the tab order', () => {
      const checkArgs = checkSetup(
        '<a href="#" id="target" style="' +
          'display: inline-block; width:16px; height:16px; margin-right: 7px' +
          '">x</a>' +
          '<a href="#" style="' +
          'display: inline-block; width:16px; height:16px;' +
          '">x</a>'
      );

      expect(checkEvaluate.apply(checkContext, checkArgs)).toBe(false);
      expect(checkContext._data.messageKey).toBeUndefined();
      expect(checkContext._data.minOffset).toBe(24);
      expect(checkContext._data.closestOffset).toBeCloseTo(22, 0.2);
    });

    it('returns undefined for targets not in the tab order', () => {
      const checkArgs = checkSetup(
        '<a href="#" id="target" tabindex="-1" style="' +
          'display: inline-block; width:16px; height:16px; margin-right: 7px' +
          '">x</a>' +
          '<a href="#" style="' +
          'display: inline-block; width:16px; height:16px;' +
          '">x</a>'
      );

      expect(checkEvaluate.apply(checkContext, checkArgs)).toBeUndefined();
      expect(checkContext._data.messageKey).toBeUndefined();
      expect(checkContext._data.minOffset).toBe(24);
      expect(checkContext._data.closestOffset).toBeCloseTo(22, 0.2);
    });
  });

  it('ignores non-widget elements as neighbors', () => {
    const checkArgs = checkSetup(
      '<a href="#" id="target" style="' +
        'display: inline-block; width:16px; height:16px; margin-right: 7px' +
        '">x</a>' +
        '<div style="' +
        'display: inline-block; width:16px; height:16px;' +
        '">x</div>'
    );

    expect(checkEvaluate.apply(checkContext, checkArgs)).toBe(true);
    expect(checkContext._data.minOffset).toBe(24);
    expect(checkContext._data.closestOffset).toBeCloseTo(24, 0.2);
  });

  it('ignores non-focusable widget elements as neighbors', () => {
    const checkArgs = checkSetup(
      '<a href="#" id="target" style="' +
        'display: inline-block; width:16px; height:16px; margin-right: 7px' +
        '">x</a>' +
        '<button disabled style="' +
        'display: inline-block; width:16px; height:16px;' +
        '">x</button>'
    );

    expect(checkEvaluate.apply(checkContext, checkArgs)).toBe(true);
    expect(checkContext._data.minOffset).toBe(24);
    expect(checkContext._data.closestOffset).toBeCloseTo(24, 0.2);
  });

  it('ignores obscured widget elements as neighbors', () => {
    const checkArgs = checkSetup(`
      <div style="position: fixed; bottom: 0">
        <a href="#">Go to top</a>
      </div>
      <div id="target" style="position: fixed; bottom: 0; left: 0; right: 0; background: #eee">
        Cookies: <a href="#">Accept all cookies</a>
      </div>
    `);

    expect(checkEvaluate.apply(checkContext, checkArgs)).toBe(true);
    expect(checkContext._data.minOffset).toBe(24);
    expect(checkContext._data.closestOffset).toBeCloseTo(24, 0.2);
  });

  it('sets all elements that are too close as related nodes', () => {
    const checkArgs = checkSetup(
      '<a href="#" id="left" style="' +
        'display: inline-block; width:16px; height:16px;' +
        '">x</a>' +
        '<a href="#" id="target" style="' +
        'display: inline-block; width:16px; height:16px; margin-right: 4px' +
        '">x</a>' +
        '<a href="#" id="right" style="' +
        'display: inline-block; width:16px; height:16px;' +
        '">x</a>'
    );
    expect(checkEvaluate.apply(checkContext, checkArgs)).toBe(false);
    expect(checkContext._data.minOffset).toBe(24);
    expect(checkContext._data.closestOffset).toBeCloseTo(8, 0.2);

    const relatedIds = checkContext._relatedNodes.map(function (node) {
      return '#' + node.id;
    });
    expect(relatedIds).toEqual(['#left', '#right']);
  });

  it('returns undefined if there are too many focusable widgets', () => {
    let html = '';
    for (let i = 0; i < 100; i++) {
      html += `
        <tr>
          <td><a href="#">A</a></td>
          <td><button>B</button></td>
          <td><button>C</button></td>
          <td><button>D</button></td>
        </tr>
      `;
    }
    const checkArgs = checkSetup(`
      <div id="target" role="tabpanel" tabindex="0" style="display:inline-block">
        <table id="tab-table">${html}</table>
      </div>
    `);
    expect(checkEvaluate.apply(checkContext, checkArgs)).toBeUndefined();
    expect(checkContext._data).toEqual({
      messageKey: 'tooManyRects',
      closestOffset: 0,
      minOffset: 24
    });
  });

  describe('when neighbors are focusable but not tabbable', () => {
    it('returns undefined if all neighbors are not tabbable', () => {
      const checkArgs = checkSetup(
        '<a href="#" id="left" tabindex="-1" style="' +
          'display: inline-block; width:16px; height:16px;' +
          '">x</a>' +
          '<a href="#" id="target" style="' +
          'display: inline-block; width:16px; height:16px; margin-right: 4px' +
          '">x</a>' +
          '<a href="#" id="right" tabindex="-1" style="' +
          'display: inline-block; width:16px; height:16px;' +
          '">x</a>'
      );
      expect(checkEvaluate.apply(checkContext, checkArgs)).toBeUndefined();
      expect(checkContext._data.messageKey).toBe('nonTabbableNeighbor');
      expect(checkContext._data.minOffset).toBe(24);
      expect(checkContext._data.closestOffset).toBeCloseTo(8, 0.2);

      const relatedIds = checkContext._relatedNodes.map(function (node) {
        return '#' + node.id;
      });
      expect(relatedIds).toEqual(['#left', '#right']);
    });

    it('returns false if some but not all neighbors are not tabbable', () => {
      const checkArgs = checkSetup(
        '<a href="#" id="left" style="' +
          'display: inline-block; width:16px; height:16px;' +
          '">x</a>' +
          '<a href="#" id="target" style="' +
          'display: inline-block; width:16px; height:16px; margin-right: 4px' +
          '">x</a>' +
          '<a href="#" id="right" tabindex="-1" style="' +
          'display: inline-block; width:16px; height:16px;' +
          '">x</a>'
      );
      expect(checkEvaluate.apply(checkContext, checkArgs)).toBe(false);
      expect(checkContext._data.messageKey).toBeUndefined();
      expect(checkContext._data.minOffset).toBe(24);
      expect(checkContext._data.closestOffset).toBeCloseTo(8, 0.2);

      const relatedIds = checkContext._relatedNodes.map(function (node) {
        return '#' + node.id;
      });
      expect(relatedIds).toEqual(['#left', '#right']);
    });

    it('returns true if the target is 10x the minOffset', () => {
      const checkArgs = checkSetup(
        '<a href="#" id="left" style="' +
          'display: inline-block; width:16px; height:16px;' +
          '">x</a>' +
          '<a href="#" id="target" style="' +
          'display: inline-block; width:240px; height:240px; margin-right: 4px' +
          '">x</a>' +
          '<a href="#" id="right" style="' +
          'display: inline-block; width:16px; height:16px;' +
          '">x</a>'
      );
      expect(checkEvaluate.apply(checkContext, checkArgs)).toBe(true);
      expect(checkContext._data.minOffset).toBe(24);
      expect(checkContext._data.messageKey).toBe('large');
    });
  });
});
