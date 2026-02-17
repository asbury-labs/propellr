import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';

declare const axe: any;
describe('Check', () => {
  const Check = axe._thisWillBeDeletedDoNotUse.base.Check;
  const CheckResult = axe._thisWillBeDeletedDoNotUse.base.CheckResult;
  const metadataFunctionMap =
    axe._thisWillBeDeletedDoNotUse.base.metadataFunctionMap;
  const noop = () => {};

  const fixture = document.getElementById('fixture');

  afterEach(() => {
    fixture.innerHTML = '';
  });

  describe('prototype', () => {
    describe('enabled', () => {
      it('should be true by default', () => {
        const check = new Check({});
        expect(check.enabled).toBe(true);
      });
      it('should be set to whatever is passed in', () => {
        const check = new Check({ enabled: false });
        expect(check.enabled).toBe(false);
      });
    });

    describe('configure', () => {
      it('should accept one parameter', () => {
        expect(new Check({}).configure).toHaveLength(1);
      });
      it('should override options', () => {
        Check.prototype.test = () => {
          return this.options;
        };
        const check = new Check({
          options: ['foo']
        });
        check.configure({ options: { value: 'fong' } });
        expect({ value: 'fong' }).toEqual(check.test());
        delete Check.prototype.test;
      });
      it('should override evaluate', () => {
        Check.prototype.test = () => {
          return this.evaluate();
        };
        const check = new Check({
          evaluate: '() => { return "foo"; }'
        });
        check.configure({ evaluate: '() => { return "fong"; }' });
        expect('fong').toBe(check.test());
        delete Check.prototype.test;
      });
      it('should override after', () => {
        Check.prototype.test = () => {
          return this.after();
        };
        const check = new Check({
          after: '() => { return "foo"; }'
        });
        check.configure({ after: '() => { return "fong"; }' });
        expect('fong').toBe(check.test());
        delete Check.prototype.test;
      });
      it('should override evaluate as a function', () => {
        Check.prototype.test = () => {
          return this.evaluate();
        };
        const check = new Check({
          evaluate() {
            return 'foo';
          }
        });
        check.configure({
          evaluate() {
            return 'fong';
          }
        });
        expect('fong').toBe(check.test());
        delete Check.prototype.test;
      });
      it('should override after as a function', () => {
        Check.prototype.test = () => {
          return this.after();
        };
        const check = new Check({
          afterAll() {
            return 'foo';
          }
        });
        check.configure({
          afterAll() {
            return 'fong';
          }
        });
        expect('fong').toBe(check.test());
        delete Check.prototype.test;
      });
      it('should override evaluate as ID', () => {
        metadataFunctionMap['custom-evaluate'] = () => {
          return 'fong';
        };

        Check.prototype.test = () => {
          return this.evaluate();
        };
        const check = new Check({
          evaluate: '() => { return "foo"; }'
        });
        check.configure({ evaluate: 'custom-evaluate' });
        expect('fong').toBe(check.test());
        delete Check.prototype.test;
        delete metadataFunctionMap['custom-evaluate'];
      });
      it('should override after as ID', () => {
        metadataFunctionMap['custom-after'] = () => {
          return 'fong';
        };

        Check.prototype.test = () => {
          return this.after();
        };
        const check = new Check({
          after: '() => { return "foo"; }'
        });
        check.configure({ after: 'custom-after' });
        expect('fong').toBe(check.test());
        delete Check.prototype.test;
        delete metadataFunctionMap['custom-after'];
      });
      it('should error if evaluate does not match an ID', () => {
        function fn() {
          const check = new Check({});
          check.configure({ evaluate: 'does-not-exist' });
        }

        expect(fn).toThrow(
          'Function ID does not exist in the metadata-function-map: does-not-exist'
        );
      });
      it('should error if after does not match an ID', () => {
        function fn() {
          const check = new Check({});
          check.configure({ after: 'does-not-exist' });
        }

        expect(fn).toThrow(
          'Function ID does not exist in the metadata-function-map: does-not-exist'
        );
      });
      it('should override enabled', () => {
        Check.prototype.test = () => {
          return this.enabled;
        };
        const check = new Check({
          enabled: true
        });
        check.configure({ enabled: false });
        expect(false).toBe(check.test());
        delete Check.prototype.test;
      });
      it('should NOT override id', () => {
        Check.prototype.test = () => {
          return this.id;
        };
        const check = new Check({
          id: 'fong'
        });
        check.configure({ id: 'foo' });
        expect('fong').toBe(check.test());
        delete Check.prototype.test;
      });
      it('should NOT override any random property', () => {
        Check.prototype.test = () => {
          return this.random;
        };
        const check = new Check({});
        check.configure({ random: 'foo' });
        expect(undefined).toBe(check.test());
        delete Check.prototype.test;
      });
    });

    describe('run', () => {
      it('should accept 5 parameters', () => {
        expect(new Check({}).run).toHaveLength(5);
      });

      it('should pass the node through', done => {
        new Check({
          evaluate(node) {
            expect(node).toBe(fixture);
            done();
          }
        }).run(axe.utils.getFlattenedTree(fixture)[0], {}, {}, noop);
      });

      it('should pass the options through', done => {
        const expected = { monkeys: 'bananas' };

        new Check({
          options: expected,
          evaluate(node, options) {
            expect(options).toEqual(expected);
            done();
          }
        }).run(fixture, {}, {}, noop);
      });

      it('should pass the options through modified by the ones passed into the call', done => {
        const configured = { monkeys: 'bananas' },
          expected = { monkeys: 'bananas', dogs: 'cats' };

        new Check({
          options: configured,
          evaluate(node, options) {
            expect(options).toEqual(expected);
            done();
          }
        }).run(fixture, { options: expected }, {}, noop);
      });

      it('should normalize non-object options for internal checks', done => {
        metadataFunctionMap['custom-check'] = (node, options) => {
          expect(options).toEqual({ value: 'foo' });
          done();
        };
        new Check({
          evaluate: 'custom-check'
        }).run(fixture, { options: 'foo' }, {}, noop);
        delete metadataFunctionMap['custom-check'];
      });

      it('should not normalize non-object options for external checks', done => {
        new Check({
          evaluate(node, options) {
            expect(options).toEqual('foo');
            done();
          }
        }).run(fixture, { options: 'foo' }, {}, noop);
      });

      it('should pass the context through to check evaluate call', done => {
        const configured = {
          cssom: 'yay',
          source: 'this is page source',
          aom: undefined
        };
        new Check({
          options: configured,
          evaluate(node, options, virtualNode, context) {
            expect(context).toHaveProperty('cssom');
            expect(context).toEqual(configured);
            done();
          }
        }).run(fixture, {}, configured, noop);
      });

      it('should pass the virtual node through', done => {
        const tree = axe.utils.getFlattenedTree(fixture);
        new Check({
          evaluate(node, options, virtualNode) {
            expect(virtualNode).toBe(tree[0]);
            done();
          }
        }).run(tree[0]);
      });

      it.skip('should bind context to `bindCheckResult`', done => {
        const orig = axe.utils.checkHelper,
          cb = () => {
            return true;
          },
          options = {},
          context = {},
          result = { monkeys: 'bananas' };

        axe.utils.checkHelper = (checkResult, opts, callback) => {
          expect(checkResult).toBeInstanceOf(window.CheckResult);
          expect(callback).toBe(cb);
          return result;
        };

        new Check({
          evaluate() {
            expect(result).toEqual(this);
            axe.utils.checkHelper = orig;
            done();
          }
        }).run(fixture, options, context, cb);
      });

      it('should allow for asynchronous checks', done => {
        const data = { monkeys: 'bananas' };
        new Check({
          evaluate() {
            const ready = this.async();
            setTimeout(() => {
              ready(data);
            }, 10);
          }
        }).run(fixture, {}, {}, d => {
          expect(d).toBeInstanceOf(CheckResult);
          expect(d.result).toEqual(data);
          done();
        });
      });

      it('should pass `null` as the parameter if not enabled', done => {
        new Check({
          evaluate() {},
          enabled: false
        }).run(fixture, {}, {}, data => {
          expect(data).toBeNull();
          done();
        });
      });

      it('should pass `null` as the parameter if options disable', done => {
        new Check({
          evaluate() {}
        }).run(
          fixture,
          {
            enabled: false
          },
          {},
          data => {
            expect(data).toBeNull();
            done();
          }
        );
      });

      it('passes a result to the resolve argument', done => {
        new Check({
          evaluate() {
            return true;
          }
        }).run(fixture, {}, {}, data => {
          expect(data).toBeInstanceOf(CheckResult);
          expect(data.result).toBe(true);
          done();
        });
      });

      it('should pass errors to the reject argument', done => {
        new Check({
          evaluate() {
            throw new Error('Grenade!');
          }
        }).run(fixture, {}, {}, noop, err => {
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toBe('Grenade!');
          done();
        });
      });
    });

    describe('runSync', () => {
      it('should accept 3 parameters', () => {
        expect(new Check({}).runSync).toHaveLength(3);
      });

      it('should pass the node through', () => {
        new Check({
          evaluate(node) {
            expect(node).toBe(fixture);
          }
        }).runSync(axe.utils.getFlattenedTree(fixture)[0], {}, {});
      });

      it('should pass the options through', () => {
        const expected = { monkeys: 'bananas' };

        new Check({
          options: expected,
          evaluate(node, options) {
            expect(options).toEqual(expected);
          }
        }).runSync(fixture, {}, {});
      });

      it('should pass the options through modified by the ones passed into the call', () => {
        const configured = { monkeys: 'bananas' },
          expected = { monkeys: 'bananas', dogs: 'cats' };

        new Check({
          options: configured,
          evaluate(node, options) {
            expect(options).toEqual(expected);
          }
        }).runSync(fixture, { options: expected }, {});
      });

      it('should normalize non-object options for internal checks', done => {
        metadataFunctionMap['custom-check'] = (node, options) => {
          expect(options).toEqual({ value: 'foo' });
          done();
        };
        new Check({
          evaluate: 'custom-check'
        }).runSync(fixture, { options: 'foo' }, {});
        delete metadataFunctionMap['custom-check'];
      });

      it('should not normalize non-object options for external checks', done => {
        new Check({
          evaluate(node, options) {
            expect(options).toEqual('foo');
            done();
          }
        }).runSync(fixture, { options: 'foo' }, {});
      });

      it('should pass the context through to check evaluate call', () => {
        const configured = {
          cssom: 'yay',
          source: 'this is page source',
          aom: undefined
        };
        new Check({
          options: configured,
          evaluate(node, options, virtualNode, context) {
            expect(context).toHaveProperty('cssom');
            expect(context).toEqual(configured);
          }
        }).runSync(fixture, {}, configured);
      });

      it('should pass the virtual node through', () => {
        const tree = axe.utils.getFlattenedTree(fixture);
        new Check({
          evaluate(node, options, virtualNode) {
            expect(virtualNode).toBe(tree[0]);
          }
        }).runSync(tree[0]);
      });

      it('should throw error for asynchronous checks', () => {
        const data = { monkeys: 'bananas' };

        try {
          new Check({
            evaluate() {
              const ready = this.async();
              setTimeout(() => {
                ready(data);
              }, 10);
            }
          }).runSync(fixture, {}, {});
        } catch (err) {
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toBe(
            'Cannot run async check while in a synchronous run'
          );
        }
      });

      it('should pass `null` as the parameter if not enabled', () => {
        const data = new Check({
          evaluate() {},
          enabled: false
        }).runSync(fixture, {}, {});

        expect(data).toBeNull();
      });

      it('should pass `null` as the parameter if options disable', () => {
        const data = new Check({
          evaluate() {}
        }).runSync(
          fixture,
          {
            enabled: false
          },
          {}
        );
        expect(data).toBeNull();
      });

      it('passes a result to the resolve argument', () => {
        const data = new Check({
          evaluate() {
            return true;
          }
        }).runSync(fixture, {}, {});
        expect(data).toBeInstanceOf(CheckResult);
        expect(data.result).toBe(true);
      });

      it('should throw errors', () => {
        try {
          new Check({
            evaluate() {
              throw new Error('Grenade!');
            }
          }).runSync(fixture, {}, {});
        } catch (err) {
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toBe('Grenade!');
        }
      });
    });

    describe('getOptions', () => {
      let check;
      beforeEach(() => {
        check = new Check({
          options: {
            foo: 'bar'
          }
        });
      });

      it('should return default check options', () => {
        expect(check.getOptions()).toEqual({ foo: 'bar' });
      });

      it('should merge options with Check defaults', () => {
        const options = check.getOptions({ hello: 'world' });
        expect(options).toEqual({ foo: 'bar', hello: 'world' });
      });

      it('should override defaults', () => {
        const options = check.getOptions({ foo: 'world' });
        expect(options).toEqual({ foo: 'world' });
      });

      it('should normalize passed in options', () => {
        const options = check.getOptions('world');
        expect(options).toEqual({ foo: 'bar', value: 'world' });
      });
    });
  });

  describe('spec object', () => {
    describe('.id', () => {
      it('should be set', () => {
        const spec = {
          id: 'monkeys'
        };
        expect(new Check(spec).id).toBe(spec.id);
      });

      it('should have no default', () => {
        const spec = {};
        expect(new Check(spec).id).toBe(spec.id);
      });
    });

    describe('.after', () => {
      it('should be set', () => {
        const spec = {
          afterAll() {}
        };
        expect(new Check(spec).after).toBe(spec.after);
      });

      it('should have no default', () => {
        const spec = {};
        expect(new Check(spec).after).toBe(spec.after);
      });

      it('should be able to take a string and turn it into a function', () => {
        const spec = {
          after: '() => {return "blah";}'
        };
        expect(typeof new Check(spec).after).toBe('function');
        expect(new Check(spec).after()).toBe('blah');
      });
    });

    describe('.options', () => {
      it('should be set', () => {
        const spec = {
          options: { value: ['monkeys', 'bananas'] }
        };
        expect(new Check(spec).options).toBe(spec.options);
      });

      it('should have no default', () => {
        const spec = {};
        expect(new Check(spec).options).toBe(spec.options);
      });

      it('should normalize non-object options for internal checks', () => {
        const spec = {
          options: 'foo'
        };
        expect(new Check(spec).options).toEqual({ value: 'foo' });
      });

      it('should not normalize non-object options for external checks', () => {
        const spec = {
          options: 'foo',
          evaluate() {}
        };
        expect(new Check(spec).options).toEqual('foo');
      });
    });

    describe('.evaluate', () => {
      it('should be set', () => {
        const spec = {
          evaluate() {}
        };
        expect(typeof new Check(spec).evaluate).toBe('function');
        expect(new Check(spec).evaluate).toBe(spec.evaluate);
      });
      it('should turn a string into a function', () => {
        const spec = {
          evaluate: '() => { return "blah";}'
        };
        expect(typeof new Check(spec).evaluate).toBe('function');
        expect(new Check(spec).evaluate()).toBe('blah');
      });
    });
  });
});
