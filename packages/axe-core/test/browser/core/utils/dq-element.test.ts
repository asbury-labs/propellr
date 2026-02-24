import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fixtureSetup, queryFixture } from '../../../testutils';

declare const axe: any;
describe('DqElement', () => {
  const DqElement = axe.utils.DqElement;
  const fixture = document.getElementById('fixture');

  afterEach(() => {
    axe.reset();
  });

  it('should be exposed to utils', () => {
    expect(axe.utils.DqElement).toBe(DqElement);
  });

  it('should take a virtual node as a parameter and return an object', () => {
    const vNode = queryFixture('<div id="target"></div>');
    const result = new DqElement(vNode);
    expect(result.element).toBe(vNode.actualNode);
  });

  it('should take an actual node as a parameter and return an object', () => {
    const vNode = queryFixture('<div id="target"></div>');
    const result = new DqElement(vNode.actualNode);
    expect(result.element).toBe(vNode.actualNode);
  });

  it('should return the same DqElement when instantiated with the same element', () => {
    const vNode = queryFixture('<div id="target"></div>');
    const result = new DqElement(vNode);
    const result2 = new DqElement(vNode);
    expect(result).toBe(result2);
  });

  describe('element', () => {
    it('should store reference to the element', () => {
      const vNode = queryFixture('<div id="target"></div>');
      const dqEl = new DqElement(vNode);
      expect(dqEl.element).toBe(vNode.actualNode);
    });

    it('should not be present in stringified version', () => {
      const vNode = queryFixture('<div id="target"></div>');
      const dqEl = new DqElement(vNode);
      expect(JSON.parse(JSON.stringify(dqEl)).element).toBeUndefined();
    });
  });

  describe('source', () => {
    it('should include the outerHTML of the element', () => {
      const vNode = queryFixture('<div class="bar" id="target">Hello!</div>');
      const outerHTML = vNode.actualNode.outerHTML;
      const result = new DqElement(vNode);
      expect(result.source).toBe(outerHTML);
    });

    it('should work with SVG elements', () => {
      const vNode = queryFixture('<svg aria-label="foo" id="target"></svg>');
      const result = new DqElement(vNode);
      expect(result.source).toBe(vNode.actualNode.outerHTML);
    });

    it('should work with MathML', () => {
      const vNode = queryFixture(
        '<math display="block" id="target">' +
          '<mrow><msup><mi>x</mi><mn>2</mn></msup></mrow>' +
          '</math>'
      );

      const result = new DqElement(vNode);
      expect(result.source).toBe(vNode.actualNode.outerHTML);
    });

    it('should truncate large elements', () => {
      let div = '<div class="foo" id="target">';
      for (let i = 0; i < 300; i++) {
        div += i;
      }
      div += '</div>';
      const vNode = queryFixture(div);
      const result = new DqElement(vNode);
      expect(result.source).toBe('<div class="foo" id="target">');
    });

    it('should truncate large attributes of large element', () => {
      const el = document.createElement('div');
      let attributeName = 'data-';
      let attributeValue = '';
      for (let i = 0; i < 500; i++) {
        attributeName += 'foo';
        attributeValue += i;
      }
      el.setAttribute(attributeName, attributeValue);

      const vNode = new DqElement(el);
      expect(vNode.source).toBe(
        `<div ${attributeName.substring(0, 20)}...="${attributeValue.substring(0, 20)}...">`
      );
    });

    it('should remove attributes for a large element having a large number of attributes', () => {
      let customElement = '<div id="target"';

      for (let i = 0; i < 100; i++) {
        customElement += ` attr${i}="value${i}"`;
      }

      customElement += `><div>`;
      const vNode = queryFixture(customElement);
      const result = new DqElement(vNode);
      const truncatedAttrCount = (result.source.match(/attr/g) || []).length;
      expect(truncatedAttrCount).toBeLessThan(100);
      expect(truncatedAttrCount).toBeGreaterThanOrEqual(10);
    });

    it('should truncate a large element with long custom tag name', () => {
      const longCustomElementTagName = new Array(300).join('b');
      const customElement = `<${longCustomElementTagName} id="target">A</${longCustomElementTagName}>`;
      const vNode = queryFixture(customElement);
      const result = new DqElement(vNode);
      expect(result.source).toBe(`${customElement.substring(0, 300)} ...>`);
    });

    it('should not truncate attributes if children are long but attribute itself is within limits', () => {
      const el = document.createElement('div');
      let attributeValue = '';
      let innerHtml = '';
      for (let i = 0; i < 50; i++) {
        attributeValue += 'a';
        innerHtml += 'foobar';
      }
      el.setAttribute('long-attribute', attributeValue);
      el.innerHTML = innerHtml;

      const vNode = new DqElement(el);
      expect(vNode.source).toBe(`<div long-attribute="${attributeValue}">`);
    });

    it('should use spec object over passed element', () => {
      const vNode = queryFixture('<div id="target" class="bar">Hello!</div>');
      const spec = { source: 'woot' };
      const result = new DqElement(vNode, {}, spec);
      expect(result.source).toBe('woot');
    });

    it('should return null if audit.noHtml is set', () => {
      axe.configure({ noHtml: true });
      const vNode = queryFixture('<div class="bar" id="target">Hello!</div>');
      const result = new DqElement(vNode);
      expect(result.source).toBeNull();
    });

    it('should not use spec object over passed element if audit.noHtml is set', () => {
      axe.configure({ noHtml: true });
      const vNode = queryFixture('<div id="target" class="bar">Hello!</div>');
      const spec = { source: 'woot' };
      const result = new DqElement(vNode, {}, spec);
      expect(result.source).toBeNull();
    });
  });

  describe('selector', () => {
    it('should prefer selector from spec object', () => {
      const vNode = queryFixture('<div id="target" class="bar">Hello!</div>');
      const spec = { selector: 'woot' };
      const result = new DqElement(vNode, {}, spec);
      expect(result.selector).toBe('woot');
    });
  });

  describe('ancestry', () => {
    it('should prefer selector from spec object', () => {
      const vNode = queryFixture('<div id="target" class="bar">Hello!</div>');
      const spec = { ancestry: 'woot' };
      const result = new DqElement(vNode, {}, spec);
      expect(result.ancestry).toBe('woot');
    });
  });

  describe('xpath', () => {
    it('should prefer selector from spec object', () => {
      const vNode = queryFixture('<div id="target" class="bar">Hello!</div>');
      const spec = { xpath: 'woot' };
      const result = new DqElement(vNode, {}, spec);
      expect(result.xpath).toBe('woot');
    });
  });

  describe('absolutePaths', () => {
    it('creates a path all the way to root', () => {
      const vNode = queryFixture('<div id="target" class="bar">Hello!</div>');
      const result = new DqElement(vNode, {
        absolutePaths: true
      });
      expect(result.selector[0]).toContain('html > ');
      expect(result.selector[0]).toContain('#fixture > ');
      expect(result.selector[0]).toContain('#target');
    });
  });

  describe('nodeIndexes', () => {
    it('is taken from virtualNode', () => {
      fixtureSetup('<i></i><b></b><s></s>');
      expect(new DqElement(fixture.children[0]).nodeIndexes).toEqual([1]);
      expect(new DqElement(fixture.children[1]).nodeIndexes).toEqual([2]);
      expect(new DqElement(fixture.children[2]).nodeIndexes).toEqual([3]);
    });

    it('is taken from spec, over virtualNode', () => {
      const vNode = queryFixture('<div id="target"></div>');
      const spec = { nodeIndexes: [123, 456] };
      const dqElm = new DqElement(vNode, {}, spec);
      expect(dqElm.nodeIndexes).toEqual([123, 456]);
    });

    it('is [] when the element is not in the virtual tree.', () => {
      const div = document.createElement('div');
      const dqElm = new DqElement(div);
      expect(dqElm.nodeIndexes).toEqual([]);
    });
  });

  describe('toJSON', () => {
    it('should only stringify selector and source', () => {
      const spec = {
        selector: ['foo > bar > joe'],
        source: '<joe aria-required="true">',
        xpath: ['/foo/bar/joe'],
        ancestry: ['foo > bar > joe'],
        nodeIndexes: [123],
        fromFrame: false
      };

      const div = document.createElement('div');
      const result = new DqElement(div, {}, spec);
      expect(result.toJSON()).toEqual(spec);
    });
  });

  describe('merging frames', () => {
    let dqMain, dqIframe;
    beforeEach(() => {
      const tree = fixtureSetup(
        '<main id="main"></main><iframe id="iframe"></iframe>'
      );
      const main = axe.utils.querySelectorAll(tree, 'main')[0];
      const mainSpec = {
        selector: ['#main'],
        ancestry: ['html > body > main'],
        xpath: ['/main']
      };
      dqMain = new DqElement(main, {}, mainSpec);

      const iframe = axe.utils.querySelectorAll(tree, 'iframe')[0];
      const iframeSpec = {
        selector: ['#iframe'],
        ancestry: ['html > body > iframe'],
        xpath: ['/iframe']
      };
      dqIframe = new DqElement(iframe, {}, iframeSpec);
    });

    describe('.mergeSpecs', () => {
      let mainSpec, iframeSpec;
      beforeEach(() => {
        mainSpec = dqMain.toJSON();
        iframeSpec = dqIframe.toJSON();
      });

      it('merges node and frame selectors', () => {
        const mergedSpec = DqElement.mergeSpecs(mainSpec, iframeSpec);
        expect(mergedSpec.selector).toEqual([
          iframeSpec.selector[0],
          mainSpec.selector[0]
        ]);
        expect(mergedSpec.ancestry).toEqual([
          iframeSpec.ancestry[0],
          mainSpec.ancestry[0]
        ]);
        expect(mergedSpec.xpath).toEqual([
          iframeSpec.xpath[0],
          mainSpec.xpath[0]
        ]);
      });

      it('merges nodeIndexes', () => {
        const mergedSpec = DqElement.mergeSpecs(mainSpec, iframeSpec);
        expect(mergedSpec.nodeIndexes).toEqual([
          iframeSpec.nodeIndexes[0],
          mainSpec.nodeIndexes[0]
        ]);
      });
    });

    describe('DqElement.fromFrame', () => {
      it('returns a new DqElement', () => {
        expect(DqElement.fromFrame(dqMain, {}, dqIframe)).toBeInstanceOf(
          DqElement
        );
      });

      it('sets options for DqElement', () => {
        const options = { absolutePaths: true };
        const dqElm = DqElement.fromFrame(dqMain, options, dqIframe);
        expect(dqElm._options.toRoot).toBe(true);
      });

      it('has props as from mergeSpecs', () => {
        const spec = DqElement.mergeSpecs(dqMain.toJSON(), dqIframe.toJSON());
        const dqElm = DqElement.fromFrame(dqMain, {}, dqIframe);
        expect(dqElm.toJSON()).toEqual(spec);
      });
    });

    describe('DqElement.prototype.fromFrame', () => {
      it('is false when created without a spec', () => {
        expect(dqMain.fromFrame).toBe(false);
      });

      it('is false when spec is not from a frame', () => {
        const specMain = dqMain.toJSON();
        const dqElm = new DqElement(dqMain, {}, specMain);
        expect(dqElm.fromFrame).toBe(false);
      });

      it('is true when created with a spec', () => {
        const dqElm = DqElement.fromFrame(dqMain, {}, dqIframe);
        expect(dqElm.fromFrame).toBe(true);
      });
    });
  });

  describe('DqElement.setRunOptions', () => {
    it('sets options for DqElement', () => {
      axe.setup();
      const options = { absolutePaths: true, elementRef: true };
      DqElement.setRunOptions(options);
      const dqElm = new DqElement(document.body);

      const { element, selector } = dqElm.toJSON();
      expect(element).toBe(document.body);
      expect(selector).toBe('html > body');
    });

    it('is reset by axe.teardown', () => {
      const options = { absolutePaths: true, elementRef: true };
      DqElement.setRunOptions(options);
      axe.teardown();

      axe.setup();
      const dqElm = new DqElement(document.body);
      const { element, selector } = dqElm.toJSON();
      expect(element).toBeUndefined();
      expect(selector).toBe('body');
    });
  });
});
