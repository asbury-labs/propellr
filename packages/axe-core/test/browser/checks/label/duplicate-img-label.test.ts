import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('duplicate-img-label', function () {
  const fixture = document.getElementById('fixture');
  const checkSetup = axe.testUtils.checkSetup;
  const shadowSupport = axe.testUtils.shadowSupport;

  afterEach(function () {
    fixture.innerHTML = '';
    axe._tree = undefined;
  });

  it('should return false if no text is present', function () {
    fixture.innerHTML = '<button><img id="target" alt="Plain text"></button>';
    const node = fixture.querySelector('#target');
    axe.testUtils.flatTreeSetup(fixture);
    const result = axe.testUtils.getCheckEvaluate('duplicate-img-label')(
      node,
      undefined,
      axe.utils.getNodeFromTree(node)
    );
    expect(result).toBe(false);
  });

  it('should return false if aria-label duplicates img alt', function () {
    fixture.innerHTML =
      '<button aria-label="Plain text"><img id="target" alt="Plain text"></button>';
    const node = fixture.querySelector('#target');
    axe.testUtils.flatTreeSetup(fixture);
    expect(
      axe.testUtils.getCheckEvaluate('duplicate-img-label')(
        node,
        undefined,
        axe.utils.getNodeFromTree(node)
      )
    ).toBe(false);
  });

  it('should return false if img and text have different text', function () {
    fixture.innerHTML =
      '<button><img id="target" alt="Alt text">Plain text</button>';
    const node = fixture.querySelector('#target');
    axe.testUtils.flatTreeSetup(fixture);
    expect(
      axe.testUtils.getCheckEvaluate('duplicate-img-label')(
        node,
        undefined,
        axe.utils.getNodeFromTree(node)
      )
    ).toBe(false);
  });

  it('should return true if img and text have the same text', function () {
    fixture.innerHTML =
      '<button><img id="target" alt="Plain text">Plain text</button>';
    const node = fixture.querySelector('#target');
    axe.testUtils.flatTreeSetup(fixture);
    expect(
      axe.testUtils.getCheckEvaluate('duplicate-img-label')(
        node,
        undefined,
        axe.utils.getNodeFromTree(node)
      )
    ).toBe(true);
  });

  it('should return true if img has ARIA label with the same text', function () {
    fixture.innerHTML =
      '<button><img id="target" aria-label="Plain text">Plain text</button>';
    const node = fixture.querySelector('#target');
    axe.testUtils.flatTreeSetup(fixture);
    expect(
      axe.testUtils.getCheckEvaluate('duplicate-img-label')(
        node,
        undefined,
        axe.utils.getNodeFromTree(node)
      )
    ).toBe(true);
  });

  it('should return false if img and text are both blank', function () {
    fixture.innerHTML = '<button><img id="target" alt=""></button>';
    const node = fixture.querySelector('#target');
    axe.testUtils.flatTreeSetup(fixture);
    expect(
      axe.testUtils.getCheckEvaluate('duplicate-img-label')(
        node,
        undefined,
        axe.utils.getNodeFromTree(node)
      )
    ).toBe(false);
  });

  it('should return false if img and text have superset/subset text', function () {
    fixture.innerHTML =
      '<button><img id="target" alt="Plain text and more">Plain text</button>';
    const node = fixture.querySelector('#target');
    axe.testUtils.flatTreeSetup(fixture);
    expect(
      axe.testUtils.getCheckEvaluate('duplicate-img-label')(
        node,
        undefined,
        axe.utils.getNodeFromTree(node)
      )
    ).toBe(false);
  });

  it('should return false if img does not have required parent', function () {
    fixture.innerHTML =
      '<main><img id="target" alt="Plain text and more"><p>Plain text</p></main>';
    const node = fixture.querySelector('#target');
    axe.testUtils.flatTreeSetup(fixture);
    expect(
      axe.testUtils.getCheckEvaluate('duplicate-img-label')(
        node,
        undefined,
        axe.utils.getNodeFromTree(node)
      )
    ).toBe(false);
  });

  it('should support options.parentSelector', function () {
    fixture.innerHTML =
      '<div aria-label="Plain text"><img id="target" alt="Plain text"></div>';
    const node = fixture.querySelector('#target');
    axe.testUtils.flatTreeSetup(fixture);
    expect(
      axe.testUtils.getCheckEvaluate('duplicate-img-label')(
        node,
        { parentSelector: 'div' },
        axe.utils.getNodeFromTree(node)
      )
    ).toBe(false);
  });

  (shadowSupport.v1 ? it : xit)(
    'should return true if the img is part of a shadow tree',
    function () {
      const button = document.createElement('div');
      button.setAttribute('role', 'button');
      button.innerHTML = 'My button';
      const shadow = button.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<slot></slot><img id="target" alt="My button">';
      fixture.appendChild(button);
      axe.testUtils.flatTreeSetup(fixture);
      const node = shadow.querySelector('#target');
      expect(
        axe.testUtils.getCheckEvaluate('duplicate-img-label')(
          node,
          undefined,
          axe.utils.getNodeFromTree(node)
        )
      ).toBe(true);
    }
  );

  (shadowSupport.v1 ? it : xit)(
    'should return true if the img is a slotted element',
    function () {
      const button = document.createElement('div');
      button.setAttribute('role', 'button');
      button.innerHTML = '<img id="target" alt="My button">';
      const shadow = button.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<span>My button</span> <slot></slot>';

      fixture.appendChild(button);
      axe.testUtils.flatTreeSetup(fixture);
      const node = button.querySelector('#target');
      expect(
        axe.testUtils.getCheckEvaluate('duplicate-img-label')(
          node,
          undefined,
          axe.utils.getNodeFromTree(node)
        )
      ).toBe(true);
    }
  );

  (shadowSupport.v1 ? it : xit)(
    'should return false if the shadow img has a different text',
    function () {
      const button = document.createElement('div');
      button.setAttribute('role', 'button');
      button.innerHTML = 'My button';
      const shadow = button.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<slot></slot><img alt="My image">';
      const checkArgs = checkSetup(button);

      expect(
        axe.testUtils
          .getCheckEvaluate('duplicate-img-label')
          .apply(null, checkArgs)
      ).toBe(false);
    }
  );
});
