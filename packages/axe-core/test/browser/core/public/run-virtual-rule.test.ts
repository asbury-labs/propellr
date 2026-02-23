import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('axe.runVirtualRule', () => {
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
          evaluate: () => {
            return true;
          }
        }
      ]
    });
  });

  afterEach(() => {
    axe._audit = null;
  });

  it('should throw if the rule does not exist', () => {
    axe._audit.rules = [];
    function fn() {
      axe.runVirtualRule('aria-roles', { nodeName: 'div' });
    }

    expect(fn).toThrow();
  });

  it('should modify the rule to not excludeHidden', () => {
    axe._audit.rules = [
      {
        id: 'aria-roles',
        excludeHidden: true,
        runSync: () => {
          expect(this.excludeHidden).toBe(false);

          return {
            id: 'aria-roles',
            nodes: []
          };
        }
      }
    ];

    axe.runVirtualRule('aria-roles', { nodeName: 'div' });
  });

  it('should not modify the original rule', () => {
    axe._audit.rules = [
      {
        id: 'aria-roles',
        excludeHidden: true,
        runSync: () => {
          expect(this).not.toBe(axe._audit.rules[0]);

          return {
            id: 'aria-roles',
            nodes: []
          };
        }
      }
    ];

    axe.runVirtualRule('aria-roles', { nodeName: 'div' });
  });

  it('should call rule.runSync', () => {
    let called = false;
    axe._audit.rules = [
      {
        id: 'aria-roles',
        runSync: () => {
          called = true;
          return {
            id: 'aria-roles',
            nodes: []
          };
        }
      }
    ];

    axe.runVirtualRule('aria-roles', { nodeName: 'div' });
    expect(called).toBe(true);
  });

  describe('context', () => {
    const { Context } = axe._thisWillBeDeletedDoNotUse.base;
    it('passes context with vNode included to rule.runSync', () => {
      let node = new axe.SerialVirtualNode({ nodeName: 'div' });
      axe._audit.rules = [
        {
          id: 'aria-roles',
          runSync: context => {
            expect(typeof context).toBe('object');
            expect(Array.isArray(context.include)).toBe(true);
            expect(context.include[0]).toBe(node);

            return {
              id: 'aria-roles',
              nodes: []
            };
          }
        }
      ];

      axe.runVirtualRule('aria-roles', node);
    });

    it('has all properties a normal context has', () => {
      const contextProps = Object.entries(new Context())
        .filter(arg => typeof arg[1] !== 'function')
        .map(([key]) => key)
        .sort();

      let node = new axe.SerialVirtualNode({ nodeName: 'div' });
      axe._audit.rules = [
        {
          id: 'aria-roles',
          runSync: context => {
            const virtualContextProps = Object.keys(context).sort();
            expect(virtualContextProps).toEqual(contextProps);
            return {
              id: 'aria-roles',
              nodes: []
            };
          }
        }
      ];
      axe.runVirtualRule('aria-roles', node);
    });
  });

  it('should pass through options to rule.runSync', () => {
    axe._audit.rules = [
      {
        id: 'aria-roles',
        runSync: (context, options) => {
          expect(options.foo).toBe('bar');

          return {
            id: 'aria-roles',
            nodes: []
          };
        }
      }
    ];

    axe.runVirtualRule('aria-roles', { nodeName: 'div' }, { foo: 'bar' });
  });

  it('should convert a serialised node into a VirtualNode', () => {
    const serialNode = {
      nodeName: 'div',
      foo: 'bar',
      attributes: {
        bar: 'baz'
      }
    };
    axe._audit.rules = [
      {
        id: 'aria-roles',
        runSync: context => {
          let node = context.include[0];
          expect(node).toBeInstanceOf(axe.AbstractVirtualNode);
          expect(node.props.foo).toBe('bar');
          expect(node.attr('bar')).toBe('baz');

          return {
            id: 'aria-roles',
            nodes: []
          };
        }
      }
    ];

    axe.runVirtualRule('aria-roles', serialNode);
  });

  it('should return correct structure', () => {
    const results = axe.runVirtualRule('test', { nodeName: 'div' });
    expect(results.violations).toBeDefined();
    expect(results.passes).toBeDefined();
    expect(results.incomplete).toBeDefined();
    expect(results.inapplicable).toBeDefined();
    expect(results.testEngine).toBeDefined();
    expect(results.toolOptions).toBeDefined();
  });
});
