import { describe, it, expect, beforeEach } from 'vitest';
import { fixtureSetup } from '../../testutils';

declare const axe: any;
describe('landmark-unique-matches', function () {
  let rule;
  let fixture;
  const sectioningContentElements = ['article', 'aside', 'nav', 'section'];
  const excludedDescendantsForHeadersFooters =
    sectioningContentElements.concat('main');
  const headerFooterElements = ['header', 'footer'];

  beforeEach(function () {
    fixture = document.getElementById('fixture');
    rule = axe.utils.getRule('landmark-unique');
  });

  it('should not match because not a landmark', function () {
    fixtureSetup('<h1>some heading</h1>');
    const node = fixture.querySelector('h1');
    const virtualNode = axe.utils.getNodeFromTree(axe._tree[0], node);
    expect(rule.matches(node, virtualNode)).toBe(false);
  });

  it('should pass because is a landmark', function () {
    fixtureSetup('<div role="banner">some banner</div>');
    const node = fixture.querySelector('div');
    fixture.appendChild(node);
    const virtualNode = axe.utils.getNodeFromTree(axe._tree[0], node);
    expect(rule.matches(node, virtualNode)).toBe(true);
  });

  it('should not match because landmark is hidden', function () {
    fixtureSetup('<div role="banner">some banner</div>');
    const node = fixture.querySelector('div');
    node.style.display = 'none';
    fixture.appendChild(node);
    const virtualNode = axe.utils.getNodeFromTree(axe._tree[0], node);
    expect(rule.matches(node, virtualNode)).toBe(false);
  });

  describe('form and section elements must have accessible names to be matched', function () {
    const sectionFormElements = ['section', 'form'];

    sectionFormElements.forEach(function (elementType) {
      it(
        'should match because it is a ' + elementType + ' with a label',
        function () {
          fixtureSetup(
            '<' +
              elementType +
              ' aria-label="sample label">some ' +
              elementType +
              '</' +
              elementType +
              '>'
          );
          const node = fixture.querySelector(elementType);
          const virtualNode = axe.utils.getNodeFromTree(axe._tree[0], node);
          expect(rule.matches(node, virtualNode)).toBe(true);
        }
      );

      it(
        'should not match because it is a ' + elementType + ' without a label',
        function () {
          fixtureSetup(
            '<' +
              elementType +
              '>some ' +
              elementType +
              '</' +
              elementType +
              '>'
          );
          const node = fixture.querySelector(elementType);
          const virtualNode = axe.utils.getNodeFromTree(axe._tree[0], node);
          expect(rule.matches(node, virtualNode)).toBe(false);
        }
      );
    });
  });

  describe('header/footers should only match when not inside the excluded descendants', function () {
    headerFooterElements.forEach(function (elementType) {
      excludedDescendantsForHeadersFooters.forEach(function (exclusionType) {
        it(
          'should not match because ' +
            elementType +
            ' is contained inside an ' +
            exclusionType,
          function () {
            fixtureSetup(
              '<' +
                exclusionType +
                ' aria-label="sample label"><' +
                elementType +
                '>an element</' +
                elementType +
                '></' +
                exclusionType +
                '>'
            );
            const node = fixture.querySelector(elementType);
            const virtualNode = axe.utils.getNodeFromTree(axe._tree[0], node);
            expect(rule.matches(node, virtualNode)).toBe(false);
          }
        );
      });

      it(
        'should match because ' +
          elementType +
          ' is not contained inside the excluded descendants',
        function () {
          fixtureSetup('<' + elementType + '>an element</' + elementType + '>');
          const node = fixture.querySelector(elementType);
          const virtualNode = axe.utils.getNodeFromTree(axe._tree[0], node);
          expect(rule.matches(node, virtualNode)).toBe(true);
        }
      );
    });
  });

  describe('aside should not match when scoped to a sectioning content element unless it has an accessible name', function () {
    sectioningContentElements.forEach(function (exclusionType) {
      it(
        'should not match because aside is scoped to ' +
          exclusionType +
          ' and has no label',
        function () {
          fixtureSetup(
            '<' +
              exclusionType +
              '><aside data-test>an element</aside></' +
              exclusionType +
              '>'
          );
          const node = fixture.querySelector('aside[data-test]');
          const virtualNode = axe.utils.getNodeFromTree(axe._tree[0], node);
          expect(rule.matches(node, virtualNode)).toBe(false);
        }
      );

      it(
        'should match because aside within ' + exclusionType + ' has a label',
        function () {
          fixtureSetup(
            '<' +
              exclusionType +
              '><aside aria-label="sample label" data-test>an element</aside></' +
              exclusionType +
              '>'
          );
          const node = fixture.querySelector('aside[data-test]');
          const virtualNode = axe.utils.getNodeFromTree(axe._tree[0], node);
          expect(rule.matches(node, virtualNode)).toBe(true);
        }
      );
    });

    it('should match because aside is not scoped to a sectioning content element', function () {
      fixtureSetup('<aside>an element</aside>');
      const node = fixture.querySelector('aside');
      const virtualNode = axe.utils.getNodeFromTree(axe._tree[0], node);
      expect(rule.matches(node, virtualNode)).toBe(true);
    });
  });

  it('return true for landmarks contained within shadow dom', function () {
    const container = document.createElement('div');
    const shadow = container.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<footer></footer>';

    fixtureSetup(container);
    const vNode = axe.utils.querySelectorAll(axe._tree[0], 'footer')[0];
    expect(rule.matches(vNode.actualNode, vNode)).toBe(true);
  });

  describe('header/footers should only match when not inside the excluded descendants within shadow dom', function () {
    let container;
    let shadow;

    beforeEach(function () {
      container = document.createElement('div');
      shadow = container.attachShadow({ mode: 'open' });
    });

    headerFooterElements.forEach(function (elementType) {
      excludedDescendantsForHeadersFooters.forEach(function (exclusionType) {
        it(
          'should not match because ' +
            elementType +
            ' is contained inside an ' +
            exclusionType +
            '',
          function () {
            shadow.innerHTML =
              '<' +
              exclusionType +
              ' aria-label="sample label"><' +
              elementType +
              '>an element</' +
              elementType +
              '></' +
              exclusionType +
              '>';

            fixtureSetup(container);
            const virtualNode = axe.utils.querySelectorAll(
              axe._tree[0],
              elementType
            )[0];
            expect(rule.matches(virtualNode.actualNode, virtualNode)).toBe(
              false
            );
          }
        );
      });

      it(
        'should match because ' +
          elementType +
          ' is not contained inside the excluded descendants',
        function () {
          shadow.innerHTML =
            '<' + elementType + '>an element</' + elementType + '>';
          fixtureSetup(container);
          const virtualNode = axe.utils.querySelectorAll(
            axe._tree[0],
            elementType
          )[0];
          expect(rule.matches(virtualNode.actualNode, virtualNode)).toBe(true);
        }
      );
    });
  });

  describe('aside should match inside shadow dom unless it is both within sectioning content and has no accessible name', function () {
    let container;
    let shadow;

    beforeEach(function () {
      container = document.createElement('div');
      shadow = container.attachShadow({ mode: 'open' });
    });

    sectioningContentElements.forEach(function (exclusionType) {
      it(
        'should not match because aside is scoped to ' +
          exclusionType +
          ' and has no label',
        function () {
          shadow.innerHTML =
            '<' +
            exclusionType +
            ' aria-label="sample label"><aside data-test>an element</aside></' +
            exclusionType +
            '>';

          fixtureSetup(container);
          const virtualNode = axe.utils.querySelectorAll(
            axe._tree[0],
            'aside[data-test]'
          )[0];
          expect(rule.matches(virtualNode.actualNode, virtualNode)).toBe(false);
        }
      );

      it(
        'should match because aside within ' + exclusionType + ' has a label',
        function () {
          shadow.innerHTML =
            '<' +
            exclusionType +
            '><aside aria-label="sample label" data-test>an element</aside></' +
            exclusionType +
            '>';
          fixtureSetup(container);
          const virtualNode = axe.utils.querySelectorAll(
            axe._tree[0],
            'aside[data-test]'
          )[0];
          expect(rule.matches(virtualNode.actualNode, virtualNode)).toBe(true);
        }
      );
    });

    it('should match because aside is not scoped to a sectioning content element', function () {
      shadow.innerHTML = '<aside>an element</aside>';
      fixtureSetup(container);
      const virtualNode = axe.utils.querySelectorAll(axe._tree[0], 'aside')[0];
      expect(rule.matches(virtualNode.actualNode, virtualNode)).toBe(true);
    });
  });
});
