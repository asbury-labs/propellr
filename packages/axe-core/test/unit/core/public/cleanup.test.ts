import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
/*global cleanup */
describe('cleanup', () => {
  function createFrames(callback) {
    let frame;
    frame = document.createElement('iframe');
    frame.src = '../mock/frames/test.html';
    frame.addEventListener('load', () => {
      setTimeout(callback, 500);
    });
    fixture.appendChild(frame);
  }

  const fixture = document.getElementById('fixture');

  const assertNotCalled = () => {
    expect(false).toBeTruthy();
  };

  afterEach(() => {
    fixture.innerHTML = '';
    axe.plugins = {};
  });

  beforeEach(() => {
    axe._audit = null;
  });

  it('should throw if no audit is configured', () => {
    expect(() => {
      axe.cleanup(document, {});
    }).toThrow(/^No audit configured/);
  });

  it('should call cleanup on all plugins', done => {
    /*eslint no-unused-vars: 0*/
    let cleaned = false;
    axe._load({
      rules: []
    });
    axe.registerPlugin({
      id: 'p',
      run: () => {},
      add: impl => {
        this._registry[impl.id] = impl;
      },
      commands: []
    });
    axe.plugins.p.cleanup = res => {
      cleaned = true;
      res();
    };
    axe.cleanup(() => {
      expect(cleaned).toBe(true);
      done();
    }, assertNotCalled);
  });

  it('should not throw exception if no arguments are provided', done => {
    let cleaned = false;
    axe._load({
      rules: []
    });
    axe.registerPlugin({
      id: 'p',
      run: () => {},
      add: impl => {
        this._registry[impl.id] = impl;
      },
      commands: []
    });
    axe.plugins.p.cleanup = res => {
      cleaned = true;
      res();
    };
    expect(() => {
      axe.cleanup();
      done();
    }).not.toThrow();
  });

  it('should send command to frames to cleanup', done => {
    createFrames(() => {
      axe._load({});

      let frame = fixture.querySelector('iframe');
      const win = frame.contentWindow;
      win.addEventListener('message', message => {
        const data = JSON.parse(message.data);
        if (data.topic === 'axe.start') {
          expect(data.payload).toEqual({ command: 'cleanup-plugin' });
          done();
        }
      });

      axe.cleanup();
    });
  });
});
