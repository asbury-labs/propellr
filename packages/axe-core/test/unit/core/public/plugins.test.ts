import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('plugins', () => {
  function createFrames(callback) {
    let frame;
    const num = 2;
    let loaded = 0;

    function onLoad() {
      loaded++;
      if (loaded >= num) {
        callback();
      }
    }

    frame = document.createElement('iframe');
    frame.id = 'target';
    frame.src = '../mock/frames/frame-frame.html';

    frame.addEventListener('load', onLoad);
    fixture.appendChild(frame);

    frame = document.createElement('iframe');
    frame.src = '../mock/frames/frame-frame.html';
    frame.addEventListener('load', onLoad);
    fixture.appendChild(frame);
  }

  const fixture = document.getElementById('fixture');

  afterEach(() => {
    fixture.innerHTML = '';
    axe._audit = null;
  });

  beforeEach(() => {
    axe._load({
      rules: []
    });
  });

  it('Should have registerPlugin function', () => {
    expect(axe.registerPlugin).toBeTruthy();
    expect(typeof axe.registerPlugin).toBe('function');
  });

  it('should have an empty set of plugins', () => {
    expect({}).toEqual(axe.plugins);
  });

  it('should add a plugin to the plugins list and a command to the audit commands', () => {
    axe.registerPlugin({
      id: 'my-plugin',
      run: 'run',
      commands: [
        {
          id: 'my-command',
          callback: 'callback'
        }
      ]
    });
    expect(axe.plugins['my-plugin']).toBeTruthy();
    expect(axe.plugins['my-plugin']._run).toBe('run');
    expect(axe._audit.commands['my-command']).toBe('callback');
  });
  describe('Plugin class', () => {
    it('should call the run function of the registered plugin, when run is called', () => {
      let called = false;
      axe.registerPlugin({
        id: 'my-plugin',
        run: (id, action, options) => {
          called = {
            id: id,
            action: action,
            options: options
          };
        },
        commands: [
          {
            id: 'my-command',
            callback: 'callback'
          }
        ]
      });
      axe.plugins['my-plugin'].run('id', 'action', 'options');
      expect({ id: 'id', action: 'action', options: 'options' }).toEqual(
        called
      );
    });
  });
  describe('Plugin.protoype.run', () => {
    afterEach(() => {
      fixture.innerHTML = '';
      axe._audit = null;
      axe.plugins = {};
    });
    beforeEach(() => {
      axe._load({
        rules: []
      });
      axe.registerPlugin({
        id: 'multi',
        run: (id, action, options, callback) => {
          this._registry[id][action].call(
            this._registry[id],
            options,
            callback
          );
        },
        commands: [
          {
            id: 'run-multi',
            callback: (data, callback) => {
              return axe.plugins.multi.run(
                data.parameter,
                data.action,
                data.options,
                callback
              );
            }
          }
        ]
      });
      axe.plugins.multi.add({
        id: 'hideall',
        cleanup: done => {
          done();
        },
        run: (options, callback) => {
          let frames;
          const q = axe.utils.queue();

          frames = axe.utils.toArray(
            document.querySelectorAll('iframe, frame')
          );
          frames.forEach(frame => {
            q.defer((resolve, reject) => {
              axe.utils.sendCommandToFrame(
                frame,
                {
                  options: options,
                  command: 'run-multi',
                  parameter: 'hideall',
                  action: 'run'
                },
                resolve,
                reject
              );
            });
          });

          q.defer(done => {
            // implementation
            done('ola!');
          });
          q.then(data => {
            // done with all the frames
            let results = [];
            data.forEach(datum => {
              if (datum) {
                results = results.concat(datum);
              }
            });
            callback(results);
          }).catch(callback);
        }
      });
    });
    it('should work without frames', done => {
      axe.plugins.multi.run('hideall', 'run', {}, results => {
        expect(results).toEqual(['ola!']);
        done();
      });
    });
    it('should work with frames', done => {
      createFrames(() => {
        setTimeout(() => {
          axe.plugins.multi.run('hideall', 'run', {}, results => {
            expect(results).toEqual(['ola!', 'ola!', 'ola!', 'ola!', 'ola!']);
            done();
          });
        }, 500);
      });
    });
    it("should call the implementation's cleanup function", done => {
      let called = false;
      axe.plugins.multi.cleanup = doneFn => {
        called = true;
        doneFn();
      };
      axe.plugins.multi.cleanup(() => {
        expect(called).toBeTruthy();
        done();
      });
    });
  });
});
