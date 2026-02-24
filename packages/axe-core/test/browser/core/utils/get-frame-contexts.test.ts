import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('utils.getFrameContexts', () => {
  const getFrameContexts = axe.utils.getFrameContexts;
  const fixture = document.querySelector('#fixture');

  it('returns an empty array if the page has no frames', () => {
    const frameContext = getFrameContexts();
    expect(Array.isArray(frameContext)).toBe(true);
    expect(frameContext).toHaveLength(0);
  });

  it('returns a `frameSelector` for each included frame', () => {
    fixture.innerHTML =
      '<iframe></iframe>' + '<iframe></iframe>' + '<iframe></iframe>';

    const selectors = getFrameContexts().map(frameData => {
      return frameData.frameSelector;
    });
    expect(selectors).toHaveLength(3);
    expect(selectors[0]).toContain('iframe:nth-child(1)');
    expect(selectors[1]).toContain('iframe:nth-child(2)');
    expect(selectors[2]).toContain('iframe:nth-child(3)');
  });

  it('sets frameContext.initiator to false for each included frame', () => {
    fixture.innerHTML =
      '<iframe></iframe>' + '<iframe></iframe>' + '<iframe></iframe>';

    const contexts = getFrameContexts().map(frameData => {
      return frameData.frameContext;
    });

    expect(contexts).toHaveLength(3);
    expect(contexts[0].initiator).toBe(false);
    expect(contexts[1].initiator).toBe(false);
    expect(contexts[2].initiator).toBe(false);
  });

  it('sets frameContext.focusable depending on the frame', () => {
    fixture.innerHTML =
      '<iframe></iframe>' +
      '<iframe tabindex="0"></iframe>' +
      '<iframe tabindex="-1"></iframe>';

    const contexts = getFrameContexts().map(frameData => {
      return frameData.frameContext;
    });
    expect(contexts).toHaveLength(3);
    expect(contexts[0].focusable).toBe(true);
    expect(contexts[1].focusable).toBe(true);
    expect(contexts[2].focusable).toBe(false);
  });

  it('sets frameContext.size based on frame size', () => {
    fixture.innerHTML =
      '<iframe width="1" height="1"></iframe>' +
      '<iframe width="10" height="10"></iframe>' +
      '<iframe width="100" height="100"></iframe>';

    const frameSize = getFrameContexts().map(frameData => {
      return frameData.frameContext.size;
    });
    expect(frameSize).toHaveLength(3);
    expect(frameSize[0]).toEqual({
      width: 1,
      height: 1
    });
    expect(frameSize[1]).toEqual({
      width: 10,
      height: 10
    });
    expect(frameSize[2]).toEqual({
      width: 100,
      height: 100
    });
  });

  describe('include / exclude', () => {
    it('returns a `frameContext` for each included frame', () => {
      fixture.innerHTML =
        '<iframe id="f1"></iframe>' +
        '<iframe id="f2"></iframe>' +
        '<iframe id="f3"></iframe>';
      const context = {
        include: [
          ['#f1', 'header'],
          ['#f2', 'main']
        ],
        exclude: [['#f3', 'footer']]
      };
      const contexts = getFrameContexts(context).map(frameData => {
        return frameData.frameContext;
      });

      expect(contexts).toHaveLength(3);
      expect(contexts[0].include).toEqual([['header']]);
      expect(contexts[0].exclude).toEqual([]);
      expect(contexts[1].include).toEqual([['main']]);
      expect(contexts[1].exclude).toEqual([]);
      expect(contexts[2].include).toEqual([]);
      expect(contexts[2].exclude).toEqual([['footer']]);
    });

    it('excludes non-frame contexts', () => {
      fixture.innerHTML = '<iframe id="f1"></iframe>';
      const context = {
        include: [['#header'], ['a'], ['#f1', 'header']]
      };
      const contexts = getFrameContexts(context).map(frameData => {
        return frameData.frameContext;
      });

      expect(contexts).toHaveLength(1);
      expect(contexts[0].include).toEqual([['header']]);
      expect(contexts[0].exclude).toEqual([]);
    });

    it('mixes contexts if the frame is selected twice', () => {
      fixture.innerHTML =
        '<iframe id="f1"></iframe>' + '<iframe id="f2"></iframe>';
      const context = {
        include: [
          ['#f1', 'header'],
          ['#f2', 'footer']
        ],
        exclude: [['iframe', 'main']]
      };
      const contexts = getFrameContexts(context).map(frameData => {
        return frameData.frameContext;
      });
      expect(contexts).toHaveLength(2);
      expect(contexts[0].include).toEqual([['header']]);
      expect(contexts[0].exclude).toEqual([['main']]);
      expect(contexts[1].include).toEqual([['footer']]);
      expect(contexts[1].exclude).toEqual([['main']]);
    });

    it('combines include/exclude arrays of frames selected twice', () => {
      fixture.innerHTML = '<iframe></iframe>';
      const context = {
        include: [
          ['iframe', 'header'],
          ['iframe', 'main']
        ],
        exclude: [
          ['iframe', 'aside'],
          ['iframe', 'footer']
        ]
      };
      const contexts = getFrameContexts(context).map(frameData => {
        return frameData.frameContext;
      });

      expect(contexts).toHaveLength(1);
      expect(contexts[0].include).toEqual([['header'], ['main']]);
      expect(contexts[0].exclude).toEqual([['aside'], ['footer']]);
    });

    it('skips excluded frames', () => {
      fixture.innerHTML =
        '<iframe id="f1"></iframe>' +
        '<iframe id="f2"></iframe>' +
        '<iframe id="f3"></iframe>';
      const context = {
        exclude: [[['#f2']]]
      };
      const selectors = getFrameContexts(context).map(frameData => {
        return frameData.frameSelector;
      });
      expect(selectors).toHaveLength(2);
      expect(selectors[0]).toContain('iframe:nth-child(1)');
      expect(selectors[1]).toContain('iframe:nth-child(3)');
    });

    it('skips frames excluded by a parent', () => {
      fixture.innerHTML = '<iframe></iframe>';
      const frameContexts = getFrameContexts({
        exclude: [['#fixture']]
      });
      expect(frameContexts).toHaveLength(0);
    });

    it('normalizes the context', () => {
      let frameContexts;
      fixture.innerHTML =
        '<iframe id="f1"></iframe>' + '<iframe id="f2"></iframe>';
      frameContexts = getFrameContexts('#f1');
      expect(frameContexts).toHaveLength(1);
      expect(frameContexts[0].frameSelector).toContain('iframe:nth-child(1)');
      expect(frameContexts[0].frameContext.include).toEqual([]);
      expect(frameContexts[0].frameContext.exclude).toEqual([]);

      frameContexts = getFrameContexts({ include: [['#f1']] });
      expect(frameContexts).toHaveLength(1);
      expect(frameContexts[0].frameSelector).toContain('iframe:nth-child(1)');
      expect(frameContexts[0].frameContext.include).toEqual([]);
      expect(frameContexts[0].frameContext.exclude).toEqual([]);

      frameContexts = getFrameContexts({ exclude: [['#f2']] });
      expect(frameContexts).toHaveLength(1);
      expect(frameContexts[0].frameSelector).toContain('iframe:nth-child(1)');
      expect(frameContexts[0].frameContext.include).toEqual([]);
      expect(frameContexts[0].frameContext.exclude).toEqual([]);
    });

    it('accepts elements', () => {
      let frameContexts;
      fixture.innerHTML =
        '<iframe id="f1"></iframe>' + '<iframe id="f2"></iframe>';
      const f1 = fixture.querySelector('#f1');
      const f2 = fixture.querySelector('#f2');
      frameContexts = getFrameContexts(f1);
      expect(frameContexts).toHaveLength(1);
      expect(frameContexts[0].frameSelector).toContain('iframe:nth-child(1)');
      expect(frameContexts[0].frameContext.include).toEqual([]);
      expect(frameContexts[0].frameContext.exclude).toEqual([]);

      frameContexts = getFrameContexts({ include: [f1] });
      expect(frameContexts).toHaveLength(1);
      expect(frameContexts[0].frameSelector).toContain('iframe:nth-child(1)');
      expect(frameContexts[0].frameContext.include).toEqual([]);
      expect(frameContexts[0].frameContext.exclude).toEqual([]);

      frameContexts = getFrameContexts({ exclude: [f2] });
      expect(frameContexts).toHaveLength(1);
      expect(frameContexts[0].frameSelector).toContain('iframe:nth-child(1)');
      expect(frameContexts[0].frameContext.include).toEqual([]);
      expect(frameContexts[0].frameContext.exclude).toEqual([]);
    });

    it('works with nested frames', () => {
      fixture.innerHTML =
        '<iframe id="f1"></iframe>' + '<iframe id="f2"></iframe>';
      const context = {
        include: [
          ['#f1', '#f3', 'header'],
          ['#f2', '#f4', '#f5', 'footer']
        ],
        exclude: [['#f2', '#f6', '#f7', '#f7', 'main']]
      };
      const contexts = getFrameContexts(context).map(frameData => {
        return frameData.frameContext;
      });

      expect(contexts).toHaveLength(2);
      expect(contexts[0].include).toEqual([['#f3', 'header']]);
      expect(contexts[0].exclude).toEqual([]);
      expect(contexts[1].include).toEqual([['#f4', '#f5', 'footer']]);
      expect(contexts[1].exclude).toEqual([['#f6', '#f7', '#f7', 'main']]);
    });

    it('works on iframes in shadow dom', () => {
      fixture.innerHTML = '<div id="shadow"></div>';
      const div = fixture.querySelector('div');
      const shadowRoot = div.attachShadow({ mode: 'open' });
      shadowRoot.innerHTML =
        '<main><iframe id="f1" width="100" height="100"></iframe></main>';

      const frameContext = getFrameContexts();

      expect(frameContext).toHaveLength(1);
      expect(frameContext[0].frameSelector).toHaveLength(2);
      expect(frameContext[0].frameSelector[1]).toBe('main > iframe');
      expect(frameContext[0].frameContext.include).toEqual([]);
      expect(frameContext[0].frameContext.exclude).toEqual([]);
    });
  });

  describe('options.iframes', () => {
    it('returns a non-empty array with `iframes: true`', () => {
      fixture.innerHTML = '<iframe></iframe>';
      const contexts = getFrameContexts({}, { iframes: true });
      expect(contexts).toHaveLength(1);
    });

    it('returns an empty array with `iframes: false`', () => {
      fixture.innerHTML = '<iframe></iframe>';
      const contexts = getFrameContexts({}, { iframes: false });
      expect(contexts).toHaveLength(0);
    });
  });
});
