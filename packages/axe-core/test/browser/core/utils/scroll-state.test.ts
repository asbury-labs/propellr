import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('axe.utils.getScrollState', () => {
  let mockWin;
  const getScrollState = axe.utils.getScrollState;

  let fixture = document.getElementById('fixture');

  beforeEach(() => {
    mockWin = {
      pageXOffset: 1,
      pageYOffset: 3,
      document: {
        documentElement: {
          children: [],
          scrollTop: 3,
          scrollHeight: 4
        }
      },
      body: { children: [] }
    };
    fixture.innerHTML = '';
  });

  it('takes the window object as an optional argument', () => {
    expect(getScrollState()).toEqual(getScrollState(window));
  });

  it('returns the window as the first item, if pageXOffset is supported', () => {
    expect(getScrollState(mockWin)[0]).toEqual({
      elm: mockWin,
      top: mockWin.pageYOffset,
      left: mockWin.pageXOffset
    });
  });

  it('returns the html as the first item, if pageXOffset is not supported', () => {
    mockWin.pageYOffset = undefined;
    mockWin.pageXOffset = undefined;
    const html = mockWin.document.documentElement;

    expect(getScrollState(mockWin)[0]).toEqual({
      elm: html,
      top: html.scrollTop,
      left: html.scrollLeft
    });
  });

  it('grabs scrollTop and scrollLeft from all descendants of body', () => {
    fixture.innerHTML =
      '<div style="overflow:auto; height: 50px" id="tgt1">' +
      '<div style="height: 100px"> Han Solo </div>' +
      '<div style="overflow: auto; height: 50px" id="tgt2">' +
      '<div style="height: 100px"> Chewbacca </div>' +
      '</div>' +
      '</div>';

    let tgt1 = document.getElementById('tgt1');
    let tgt2 = document.getElementById('tgt2');
    tgt1.scrollTop = 10;
    tgt2.scrollTop = 20;

    let scrollState = getScrollState();

    expect(
      scrollState.find(scroll => {
        return scroll.elm === tgt1;
      })
    ).toEqual({ elm: tgt1, top: 10, left: 0 });
    expect(
      scrollState.find(scroll => {
        return scroll.elm === tgt2;
      })
    ).toEqual({ elm: tgt2, top: 20, left: 0 });
  });

  it('ignores elements with overflow visible', () => {
    fixture.innerHTML =
      '<div style="overflow:visible; height: 50px" id="tgt1">' +
      '<div style="height: 100px" id="tgt2"> Han Solo </div>' +
      '</div>';

    let tgt1 = document.getElementById('tgt1');
    let tgt2 = document.getElementById('tgt2');
    let scrollState = getScrollState();

    expect(
      scrollState.find(scroll => {
        return scroll.elm === tgt1;
      })
    ).toBeUndefined();
    expect(
      scrollState.find(scroll => {
        return scroll.elm === tgt2;
      })
    ).toBeUndefined();
  });

  it('ignores elements that do not overflow', () => {
    fixture.innerHTML =
      '<div style="overflow:auto; height: 300px" id="tgt1">' +
      '<div style="height: 100px"> Han Solo </div>' +
      '<div style="overflow: hidden; height: 150px" id="tgt2">' +
      '<div style="height: 100px"> Chewbacca </div>' +
      '</div>' +
      '</div>';

    let tgt1 = document.getElementById('tgt1');
    let tgt2 = document.getElementById('tgt2');
    let scrollState = getScrollState();

    expect(
      scrollState.find(scroll => {
        return scroll.elm === tgt1;
      })
    ).toBeUndefined();
    expect(
      scrollState.find(scroll => {
        return scroll.elm === tgt2;
      })
    ).toBeUndefined();
  });

  it('does not fail with svg elements', () => {
    fixture.innerHTML =
      '<svg class="svg" xmlns="http://www.w3.org/2000/svg" width="13" height="17" viewBox="0 0 13 17">' +
      '<path fill="currentColor" d="M6.5 0L0 6.5 1.4 8l4-4v12.7h2V4l4.3 4L13 6.4z"></path>' +
      '</svg>';

    expect(() => {
      getScrollState();
    }).not.toThrow();
  });
});

describe('axe.utils.setScrollState', () => {
  const setScrollState = axe.utils.setScrollState;

  let fixture = document.getElementById('fixture');
  afterEach(() => {
    fixture.innerHTML = '';
  });

  it('sets scrollTop and scrollLeft for regular nodes', () => {
    const elm1 = {},
      elm2 = {};
    setScrollState([
      { elm: elm1, top: 10, left: 20 },
      { elm: elm2, top: 30, left: 40 }
    ]);

    expect(elm1).toEqual({ scrollTop: 10, scrollLeft: 20 });
    expect(elm2).toEqual({ scrollTop: 30, scrollLeft: 40 });
  });

  it('calls scroll() for the window element', () => {
    let called;
    const winScroll = window.scroll;
    window.scroll = (left, top) => {
      called = { top: top, left: left };
    };
    setScrollState([{ elm: window, top: 10, left: 20 }]);
    expect(called).toEqual({ top: 10, left: 20 });
    window.scroll = winScroll;
  });
});
