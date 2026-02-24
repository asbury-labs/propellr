import { describe, it, expect } from 'vitest';
import { flatTreeSetup } from '../../../testutils';

declare const axe: any;
describe('dom.hasContentVirtual', function () {
  const hasContentVirtual = axe.commons.dom.hasContentVirtual;
  const fixture = document.getElementById('fixture');
  const tree;

  it('returns false if there is no content', function () {
    fixture.innerHTML = '<div id="target">	</div>';
    tree = axe.utils.getFlattenedTree(fixture);
    expect(
      hasContentVirtual(axe.utils.querySelectorAll(tree, '#target')[0])
    ).toBe(false);
  });

  it('returns false if there are non-visual elements', function () {
    fixture.innerHTML = '<div id="target"> <span></span> </div>';
    tree = axe.utils.getFlattenedTree(fixture);
    expect(
      hasContentVirtual(axe.utils.querySelectorAll(tree, '#target')[0])
    ).toBe(false);
  });

  it('is true if the element has non-empty text', function () {
    fixture.innerHTML = '<div id="target"> text </div>';
    tree = axe.utils.getFlattenedTree(fixture);
    expect(
      hasContentVirtual(axe.utils.querySelectorAll(tree, '#target')[0])
    ).toBe(true);
  });

  it('is true if the element has an aria label', function () {
    fixture.innerHTML = '<div id="target" aria-label="my-label">	</div>';
    tree = axe.utils.getFlattenedTree(fixture);
    expect(
      hasContentVirtual(axe.utils.querySelectorAll(tree, '#target')[0])
    ).toBe(true);
  });

  it('is false if the element has an aria label but `ignoreAria=true`', function () {
    fixture.innerHTML = '<div id="target" aria-label="my-label">	</div>';
    tree = axe.utils.getFlattenedTree(fixture);
    expect(
      hasContentVirtual(
        axe.utils.querySelectorAll(tree, '#target')[0],
        true,
        true
      )
    ).toBe(false);
  });

  it('is true if the element contains visual content', function () {
    fixture.innerHTML = '<div id="target"> <img src=""> </div>';
    tree = axe.utils.getFlattenedTree(fixture);
    expect(
      hasContentVirtual(axe.utils.querySelectorAll(tree, '#target')[0])
    ).toBe(true);
  });

  it('is true if the element contains a node with a aria-label', function () {
    fixture.innerHTML =
      '<div id="target"> <span aria-label="my-label"></span> </div>';
    tree = axe.utils.getFlattenedTree(fixture);
    expect(
      hasContentVirtual(axe.utils.querySelectorAll(tree, '#target')[0])
    ).toBe(true);
  });

  it('is false if the element does not show text', function () {
    fixture.innerHTML = '<style id="target"> #foo { color: green } </style>';
    tree = axe.utils.getFlattenedTree(fixture);
    expect(
      hasContentVirtual(axe.utils.querySelectorAll(tree, '#target')[0])
    ).toBe(false);
  });

  it('is called through hasContent, with a DOM node', function () {
    const hasContent = axe.commons.dom.hasContent;
    fixture.innerHTML = '<div id="target"> text </div>';
    flatTreeSetup(fixture);
    expect(hasContent(fixture.querySelector('#target'))).toBe(true);

    fixture.innerHTML = '<div id="target"></div>';
    flatTreeSetup(fixture);
    expect(hasContent(fixture.querySelector('#target'))).toBe(false);
  });

  it('is false if noRecursion is true and the content is not in a child', function () {
    fixture.innerHTML = '<div id="target"><span> text </span></div>';
    tree = axe.utils.getFlattenedTree(fixture);

    expect(
      hasContentVirtual(axe.utils.querySelectorAll(tree, '#target')[0], true)
    ).toBe(false);
  });

  it(
    'looks at content of shadow dom elements',
    function () {
      fixture.innerHTML = '<div id="target"></div>';
      const shadow = fixture
        .querySelector('#target')
        .attachShadow({ mode: 'open' });
      shadow.innerHTML = 'Some text';
      tree = axe.utils.getFlattenedTree(fixture);

      expect(
        hasContentVirtual(axe.utils.querySelectorAll(tree, '#target')[0])
      ).toBe(true);
    }
  );

  it(
    'looks at the slots in a shadow tree',
    function () {
      fixture.innerHTML = '<div id="shadow">some text</div>';
      const shadow = fixture
        .querySelector('#shadow')
        .attachShadow({ mode: 'open' });
      shadow.innerHTML = '<div class="target"><slot></slot></div>';
      tree = axe.utils.getFlattenedTree(fixture);

      expect(
        hasContentVirtual(axe.utils.querySelectorAll(tree, '.target')[0])
      ).toBe(true);
    }
  );
});
