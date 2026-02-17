import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('hidden-explicit-label', function () {
  const shadowSupport = axe.testUtils.shadowSupport;
  const shadowCheckSetup = axe.testUtils.shadowCheckSetup;
  const checkContext = axe.testUtils.MockCheckContext();
  const checkSetup = axe.testUtils.checkSetup;
  const check = checks['hidden-explicit-label'];

  afterEach(function () {
    checkContext.reset();
  });

  it('should return true if a hidden non-empty label is present', function () {
    const args = checkSetup(
      '<label for="target" style="display:none">Text</label><input type="text" id="target">',
      {},
      '#target'
    );
    expect(check.evaluate.apply(check, args)).toBe(true);
  });

  it('should return false if a visible non-empty label is present', function () {
    const args = checkSetup(
      '<label for="target">Label</label><input type="text" id="target">'
    );
    expect(check.evaluate.apply(check, args)).toBe(false);
  });

  it('should return true if an invisible empty label is present', function () {
    const args = checkSetup(
      '<label for="target" style="display: none;"></label><input type="text" id="target">'
    );
    expect(check.evaluate.apply(check, args)).toBe(true);
  });

  (shadowSupport.v1 ? it : xit)(
    'should return true if content is inside of shadow DOM',
    function () {
      const params = shadowCheckSetup(
        '<div></div>',
        '<label for="target" style="display:none">Text</label><input type="text" id="target">'
      );

      expect(check.evaluate.apply(shadowCheckSetup, params)).toBe(true);
    }
  );

  (shadowSupport.v1 ? it : xit)(
    'should return false if part of the pairing is inside of shadow DOM',
    function () {
      const params = shadowCheckSetup(
        '<div><label for="target" style="display:none">Text</label></div>',
        '<input type="text" id="target">'
      );

      expect(check.evaluate.apply(shadowCheckSetup, params)).toBe(false);
    }
  );

  it('should fail when the label has aria-hidden=true', function () {
    const html = '';
    html += '<div>';
    html += '  <label for="target" aria-hidden="true">';
    html += '    Hello world';
    html += '  </label>';
    html += '  <input id="target">';
    html += '</div>';
    const args = checkSetup(html, {}, '#target');
    expect(check.evaluate.apply(check, args)).toBe(true);
  });

  describe('if the label is hidden', function () {
    describe('and the element has an accessible name', function () {
      it('should not fail', function () {
        const html = '';

        html += '<div>';
        html += '  <label for="target" style="display:none">';
        html += '    Hello world';
        html += '  </label>';
        html += '  <input id="target" title="Hi">';
        html += '</div>';

        const args = checkSetup(html, {}, '#target');
        expect(check.evaluate.apply(check, args)).toBe(false);
      });
    });
  });

  describe('SerialVirtualNode', function () {
    it('should return false if no id', function () {
      const vNode = new axe.SerialVirtualNode({
        nodeName: 'input',
        attributes: {
          type: 'text'
        }
      });
      expect(
        axe.testUtils.getCheckEvaluate('hidden-explicit-label')(null, {}, vNode)
      ).toBe(false);
    });

    it('should return undefined if it has id', function () {
      const vNode = new axe.SerialVirtualNode({
        nodeName: 'input',
        attributes: {
          type: 'text',
          id: 'foobar'
        }
      });
      expect(
        axe.testUtils.getCheckEvaluate('hidden-explicit-label')(null, {}, vNode)
      ).toBeUndefined();
    });
  });
});
