import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { captureError } from '../../../../testutils';

declare const axe: any;
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

  it('can be subscribed to', () => {
    return new Promise<void>(done => {
      frameSubscribe('greeting', () => {
        done();
      });
      respondable(frameWin, 'greeting', 'hello');
    });
  });

  it('forwards the message', () => {
    return new Promise<void>((done, reject) => {
      const expected = { hello: 'world' };
      frameSubscribe(
        'greeting',
        captureError(actual => {
          expect(actual).toEqual(expected);
          done();
        }, reject)
      );
      respondable(frameWin, 'greeting', expected);
    });
  });

  it('passes a truthy keepalive value', () => {
    return new Promise<void>((done, reject) => {
      frameSubscribe(
        'greeting',
        captureError((_, keepalive) => {
          expect(keepalive).toBe(true);
          done();
        }, reject)
      );
      respondable(frameWin, 'greeting', 'hello', 'truthy');
    });
  });

  it('passes a falsy keepalive value', () => {
    return new Promise<void>((done, reject) => {
      frameSubscribe(
        'greeting',
        captureError((_, keepalive) => {
          expect(keepalive).toBe(false);
          done();
        }, reject)
      );
      respondable(frameWin, 'greeting', 'hello', 0);
    });
  });

  it('can not publish to a parent frame', () => {
    return new Promise<void>((done, reject) => {
      let isCalled = false;
      axe.utils.respondable.subscribe('greeting', () => {
        isCalled = true;
      });
      expect(() => {
        frameWin.axe.utils.respondable(window, 'greeting', 'hello', 0);
      }).toThrow();
      setTimeout(
        captureError(() => {
          expect(isCalled).toBe(false);
          done();
        }, reject),
        100
      );
    });
  });

  it('does not expose private methods', () => {
    const methods = Object.keys(respondable).sort();
    expect(methods).toEqual(
      ['subscribe', 'isInFrame', 'updateMessenger'].sort()
    );
  });

  it('passes serialized information only', () => {
    return new Promise<void>((done, reject) => {
      const div = document.createElement('div');
      frameSubscribe(
        'greeting',
        captureError(message => {
          expect(message).toEqual({});
          done();
        }, reject)
      );

      respondable(frameWin, 'greeting', div);
    });
  });

  it('posts message to allowed origins', () => {
    axe.configure({
      allowedOrigins: [window.location.origin, 'http://customOrigin.com']
    });

    const spy = vi.spyOn(frameWin, 'postMessage');
    const posted = respondable(frameWin, 'greeting');
    expect(posted).toBe(true);
    expect(spy.mock.calls.length).toBe(2);
    expect(spy.firstCall.args[1]).toEqual(window.location.origin);
    expect(spy.secondCall.args[1]).toEqual('http://customOrigin.com');
  });

  it('posts message to allowed origins using <same_origin>', () => {
    axe.configure({
      allowedOrigins: ['<same_origin>']
    });

    const spy = vi.spyOn(frameWin, 'postMessage');
    const posted = respondable(frameWin, 'greeting');
    expect(posted).toBe(true);
    expect(spy.mock.calls.length).toBe(1);
    expect(spy.firstCall.args[1]).toEqual(window.location.origin);
  });

  it('posts message to allowed origins using <unsafe_all_origins>', () => {
    axe.configure({
      allowedOrigins: ['http://customOrigin.com', '<unsafe_all_origins>']
    });

    const spy = vi.spyOn(frameWin, 'postMessage');
    const posted = respondable(frameWin, 'greeting');
    expect(posted).toBe(true);
    expect(spy.mock.calls.length).toBe(1);
    expect(spy.firstCall.args[1]).toBe('*');
  });

  it('does not post message if no allowed origins', () => {
    axe.configure({
      allowedOrigins: []
    });
    const spy = vi.spyOn(frameWin, 'postMessage');
    const posted = respondable(frameWin, 'greeting');
    expect(posted).toBe(false);
    expect(spy.called).toBe(false);
  });

  it('does not post message if no allowed origins', () => {
    axe._audit.allowedOrigins = null;
    const spy = vi.spyOn(frameWin, 'postMessage');
    const posted = respondable(frameWin, 'greeting');
    expect(posted).toBe(false);
    expect(spy.called).toBe(false);
  });

  it('does not post message if allowed origins is empty', () => {
    axe.configure({
      allowedOrigins: []
    });
    const spy = vi.spyOn(frameWin, 'postMessage');
    const posted = respondable(frameWin, 'greeting');
    expect(posted).toBe(false);
    expect(spy.called).toBe(false);
  });

  it('throws error if origin is invalid', () => {
    axe.configure({
      allowedOrigins: ['foo.com']
    });
    expect(() => {
      respondable(frameWin, 'greeting');
    }).toThrow('allowedOrigins value "foo.com" is not a valid origin');
  });

  it('does not log error if message is null', () => {
    return new Promise<void>((done, reject) => {
      axe.configure({
        allowedOrigins: ['<unsafe_all_origins>']
      });
      let called = false;
      frameWin.axe.log = () => {
        called = true;
      };

      frameWin.postMessage(null, '*');

      setTimeout(() => {
        try {
          expect(called).toBe(false);
          done();
        } catch (e) {
          reject(e);
        }
      }, 500);
    });
  });

  describe('isInFrame', () => {
    it('is false for the page window', () => {
      const frameRespondable = frameWin.axe.utils.respondable;
      expect(respondable.isInFrame()).toBe(false);
      expect(frameRespondable.isInFrame(window)).toBe(false);
    });

    it('is true for iframes', () => {
      const frameRespondable = frameWin.axe.utils.respondable;
      expect(frameRespondable.isInFrame()).toBe(true);
      expect(respondable.isInFrame(frameWin)).toBe(true);
    });
  });
});
