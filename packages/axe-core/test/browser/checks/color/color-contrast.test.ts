import { describe, it, expect, afterEach } from 'vitest';
import {
  checkSetup,
  fixtureSetup,
  flatTreeSetup,
  getCheckEvaluate,
  MockCheckContext,
  shadowCheckSetup,
  shadowSupport
} from '../../../testutils';

declare const axe: any;
describe('color-contrast', function () {
  const fixture = document.getElementById('fixture')!;
  const shadowSupported = shadowSupport.v1;
  const checkContext = MockCheckContext();
  const contrastEvaluate = getCheckEvaluate('color-contrast');

  afterEach(function () {
    fixture.innerHTML = '';
    checkContext.reset();
    axe._tree = undefined;
  });

  it('should return undefined if cannot handle color', function () {
    const params = checkSetup(
      '<div id="divundertest" style="color: oklch(0.961073 0.000047911 none / 0.2); background-color: black; font-size: 14pt; font-weight: 900;">' +
        '<span id="target" style="font-weight:lighter;">My text</span></div>'
    );

    const expectedRelatedNodes = fixture.querySelector('#divundertest');
    expect(contrastEvaluate.apply(checkContext, params)).toBeUndefined();
    expect(checkContext._relatedNodes).toEqual([expectedRelatedNodes]);
    expect(checkContext._data.messageKey).toEqual('colorParse');
    expect(checkContext._data.colorParse).toBe(
      'oklch(0.961073 0.000047911 none / 0.2)'
    );
  });

  it('should return undefined if cannot handle backgroundcolor', function () {
    const params = checkSetup(
      '<div style="color: gray; background-color: oklch(0.961073 0.000047911 none / 0.2); font-size: 14pt; font-weight: 900;">' +
        '<span id="target" style="font-weight:lighter;">My text</span></div>'
    );
    expect(contrastEvaluate.apply(checkContext, params)).toBeUndefined();
    expect(checkContext._relatedNodes).toEqual([]);
    expect(checkContext._data.messageKey).toEqual('colorParse');
    expect(checkContext._data.colorParse).toBe(
      'oklch(0.961073 0.000047911 none / 0.2)'
    );
  });

  it('should return undefined if cannot handle text-shadow', function () {
    const params = checkSetup(
      '<div id="target" style="background-color: #fff; color:#000; text-shadow: 1px 1px oklch(0.961073 0.000047911 none / 0.2);">My text</div>'
    );

    expect(contrastEvaluate.apply(checkContext, params)).toBeUndefined();
    expect(checkContext._relatedNodes).toEqual([]);
  });

  it('should return true for hidden element', function () {
    const params = checkSetup(
      '<div style="color: gray; background-color: white; font-size: 14pt; font-weight: 100;">' +
        '<span  id="target" style="font-weight:bolder; opacity: 0;">My text</span></div>'
    );

    expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._relatedNodes).toEqual([]);
  });

  it('should return true for child of hidden element', function () {
    const params = checkSetup(
      '<div style="color: gray; background-color: white; font-size: 14pt; font-weight: 100; overflow: scroll; height: 0">' +
        '<span id="target" style="font-weight:bolder">My text</span></div>'
    );

    expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._relatedNodes).toEqual([]);
  });

  it('should return the proper values stored in data', function () {
    const params = checkSetup(
      '<div id="parent" style="color: black; background-color: white; font-size: 14pt">' +
        '<b id="target">My text</b></div>'
    );
    const white = new axe.commons.color.Color(255, 255, 255, 1);
    const black = new axe.commons.color.Color(0, 0, 0, 1);

    expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._data.bgColor).toBe(white.toHexString());
    expect(checkContext._data.fgColor).toBe(black.toHexString());
    expect(checkContext._data.contrastRatio).toBe('21.00');
    expect(checkContext._data.fontWeight).toBe('bold');
    expect(parseFloat(checkContext._data.fontSize)).toBeGreaterThanOrEqual(14);
    expect(checkContext._relatedNodes).toEqual([]);
  });

  it('should return true when there is sufficient contrast because of bold tag', function () {
    const params = checkSetup(
      '<div id="parent" style="color: gray; background-color: white; font-size: 14pt">' +
        '<b id="target">My text</b></div>'
    );

    expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._relatedNodes).toEqual([]);
  });

  it('should return true when there is sufficient contrast because of font weight', function () {
    const params = checkSetup(
      '<div style="color: gray; background-color: white; font-size: 14pt; font-weight: 900" id="target">' +
        '<span style="font-weight:lighter">My text</span></div>'
    );

    expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._relatedNodes).toEqual([]);
  });

  it('should return false when there is not sufficient contrast because of font weight', function () {
    const params = checkSetup(
      '<div style="color: gray; background-color: white; font-size: 14pt; font-weight: 100" id="target">' +
        '<span style="font-weight:bolder">My text</span></div>'
    );

    expect(contrastEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._relatedNodes).toEqual([params[0]]);
  });

  it('should return true when there is sufficient contrast because of font size', function () {
    const params = checkSetup(
      '<div style="color: gray; background-color: white; font-size: 18pt;" id="target">' +
        'My text</div>'
    );
    expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._relatedNodes).toEqual([]);
  });

  it('should return false when there is not sufficient contrast because of font size', function () {
    const params = checkSetup(
      '<div style="color: gray; background-color: white; font-size: 8pt; -webkit-text-size-adjust: none;" id="target">' +
        'My text</div>'
    );

    expect(contrastEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._relatedNodes).toEqual([params[0]]);
  });

  it('should return true when there is sufficient contrast with explicit transparency', function () {
    const params = checkSetup(
      '<div id="parent" style="color: white; background-color: white;">' +
        '<span style="color: black; background-color: rgba(0,0,0,0)" id="target">My text</span></div>'
    );

    expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._relatedNodes).toEqual([]);
  });

  it('should return true when there is sufficient contrast with implicit transparency', function () {
    const params = checkSetup(
      '<div id="parent" style="color: white; background-color: white;">' +
        '<span style="color: black;" id="target">My text</span></div>'
    );

    expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._relatedNodes).toEqual([]);
  });

  it('should return true when there is sufficient contrast', function () {
    const params = checkSetup(
      '<div style="color: black; background-color: white;" id="target">' +
        'My text</div>'
    );

    expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._relatedNodes).toEqual([]);
  });

  it('should return true for inline elements with sufficient contrast spanning multiple lines', function () {
    const params = checkSetup(
      '<p>Text oh heyyyy <a href="#" id="target">and here\'s <br>a link</a></p>'
    );
    expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._relatedNodes).toEqual([]);
  });

  it('should return undefined for inline elements spanning multiple lines that are overlapped', function () {
    const params = checkSetup(
      '<div style="position:relative;"><div style="background-color:rgba(0,0,0,1);position:absolute;width:300px;height:200px;"></div>' +
        '<p>Text oh heyyyy <a href="#" id="target">and here\'s <br>a link</a></p></div>'
    );
    expect(contrastEvaluate.apply(checkContext, params)).toBeUndefined();
    expect(checkContext._relatedNodes).toEqual([]);
  });

  it('should return true for truncated inline elements', function () {
    const params = checkSetup(
      '<p>Text oh heyyyy <b id="target" style="display: block;overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed et sollicitudin quam. Fusce mi odio, egestas pulvinar erat eget, vehicula tempus est. Proin vitae ullamcorper velit. Donec sagittis est justo, mattis iaculis arcu facilisis id. Proin pulvinar ornare arcu a fermentum. Quisque et dignissim nulla, sit amet consectetur ipsum. Donec in libero porttitor, dapibus neque imperdiet, aliquam est. Vivamus blandit volutpat fringilla. In mi magna, mollis sit amet imperdiet eu, rutrum ut tellus. Mauris vel condimentum nibh, quis ultricies nisi. Vivamus accumsan quam mauris, id iaculis quam fringilla ac. Curabitur pulvinar dolor ac magna vehicula, non auctor ligula dignissim. Nam ac nibh porttitor, malesuada tortor varius, feugiat turpis. Mauris dapibus, tellus ut viverra porta, ipsum turpis bibendum ligula, at tempor felis ante non libero. Donec dapibus, diam sit amet posuere commodo, magna orci hendrerit ipsum, eu egestas mauris nulla ut ipsum. Sed luctus, orci in fringilla finibus, odio leo porta dolor, eu dignissim risus eros eget erat</b></p>'
    );
    expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._relatedNodes).toEqual([]);
  });

  it('should return true for inline elements with sufficient contrast', function () {
    const params = checkSetup(
      '<p>Text oh heyyyy <b id="target">and here\'s bold text</b></p>'
    );
    expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._relatedNodes).toEqual([]);
  });

  it('should return false when there is not sufficient contrast between foreground and background', function () {
    const params = checkSetup(
      '<div style="color: yellow; background-color: white;" id="target">' +
        'My text</div>'
    );

    expect(contrastEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._relatedNodes).toEqual([params[0]]);
    expect(checkContext._data.messageKey).toEqual(null);
  });

  it('should ignore position:fixed elements above the target', function () {
    const params = checkSetup(
      '<div style="background-color: #e5f1e5;" id="background">' +
        '<div style="width:100%; position:fixed; top:0; height:50px; background: #F0F0F0; z-index: 200; color:#fff" >header</div>' +
        '<div style="height: 6000px;"></div>' +
        'stuff <span id="target" style="color: rgba(91, 91, 90, 0.7)">This is some text</span>' +
        '<div style="height: 6000px;"></div>' +
        '</div>'
    );
    const expectedRelatedNodes = fixture.querySelector('#background');
    expect(contrastEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._relatedNodes).toEqual([expectedRelatedNodes]);
  });

  it('should ignore position:fixed elements directly above the target', function () {
    const params = checkSetup(
      '<div style="background-color: #e5f1e5;" id="background">' +
        '<div style="width:100%; position:fixed; top:0; height:400px; background: #F0F0F0; z-index: 200; color:#fff" >header</div>' +
        '<div style="height: 10px;"></div>' +
        'stuff <span id="target" style="color: rgba(91, 91, 90, 0.7)">This is some text</span>' +
        '<div style="height: 10px;"></div>' +
        '</div>'
    );
    const expectedRelatedNodes = fixture.querySelector('#background');
    expect(contrastEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._relatedNodes).toEqual([expectedRelatedNodes]);
  });

  it('should find contrast issues on position:fixed elements', function () {
    const params = checkSetup(
      '<div style="background-color: #e5f1e5;" id="background">' +
        '<div style="width:100%; position:fixed; top:0; height:50px; background: #F0F0F0; z-index: 200; color:#fff" id="target">header</div>' +
        '<div style="height: 6000px;"></div>' +
        'stuff <span style="color: rgba(91, 91, 90, 0.7)">This is some text</span>' +
        '<div style="height: 6000px;"></div>' +
        '</div>'
    );
    expect(contrastEvaluate.apply(checkContext, params)).toBe(false);
    expect(checkContext._relatedNodes).toEqual([params[0]]);
  });

  it('should return undefined for background-image elements', function () {
    const dataURI =
      'data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/' +
      'XBs/fNwfjZ0frl3/zy7////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkA' +
      'ABAALAAAAAAQABAAAAVVICSOZGlCQAosJ6mu7fiyZeKqNKToQGDsM8hBADgUXoGAiqhSvp5QAnQKGIgUhwFUYLCVDFCrKU' +
      'E1lBavAViFIDlTImbKC5Gm2hB0SlBCBMQiB0UjIQA7';

    const params = checkSetup(
      '<div id="background" style="background:url(' +
        dataURI +
        ') no-repeat left center; padding: 5px 0 5px 25px;">' +
        '<p id="target">Text 1</p>' +
        '</div>'
    );

    expect(contrastEvaluate.apply(checkContext, params)).toBeUndefined();
    expect(checkContext._data.bgColor).toBeUndefined();
    expect(checkContext._data.contrastRatio).toBe(0);
    expect(checkContext._data.messageKey).toBe('bgImage');
  });

  it('should return undefined for background-gradient elements', function () {
    const params = checkSetup(
      '<div id="background" style="background-image:linear-gradient(red, orange);">' +
        '<p id="target">Text 2</p>' +
        '</div>'
    );

    expect(contrastEvaluate.apply(checkContext, params)).toBeUndefined();
    expect(checkContext._data.bgColor).toBeUndefined();
    expect(checkContext._data.messageKey).toBe('bgGradient');
    expect(checkContext._data.contrastRatio).toBe(0);
  });

  it('should return undefined when there are elements overlapping', function (done) {
    // Give Edge time to scroll... :/
    setTimeout(function () {
      const params = checkSetup(
        '<div style="color: black; background-color: white; width: 200px; height: 100px; position: relative;" id="target">' +
          'My text <div style="position: absolute; top:0; left: 0; background-color: white; width: 100%; height: 100%;"></div></div>'
      );

      const result = contrastEvaluate.apply(checkContext, params);
      expect(result).toBeUndefined();
      expect(checkContext._data.messageKey).toBe('bgOverlap');
      expect(checkContext._data.contrastRatio).toBe(0);
      done();
    }, 10);
  });

  it('should return true when a form wraps mixed content', function () {
    const params = checkSetup(
      '<form id="target"><p>Some text</p><label for="input6">Text</label><input id="input6"></form>'
    );
    expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
  });

  it('should return true when a label wraps a text input', function () {
    fixtureSetup('<label id="target">My text <input type="text"></label>');
    const target = fixture.querySelector('#target');
    const virtualNode = axe.utils.getNodeFromTree(target);
    const result = contrastEvaluate.call(checkContext, target, {}, virtualNode);
    expect(result).toBe(true);
  });

  it("should return true when a label wraps a text input but doesn't overlap", function () {
    const params = checkSetup(
      '<label id="target">' +
        'My text <input type="text" style="position: absolute; top: 200px;"></label>'
    );
    const result = contrastEvaluate.apply(checkContext, params);
    expect(result).toBe(true);
  });

  it('should return true when there is sufficient contrast based on thead', function () {
    const params = checkSetup(
      '<table><thead style="background: #d00d2c"><tr><th id="target" style="color: #fff; padding: .5em">Col 1</th></tr></thead></table>'
    );
    expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._relatedNodes).toEqual([]);
  });

  it('should return true when there is sufficient contrast based on tbody', function () {
    const params = checkSetup(
      '<table><tbody style="background: #d00d2c"><tr><td id="target" style="color: #fff; padding: .5em">Col 1</td></tr></tbody></table>'
    );
    expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    expect(checkContext._relatedNodes).toEqual([]);
  });

  it('should return undefined if element overlaps text content', function (done) {
    // Give Edge time to scroll
    setTimeout(function () {
      const params = checkSetup(
        '<div style="background-color: white; height: 60px; width: 80px; border:1px solid;position: relative;">' +
          '<div id="target" style="color: white; height: 40px; width: 60px; border:1px solid red;">Hi</div>' +
          '<div style="position: absolute; top: 0; width: 60px; height: 40px;background-color: #000"></div>' +
          '</div>'
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBeUndefined();
      expect(checkContext._data.messageKey).toBe('bgOverlap');
      expect(checkContext._data.contrastRatio).toBe(0);
      done();
    }, 10);
  });

  it('should return undefined if element has same color as background', function () {
    const params = checkSetup(
      '<div style="background-color: white;">' +
        '<div style="color:white;" id="target">Text</div>' +
        '</div>'
    );

    expect(contrastEvaluate.apply(checkContext, params)).toBeUndefined();
    expect(checkContext._data.messageKey).toBe('equalRatio');
    expect(checkContext._data.contrastRatio).toBe(1);
  });

  it('returns relatedNodes with undefined', function () {
    const dataURI =
      'data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/' +
      'XBs/fNwfjZ0frl3/zy7////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkA' +
      'ABAALAAAAAAQABAAAAVVICSOZGlCQAosJ6mu7fiyZeKqNKToQGDsM8hBADgUXoGAiqhSvp5QAnQKGIgUhwFUYLCVDFCrKU' +
      'E1lBavAViFIDlTImbKC5Gm2hB0SlBCBMQiB0UjIQA7';

    const params = checkSetup(
      '<div id="background" style="background:url(' +
        dataURI +
        ') no-repeat left center; padding: 5px 0 5px 25px;">' +
        '<p id="target">Text 1</p>' +
        '</div>'
    );

    expect(contrastEvaluate.apply(checkContext, params)).toBeUndefined();
    expect(checkContext._relatedNodes[0]).toBe(
      document.querySelector('#background')
    );
  });

  it('should not error if client rects do not fill entire bounding rect', function () {
    const params = checkSetup(
      '<pre style="overflow-x: auto; background-color: #333"><span id="target" style="color: #000">' +
        '\nx x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x ' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\nx' +
        '\n</span></pre>'
    );
    expect(function () {
      contrastEvaluate.apply(checkContext, params);
    }).not.toThrow();
  });

  it('passes for element outside overflow:hidden', function () {
    const params = checkSetup(`
      <style>
        .container {
          width: 200px;
          height: 200px;
          overflow: hidden;
        }
        .foo * {
          width: 200px;
          height: 200px;
        }
        #target {
          color: #eee;
        }
      </style>
      <div class="container">
        <div class="foo" id="foo">
          <div id="one">hello</div>
          <div id="target">goodbye</div>
        </div>
      </div>
    `);
    expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
  });

  describe('with pseudo elements', function () {
    it('should return undefined if :before pseudo element has a background color', function () {
      const params = checkSetup(
        '<style>.foo { position: relative; } .foo:before { content: ""; position: absolute; width: 100%; height: 100%; background: red; }</style>' +
          '<div id="background" class="foo"><p id="target" style="#000">Content</p></div>'
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBeUndefined();
      expect(checkContext._data).toEqual({
        fontSize: '12.0pt (16px)',
        fontWeight: 'normal',
        messageKey: 'pseudoContent',
        expectedContrastRatio: '4.5:1'
      });
      expect(checkContext._relatedNodes[0]).toBe(
        document.querySelector('#background')
      );
    });

    it('should return undefined if :after pseudo element has a background color', function () {
      const params = checkSetup(
        '<style>.foo { position: relative; } .foo:after { content: ""; position: absolute; width: 100%; height: 100%; background: red; }</style>' +
          '<div id="background" class="foo"><p id="target" style="#000">Content</p></div>'
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBeUndefined();
      expect(checkContext._data).toEqual({
        fontSize: '12.0pt (16px)',
        fontWeight: 'normal',
        messageKey: 'pseudoContent',
        expectedContrastRatio: '4.5:1'
      });
      expect(checkContext._relatedNodes[0]).toBe(
        document.querySelector('#background')
      );
    });

    it('should return undefined if pseudo element has a background image', function () {
      const dataURI =
        'data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/' +
        'XBs/fNwfjZ0frl3/zy7////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkA' +
        'ABAALAAAAAAQABAAAAVVICSOZGlCQAosJ6mu7fiyZeKqNKToQGDsM8hBADgUXoGAiqhSvp5QAnQKGIgUhwFUYLCVDFCrKU' +
        'E1lBavAViFIDlTImbKC5Gm2hB0SlBCBMQiB0UjIQA7';

      const params = checkSetup(
        '<style>.foo { position: relative; } .foo:before { content: ""; position: absolute; width: 100%; height: 100%; background: url(' +
          dataURI +
          ') no-repeat left center; }</style>' +
          '<div id="background" class="foo"><p id="target" style="#000">Content</p></div>'
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBeUndefined();
      expect(checkContext._data).toEqual({
        fontSize: '12.0pt (16px)',
        fontWeight: 'normal',
        messageKey: 'pseudoContent',
        expectedContrastRatio: '4.5:1'
      });
      expect(checkContext._relatedNodes[0]).toBe(
        document.querySelector('#background')
      );
    });

    it('should not return undefined if pseudo element has no content', function () {
      const params = checkSetup(
        '<style>.foo { position: relative; } .foo:before { position: absolute; width: 100%; height: 100%; background: red; }</style>' +
          '<div id="background" class="foo"><p id="target" style="#000">Content</p></div>'
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    });

    it('should not return undefined if pseudo element is not absolutely positioned no content', function () {
      const params = checkSetup(
        '<style>.foo { position: relative; } .foo:before { content: ""; width: 100%; height: 100%; background: red; }</style>' +
          '<div id="background" class="foo"><p id="target" style="#000">Content</p></div>'
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    });

    it('should not return undefined if pseudo element is has zero dimension', function () {
      const params = checkSetup(
        '<style>.foo { position: relative; } .foo:before { content: ""; position: absolute; width: 0; height: 100%; background: red; }</style>' +
          '<div id="background" class="foo"><p id="target" style="#000">Content</p></div>'
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    });

    it("should not return undefined if pseudo element doesn't have a background", function () {
      const params = checkSetup(
        '<style>.foo { position: relative; } .foo:before { content: ""; position: absolute; width: 100%; height: 100%; }</style>' +
          '<div id="background" class="foo"><p id="target" style="#000">Content</p></div>'
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    });

    it('should not return undefined if pseudo element has visibility: hidden', function () {
      const params = checkSetup(
        '<style>.foo { position: relative; } .foo:before { content: ""; position: absolute; width: 100%; height: 100%; background-color: red; visibility: hidden; }</style>' +
          '<div id="background" class="foo"><p id="target" style="#000">Content</p></div>'
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    });

    it('should not return undefined if pseudo element has display: none', function () {
      const params = checkSetup(
        '<style>.foo { position: relative; } .foo:before { content: ""; position: absolute; width: 100%; height: 100%; background-color: red; display: none; }</style>' +
          '<div id="background" class="foo"><p id="target" style="#000">Content</p></div>'
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    });

    it('should return undefined if pseudo element is more than 25% of the element', function () {
      const params = checkSetup(
        '<style>.foo { position: relative; width: 100px; height: 100px; } ' +
          '.foo:before { content: ""; position: absolute; width: 26px; height: 100px; background: red; }</style>' +
          '<p id="target" class="foo">Content</p>'
      );
      expect(contrastEvaluate.apply(checkContext, params)).toBeUndefined();
    });

    it('should not return undefined if pseudo element is 25% of the element', function () {
      const params = checkSetup(
        '<style>.foo { position: relative; width: 100px; height: 100px; } ' +
          '.foo:before { content: ""; position: absolute; width: 25px; height: 100px; background: red; }</style>' +
          '<p id="target" class="foo">Content</p>'
      );
      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    });
  });

  describe('with special texts', function () {
    it('should return undefined for a single character text with insufficient contrast', function () {
      const params = checkSetup(
        '<div style="background-color: #FFF;">' +
          '<div style="color:#DDD;" id="target">X</div>' +
          '</div>'
      );

      const actual = contrastEvaluate.apply(checkContext, params);
      expect(actual).toBeUndefined();
      expect(checkContext._data.messageKey).toBe('shortTextContent');
    });

    it('should return true for a single character text with insufficient contrast', function () {
      const params = checkSetup(
        '<div style="background-color: #FFF;">' +
          '<div style="color:#DDD;" id="target">X</div>' +
          '</div>'
      );

      const actual = contrastEvaluate.apply(checkContext, params);
      expect(actual).toBeUndefined();
      expect(checkContext._data.messageKey).toBe('shortTextContent');
    });

    it('should return undefined when the text only contains nonBmp unicode when the ignoreUnicode option is true', function () {
      const params = checkSetup(
        '<div style="background-color: #FFF;">' +
          '<div style="color:#DDD;" id="target">&#x20A0; &#x20A1; &#x20A2; &#x20A3;</div>' +
          '</div>',
        {
          ignoreUnicode: true
        }
      );

      const actual = contrastEvaluate.apply(checkContext, params);
      expect(actual).toBeUndefined();
      expect(checkContext._data.messageKey).toBe('nonBmp');
    });

    it('should return true when the text only contains nonBmp unicode when the ignoreUnicode option is false, and there is sufficient contrast', function () {
      const params = checkSetup(
        '<div style="background-color: #FFF;">' +
          '<div style="color:#000;" id="target">◓</div>' +
          '</div>',
        {
          ignoreUnicode: false
        }
      );

      const actual = contrastEvaluate.apply(checkContext, params);
      expect(actual).toBe(true);
    });

    it('should return undefined when the text only contains nonBmp unicode when the ignoreUnicode option is false and the ignoreLength option is default, and there is insufficient contrast', function () {
      const params = checkSetup(
        '<div style="background-color: #FFF;">' +
          '<div style="color:#DDD;" id="target">◓</div>' +
          '</div>',
        {
          ignoreUnicode: false
        }
      );

      const actual = contrastEvaluate.apply(checkContext, params);
      expect(actual).toBeUndefined();
      expect(checkContext._data.messageKey).toBe('shortTextContent');
    });

    it('should return false when the text only contains nonBmp unicode when the ignoreUnicode option is false and the ignoreLength option is true, and there is insufficient contrast', function () {
      const params = checkSetup(
        '<div style="background-color: #FFF;">' +
          '<div style="color:#DDD;" id="target">◓</div>' +
          '</div>',
        {
          ignoreUnicode: false,
          ignoreLength: true
        }
      );

      const actual = contrastEvaluate.apply(checkContext, params);
      expect(actual).toBe(false);
    });
  });

  describe('options', function () {
    it('should support options.boldValue', function () {
      const params = checkSetup(
        '<div style="color: gray; background-color: white; font-size: 14pt; font-weight: 100" id="target">' +
          '<span style="font-weight:bolder">My text</span></div>',
        {
          boldValue: 100
        }
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
      expect(checkContext._relatedNodes).toEqual([]);
    });

    it('should support options.boldTextPt', function () {
      const params = checkSetup(
        '<div style="color: gray; background-color: white; font-size: 6pt; font-weight: 700" id="target">' +
          '<span style="font-weight:bolder">My text</span></div>',
        {
          boldTextPt: 6
        }
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
      expect(checkContext._relatedNodes).toEqual([]);
    });

    it('should support options.largeTextPt', function () {
      const params = checkSetup(
        '<div style="color: gray; background-color: white; font-size: 6pt; font-weight: 100" id="target">' +
          '<span style="font-weight:bolder">My text</span></div>',
        {
          largeTextPt: 6
        }
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
      expect(checkContext._relatedNodes).toEqual([]);
    });

    it('should support options.contrastRatio.normal.expected', function () {
      const params = checkSetup(
        '<div style="color: #999; background-color: white; font-size: 14pt; font-weight: 100" id="target">' +
          '<span style="font-weight:bolder">My text</span></div>',
        {
          contrastRatio: {
            normal: {
              expected: 2.5
            }
          }
        }
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
      expect(checkContext._relatedNodes).toEqual([]);
    });

    it('should support options.contrastRatio.normal.minThreshold', function () {
      const params = checkSetup(
        '<div style="color: #999; background-color: white; font-size: 14pt; font-weight: 100" id="target">' +
          '<span style="font-weight:bolder">My text</span></div>',
        {
          contrastRatio: {
            normal: {
              minThreshold: 3
            }
          }
        }
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
      expect(checkContext._relatedNodes).toEqual([]);
    });

    it('should not report incomplete when  options.contrastRatio.normal.minThreshold is set', function () {
      const params = checkSetup(
        `
        <p id="target" style="color: #666; background: linear-gradient(to right, #FFF, #0FF); width: 300px">
          Some text in English
        </p>`,
        {
          contrastRatio: {
            normal: {
              minThreshold: 3
            }
          }
        }
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
      expect(checkContext._data.messageKey).toBeUndefined();
    });

    it('should support options.contrastRatio.normal.maxThreshold', function () {
      const params = checkSetup(
        '<div style="color: #999; background-color: white; font-size: 14pt; font-weight: 100" id="target">' +
          '<span style="font-weight:bolder">My text</span></div>',
        {
          contrastRatio: {
            normal: {
              maxThreshold: 2
            }
          }
        }
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
      expect(checkContext._relatedNodes).toEqual([]);
    });

    it('should not report incomplete when  options.contrastRatio.normal.maxThreshold is set', function () {
      const params = checkSetup(
        `
        <p id="target" style="color: #666; background: linear-gradient(to right, #FFF, #0FF); width: 300px">
          Some text in English
        </p>`,
        {
          contrastRatio: {
            normal: {
              maxThreshold: 2
            }
          }
        }
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
      expect(checkContext._data.messageKey).toBeUndefined();
    });

    it('should support options.contrastRatio.large.expected', function () {
      const params = checkSetup(
        '<div style="color: #ccc; background-color: white; font-size: 18pt; font-weight: 100" id="target">' +
          '<span style="font-weight:bolder">My text</span></div>',
        {
          contrastRatio: {
            large: {
              expected: 1.5
            }
          }
        }
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
      expect(checkContext._relatedNodes).toEqual([]);
    });

    it('should support options.contrastRatio.large.minThreshold', function () {
      const params = checkSetup(
        '<div style="color: #ccc; background-color: white; font-size: 18pt; font-weight: 100" id="target">' +
          '<span style="font-weight:bolder">My text</span></div>',
        {
          contrastRatio: {
            large: {
              minThreshold: 2
            }
          }
        }
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
      expect(checkContext._relatedNodes).toEqual([]);
    });

    it('should not report incomplete when  options.contrastRatio.large.minThreshold is set', function () {
      const params = checkSetup(
        `
        <p id="target" style="color: #666; background: linear-gradient(to right, #FFF, #0FF); width: 300px; font-size: 18pt;">
          Some text in English
        </p>`,
        {
          contrastRatio: {
            large: {
              minThreshold: 2
            }
          }
        }
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
      expect(checkContext._data.messageKey).toBeUndefined();
    });

    it('should support options.contrastRatio.large.maxThreshold', function () {
      const params = checkSetup(
        '<div style="color: #ccc; background-color: white; font-size: 18pt; font-weight: 100" id="target">' +
          '<span style="font-weight:bolder">My text</span></div>',
        {
          contrastRatio: {
            large: {
              maxThreshold: 1.2
            }
          }
        }
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
      expect(checkContext._relatedNodes).toEqual([]);
    });

    it('should not report incomplete when  options.contrastRatio.large.maxThreshold is set', function () {
      const params = checkSetup(
        `
        <p id="target" style="color: #666; background: linear-gradient(to right, #FFF, #0FF); width: 300px; font-size: 18pt;">
          Some text in English
        </p>`,
        {
          contrastRatio: {
            large: {
              maxThreshold: 2
            }
          }
        }
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
      expect(checkContext._data.messageKey).toBeUndefined();
    });

    it('should ignore pseudo element with options.ignorePseudo', function () {
      const params = checkSetup(
        '<style>.foo { position: relative; } .foo:after { content: ""; position: absolute; width: 100%; height: 100%; background: red; }</style>' +
          '<div id="background" class="foo"><p id="target" style="#000">Content</p></div>',
        {
          ignorePseudo: true
        }
      );

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    });

    it('should adjust the pseudo element minimum size with the options.pseudoSizeThreshold', function () {
      const params = checkSetup(
        '<style>.foo { position: relative; width: 100px; height: 100px }' +
          '.foo:before { content: ""; position: absolute; width: 22%; height: 100%; background: red; }</style>' +
          '<p id="target" class="foo">Content</p>',
        {
          pseudoSizeThreshold: 0.2
        }
      );
      expect(contrastEvaluate.apply(checkContext, params)).toBeUndefined();
    });
  });

  (shadowSupported ? it : xit)(
    'returns colors across Shadow DOM boundaries',
    function () {
      const params = shadowCheckSetup(
        '<div id="container" style="background-color:black;"></div>',
        '<p style="color: #333;" id="target">Text</p>'
      );
      const container = fixture.querySelector('#container');
      const result = contrastEvaluate.apply(checkContext, params);
      expect(result).toBe(false);
      expect(checkContext._relatedNodes).toEqual([container]);
    }
  );

  (shadowSupported ? it : xit)('handles <slot> elements', () => {
    fixture.innerHTML =
      '<div id="container" style="height: 100px;"><p id="target" style="color: #333;">Slotted text</p></div>';
    const container = fixture.querySelector('#container');
    const shadow = container.attachShadow({ mode: 'open' });

    shadow.innerHTML =
      '<div id="shadowContainer" style="position: absolute; background: black;"><slot></slot></div>';
    const shadowContainer = shadow.querySelector('#shadowContainer');
    flatTreeSetup(fixture);

    const target = fixture.querySelector('#target');
    const vNode = axe.utils.getNodeFromTree(target);
    const result = contrastEvaluate.call(
      checkContext,
      vNode.actualNode,
      null,
      vNode
    );
    expect(result).toBe(false);
    expect(checkContext._relatedNodes).toEqual([shadowContainer]);
  });

  describe('with text-shadow', function () {
    it('passes if thin text shadows have sufficient contrast with the text', function () {
      const params = checkSetup(
        '<div id="target" style="background-color: #666; color:#aaa; ' +
          'text-shadow: 0 0 0.09em #000, 0 0 0.09em #000, 0 0 0.09em #000;">' +
          '  Hello world' +
          '</div>'
      );
      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    });

    it('does not count text shadows of offset 0, blur 0 as part of the background color', function () {
      const params = checkSetup(
        '<div id="target" style="background-color: #fff; color:#0f833e; ' +
          'text-shadow: 0 0 0 #000">' +
          '  Hello world' +
          '</div>'
      );

      const white = new axe.commons.color.Color(255, 255, 255, 1);

      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
      expect(checkContext._data.bgColor).toBe(white.toHexString());
      expect(checkContext._data.fgColor).toBe('#0f833e');
      expect(checkContext._data.contrastRatio).toBe('4.84');
    });

    it('passes if thin text shadows have sufficient contrast with the background', function () {
      const params = checkSetup(
        '<div id="target" style="background-color: #aaa; color:#666; ' +
          'text-shadow: 0 0 0.09em #000, 0 0 0.09em #000, 0 0 0.09em #000;">' +
          '  Hello world' +
          '</div>'
      );
      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    });

    it('fails if text shadows have sufficient contrast with the background if its width is thicker than `shadowOutlineEmMax`', function () {
      const checkOptions = { shadowOutlineEmMax: 0.05 };
      const params = checkSetup(
        '<div id="target" style="background-color: #aaa; color:#666; ' +
          'text-shadow: 0 0 0.09em #000, 0 0 0.09em #000, 0 0 0.09em #000;">' +
          '  Hello world' +
          '</div>',
        checkOptions
      );
      expect(contrastEvaluate.apply(checkContext, params)).toBe(false);
      expect(checkContext._data.messageKey).toBe(null);
    });

    it('fails if text shadows do not have sufficient contrast with the foreground', function () {
      const params = checkSetup(
        '<div id="target" style="background-color: #aaa; color:#666; ' +
          'text-shadow: 1px 1px 0.01em #000">' +
          '  Hello world' +
          '</div>'
      );
      expect(contrastEvaluate.apply(checkContext, params)).toBe(false);
      expect(checkContext._data.messageKey).toBeNull();
    });

    it('fails if text shadows do not have sufficient contrast with the background', function () {
      const params = checkSetup(
        '<div id="target" style="background-color: #aaa; color:#666; ' +
          'text-shadow: 0 0 0.01em #000">' +
          '  Hello world' +
          '</div>'
      );
      expect(contrastEvaluate.apply(checkContext, params)).toBe(false);
      expect(checkContext._data.messageKey).toBe('shadowOnBgColor');
    });

    it("fails if thick text shadows don't have sufficient contrast", function () {
      const params = checkSetup(
        '<div id="target" style="background-color: #aaa; color:#666; ' +
          'text-shadow: 0 0 0.09em #000, 0 0 0.09em #000, 0 0 0.09em #000;">' +
          '  Hello world' +
          '</div>'
      );
      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    });

    it("passes if thin text shadows don't have sufficient contrast, but the text and background do", function () {
      const params = checkSetup(
        '<div id="target" style="background-color: #aaa; color:#666; ' +
          'text-shadow: 0 0 0.09em #000, 0 0 0.09em #000, 0 0 0.09em #000;">' +
          '  Hello world' +
          '</div>'
      );
      expect(contrastEvaluate.apply(checkContext, params)).toBe(true);
    });

    it('incompletes if text-shadow is only on part of the text', function () {
      const params = checkSetup(`
        <div id="target" style="
          background-color: #aaa;
          color:#666; 
          text-shadow: 1px 1px #000;
        "> Hello world </div>
      `);

      expect(contrastEvaluate.apply(checkContext, params)).toBeUndefined();
      expect(checkContext._relatedNodes).toEqual([]);
      expect(checkContext._data).toEqual({
        messageKey: 'complexTextShadows'
      });
    });
  });
});
