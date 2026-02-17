import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('css-orientation-lock tests', function () {
  const checkContext = axe.testUtils.MockCheckContext();
  const check = checks['css-orientation-lock'];
  const dynamicDoc = document.implementation.createHTMLDocument(
    'Dynamic document for CSS Orientation Lock tests'
  );

  afterEach(function () {
    checkContext.reset();
  });

  function getSheet(data) {
    const style = dynamicDoc.createElement('style');
    style.type = 'text/css';
    style.appendChild(dynamicDoc.createTextNode(data));
    dynamicDoc.head.appendChild(style);
    return style.sheet;
  }

  it('returns undefined when CSSOM is undefined', function () {
    const actual = check.evaluate.call(checkContext, document);
    expect(actual).toBeUndefined();
  });

  it('returns undefined when CSSOM is empty', function () {
    const actual = check.evaluate.call(checkContext, document, {}, undefined, {
      cssom: [] // pass context with cssom as empty
    });
    expect(actual).toBeUndefined();
  });

  it('returns true when CSSOM has no rules', function () {
    const actual = check.evaluate.call(checkContext, document, {}, undefined, {
      cssom: [
        {
          shadowId: 'a',
          sheet: {} // empty sheet, no css rules
        }
      ]
    });
    expect(actual).toBe(true);
  });

  it('returns true when CSSOM has no CSS media features', function () {
    const actual = check.evaluate.call(checkContext, document, {}, undefined, {
      cssom: [
        {
          shadowId: 'a',
          sheet: getSheet('body { color: inherit; }')
        }
      ]
    });
    expect(actual).toBe(true);
  });

  it('returns true when CSSOM has no CSS media features targeting orientation', function () {
    const actual = check.evaluate.call(checkContext, document, {}, undefined, {
      cssom: [
        {
          shadowId: undefined,
          sheet: getSheet('body { color: inherit; }')
        },
        {
          shadowId: 'a',
          sheet: getSheet(
            '@media (min-width: 400px) { background-color: red; }'
          )
        }
      ]
    });
    expect(actual).toBe(true);
  });

  it('returns true when CSSOM has empty Orientation CSS media features', function () {
    const actual = check.evaluate.call(checkContext, document, {}, undefined, {
      cssom: [
        {
          shadowId: undefined,
          sheet: getSheet('body { color: inherit; }')
        },
        {
          shadowId: 'a',
          sheet: getSheet(
            '@media screen and (min-width: 1px) and (max-width: 3000px) and (orientation: landscape) {  }'
          )
        }
      ]
    });
    expect(actual).toBe(true);
  });

  it('returns true when CSSOM has Orientation CSS media features that does not target transform property', function () {
    const actual = check.evaluate.call(checkContext, document, {}, undefined, {
      cssom: [
        {
          shadowId: 'a',
          sheet: getSheet(
            '@media screen and (min-width: 1px) and (max-width: 2000px) and (orientation: portrait) { #mocha { color: red; } }'
          )
        }
      ]
    });
    expect(actual).toBe(true);
  });

  it('returns true when CSSOM has Orientation CSS media features with transform property and transformation function of translateX, which does not affect rotation', function () {
    const actual = check.evaluate.call(checkContext, document, {}, undefined, {
      cssom: [
        {
          shadowId: undefined,
          sheet: getSheet(
            '@media screen and (min-width: 1px) and (max-width: 3000px) and (orientation: landscape) { #mocha { transform: translateX(10px); -webkit-transform: translateX(10px); } }'
          )
        }
      ]
    });
    expect(actual).toBe(true);
  });

  it('returns true when CSSOM has Orientation CSS media features with transform property and tranformation function of rotate, which affects rotation but does not lock orientation (rotate(180deg))', function () {
    const actual = check.evaluate.call(checkContext, document, {}, undefined, {
      cssom: [
        {
          shadowId: 'a',
          root: document,
          sheet: getSheet(
            '@media screen and (min-width: 1px) and (max-width: 3000px) and (orientation: landscape) { body { transform: rotate(180deg); -webkit-transform: rotate(180deg); } }'
          )
        }
      ]
    });
    expect(actual).toBe(true);
  });

  it('returns true when CSSOM has Orientation CSS media features with transform property and tranformation function of rotate, which affects rotation but does not lock orientation (rotate(-178deg))', function () {
    const actual = check.evaluate.call(
      checkContext,
      document,
      { degreeThreshold: 3 },
      undefined,
      {
        cssom: [
          {
            shadowId: 'a',
            root: document,
            sheet: getSheet(
              '@media screen and (min-width: 1px) and (max-width: 3000px) and (orientation: landscape) { body { transform: rotate(-178deg); -webkit-transform: rotate(-178deg); } }'
            )
          }
        ]
      }
    );
    expect(actual).toBe(true);
  });

  it('returns true when CSSOM has Orientation CSS media features with transform property and tranformation function of rotateZ, which affects rotation but does not lock orientation (rotateZ(1turn))', function () {
    const actual = check.evaluate.call(checkContext, document, {}, undefined, {
      cssom: [
        {
          shadowId: 'a',
          root: document,
          sheet: getSheet(
            '@media screen and (min-width: 1px) and (max-width: 3000px) and (orientation: landscape) { body { transform: rotateZ(1turn); } }'
          )
        }
      ]
    });
    expect(actual).toBe(true);
  });

  it('returns true when CSSOM has Orientation CSS media features with transform property and tranformation function of rotate3d, which affects rotation but does not lock orientation (rotate3d(0,0,0,400grad))', function () {
    const actual = check.evaluate.call(checkContext, document, {}, undefined, {
      cssom: [
        {
          shadowId: 'a',
          root: document,
          sheet: getSheet(
            // Note: values set on rotate3d cascasdes over rotate
            '@media screen and (min-width: 1px) and (max-width: 3000px) and (orientation: landscape) { body { transform: rotate(90deg) rotate3d(0,0,1, 400grad); } }'
          )
        }
      ]
    });
    expect(actual).toBe(true);
  });

  it('returns true when CSSOM has Orientation CSS media features with transform property and tranformation function of matrix3d, which affects rotation but does not lock orientation (matrix3d(-1,0,0.00,0,0.00,-1,0.00,0,0,0,1,0,0,0,0,1))', function () {
    const actual = check.evaluate.call(checkContext, document, {}, undefined, {
      cssom: [
        {
          shadowId: 'a',
          root: document,
          sheet: getSheet(
            // Here the target is rotated by 180deg
            '@media screen and (min-width: 1px) and (max-width: 3000px) and (orientation: landscape) { body { transform: matrix3d(-1,0,0.00,0,0.00,-1,0.00,0,0,0,1,0,0,0,0,1);  } }'
          )
        }
      ]
    });
    expect(actual).toBe(true);
  });

  it('returns false when CSSOM has Orientation CSS media features with transform property and transformation function of rotate, which affects rotation and locks orientation (rotate(270deg))', function () {
    const actual = check.evaluate.call(checkContext, document, {}, undefined, {
      cssom: [
        {
          shadowId: undefined,
          root: document,
          sheet: getSheet(
            '@media screen and (min-width: 1px) and (max-width: 3000px) and (orientation: landscape) { #mocha { transform: rotate(270deg); -webkit-transform: rotate(270deg); } }'
          )
        }
      ]
    });
    expect(actual).toBe(false);
  });

  it('returns false when CSSOM has Orientation CSS media features with transform property and transformation function of rotate3d, which affects rotation and locks orientation (rotate3d(0,0,1,90deg))', function () {
    const actual = check.evaluate.call(checkContext, document, {}, undefined, {
      cssom: [
        {
          shadowId: undefined,
          root: document,
          sheet: getSheet(
            // apply 0 on the z-axis (3rd parameter) does not apply given rotation on z-axis
            '@media screen and (min-width: 1px) and (max-width: 3000px) and (orientation: landscape) { #mocha { transform: rotate3d(0,0,1,90deg); -webkit-transform: rotate3d(0,0,1,90deg) } }'
          )
        }
      ]
    });
    expect(actual).toBe(false);
  });

  it('returns false when CSSOM has Orientation CSS media features with transform property and transformation function of rotate3d, which affects rotation and locks orientation (rotate3d(0,0,1,93deg))', function () {
    const actual = check.evaluate.call(
      checkContext,
      document,
      { degreeThreshold: 3 },
      undefined,
      {
        cssom: [
          {
            shadowId: undefined,
            root: document,
            sheet: getSheet(
              // apply 0 on the z-axis (3rd parameter) does not apply given rotation on z-axis
              '@media screen and (min-width: 1px) and (max-width: 3000px) and (orientation: landscape) { #mocha { transform: rotate3d(0,0,1,93deg); -webkit-transform: rotate3d(0,0,1,93deg) } }'
            )
          }
        ]
      }
    );
    expect(actual).toBe(false);
  });

  it('returns false when CSSOM has Orientation CSS media features with transform property and transformation function of rotate3d, which affects rotation and locks orientation (rotate3d(0,0,1,1.5708rad))', function () {
    const actual = check.evaluate.call(checkContext, document, {}, undefined, {
      cssom: [
        {
          shadowId: undefined,
          root: document,
          sheet: getSheet(
            '@media screen and (min-width: 1px) and (max-width: 3000px) and (orientation: landscape) { #mocha { transform: rotate3d(0,0,1,1.5708rad); -webkit-transform: rotate3d(0,0,1,1.5708rad) } }'
          )
        }
      ]
    });
    expect(actual).toBe(false);
  });

  it('returns false when CSSOM has Orientation CSS media features with transform property and transformation function of matrix, which affects rotation and locks orientation (matrix(0.00,1.00,-1.00,0.00,0,0))', function () {
    const actual = check.evaluate.call(checkContext, document, {}, undefined, {
      cssom: [
        {
          shadowId: undefined,
          root: document,
          sheet: getSheet(
            // this rotates by 90deg
            '@media screen and (min-width: 1px) and (max-width: 3000px) and (orientation: landscape) { #mocha { transform:matrix(0.00,1.00,-1.00,0.00,0,0); -webkit-transform:matrix(0.00,1.00,-1.00,0.00,0,0); } }'
          )
        }
      ]
    });
    expect(actual).toBe(false);
  });

  it('returns false when CSSOM has Orientation CSS media features with transform property and transformation function of matrix3d, which affects rotation and locks orientation (matrix3d(0,-1,0.00,0,1.00,0,0.00,0,0,0,1,0,0,0,0,1);)', function () {
    const actual = check.evaluate.call(checkContext, document, {}, undefined, {
      cssom: [
        {
          shadowId: undefined,
          root: document,
          sheet: getSheet(
            // this rotates by 90deg
            '@media screen and (min-width: 1px) and (max-width: 3000px) and (orientation: landscape) { #mocha { transform: matrix3d(0,-1,0.00,0,1.00,0,0.00,0,0,0,1,0,0,0,0,1); -webkit-transform: matrix3d(0,-1,0.00,0,1.00,0,0.00,0,0,0,1,0,0,0,0,1); } }'
          )
        }
      ]
    });
    expect(actual).toBe(false);
  });

  it('returns false when CSSOM has Orientation CSS media features with rotate property', function () {
    const actual = check.evaluate.call(checkContext, document, {}, undefined, {
      cssom: [
        {
          shadowId: 'a',
          root: document,
          sheet: getSheet(
            '@media screen and (min-width: 1px) and (max-width: 3000px) and (orientation: landscape) { body { rotate: 90deg; } }'
          )
        }
      ]
    });
    expect(actual).toBe(false);
  });

  it('returns false when CSSOM has Orientation CSS media features with rotate property matrix', function () {
    const actual = check.evaluate.call(checkContext, document, {}, undefined, {
      cssom: [
        {
          shadowId: 'a',
          root: document,
          sheet: getSheet(
            '@media screen and (min-width: 1px) and (max-width: 3000px) and (orientation: landscape) { body { rotate: 0 0 1 1.5708rad; } }'
          )
        }
      ]
    });
    expect(actual).toBe(false);
  });

  it('returns false when CSSOM has Orientation CSS media features with transform: rotate and rotate property', function () {
    const actual = check.evaluate.call(checkContext, document, {}, undefined, {
      cssom: [
        {
          shadowId: 'a',
          root: document,
          sheet: getSheet(
            '@media screen and (min-width: 1px) and (max-width: 3000px) and (orientation: landscape) { body { rotate: 45deg; transform: rotate(45deg); -webkit-transform: rotate(45deg); } }'
          )
        }
      ]
    });
    expect(actual).toBe(false);
  });

  // Note:
  // external stylesheets is tested in integration tests
  // shadow DOM is tested in integration tests
});
