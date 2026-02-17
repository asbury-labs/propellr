import { describe, it, afterEach, expect } from 'vitest';

declare const axe: any;
describe('dom.isOffscreen', function () {
  const fixture = document.getElementById('fixture');
  const shadowSupport = axe.testUtils.shadowSupport;

  afterEach(function () {
    fixture.innerHTML = '';
    document.body.style.direction = 'ltr';
  });

  it('should detect elements positioned outside the left edge', function () {
    fixture.innerHTML =
      '<div id="target" style="position: absolute; width: 50px; left: -51px;">Offscreen?</div>';
    const el = document.getElementById('target');

    expect(axe.commons.dom.isOffscreen(el)).toBe(true);
  });

  it('should detect elements positioned to but not beyond the left edge', function () {
    fixture.innerHTML =
      '<div id="target" style="position: absolute; width: 50px; left: -50px;">Offscreen?</div>';
    const el = document.getElementById('target');

    expect(axe.commons.dom.isOffscreen(el)).toBe(true);
  });

  it('should not detect elements at the left edge with a zero width', function () {
    fixture.innerHTML =
      '<div id="target" style="width: 0px; left: 0px;"></div>';
    const el = document.getElementById('target');

    expect(axe.commons.dom.isOffscreen(el)).toBe(false);
  });

  it('should detect elements positioned outside the top edge', function () {
    fixture.innerHTML =
      '<div id="target" style="position: absolute; height: 50px; top: -51px;">Offscreen?</div>';
    const el = document.getElementById('target');
    expect(axe.commons.dom.isOffscreen(el)).toBe(true);
  });

  it('should never detect elements positioned outside the bottom edge', function () {
    fixture.innerHTML =
      '<div id="target" style="position: absolute; height: 50px; bottom: -501px;">Offscreen?</div>';
    const el = document.getElementById('target');

    expect(axe.commons.dom.isOffscreen(el)).toBe(false);
  });

  it('should detect elements positioned that bleed inside the left edge', function () {
    fixture.innerHTML =
      '<div id="target" style="position: absolute; width: 50px; left: -49px;">Offscreen?</div>';
    const el = document.getElementById('target');

    expect(axe.commons.dom.isOffscreen(el)).toBe(false);
  });

  it('should detect elements positioned outside the right edge', function () {
    fixture.innerHTML =
      '<div id="target" style="position: absolute; width: 50px; right: -49px;">Offscreen?</div>';
    const el = document.getElementById('target');

    expect(axe.commons.dom.isOffscreen(el)).toBe(false);
  });

  it('should detect elements positioned outside the top edge', function () {
    fixture.innerHTML =
      '<div id="target" style="position: absolute; height: 50px; top: -49px;">Offscreen?</div>';
    const el = document.getElementById('target');

    expect(axe.commons.dom.isOffscreen(el)).toBe(false);
  });

  it('should detect elements positioned outside the bottom edge', function () {
    fixture.innerHTML =
      '<div id="target" style="position: absolute; height: 50px; bottom: -49px;">Offscreen?</div>';
    const el = document.getElementById('target');

    expect(axe.commons.dom.isOffscreen(el)).toBe(false);
  });

  it('should detect elements that are made off-screen by a parent', function () {
    fixture.innerHTML =
      '<div id="target" style="position: absolute; width: 50px; left: -51px;">' +
      '<div id="target">Offscreen?</div>' +
      '</div>';

    const el = document.getElementById('target');

    expect(axe.commons.dom.isOffscreen(el)).toBe(true);
  });

  it('should NOT detect elements positioned outside the right edge on LTR documents', function () {
    fixture.innerHTML =
      '<div id="target" style="position: absolute; width: 50px; right: -51px;">Offscreen?</div>';
    const el = document.getElementById('target');

    expect(axe.commons.dom.isOffscreen(el)).toBe(false);
  });

  it('should detect elements positioned outside the right edge on RTL documents', function () {
    document.body.style.direction = 'rtl';
    fixture.innerHTML =
      '<div id="target" style="position: absolute; width: 50px; right: -151px;">Offscreen?</div>';
    const el = document.getElementById('target');

    expect(axe.commons.dom.isOffscreen(el)).toBe(true);
  });

  it('should NOT detect elements positioned outside the left edge on RTL documents', function () {
    document.body.style.direction = 'rtl';
    fixture.innerHTML =
      '<div id="target" style="position: absolute; width: 50px; left: -51px;">Offscreen?</div>';
    const el = document.getElementById('target');

    expect(axe.commons.dom.isOffscreen(el)).toBe(false);
  });

  it('should not detect elements positioned because of a scroll', function () {
    fixture.innerHTML =
      '<div id="scrollable" style="max-height:20px;overflow:scroll">' +
      '<div id="visible">goobye</div>' +
      '<div id="high" style="height:50px">high</div>' +
      '<div id="scrollme">hello</div>' +
      '</div>';
    const viz = document.getElementById('visible');
    expect(axe.commons.dom.isOffscreen(viz)).toBe(false);
    const scrollme = document.getElementById('scrollme');
    scrollme.scrollIntoView();
    expect(axe.commons.dom.isOffscreen(viz)).toBe(false);
  });

  it('should return undefined if actual ndoe is undefined', function () {
    expect(axe.commons.dom.isOffscreen()).toBeUndefined();
  });

  (shadowSupport.v1 ? it : xit)(
    'should detect on screen shadow nodes',
    function () {
      fixture.innerHTML = '<div></div>';
      const shadow = fixture
        .querySelector('div')
        .attachShadow({ mode: 'open' });
      shadow.innerHTML = '<div id="target">Offscreen?</div>';

      const el = shadow.querySelector('#target');
      expect(axe.commons.dom.isOffscreen(el)).toBe(false);
    }
  );

  (shadowSupport.v1 ? it : xit)(
    'should detect off screen shadow nodes',
    function () {
      fixture.innerHTML = '<div></div>';
      const shadow = fixture
        .querySelector('div')
        .attachShadow({ mode: 'open' });
      shadow.innerHTML =
        '<div id="target" style="position: absolute; height: 50px; top: -51px;">Offscreen?</div>';

      const el = shadow.querySelector('#target');
      expect(axe.commons.dom.isOffscreen(el)).toBe(true);
    }
  );
});
