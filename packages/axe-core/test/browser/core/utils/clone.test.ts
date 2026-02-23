import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('utils.clone', () => {
  const clone = axe.utils.clone;
  const fixture = document.querySelector('#fixture');

  it('should clone an object', () => {
    const obj = {
      cats: true,
      dogs: 2,
      fish: [0, 1, { one: 'two' }]
    };
    const c = clone(obj);

    obj.cats = false;
    obj.dogs = 1;
    obj.fish[2].one = 'three';

    expect(c.cats).toBe(true);
    expect(c.dogs).toBe(2);
    expect(c.fish).toEqual([0, 1, { one: 'two' }]);
  });

  it('should clone nested objects', () => {
    const obj = {
      cats: {
        fred: 1,
        billy: 2,
        meow: true
      },
      dogs: {
        spot: 1,
        max: 2,
        woof: [0, 1, 2]
      },
      fish: [0, 1, 2]
    };
    const c = clone(obj);

    obj.cats.fred = 47;
    obj.dogs = 47;
    obj.fish[0] = 'stuff';

    expect(c.cats).toEqual({
      fred: 1,
      billy: 2,
      meow: true
    });

    expect(c.dogs).toEqual({
      spot: 1,
      max: 2,
      woof: [0, 1, 2]
    });

    expect(c.fish).toEqual([0, 1, 2]);
  });

  it('should clone objects with methods', () => {
    const obj = {
      cats: () => {
        return 'meow';
      },
      dogs: () => {
        return 'woof';
      }
    };
    const c = clone(obj);

    expect(obj.cats).toBe(c.cats);
    expect(obj.dogs).toBe(c.dogs);

    obj.cats = () => {};
    obj.dogs = () => {};

    expect(obj.cats).not.toBe(c.cats);
    expect(obj.dogs).not.toBe(c.dogs);
  });

  it('should clone prototypes', () => {
    function Cat(name) {
      this.name = name;
    }

    Cat.prototype.meow = () => {
      return 'meow';
    };

    Cat.prototype.bark = () => {
      return 'cats dont bark';
    };

    const cat = new Cat('Fred'),
      c = clone(cat);

    expect(cat.name).toEqual(c.name);
    expect(Cat.prototype.bark).toEqual(c.bark);
    expect(Cat.prototype.meow).toEqual(c.meow);
  });

  it('should clone circular objects while keeping the circular reference', () => {
    const obj = { cats: true };
    obj.child = obj;
    const c = clone(obj);

    obj.cats = false;

    expect(c).toEqual({
      cats: true,
      child: c
    });
    expect(c).toBe(c.child);
  });

  it('should not return the same object when cloned twice', () => {
    const obj = { cats: true };
    const c1 = clone(obj);
    const c2 = clone(obj);

    expect(c1).not.toBe(c2);
  });

  it('should not return the same object when nested', () => {
    const obj = { dogs: true };
    const obj1 = { cats: true, child: { prop: obj } };
    const obj2 = { fish: [0, 1, 2], child: { prop: obj } };

    const c1 = clone(obj1);
    const c2 = clone(obj2);

    expect(c1.child.prop).not.toBe(c2.child.prop);
  });

  it('should not clone HTML elements', () => {
    const obj = {
      cats: true,
      node: document.createElement('div')
    };
    const c = clone(obj);

    obj.cats = false;

    expect(c.cats).toBe(true);
    expect(c.node).toBe(obj.node);
  });

  it('should not clone HTML elements from different windows', () => {
    fixture.innerHTML = '<iframe id="target"></iframe>';
    const iframe = fixture.querySelector('#target');

    const obj = {
      cats: true,
      node: iframe.contentDocument
    };
    const c = clone(obj);

    obj.cats = false;

    expect(c.cats).toBe(true);
    expect(c.node).toBe(obj.node);
  });
});
