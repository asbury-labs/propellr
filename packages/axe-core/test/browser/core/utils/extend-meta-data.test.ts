import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.extend', () => {
  it('should merge properties', () => {
    const src = {
      cats: 'fail',
      dogs: 'fail'
    };

    axe.utils.extendMetaData(src, {
      cats: 'meow',
      dogs: 'woof'
    });
    expect(Object.keys(src).length).toBe(2);
    expect(src.cats).toBe('meow');
    expect(src.dogs).toBe('woof');
  });

  it('should execute any found functions', () => {
    const src = {
      cats: 'fail',
      dogs: 'fail'
    };
    axe.utils.extendMetaData(src, {
      cats: ctxt => {
        expect(ctxt).toBe(src);
        return 'meow';
      },
      dogs: 'woof'
    });
    expect(Object.keys(src).length).toBe(2);
    expect(src.cats).toBe('meow');
    expect(src.dogs).toBe('woof');
  });
  it('should catch exceptions in functions and default to `null`', () => {
    const src = {
      cats: 'fail',
      dogs: 'fail'
    };
    axe.utils.extendMetaData(src, {
      cats: () => {
        throw new Error('hehe');
      },
      dogs: 'woof'
    });
    expect(Object.keys(src).length).toBe(2);
    expect(src.cats).toBeNull();
    expect(src.dogs).toBe('woof');
  });
});
