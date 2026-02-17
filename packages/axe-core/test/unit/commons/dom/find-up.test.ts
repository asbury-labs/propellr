import { describe, it, afterEach, expect } from 'vitest';

declare const axe: any;
/* global xit */
describe('dom.findUp', function () {
  const fixture = document.getElementById('fixture');
  const shadowSupport = axe.testUtils.shadowSupport;

  afterEach(function () {
    fixture.innerHTML = '';
    axe._tree = undefined;
  });

  it('should find parents based on selector', function () {
    fixture.innerHTML =
      '<div class="target"><div id="target" class="target"><span><span><span><div>' +
      '<div><div id="start"></div></div></div></span></span></span></div></div>';

    const start = document.getElementById('start'),
      target = document.getElementById('target');

    axe.testUtils.flatTreeSetup(fixture.firstChild);
    expect(axe.commons.dom.findUp(start, '.target')).toBe(target);
  });

  it('should return null if it cant find a match anywhere in the document', function () {
    fixture.innerHTML = '<div id="start"></div>';
    const start = document.getElementById('start');

    axe.testUtils.flatTreeSetup(fixture.firstChild);
    expect(axe.commons.dom.findUp(start, '.nomatchyplzkthx')).toBeNull();
  });

  it('should return null if it cant find a match anywhere above the start', function () {
    fixture.innerHTML = '<div id="start"></div><div class="target"></div>';
    const start = document.getElementById('start');

    axe.testUtils.flatTreeSetup(fixture.firstChild);
    expect(axe.commons.dom.findUp(start, '.target')).toBeNull();
  });

  (shadowSupport.v0 ? it : xit)(
    'should walk up the assigned content (v0)',
    function () {
      function createContentSlotted() {
        const group = document.createElement('div');
        group.innerHTML =
          '<div id="target" style="display:none;">Stuff<content></content></div>';
        return group;
      }
      function makeShadowTree(node) {
        const root = node.createShadowRoot();
        const div = document.createElement('div');
        root.appendChild(div);
        div.appendChild(createContentSlotted());
      }

      fixture.innerHTML = '<label><div><p><a>hello</a></p></div></label>';
      makeShadowTree(fixture.querySelector('div'));
      const tree = axe.testUtils.flatTreeSetup(fixture.firstChild);
      const el = axe.utils.querySelectorAll(tree, 'a')[0];
      expect(axe.commons.dom.findUp(el.actualNode, 'label')).toBe(
        fixture.firstChild
      );
    }
  );

  (shadowSupport.v0 ? it : xit)(
    'should walk down the shadow DOM v0',
    function () {
      function createContent() {
        const group = document.createElement('div');
        group.innerHTML = '<a>thing</a>';
        return group;
      }
      function makeShadowTree(node) {
        const root = node.createShadowRoot();
        const div = document.createElement('div');
        div.appendChild(createContent());
        root.appendChild(div);
      }

      fixture.innerHTML = '<label><div></div></label>';
      makeShadowTree(fixture.querySelector('div'));
      const tree = axe.testUtils.flatTreeSetup(fixture.firstChild);
      const el = axe.utils.querySelectorAll(tree, 'a')[0];
      expect(axe.commons.dom.findUp(el.actualNode, 'label')).toBe(
        fixture.firstChild
      );
    }
  );

  (shadowSupport.v0 ? it : xit)(
    'should work on shadow root children',
    function () {
      fixture.innerHTML = '<div role="list" id="something"></div>';
      const shadow = fixture.querySelector('#something').createShadowRoot();

      shadow.innerHTML = '<div role="listitem">item 1</div>';
      const listItem = shadow.querySelector('[role=listitem]');

      axe.testUtils.flatTreeSetup(fixture.firstChild);
      expect(axe.commons.dom.findUp(listItem, '[role=list]')).toBe(
        fixture.firstChild
      );
    }
  );

  (shadowSupport.v1 ? it : xit)(
    'should walk up the assigned slot',
    function () {
      function createContentSlotted() {
        const group = document.createElement('div');
        group.innerHTML =
          '<div id="target" style="display:none;">Stuff<slot></slot></div>';
        return group;
      }
      function makeShadowTree(node) {
        const root = node.attachShadow({ mode: 'open' });
        const div = document.createElement('div');
        root.appendChild(div);
        div.appendChild(createContentSlotted());
      }

      fixture.innerHTML = '<label><div><p><a>hello</a></p></div></label>';
      makeShadowTree(fixture.querySelector('div'));
      const tree = axe.testUtils.flatTreeSetup(fixture.firstChild);
      const el = axe.utils.querySelectorAll(tree, 'a')[0];
      expect(axe.commons.dom.findUp(el.actualNode, 'label')).toBe(
        fixture.firstChild
      );
    }
  );

  (shadowSupport.v1 ? it : xit)(
    'should find element in assigned slot, not in the host document',
    function () {
      function createContentSlotted() {
        const group = document.createElement('div');
        group.className = 'target';
        const slot = document.createElement('slot');
        group.appendChild(slot);
        return group;
      }
      function makeShadowTree(node) {
        const root = node.attachShadow({ mode: 'open' });
        const div = document.createElement('div');
        root.appendChild(div);
        div.appendChild(createContentSlotted());
      }

      fixture.innerHTML = '<label><div><p><a>hello</a></p></div></label>';
      makeShadowTree(fixture.querySelector('div'));
      const tree = axe.testUtils.flatTreeSetup(fixture.firstChild);
      const el = axe.utils.querySelectorAll(tree, 'a')[0];
      const target = axe.utils.querySelectorAll(tree, '.target')[0];
      expect(axe.commons.dom.findUp(el.actualNode, 'div')).toBe(
        target.actualNode
      );
    }
  );

  (shadowSupport.v1 ? it : xit)('should walk up the shadow DOM', function () {
    function createContent() {
      const group = document.createElement('div');
      group.innerHTML = '<a>thing</a>';
      return group;
    }
    function makeShadowTree(node) {
      const root = node.attachShadow({ mode: 'open' });
      const div = document.createElement('div');
      root.appendChild(div);
      div.appendChild(createContent());
    }

    fixture.innerHTML = '<label><div></div></label>';
    makeShadowTree(fixture.querySelector('div'));
    const tree = axe.testUtils.flatTreeSetup(fixture.firstChild);
    const el = axe.utils.querySelectorAll(tree, 'a')[0];
    expect(axe.commons.dom.findUp(el.actualNode, 'label')).toBe(
      fixture.firstChild
    );
  });

  (shadowSupport.v1 ? it : xit)(
    'should work on shadow root children',
    function () {
      fixture.innerHTML = '<div role="list" id="something"></div>';
      const shadow = fixture
        .querySelector('#something')
        .attachShadow({ mode: 'open' });

      shadow.innerHTML = '<div role="listitem">item 1</div>';
      const listItem = shadow.querySelector('[role=listitem]');

      axe.testUtils.flatTreeSetup(fixture.firstChild);
      expect(axe.commons.dom.findUp(listItem, '[role=list]')).toBe(
        fixture.firstChild
      );
    }
  );
});
