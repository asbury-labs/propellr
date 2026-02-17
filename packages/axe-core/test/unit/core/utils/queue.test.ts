import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.queue', () => {
  describe('defer', () => {
    it('should be a function', () => {
      let q = axe.utils.queue();
      expect(typeof q.defer).toBe('function');
    });

    it('should push onto the "axe.utils.queue"', done => {
      let q = axe.utils.queue();

      q.defer(resolve => {
        setTimeout(() => {
          resolve(1);
        }, 0);
      });

      q.defer(resolve => {
        setTimeout(() => {
          resolve(2);
        }, 0);
      });

      q.then(data => {
        expect(data).toEqual([1, 2]);
        done();
      });
    });

    it('should execute resolve immediately if defered functions are already complete', () => {
      let q = axe.utils.queue(),
        complete = false;

      q.defer(resolve => {
        resolve(1);
      });

      q.defer(resolve => {
        resolve(2);
      });

      q.then(data => {
        complete = true;
        expect(data).toEqual([1, 2]);
      });

      expect(complete).toBe(true);
    });

    it('is chainable', () => {
      let q = axe.utils.queue();
      expect(q).toBe(q.defer(() => {}));
    });

    it('throws if then was already called', () => {
      expect(() => {
        let q = axe.utils.queue();
        q.defer(resolve => {
          resolve();
        });

        q.then(() => {});

        q.defer(resolve => {
          resolve();
        });
      }).toThrow();
    });

    it('can await another queue', done => {
      const q1 = axe.utils.queue();
      const q2 = axe.utils.queue();

      q1.defer(resolve => {
        setTimeout(() => {
          resolve(123);
        }, 10);
      });

      q2.defer(q1);
      q2.then(res => {
        // unwrap both queue results
        expect(res[0][0]).toBe(123);
        done();
      });
    });
  });

  describe('then', () => {
    it('should be a function', () => {
      let q = axe.utils.queue();
      expect(typeof q.then).toBe('function');
    });

    it('should execute immediately if axe.utils.queue is complete', () => {
      let q = axe.utils.queue();
      let result = false;

      q.then(() => {
        result = true;
      });

      expect(result).toBe(true);
    });

    it('is chainable', () => {
      let q = axe.utils.queue();
      expect(q).toBe(q.then(() => {}));
    });

    it('throws when called more than once', () => {
      expect(() => {
        let q = axe.utils.queue();
        q.defer(() => {});
        q.then(() => {});
        q.then(() => {});
      }).toThrow();
    });
  });

  describe('abort', () => {
    it('should be a function', () => {
      let q = axe.utils.queue();
      expect(typeof q.abort).toBe('function');
    });

    it('stops `then` from being called', done => {
      let q = axe.utils.queue();

      q.defer(resolve => {
        setTimeout(() => {
          resolve(true);
        }, 100);
      });

      q.then(() => {
        expect(false).toBeTruthy();
      });
      q.catch(() => {});

      setTimeout(() => {
        const data = q.abort();
        expect(true).toBeTruthy();
        expect(typeof data[0]).toBe('function');
        done();
      }, 1);
    });

    it('sends a message to `catch`', done => {
      let q = axe.utils.queue();
      q.defer(() => {});

      q.then(() => {});
      q.catch(err => {
        expect(err).toBe('Super sheep');
        done();
      });

      q.abort('Super sheep');
    });
  });

  describe('catch', () => {
    it('is called when defer throws an error', done => {
      let q = axe.utils.queue();
      q.defer(() => {
        throw 'error! 1';
      });

      q.catch(e => {
        expect(e).toBe('error! 1');
        done();
      });
    });

    it('can catch error synchronously', done => {
      let q = axe.utils.queue();
      let sync = true;
      q.defer(() => {
        throw 'error! 2';
      });

      q.catch(e => {
        expect(e).toBe('error! 2');
        expect(sync).toBeTruthy();
        done();
      });
      sync = false;
    });

    it('is called when the reject method is called', done => {
      /*eslint no-unused-vars: 0*/
      let q = axe.utils.queue();
      let errorsCaught = 0;

      q.defer((resolve, reject) => {
        setTimeout(() => {
          reject('error! 2');
        }, 1);
      });

      q.catch(e => {
        expect(e).toBe('error! 2');
        errorsCaught += 1;
        done();
      });
    });

    it('will not run `then` if an error is thrown', done => {
      let q = axe.utils.queue();
      q.defer(() => {
        throw 'error! 3';
      });

      q.then(() => {
        expect(false).toBeTruthy();
      });
      q.catch(e => {
        expect(e).toBe('error! 3');
        done();
      });
    });

    it('does not continue other tasks if an error occurs', done => {
      let q = axe.utils.queue();
      let aborted;
      q.defer(() => {
        throw 'error! 3';
      });
      q.defer(() => {
        aborted = false;
      });

      q.then(() => {
        expect(false).toBeTruthy();
      });
      q.catch(e => {
        expect(e).toBe('error! 3');
      });
      setTimeout(() => {
        expect(aborted).not.toBe(false);
        done();
      }, 30);
    });

    it('is chainable', () => {
      let q = axe.utils.queue();
      expect(q).toBe(q.catch(() => {}));
    });

    it('throws when called more than once', () => {
      expect(() => {
        let q = axe.utils.queue();
        q.defer(() => {});
        q.catch(() => {});
        q.catch(() => {});
      }).toThrow();
    });
  });
});
