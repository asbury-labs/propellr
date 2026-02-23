import { describe, it, expect, afterEach } from 'vitest';
import {
  checks,
  getCheckEvaluate,
  MockCheckContext,
  shadowSupport
} from '../../../testutils';

describe('duplicate-id', function () {
  const fixture = document.getElementById('fixture')!;

  const checkContext = MockCheckContext();

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext.reset();
  });

  it('should return true if there is only one element with an ID', function () {
    fixture.innerHTML = '<div id="target"></div>';
    const node = fixture.querySelector('#target');
    expect(getCheckEvaluate('duplicate-id').call(checkContext, node)).toBe(
      true
    );
    expect(checkContext._data).toBe(node.id);
    expect(checkContext._relatedNodes).toEqual([]);
  });

  it('should return false if there are multiple elements with an ID', function () {
    fixture.innerHTML = '<div id="target"></div><div id="target"></div>';
    const node = fixture.querySelector('#target');
    expect(getCheckEvaluate('duplicate-id').call(checkContext, node)).toBe(
      false
    );
    expect(checkContext._data).toBe(node.id);
    expect(checkContext._relatedNodes).toEqual([node.nextSibling]);
  });

  it('should return remove duplicates', function () {
    expect(
      checks['duplicate-id'].afterAll([
        { data: 'a' },
        { data: 'b' },
        { data: 'b' }
      ])
    ).toEqual([{ data: 'a' }, { data: 'b' }]);
  });

  it('should ignore empty ids', function () {
    fixture.innerHTML =
      '<div data-testelm="1" id=""></div><div data-testelm="2"  id=""></div>';
    const node = fixture.querySelector('[data-testelm="1"]');

    expect(getCheckEvaluate('duplicate-id').call(checkContext, node)).toBe(
      true
    );
  });

  it('should allow overwrote ids', function () {
    fixture.innerHTML =
      '<form data-testelm="1" id="target"><label>mylabel' +
      '<input name="id">' +
      '</label></form>';
    const node = fixture.querySelector('[data-testelm="1"]');

    expect(getCheckEvaluate('duplicate-id').call(checkContext, node)).toBe(
      true
    );
  });

  (shadowSupport.v1 ? it : xit)(
    'should find duplicate IDs in the same shadow DOM',
    function () {
      const div = document.createElement('div');
      div.id = 'target';
      const shadow = div.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<span id="target"></span><p id="target">text</p>';
      const node = shadow.querySelector('span');
      fixture.appendChild(div);

      expect(getCheckEvaluate('duplicate-id').call(checkContext, node)).toBe(
        false
      );
      expect(checkContext._relatedNodes).toHaveLength(1);
      expect(checkContext._relatedNodes).toEqual([shadow.querySelector('p')]);
    }
  );

  (shadowSupport.v1 ? it : xit)(
    'should ignore duplicate IDs if they are in different document roots',
    function () {
      const node = document.createElement('div');
      node.id = 'target';
      const shadow = node.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<span id="target"></span>';
      fixture.appendChild(node);

      expect(getCheckEvaluate('duplicate-id').call(checkContext, node)).toBe(
        true
      );
      expect(checkContext._relatedNodes).toHaveLength(0);
    }
  );

  (shadowSupport.v1 ? it : xit)(
    'should ignore same IDs outside shadow trees',
    function () {
      const div = document.createElement('div');
      div.id = 'target';
      const shadow = div.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<span id="target"></span>';
      const node = shadow.querySelector('#target');
      fixture.appendChild(div);

      expect(getCheckEvaluate('duplicate-id').call(checkContext, node)).toBe(
        true
      );
      expect(checkContext._relatedNodes).toHaveLength(0);
    }
  );

  (shadowSupport.v1 ? it : xit)(
    'should compare slotted content with the light DOM',
    function () {
      const node = document.createElement('div');
      node.id = 'target';
      node.innerHTML = '<p id="target">text</p>';
      const shadow = node.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<span id="target"><slot></slot></span>';
      fixture.appendChild(node);

      expect(getCheckEvaluate('duplicate-id').call(checkContext, node)).toBe(
        false
      );
      expect(checkContext._relatedNodes).toHaveLength(1);
      expect(checkContext._relatedNodes).toEqual([node.querySelector('p')]);
    }
  );
});
