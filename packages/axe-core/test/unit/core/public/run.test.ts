import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('axe.run', () => {
  let fixture = document.getElementById('fixture');
  const noop = () => {};
  let origRunRules = axe._runRules;
  let captureError = axe.testUtils.captureError;

  beforeEach(() => {
    axe._load({
      rules: [
        {
          id: 'test',
          selector: '*',
          none: ['fred']
        }
      ],
      checks: [
        {
          id: 'fred',
          evaluate: node => {
            this.relatedNodes([node]);
            return true;
          }
        }
      ]
    });
  });

  afterEach(() => {
    fixture.innerHTML = '';
    axe._audit = null;
    axe._runRules = origRunRules;
    axe._running = false;
  });

  it('takes context, options and callback as parameters', done => {
    fixture.innerHTML = '<div id="t1"></div>';
    let options = {
      runOnly: {
        type: 'rule',
        values: ['test']
      }
    };

    axe.run(['#t1'], options, () => {
      expect(true).toBeTruthy();
      done();
    });
  });

  it('uses document as content if it is not specified', done => {
    axe._runRules = ctxt => {
      expect(ctxt).toBe(document);
      done();
    };

    axe.run({ someOption: true }, noop);
  });

  it('uses an object as options if it is not specified', done => {
    axe._runRules = (ctxt, opt) => {
      expect(typeof opt).toBe('object');
      done();
    };
    axe.run(document, noop);
  });

  it('does not mutate the options object', done => {
    let options = {};
    axe.run(options, () => {
      expect(options).toEqual({});
      done();
    });
  });

  it('works with performance logging enabled', done => {
    axe.run(document, { performanceTimer: true }, (err, result) => {
      expect(typeof result).toBe('object');
      done();
    });
  });

  describe('identifies context objects', () => {
    it('based on the include property', done => {
      axe._runRules = ctxt => {
        expect(ctxt).toEqual({ include: '#BoggyB' });
        done();
      };
      axe.run({ include: '#BoggyB' }, noop);
    });

    it('based on the exclude property', done => {
      axe._runRules = ctxt => {
        expect(ctxt).toEqual({ exclude: '#BoggyB' });
        done();
      };
      axe.run({ exclude: '#BoggyB' }, noop);
    });

    it('based on the fromFrames property', done => {
      axe._runRules = ctxt => {
        expect(ctxt).toEqual({ fromFrames: ['#myFrame'] });
        done();
      };
      axe.run({ fromFrames: ['#myFrame'] }, noop);
    });

    it('based on the fromShadowDom property', done => {
      axe._runRules = ctxt => {
        expect(ctxt).toEqual({ fromShadowDom: ['#myFrame'] });
        done();
      };
      axe.run({ fromShadowDom: ['#myFrame'] }, noop);
    });

    it('ignores objects with none of those properties', done => {
      axe._runRules = (ctxt, opt) => {
        expect(opt.HHG).toEqual('hallelujah');
        done();
      };
      axe.run({ HHG: 'hallelujah' }, noop);
    });
  });

  it('does not fail if no callback is specified', done => {
    expect(() => {
      axe.run(done);
    }).not.toThrow();
  });

  it('should error if axe is already running', done => {
    axe.run(noop);
    axe.run(err => {
      expect(err.indexOf('Axe is already running') !== -1).toBe(true);
      done();
    });
  });

  describe('callback', () => {
    it('gives errors to the first argument on the callback', done => {
      axe._runRules = (ctxt, opt, resolve, reject) => {
        axe._runRules = origRunRules;
        reject('Ninja rope!');
      };

      axe.run({ reporter: 'raw' }, err => {
        expect(err).toBe('Ninja rope!');
        done();
      });
    });

    it('gives results to the second argument on the callback', done => {
      axe._runRules = (ctxt, opt, resolve) => {
        axe._runRules = origRunRules;
        resolve('MB Bomb', noop);
      };

      axe.run({ reporter: 'raw' }, (err, result) => {
        expect(err).toBe(null);
        expect(result).toBe('MB Bomb');
        done();
      });
    });

    it('does not run the callback twice if it throws', done => {
      let calls = 0;
      axe._runRules = (ctxt, opt, resolve) => {
        resolve([], noop);
      };

      const log = axe.log;
      axe.log = e => {
        expect(e.message).toBe('err');
        axe.log = log;
      };
      axe.run(() => {
        calls += 1;
        if (calls === 1) {
          setTimeout(() => {
            expect(calls).toBe(1);
            axe.log = log;
            done();
          }, 20);
        }
        throw new Error('err');
      });
    });

    it('is called after cleanup', done => {
      let isClean = false;
      axe._runRules = (ctxt, opt, resolve) => {
        axe._runRules = origRunRules;
        // Check that cleanup is called before the callback is executed
        resolve('MB Bomb', function cleanup() {
          isClean = true;
        });
      };

      axe.run({ reporter: 'raw' }, () => {
        expect(isClean).toBe(true);
        done();
      });
    });

    it('rejects with sync reporter errors', done => {
      axe.addReporter('throwing', () => {
        throw new Error('Something went wrong');
      });
      axe.run({ reporter: 'throwing' }, err => {
        expect(err.message).toBe('Something went wrong');
        done();
      });
    });

    it('rejects with async reporter errors', done => {
      axe.addReporter('throwing', (results, options, resolve, reject) => {
        setTimeout(() => {
          reject(new Error('Something went wrong'));
        }, 10);
      });
      axe.run({ reporter: 'throwing' }, err => {
        expect(err.message).toBe('Something went wrong');
        done();
      });
    });
  });

  describe('promise result', () => {
    /*eslint indent: 0*/
    const promiseIt = window.Promise ? it : it.skip;

    promiseIt('returns an error to catch if axe fails', done => {
      axe._runRules = (ctxt, opt, resolve, reject) => {
        axe._runRules = origRunRules;
        reject('I surrender!');
      };

      let p = axe.run({ reporter: 'raw' });
      p.then(noop).catch(err => {
        expect(err).toBe('I surrender!');
        done();
      });

      expect(p).toBeInstanceOf(window.Promise);
    });

    promiseIt('returns a promise if no callback was given', done => {
      axe._runRules = (ctxt, opt, resolve) => {
        axe._runRules = origRunRules;
        resolve('World party', noop);
      };

      let p = axe.run({ reporter: 'raw' });
      p.then(result => {
        expect(result).toBe('World party');
        done();
      });

      expect(p).toBeInstanceOf(window.Promise);
    });

    promiseIt('does not error if then() throws', done => {
      axe._runRules = (ctxt, opt, resolve) => {
        resolve([], noop);
      };

      axe
        .run()
        .then(
          () => {
            throw new Error('err');
          },
          e => {
            expect(e).toBeFalsy();
            done();
          }
        )
        .catch(e => {
          expect(e.message).toBe('err');
          done();
        });
    });

    promiseIt('is called after cleanup', done => {
      let isClean = false;
      axe._runRules = (ctxt, opt, resolve) => {
        axe._runRules = origRunRules;
        // Check that cleanup is called before the callback is executed
        resolve('MB Bomb', function cleanup() {
          isClean = true;
        });
      };

      axe
        .run({ reporter: 'raw' })
        .then(() => {
          expect(isClean).toBeTruthy();
          done();
        })
        .catch(done);
    });
  });

  describe('option reporter', () => {
    it('sets v1 as the default reporter if audit.reporter is null', done => {
      axe._runRules = (ctxt, opt) => {
        expect(opt.reporter).toBe('v1');
        axe._runRules = origRunRules;
        done();
      };
      axe._audit.reporter = null;
      axe.run(document, noop);
    });

    it('uses the audit.reporter if no reporter is set in options', done => {
      axe._runRules = (ctxt, opt) => {
        expect(opt.reporter).toBe('raw');
        axe._runRules = origRunRules;
        done();
      };
      axe._audit.reporter = 'raw';
      axe.run(document, noop);
    });

    it('does not override if another reporter is set', done => {
      axe._runRules = (ctxt, opt) => {
        expect(opt.reporter).toBe('raw');
        axe._runRules = origRunRules;
        done();
      };
      axe._audit.reporter = null;
      axe.run(document, { reporter: 'raw' }, noop);
    });
  });

  describe('option xpath', () => {
    it('returns no xpath if the xpath option is not set', done => {
      axe.run('#fixture', (err, result) => {
        expect(result.violations[0].nodes[0].xpath).toBeUndefined();
        done();
      });
    });

    it('returns the xpath if the xpath option is true', done => {
      axe.run(
        '#fixture',
        {
          xpath: true
        },
        captureError((err, result) => {
          expect(result.violations[0].nodes[0].xpath).toEqual([
            "//div[@id='fixture']"
          ]);
          done();
        }, done)
      );
    });

    it('returns xpath on related nodes', done => {
      axe.run(
        '#fixture',
        {
          xpath: true
        },
        captureError((err, result) => {
          expect(
            result.violations[0].nodes[0].none[0].relatedNodes[0].xpath
          ).toEqual(["//div[@id='fixture']"]);
          done();
        }, done)
      );
    });

    it('returns the xpath on any reporter', done => {
      axe.run(
        '#fixture',
        {
          xpath: true,
          reporter: 'no-passes'
        },
        captureError((err, result) => {
          expect(result.violations[0].nodes[0].xpath).toEqual([
            "//div[@id='fixture']"
          ]);
          done();
        }, done)
      );
    });
  });

  describe('option absolutePaths', () => {
    it('returns relative paths when falsy', done => {
      axe.run(
        '#fixture',
        {
          absolutePaths: 0
        },
        captureError((err, result) => {
          expect(result.violations[0].nodes[0].target).toEqual(['#fixture']);
          done();
        }, done)
      );
    });

    it('returns absolute paths when truthy', done => {
      axe.run(
        '#fixture',
        {
          absolutePaths: 'yes please'
        },
        captureError((err, result) => {
          expect(result.violations[0].nodes[0].target).toEqual([
            'html > body > #fixture'
          ]);
          done();
        }, done)
      );
    });

    it('returns absolute paths on related nodes', done => {
      axe.run(
        '#fixture',
        {
          absolutePaths: true
        },
        captureError((err, result) => {
          expect(
            result.violations[0].nodes[0].none[0].relatedNodes[0].target
          ).toEqual(['html > body > #fixture']);
          done();
        }, done)
      );
    });
  });
});

describe('axe.run iframes', () => {
  let fixture = document.getElementById('fixture');
  let origRunRules = axe._runRules;
  let captureError = axe.testUtils.captureError;

  beforeEach(() => {
    fixture.innerHTML = '<div id="target">Target in top frame</div>';
    axe._load({
      rules: [
        {
          id: 'html',
          selector: '#target',
          none: ['fred']
        }
      ],
      checks: [
        {
          id: 'fred',
          evaluate: () => {
            return true;
          }
        }
      ]
    });
  });

  afterEach(() => {
    fixture.innerHTML = '';
    axe._audit = null;
    axe._runRules = origRunRules;
  });

  it('includes iframes by default', done => {
    let frame = document.createElement('iframe');
    frame.addEventListener('load', () => {
      axe.run(
        '#fixture',
        {},
        captureError((err, result) => {
          expect(result.violations.length).toBe(1);
          let violation = result.violations[0];
          expect(violation.nodes.length).toBe(2);
          expect(
            violation.nodes.some(node => {
              return node.target.length === 1 && node.target[0] === '#target';
            })
          ).toBe(true);
          expect(
            violation.nodes.some(node => {
              return node.target.length === 2 && node.target[0] === 'iframe';
            })
          ).toBe(true);
          done();
        }, done)
      );
    });

    frame.src = '../mock/frames/test.html';
    fixture.appendChild(frame);
  });

  it('excludes iframes if iframes is false', done => {
    let frame = document.createElement('iframe');
    frame.addEventListener('load', () => {
      axe.run(
        '#fixture',
        { iframes: false },
        captureError((err, result) => {
          expect(result.violations.length).toBe(1);
          let violation = result.violations[0];
          expect(violation.nodes.length).toBe(1);
          expect(violation.nodes[0].target.length).toBe(1);
          expect(violation.nodes[0].target[0]).toBe('#target');
          done();
        }, done)
      );
    });

    frame.src = '../mock/frames/test.html';
    fixture.appendChild(frame);
  });

  it('ignores unexpected messages from non-axe iframes', done => {
    let frame = document.createElement('iframe');
    frame.addEventListener('load', () => {
      axe.run(
        '#fixture',
        {},
        captureError((err, result) => {
          expect(err).toBeNull();
          expect(result.violations.length).toBe(1);
          done();
        }, done)
      );
    });

    frame.src = '../mock/frames/with-echo.html';
    fixture.appendChild(frame);
  });

  it('ignores unexpected messages from axe iframes', done => {
    let frame = document.createElement('iframe');

    frame.addEventListener('load', () => {
      axe.run(
        '#fixture',
        {},
        captureError((err, result) => {
          expect(err).toBeNull();
          expect(result.violations.length).toBe(1);
          done();
        }, done)
      );
    });

    frame.src = '../mock/frames/with-echo-axe.html';
    fixture.appendChild(frame);
  });
});
