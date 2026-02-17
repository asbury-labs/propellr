import { describe, it, beforeEach, expect } from 'vitest';

declare const axe: any;
describe('matches.fromDefinition', function () {
  const fromDefinition = axe.commons.matches.fromDefinition;
  const fixture = document.querySelector('#fixture');
  const queryFixture = axe.testUtils.queryFixture;

  beforeEach(function () {
    fixture.innerHTML = '';
  });

  it('applies a css selector when the matcher is a string', function () {
    const virtualNode = queryFixture('<div id="target">foo</div>');
    expect(fromDefinition(virtualNode, '#fixture > div')).toBe(true);
    expect(fromDefinition(virtualNode, '#fixture > span')).toBe(false);
  });

  it('matches a definition with a `nodeName` property', function () {
    const virtualNode = queryFixture('<div id="target">foo</div>');
    const matchers = [
      'div',
      ['div', 'span'],
      /div/,
      function (nodeName) {
        return nodeName === 'div';
      }
    ];
    matchers.forEach(function (matcher) {
      expect(
        fromDefinition(virtualNode, {
          nodeName: matcher
        })
      ).toBe(true);
    });
    expect(
      fromDefinition(virtualNode, {
        nodeName: 'span'
      })
    ).toBe(false);
  });

  it('matches a definition with an `attributes` property', function () {
    const virtualNode = queryFixture('<div id="target" foo="bar">foo</div>');
    const matchers = [
      'bar',
      ['bar', 'baz'],
      /bar/,
      function (attributeName) {
        return attributeName === 'bar';
      }
    ];
    matchers.forEach(function (matcher) {
      expect(
        fromDefinition(virtualNode, {
          attributes: {
            foo: matcher
          }
        })
      ).toBe(true);
    });
    expect(
      fromDefinition(virtualNode, {
        attributes: {
          foo: 'baz'
        }
      })
    ).toBe(false);
  });

  it('matches a definition with a `properties` property', function () {
    const virtualNode = queryFixture('<input id="target" />');
    const matchers = [
      'text',
      ['text', 'password'],
      /text/,
      function (type) {
        return type === 'text';
      }
    ];
    matchers.forEach(function (matcher) {
      expect(
        fromDefinition(virtualNode, {
          properties: {
            type: matcher
          }
        })
      ).toBe(true);
    });
    expect(
      fromDefinition(virtualNode, {
        properties: {
          type: 'password'
        }
      })
    ).toBe(false);
  });

  it('matches a definition with an `explicitRole` property', function () {
    const virtualNode = queryFixture(
      '<span id="target" role="textbox"></span>'
    );
    const matchers = [
      'textbox',
      ['textbox', 'combobox'],
      /textbox/,
      function (attributeName) {
        return attributeName === 'textbox';
      }
    ];
    matchers.forEach(function (matcher) {
      expect(
        fromDefinition(virtualNode, {
          explicitRole: matcher
        })
      ).toBe(true);
    });
    expect(
      fromDefinition(virtualNode, {
        explicitRole: 'main'
      })
    ).toBe(false);
  });

  it('matches a definition with an `implicitRole` property', function () {
    const virtualNode = queryFixture('<input id="target">');
    const matchers = [
      'textbox',
      ['textbox', 'combobox'],
      /textbox/,
      function (attributeName) {
        return attributeName === 'textbox';
      }
    ];
    matchers.forEach(function (matcher) {
      expect(
        fromDefinition(virtualNode, {
          implicitRole: matcher
        })
      ).toBe(true);
    });
    expect(
      fromDefinition(virtualNode, {
        implicitRole: 'main'
      })
    ).toBe(false);
  });

  it('matches a definition with an `semanticRole` property', function () {
    const virtualNode = queryFixture('<input id="target">');
    const matchers = [
      'textbox',
      ['textbox', 'combobox'],
      /textbox/,
      function (attributeName) {
        return attributeName === 'textbox';
      }
    ];
    matchers.forEach(function (matcher) {
      expect(
        fromDefinition(virtualNode, {
          semanticRole: matcher
        })
      ).toBe(true);
    });
    expect(
      fromDefinition(virtualNode, {
        semanticRole: 'main'
      })
    ).toBe(false);
  });

  it('matches a definition with an `accessibleName` property', function () {
    const virtualNode = queryFixture('<input id="target" aria-label="foo">');
    expect(
      fromDefinition(virtualNode, {
        hasAccessibleName: true
      })
    ).toBe(true);
    expect(
      fromDefinition(virtualNode, {
        hasAccessibleName: false
      })
    ).toBe(false);
  });

  it('returns true when all matching properties return true', function () {
    const virtualNode = queryFixture(
      '<input id="target" value="bar" aria-disabled="true" />'
    );
    expect(
      fromDefinition(virtualNode, {
        nodeName: 'input',
        properties: {
          type: 'text',
          id: 'target'
        },
        attributes: {
          'aria-disabled': 'true'
        }
      })
    ).toBe(true);
  });

  it('returns false when some matching properties return false', function () {
    const virtualNode = queryFixture(
      '<input id="target" value="bar" aria-disabled="true" />'
    );
    expect(
      fromDefinition(virtualNode, {
        nodeName: 'input',
        attributes: {
          'aria-disabled': 'false'
        }
      })
    ).toBe(false);
  });

  describe('with actual nodes', function () {
    it('matches using a string', function () {
      const virtualNode = queryFixture('<div id="target">foo</div>');
      expect(fromDefinition(virtualNode.actualNode, 'div')).toBe(true);
      expect(fromDefinition(virtualNode.actualNode, 'span')).toBe(false);
    });

    it('matches nodeName', function () {
      const virtualNode = queryFixture('<div id="target">foo</div>');
      expect(
        fromDefinition(virtualNode.actualNode, {
          nodeName: 'div'
        })
      ).toBe(true);
      expect(
        fromDefinition(virtualNode.actualNode, {
          nodeName: 'span'
        })
      ).toBe(false);
    });

    it('matches attributes', function () {
      const virtualNode = queryFixture('<div id="target" foo="bar">foo</div>');
      expect(
        fromDefinition(virtualNode.actualNode, {
          attributes: {
            foo: 'bar'
          }
        })
      ).toBe(true);
      expect(
        fromDefinition(virtualNode.actualNode, {
          attributes: {
            foo: 'baz'
          }
        })
      ).toBe(false);
    });

    it('matches properties', function () {
      const virtualNode = queryFixture('<input id="target" value="foo" />');
      expect(
        fromDefinition(virtualNode.actualNode, {
          properties: {
            id: 'target'
          }
        })
      ).toBe(true);
      expect(
        fromDefinition(virtualNode.actualNode, {
          properties: {
            id: 'bar'
          }
        })
      ).toBe(false);
    });
  });

  describe('with SerialVirtualNode', function () {
    it('matches using a string', function () {
      const serialNode = new axe.SerialVirtualNode({
        nodeName: 'div',
        attributes: {
          id: 'target'
        }
      });
      expect(fromDefinition(serialNode, 'div')).toBe(true);
      expect(fromDefinition(serialNode, 'span')).toBe(false);
    });

    it('matches nodeName', function () {
      const serialNode = new axe.SerialVirtualNode({
        nodeName: 'div',
        attributes: {
          id: 'target'
        }
      });
      expect(
        fromDefinition(serialNode, {
          nodeName: 'div'
        })
      ).toBe(true);
      expect(
        fromDefinition(serialNode, {
          nodeName: 'span'
        })
      ).toBe(false);
    });

    it('matches attributes', function () {
      const serialNode = new axe.SerialVirtualNode({
        nodeName: 'div',
        attributes: {
          id: 'target',
          foo: 'bar'
        }
      });
      expect(
        fromDefinition(serialNode, {
          attributes: {
            foo: 'bar'
          }
        })
      ).toBe(true);
      expect(
        fromDefinition(serialNode, {
          attributes: {
            foo: 'baz'
          }
        })
      ).toBe(false);
    });

    it('matches properties', function () {
      const serialNode = new axe.SerialVirtualNode({
        nodeName: 'input',
        id: 'target'
      });
      expect(
        fromDefinition(serialNode, {
          properties: {
            id: 'target'
          }
        })
      ).toBe(true);
      expect(
        fromDefinition(serialNode, {
          properties: {
            id: 'bar'
          }
        })
      ).toBe(false);
    });
  });

  describe('with a `condition` property', function () {
    it('calls condition and uses its return value as a matcher', function () {
      const virtualNode = queryFixture('<div id="target">foo</div>');
      const called = false;
      expect(
        fromDefinition(virtualNode, {
          condition: function (node) {
            expect(node).toEqual(virtualNode);
            called = true;
            return true;
          }
        })
      ).toBe(true);
      expect(
        fromDefinition(virtualNode, {
          condition: function () {
            return false;
          }
        })
      ).toBe(false);
      expect(called).toBe(true);
    });

    it('uses the return value as a matcher', function () {
      const returnVal = 'true';
      function condition() {
        return returnVal;
      }
      expect(
        fromDefinition(fixture, {
          condition: condition // Truthy test
        })
      ).toBe(true);

      returnVal = 0; // Falsey test
      expect(
        fromDefinition(fixture, {
          condition: condition
        })
      ).toBe(false);
    });
  });

  describe('with an `array` of definitions', function () {
    it('returns true if any definition in the array matches', function () {
      const virtualNode = queryFixture('<div id="target">foo</div>');
      expect(
        fromDefinition(virtualNode, [
          { nodeName: 'span' },
          { nodeName: 'div' },
          { nodeName: 'h1' }
        ])
      ).toBe(true);
    });

    it('returns false if none definition in the array matches', function () {
      const virtualNode = queryFixture('<input id="target" />');
      expect(
        fromDefinition(virtualNode, [
          { nodeName: 'span' },
          { nodeName: 'div' },
          { nodeName: 'h1' }
        ])
      ).toBe(false);
    });
  });
});
