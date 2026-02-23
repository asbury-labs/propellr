import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { captureError, shadowSupport } from '../../../../testutils';

declare const axe: any;
function afterMessage(win, callback) {
  const handler = () => {
    win.removeEventListener('message', handler);
    // Wait one more tick for stuff to resolve
    setTimeout(() => {
      callback();
    }, 10);
  };
  win.addEventListener('message', handler);
}

function once(callback) {
  let called = false;
  return function () {
    if (!called) {
      callback.apply(this, arguments);
    }
    called = true;
  };
}

describe('frame-messenger', () => {
  let fixture,
    axeVersion,
    axeApplication,
    frame,
    frameWin,
    respondable,
    frameSubscribe,
    axeLog;
  const postMessage = window.postMessage;
  const shadowSupported = shadowSupport.v1;

  beforeEach(() => {
    return new Promise<void>((resolve, reject) => {
      respondable = axe.utils.respondable;
      axeVersion = axe.version;
      axeLog = axe.log;
      axeApplication = axe._audit.application;

      frame = document.createElement('iframe');
      frame.src = '../mock/frames/test.html';
      frame.addEventListener('load', () => {
        frameWin = frame.contentWindow;
        frameSubscribe = frameWin.axe.utils.respondable.subscribe;
        resolve();
      });
      frame.addEventListener('error', reject);

      fixture = document.querySelector('#fixture');
      fixture.appendChild(frame);
    });
  });

  afterEach(() => {
    axe.version = axeVersion;
    axe._audit.application = axeApplication;
    axe.log = axeLog;
    axe.reset();
    window.postMessage = postMessage;
  });

  describe('subscribe', () => {
    it('is called with the same topic', () => {
      return new Promise<void>((done, reject) => {
        let called = false;
        frameSubscribe('greeting', () => {
          called = true;
        });
        respondable(frameWin, 'greeting');
        afterMessage(
          frameWin,
          captureError(() => {
            expect(called).toBe(true);
            done();
          }, reject)
        );
      });
    });

    (shadowSupported ? it : xit)('works with frames in shadow DOM', () => {
      return new Promise<void>((done, reject) => {
        // Safe: test-only static HTML for DOM fixture
        fixture.innerHTML = '<div id="shadow-root"></div>';
        const shadowRoot = fixture
          .querySelector('#shadow-root')
          .attachShadow({ mode: 'open' });
        frame = document.createElement('iframe');
        frame.src = '../mock/frames/test.html';

        frame.addEventListener('load', () => {
          let called = false;
          frameWin = frame.contentWindow;
          frameSubscribe = frameWin.axe.utils.respondable.subscribe;

          frameSubscribe('greeting', msg => {
            expect(msg).toBe('hello');
            called = true;
          });
          respondable(frameWin, 'greeting', 'hello');
          afterMessage(
            frameWin,
            captureError(() => {
              expect(called).toBe(true);
              done();
            }, reject)
          );
        });
        shadowRoot.appendChild(frame);
      });
    });

    it('is not called on a different topic', () => {
      return new Promise<void>((done, reject) => {
        let called = false;
        frameSubscribe('otherTopic', () => {
          called = true;
        });
        respondable(frameWin, 'greeting');
        afterMessage(
          frameWin,
          captureError(() => {
            expect(called).toBe(false);
            done();
          }, reject)
        );
      });
    });

    it('is not called for different axe-core versions', () => {
      return new Promise<void>((done, reject) => {
        let called = false;
        axe.version = '1.0.0';
        frameSubscribe('greeting', () => {
          called = true;
        });
        respondable(frameWin, 'greeting');
        afterMessage(
          frameWin,
          captureError(() => {
            expect(called).toBe(false);
            done();
          }, reject)
        );
      });
    });

    it('is not called with the "x.y.z" wildcard', () => {
      return new Promise<void>((done, reject) => {
        let called = false;
        axe.version = 'x.y.z';
        frameSubscribe('greeting', () => {
          called = true;
        });
        respondable(frameWin, 'greeting');
        afterMessage(
          frameWin,
          captureError(() => {
            expect(called).toBe(false);
            done();
          }, reject)
        );
      });
    });

    it('is not called for different applications', () => {
      return new Promise<void>((done, reject) => {
        let called = false;
        axe._audit.application = 'Coconut';
        frameSubscribe('greeting', () => {
          called = true;
        });
        respondable(frameWin, 'greeting');
        afterMessage(
          frameWin,
          captureError(() => {
            expect(called).toBe(false);
            done();
          }, reject)
        );
      });
    });

    it('logs errors passed to respondable, rather than passing them on', () => {
      return new Promise<void>((done, reject) => {
        axe.log = captureError(e => {
          expect(e.message).toBe('expected message');
          done();
        }, reject);

        frameSubscribe('greeting', () => {
          reject(new Error('subscribe should not be called'));
        });
        respondable(frameWin, 'greeting', new Error('expected message'));
      });
    });

    it('throws if frame.parent is not the window', () => {
      frameWin.parent = frameWin;
      expect(() => {
        respondable(frameWin, 'greeting');
      }).toThrow();
    });

    it('is not called when the source is not a frame in the page', () => {
      return new Promise<void>((done, reject) => {
        const doneOnce = once(done);
        const rejectOnce = once(reject);
        let called = false;
        frameWin.axe.log = () => {
          called = true;
        };

        frameSubscribe('greeting', () => {
          rejectOnce(new Error('subscribe should not be called'));
        });
        respondable(frameWin, 'greeting');
        // Swap parent after the message is sent, but before it is received:
        frameWin.parent = frameWin;

        setTimeout(
          captureError(() => {
            expect(called).toBe(true);
            doneOnce();
          }, rejectOnce),
          100
        );
      });
    });

    it('throws when targeting itself', () => {
      expect(() => {
        respondable(window, 'greeting');
      }).toThrow();
      expect(() => {
        frameWin.respondable(frameWin, 'greeting');
      }).toThrow();
    });

    it('throws when targeting a window that is not a frame in the page', () => {
      const blankPage = window.open('');
      const frameCopy = window.open(frameWin.location.href);

      // seems ie11 can't open new windows?
      if (!blankPage) {
        return;
      }

      // Cleanup
      setTimeout(() => {
        blankPage.close();
        frameCopy.close();
      });

      expect(() => {
        respondable(blankPage, 'greeting');
      }).toThrow();
      expect(() => {
        respondable(frameCopy, 'greeting');
      }).toThrow();
    });

    it('is not triggered by "repeaters"', () => {
      return new Promise<void>((done, reject) => {
        let calls = 0;
        frameSubscribe('greeting', () => {
          calls++;
        });
        // Repeat fire the event
        frameWin.addEventListener('message', function handler(evt) {
          frameWin.postMessage(evt.data, '*');
          frameWin.removeEventListener('message', handler);
        });

        respondable(frameWin, 'greeting', 'hello');
        setTimeout(
          captureError(() => {
            expect(calls).toBe(1);
            done();
          }, reject),
          100
        );
      });
    });

    it('is not called if origin does not match', () => {
      return new Promise<void>(done => {
        axe.configure({
          allowedOrigins: ['http://customOrigin.com']
        });
        let spy = vi.fn();

        frameSubscribe('greeting', spy);
        respondable(frameWin, 'greeting', 'hello');

        setTimeout(() => {
          expect(spy.called).toBe(false);
          done();
        }, 500);
      });
    });

    it('is called if origin is <unsafe_all_origins>', () => {
      return new Promise<void>(done => {
        axe.configure({
          allowedOrigins: ['<unsafe_all_origins>']
        });
        let spy = vi.fn();

        frameSubscribe('greeting', spy);
        respondable(frameWin, 'greeting', 'hello');

        setTimeout(() => {
          expect(spy).toHaveBeenCalled();
          done();
        }, 500);
      });
    });
  });
});
