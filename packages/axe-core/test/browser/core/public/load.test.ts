import { describe, it, expect, afterEach } from 'vitest';
import { captureError } from '../../../testutils';

declare const axe: any;
describe('axe._load', () => {
  const fixture = document.querySelector('#fixture');

  afterEach(() => {
    axe._audit = null;
  });

  it('should push rules on the Audit', () => {
    let mockAudit = {
      rules: [{ id: 'monkeys' }, { id: 'bananas' }]
    };

    axe._load(mockAudit);
    // TODO: this does not work yet thanks to webpack
    // expect(axe._audit.rules[0]).toBeInstanceOf(Rule);
    // expect(axe._audit.rules[1]).toBeInstanceOf(Rule);
    expect(axe._audit.rules[0].id).toBe('monkeys');
    expect(axe._audit.rules[1].id).toBe('bananas');
  });

  it('should load with a lang', () => {
    axe._load({
      lang: 'ja'
    });
    expect(axe._audit.lang).toBe('ja');
  });

  describe('respondable subscriber', () => {
    it('should add a respondable subscriber for axe.ping', () => {
      return new Promise<void>((done, reject) => {
        const winParent = window.parent;
        let mockAudit = {
          rules: [{ id: 'monkeys' }, { id: 'bananas' }]
        };

        axe._load(mockAudit);

        const frame = document.createElement('iframe');
        frame.src = '../mock/frames/test.html';
        frame.addEventListener('load', () => {
          const win = frame.contentWindow;
          window.parent = win;
          win.postMessage = captureError(message => {
            const data = JSON.parse(message);
            expect(data.payload).toEqual({ axe: true });
            window.parent = winParent;
            done();
          }, reject);
          axe.utils.respondable(win, 'axe.ping', { axe: true });
        });

        fixture.appendChild(frame);
      });
    });

    describe('given command rules', () => {
      // todo: see issue - https://github.com/dequelabs/axe-core/issues/2168
      it.skip('should call `runRules` and default context to empty object', () => {
        return new Promise<void>((done, reject) => {
          let mockAudit = {
            rules: []
          };
          let origSub = window.utils.respondable.subscribe;
          let orig = window.runRules;
          window.runRules = (context, options, callback) => {
            expect(context).toEqual({});
            expect(typeof callback).toBe('function');
            done();
          };

          axe.utils.respondable.subscribe = (topic, callback) => {
            callback(
              { data: 'iscool', command: 'rules' },
              undefined,
              response => {
                // ping callback will call this response function
                expect(response).toBeTruthy();
              }
            );
          };
          axe._load(mockAudit);

          window.utils.respondable.subscribe = origSub;
          window.runRules = orig;
        });
      });

      // todo: see issue - https://github.com/dequelabs/axe-core/issues/2168
      it.skip('should pass data.context to `runRules`', () => {
        return new Promise<void>((done, reject) => {
          let origSub = window.utils.respondable.subscribe;
          let orig = window.runRules;
          window.runRules = (context, options, callback) => {
            expect(context).toEqual({ include: ['monkeys'] });
            expect(typeof callback).toBe('function');
            done();
          };

          axe.utils.respondable.subscribe = (topic, callback) => {
            callback(
              { command: 'rules', context: { include: ['monkeys'] } },
              undefined,
              response => {
                expect(response).toBeTruthy();
              }
            );
          };
          axe._load({
            rules: []
          });

          window.utils.respondable.subscribe = origSub;
          window.runRules = orig;
        });
      });

      // todo: see issue - https://github.com/dequelabs/axe-core/issues/2168
      it.skip('should default include to current document if none are found', () => {
        return new Promise<void>((done, reject) => {
          let origSub = axe.utils.respondable.subscribe;
          let orig = window.runRules;
          const expected = { include: [document] };
          window.runRules = context => {
            expect(context).toEqual(expected);
            done();
          };

          axe.utils.respondable.subscribe = (topic, callback) => {
            callback(
              { command: 'rules', context: { include: [] } },
              undefined,
              () => {}
            );
          };
          axe._load({
            rules: []
          });
          window.runRules = orig;
          axe.utils.respondable.subscribe = origSub;
        });
      });
    });

    describe('given command cleanup-plugins', () => {
      // todo: see issue - https://github.com/dequelabs/axe-core/issues/2168
      it.skip('should call `cleanup`', () => {
        return new Promise<void>((done, reject) => {
          let mockAudit = {
            rules: []
          };
          let origSub = window.utils.respondable.subscribe;
          let orig = window.cleanup;
          window.cleanup = callback => {
            expect(typeof callback).toBe('function');
            done();
          };

          axe.utils.respondable.subscribe = (topic, callback) => {
            callback(
              {
                command: 'cleanup-plugin'
              },
              undefined,
              response => {
                // ping callback will call this response function
                expect(response).toBeTruthy();
              }
            );
          };
          axe._load(mockAudit);

          window.utils.respondable.subscribe = origSub;
          window.cleanup = orig;
        });
      });
    });
  });
});
