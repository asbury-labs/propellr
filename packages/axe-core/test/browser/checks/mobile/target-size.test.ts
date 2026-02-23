import { describe, it, expect, afterEach } from 'vitest';
import {
  checkSetup,
  checks,
  MockCheckContext,
  shadowCheckSetup
} from '../../../testutils';

describe('target-size tests', () => {
  const checkContext = MockCheckContext();
  const check = checks['target-size'];
  const fixture = document.querySelector('#fixture')!;

  function elmIds(elms) {
    return Array.from(elms).map(elm => {
      return '#' + elm.id;
    });
  }

  afterEach(() => {
    checkContext.reset();
  });

  it('returns false for targets smaller than minSize', () => {
    const checkArgs = checkSetup(
      '<button id="target" style="' +
        'display: inline-block; width:20px; height:30px;' +
        '">x</button>'
    );
    expect(check.evaluate.apply(checkContext, checkArgs)).toBe(false);
    expect(checkContext._data).toEqual({
      minSize: 24,
      width: 20,
      height: 30
    });
  });

  it('returns undefined for non-tabbable targets smaller than minSize', () => {
    const checkArgs = checkSetup(
      '<button id="target" tabindex="-1" style="' +
        'display: inline-block; width:20px; height:30px;' +
        '">x</button>'
    );
    expect(check.evaluate.apply(checkContext, checkArgs)).toBeUndefined();
    expect(checkContext._data).toEqual({
      minSize: 24,
      width: 20,
      height: 30
    });
  });

  it('returns true for unobscured targets larger than minSize', () => {
    const checkArgs = checkSetup(
      '<button id="target" style="' +
        'display: inline-block; width:40px; height:30px;' +
        '">x</button>'
    );
    expect(check.evaluate.apply(checkContext, checkArgs)).toBe(true);
    expect(checkContext._data).toEqual({
      minSize: 24,
      width: 40,
      height: 30
    });
  });

  it('returns true for very large targets', () => {
    const checkArgs = checkSetup(
      '<button id="target" style="' +
        'display: inline-block; width:240px; height:300px;' +
        '">x</button>'
    );
    expect(check.evaluate.apply(checkContext, checkArgs)).toBe(true);
    expect(checkContext._data).toEqual({ messageKey: 'large', minSize: 24 });
  });

  describe('when fully obscured', () => {
    it('returns true, regardless of size', () => {
      const checkArgs = checkSetup(
        '<a href="#" id="target" style="' +
          'display: inline-block; width:20px; height:20px;' +
          '">x</a>' +
          '<div id="obscurer" style="' +
          'display: inline-block; width:20px; height:20px; margin-left: -20px;' +
          '">x</div>'
      );
      expect(check.evaluate.apply(checkContext, checkArgs)).toBe(true);
      expect(checkContext._data).toEqual({ messageKey: 'obscured' });
      expect(elmIds(checkContext._relatedNodes)).toEqual(['#obscurer']);
    });

    it('returns true when obscured by another focusable widget', () => {
      const checkArgs = checkSetup(
        '<a href="#" id="target" style="' +
          'display: inline-block; width:20px; height:20px;' +
          '">x</a>' +
          '<a href="#" id="obscurer" style="' +
          'display: inline-block; width:20px; height:20px; margin-left: -20px;' +
          '">x</a>'
      );
      expect(check.evaluate.apply(checkContext, checkArgs)).toBe(true);
      expect(checkContext._data).toEqual({ messageKey: 'obscured' });
      expect(elmIds(checkContext._relatedNodes)).toEqual(['#obscurer']);
    });

    it('ignores obscuring element has pointer-events:none', () => {
      const checkArgs = checkSetup(
        '<a href="#" id="target" style="' +
          'display: inline-block; width:20px; height:20px;' +
          '">x</a>' +
          '<span style="' +
          'display: inline-block; pointer-events: none; width:20px; height:20px; margin-left: -20px;' +
          '">x</span>'
      );
      expect(check.evaluate.apply(checkContext, checkArgs)).toBe(false);
      expect(checkContext._data).toEqual({
        minSize: 24,
        width: 20,
        height: 20
      });
    });
  });

  describe('when partially obscured', () => {
    it('returns true for focusable non-widgets', () => {
      const checkArgs = checkSetup(
        '<button id="target" style="' +
          'display: inline-block; width:40px; height:30px; margin-left:30px;' +
          '">x</button>' +
          '<button id="obscurer" style="' +
          'display: inline-block; width:40px; height:30px; margin-left: -10px;' +
          '">x</button>' +
          '<span tabindex="0" style="' +
          'display: inline-block; width:40px; height:30px; margin-left: -100px;' +
          '">x</span>'
      );
      expect(check.evaluate.apply(checkContext, checkArgs)).toBe(true);
      expect(checkContext._data).toEqual({
        minSize: 24,
        width: 30,
        height: 30
      });
      expect(elmIds(checkContext._relatedNodes)).toEqual(['#obscurer']);
    });

    it('returns true for non-focusable widgets', () => {
      const checkArgs = checkSetup(
        '<button id="target" style="' +
          'display: inline-block; width:40px; height:30px; margin-left:30px;' +
          '">x</button>' +
          '<button id="obscurer" style="' +
          'display: inline-block; width:40px; height:30px; margin-left: -10px;' +
          '">x</button>' +
          '<button disabled style="' +
          'display: inline-block; width:40px; height:30px; margin-left: -100px;' +
          '">x</button>'
      );
      expect(check.evaluate.apply(checkContext, checkArgs)).toBe(true);
      expect(checkContext._data).toEqual({
        minSize: 24,
        width: 30,
        height: 30
      });
      expect(elmIds(checkContext._relatedNodes)).toEqual(['#obscurer']);
    });

    describe('by a focusable widget', () => {
      it('returns true for obscured targets with sufficient space', () => {
        const checkArgs = checkSetup(
          '<button id="target" style="' +
            'display: inline-block; width:40px; height:30px;' +
            '">x</button>' +
            '<button id="obscurer" style="' +
            'display: inline-block; width:40px; height:30px; margin-left: -10px;' +
            '">x</button>'
        );
        expect(check.evaluate.apply(checkContext, checkArgs)).toBe(true);
        expect(checkContext._data).toEqual({
          minSize: 24,
          width: 30,
          height: 30
        });
        expect(elmIds(checkContext._relatedNodes)).toEqual(['#obscurer']);
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
        expect(check.evaluate.apply(checkContext, checkArgs)).toBeUndefined();
        expect(checkContext._data).toEqual({
          messageKey: 'tooManyRects',
          minSize: 24
        });
      });

      describe('for obscured targets with insufficient space', () => {
        it('returns false if all elements are tabbable', () => {
          const checkArgs = checkSetup(
            '<button id="target" style="' +
              'display: inline-block; width:40px; height:30px; margin-left:30px;' +
              '">x</button>' +
              '<button id="obscurer1" style="' +
              'display: inline-block; width:40px; height:30px; margin-left: -10px;' +
              '">x</button>' +
              '<button id="obscurer2" style="' +
              'display: inline-block; width:40px; height:30px; margin-left: -100px;' +
              '">x</button>'
          );
          expect(check.evaluate.apply(checkContext, checkArgs)).toBe(false);
          expect(checkContext._data).toEqual({
            messageKey: 'partiallyObscured',
            minSize: 24,
            width: 20,
            height: 30
          });
          expect(elmIds(checkContext._relatedNodes)).toEqual([
            '#obscurer1',
            '#obscurer2'
          ]);
        });

        it('returns undefined if the target is not tabbable', () => {
          const checkArgs = checkSetup(
            '<button id="target" tabindex="-1" style="' +
              'display: inline-block; width:40px; height:30px; margin-left:30px;' +
              '">x</button>' +
              '<button id="obscurer1" style="' +
              'display: inline-block; width:40px; height:30px; margin-left: -10px;' +
              '">x</button>' +
              '<button id="obscurer2" style="' +
              'display: inline-block; width:40px; height:30px; margin-left: -100px;' +
              '">x</button>'
          );
          expect(check.evaluate.apply(checkContext, checkArgs)).toBeUndefined();
          expect(checkContext._data).toEqual({
            messageKey: 'partiallyObscured',
            minSize: 24,
            width: 20,
            height: 30
          });
          expect(elmIds(checkContext._relatedNodes)).toEqual([
            '#obscurer1',
            '#obscurer2'
          ]);
        });

        it('returns undefined if the obscuring node is not tabbable', () => {
          const checkArgs = checkSetup(
            '<button id="target" style="' +
              'display: inline-block; width:40px; height:30px; margin-left:30px;' +
              '">x</button>' +
              '<button id="obscurer1" tabindex="-1" style="' +
              'display: inline-block; width:40px; height:30px; margin-left: -10px;' +
              '">x</button>' +
              '<button id="obscurer2" style="' +
              'display: inline-block; width:40px; height:30px; margin-left: -100px;' +
              '">x</button>'
          );
          expect(check.evaluate.apply(checkContext, checkArgs)).toBeUndefined();
          expect(checkContext._data).toEqual({
            messageKey: 'partiallyObscuredNonTabbable',
            minSize: 24,
            width: 20,
            height: 30
          });
          expect(elmIds(checkContext._relatedNodes)).toEqual([
            '#obscurer1',
            '#obscurer2'
          ]);
        });
      });

      describe('that is a descendant', () => {
        it('returns false if the widget is tabbable', () => {
          const checkArgs = checkSetup(
            `<a role="link" aria-label="play" tabindex="0" style="display:inline-block" id="target">
              <button style="margin:1px; line-height:20px">Play</button>
            </a>`
          );
          const out = check.evaluate.apply(checkContext, checkArgs);
          expect(out).toBe(false);
        });

        it('returns true if the widget is not tabbable', () => {
          const checkArgs = checkSetup(
            `<a role="link" aria-label="play" tabindex="0" style="display:inline-block" id="target">
              <button tabindex="-1" style="margin:1px; line-height:20px">Play</button>
            </a>`
          );
          const out = check.evaluate.apply(checkContext, checkArgs);
          expect(out).toBe(true);
        });
      });

      describe('that is a descendant', () => {
        it('returns false if the widget is tabbable', () => {
          const checkArgs = checkSetup(
            `<a role="link" aria-label="play" tabindex="0" style="display:inline-block" id="target">
              <button style="margin:1px; line-height:20px">Play</button>
            </a>`
          );
          const out = check.evaluate.apply(checkContext, checkArgs);
          expect(out).toBe(false);
        });

        it('returns true if the widget is not tabbable', () => {
          const checkArgs = checkSetup(
            `<a role="link" aria-label="play" tabindex="0" style="display:inline-block" id="target">
              <button tabindex="-1" style="margin:1px; line-height:20px">Play</button>
            </a>`
          );
          const out = check.evaluate.apply(checkContext, checkArgs);
          expect(out).toBe(true);
        });
      });
    });
  });

  describe('with overflowing content', () => {
    it('returns undefined target is too small', () => {
      const checkArgs = checkSetup(
        '<a href="#" id="target"><img width="24" height="24"></a>'
      );
      expect(check.evaluate.apply(checkContext, checkArgs)).toBeUndefined();
      expect(checkContext._data).toEqual({
        minSize: 24,
        messageKey: 'contentOverflow'
      });
    });

    it('returns true if target has sufficient size', () => {
      const checkArgs = checkSetup(
        '<a href="#" id="target" style="font-size:24px;"><img width="24" height="24"></a>'
      );
      expect(check.evaluate.apply(checkContext, checkArgs)).toBe(true);
    });

    describe('and partially obscured', () => {
      it('is undefined when unobscured area is too small', () => {
        const checkArgs = checkSetup(
          '<a href="#" id="target" style="font-size:24px;">' +
            '  <img width="24" height="36" style="vertical-align: bottom;">' +
            '</a><br>' +
            '<a href="" style="margin-top:-10px; position:absolute; width:24px;">&nbsp;</a>'
        );
        expect(check.evaluate.apply(checkContext, checkArgs)).toBeUndefined();
        expect(checkContext._data).toEqual({
          minSize: 24,
          messageKey: 'contentOverflow'
        });
      });

      it('is true when unobscured area is sufficient', () => {
        const checkArgs = checkSetup(
          '<a href="#" id="target" style="font-size:24px;">' +
            '  <img width="24" height="36" style="vertical-align: bottom;">' +
            '</a><br>' +
            '<a href="" style="margin-top:-2px; position:absolute; width:24px;">&nbsp;</a>'
        );
        expect(check.evaluate.apply(checkContext, checkArgs)).toBe(true);
      });
    });

    describe('and fully obscured', () => {
      it('is undefined', () => {
        const checkArgs = checkSetup(
          '<a href="#" id="target" style="font-size:24px;">' +
            '  <img width="24" height="36" style="vertical-align: bottom;">' +
            '</a><br>' +
            '<a href="" style="margin-top:-40px; position:absolute; width:100px; height:100px;">&nbsp;</a>'
        );
        expect(check.evaluate.apply(checkContext, checkArgs)).toBeUndefined();
        expect(checkContext._data).toEqual({
          minSize: 24,
          messageKey: 'contentOverflow'
        });
      });
    });
  });

  it('works across shadow boundaries', () => {
    const checkArgs = shadowCheckSetup(
      '<span id="shadow"></span>' +
        '<button id="obscurer1" style="' +
        'display: inline-block; width:40px; height:30px; margin-left: -10px;' +
        '">x</button>' +
        '<button id="obscurer2" style="' +
        'display: inline-block; width:40px; height:30px; margin-left: -100px;' +
        '">x</button>',
      '<button id="target" style="' +
        'display: inline-block; width:40px; height:30px; margin-left:30px;' +
        '">x</button>'
    );
    expect(check.evaluate.apply(checkContext, checkArgs)).toBe(false);
    expect(checkContext._data).toEqual({
      messageKey: 'partiallyObscured',
      minSize: 24,
      width: 20,
      height: 30
    });
    expect(elmIds(checkContext._relatedNodes)).toEqual([
      '#obscurer1',
      '#obscurer2'
    ]);
  });

  it('ignores descendants of the target that are in shadow dom', () => {
    fixture.innerHTML =
      '<button id="target" style="width: 30px; height: 40px; position: absolute; left: 10px; top: 5px"><span id="shadow"></span></button>';
    const target = fixture.querySelector('#target');
    const shadow = fixture
      .querySelector('#shadow')
      .attachShadow({ mode: 'open' });
    shadow.innerHTML =
      '<div style="position: absolute; left: 5px; top: 5px; width: 50px; height: 50px;"></div>';

    axe.setup(fixture);
    const vNode = axe.utils.getNodeFromTree(target);
    expect(check.evaluate.apply(checkContext, [target, {}, vNode])).toBe(true);
  });
});
