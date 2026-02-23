import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

declare const axe: any;
describe('axe.utils.respondable', () => {
  const fixture = document.querySelector('#fixture');
  const respondable = axe.utils.respondable;
  const noop = vi.fn();
  let frameWin;

  beforeEach(() => {
    return new Promise<void>((resolve, reject) => {
      const frame = document.createElement('iframe');
      frame.src = '../mock/frames/test.html';
      frame.addEventListener('load', () => {
        frameWin = frame.contentWindow;
        resolve();
      });
      frame.addEventListener('error', reject);

      fixture.appendChild(frame);
    });
  });

  afterEach(() => {
    axe._thisWillBeDeletedDoNotUse.utils.setDefaultFrameMessenger(respondable);
  });

  it('should error if open is not a function', () => {
    expect(() => {
      respondable.updateMessenger({
        post: noop,
        close: noop
      });
    }).toThrow();
  });

  it('should error if post is not a function', () => {
    expect(() => {
      respondable.updateMessenger({
        open: noop
      });
    }).toThrow();
  });

  it('should error if open function return is not a function', () => {
    expect(() => {
      respondable.updateMessenger({
        post: noop,
        open: () => {
          return 1;
        }
      });
    }).toThrow();
  });

  it('should call the open function and pass the listener', () => {
    const open = vi.fn();
    respondable.updateMessenger({
      open: open,
      post: noop
    });

    expect(open).toHaveBeenCalled();
    expect(typeof open.args[0][0] === 'function').toBe(true);
  });

  it('should call previous close function', () => {
    const close = vi.fn();
    respondable.updateMessenger({
      open: () => {
        return close;
      },
      post: noop
    });

    respondable.updateMessenger({
      open: noop,
      post: noop
    });

    expect(close).toHaveBeenCalled();
  });

  it('should use the post function when making a frame post', () => {
    let post = vi.fn();
    respondable.updateMessenger({
      open: noop,
      post: post
    });

    respondable(frameWin, 'greeting');
    expect(post).toHaveBeenCalled();
  });

  it('should pass the post function the correct parameters', () => {
    let post = vi.fn();
    const callback = vi.fn();

    respondable.updateMessenger({
      open: noop,
      post: post
    });

    respondable(frameWin, 'greeting', 'hello', true, callback);
    expect(post).toHaveBeenCalledWith(
      frameWin,
      expect.objectContaining({
        topic: 'greeting',
        message: 'hello',
        keepalive: true
      }),
      callback
    );
  });

  it('should work as a full integration', () => {
    const listeners = {};
    const listener = vi.fn();

    respondable.updateMessenger({
      open: () => {
        listeners.greeting = listener;
      },
      post: (win, data) => {
        if (listeners[data.topic]) {
          listeners[data.topic]();
        }
      },
      close: noop
    });

    respondable(frameWin, 'greeting', 'hello');
    expect(listener).toHaveBeenCalled();
  });
});
