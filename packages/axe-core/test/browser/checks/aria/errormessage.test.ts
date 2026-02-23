import { describe, it, expect, afterEach } from 'vitest';
import {
  getCheckEvaluate,
  MockCheckContext,
  queryFixture,
  shadowCheckSetup,
  shadowSupport
} from '../../../testutils';

declare const axe: any;
describe('aria-errormessage', function () {
  const shadowSupported = shadowSupport.v1;
  const checkContext = MockCheckContext();

  afterEach(function () {
    checkContext.reset();
  });

  it('should return false if aria-errormessage value is invalid', function () {
    const vNode = queryFixture(
      '<div id="target" aria-errormessage="plain" aria-invalid="true">' +
        '<div id="plain"></div>'
    );
    expect(
      getCheckEvaluate('aria-errormessage').call(
        checkContext,
        null,
        null,
        vNode
      )
    ).toBe(false);
  });

  it('should return undefined if aria-errormessage references an element that does not exist', function () {
    const vNode = queryFixture(
      '<div id="target" aria-errormessage="plain" aria-invalid="true">' +
        '<div></div>'
    );
    expect(
      getCheckEvaluate('aria-errormessage').call(
        checkContext,
        null,
        null,
        vNode
      )
    ).toBeUndefined();
  });

  it('should return true if aria-errormessage id is alert', function () {
    const vNode = queryFixture(
      '<div id="target" aria-errormessage="alert" aria-invalid="true">' +
        '<div id="alert" role="alert"></div>'
    );
    expect(
      getCheckEvaluate('aria-errormessage').call(
        checkContext,
        null,
        null,
        vNode
      )
    ).toBe(true);
  });

  it('should return true if aria-errormessage id is aria-live=assertive', function () {
    const vNode = queryFixture(
      '<div id="target" aria-errormessage="live" aria-invalid="true">' +
        '<div id="live" aria-live="assertive"></div>'
    );
    expect(
      getCheckEvaluate('aria-errormessage').call(
        checkContext,
        null,
        null,
        vNode
      )
    ).toBe(true);
  });

  it('should return true if aria-errormessage id is aria-describedby', function () {
    const vNode = queryFixture(
      '<div id="target" aria-errormessage="plain" aria-describedby="plain" aria-invalid="true">' +
        '<div id="plain"></div>'
    );
    expect(
      getCheckEvaluate('aria-errormessage').call(
        checkContext,
        null,
        null,
        vNode
      )
    ).toBe(true);
  });

  it('should return false if aria-errormessage has multiple ids (unsupported)', function () {
    const vNode = queryFixture(
      '<input id="target" aria-invalid="true" aria-describedby="error1 error2" aria-errormessage="error1 error2">' +
        '<div id="error1">Error 1</div>' +
        '<div id="error2">Error 2</div>'
    );
    expect(
      getCheckEvaluate('aria-errormessage').call(
        checkContext,
        null,
        null,
        vNode
      )
    ).toBe(false);
    expect(checkContext._data).toEqual({
      messageKey: 'unsupported',
      values: ['error1', 'error2']
    });
  });

  it('should return false if aria-errormessage has multiple ids even when one is in aria-describedby', function () {
    const vNode = queryFixture(
      '<input id="target" aria-invalid="true" aria-describedby="error1" aria-errormessage="error1 error2">' +
        '<div id="error1">Error 1</div>' +
        '<div id="error2">Error 2</div>'
    );
    expect(
      getCheckEvaluate('aria-errormessage').call(
        checkContext,
        null,
        null,
        vNode
      )
    ).toBe(false);
    expect(checkContext._data).toEqual({
      messageKey: 'unsupported',
      values: ['error1', 'error2']
    });
  });

  it('should return false if aria-errormessage has multiple ids even when none are in aria-describedby', function () {
    const vNode = queryFixture(
      '<input id="target" aria-invalid="true" aria-describedby="other" aria-errormessage="error1 error2">' +
        '<div id="other">Other</div>' +
        '<div id="error1">Error 1</div>' +
        '<div id="error2">Error 2</div>'
    );
    expect(
      getCheckEvaluate('aria-errormessage').call(
        checkContext,
        null,
        null,
        vNode
      )
    ).toBe(false);
    expect(checkContext._data).toEqual({
      messageKey: 'unsupported',
      values: ['error1', 'error2']
    });
  });

  it('sets an unsupported message when aria-errormessage contains multiple ids', function () {
    const vNode = queryFixture(
      '<div id="target" aria-errormessage=" foo  bar \tbaz  " aria-invalid="true">' +
        '<div id="plain"></div>'
    );
    expect(
      getCheckEvaluate('aria-errormessage').call(
        checkContext,
        null,
        null,
        vNode
      )
    ).toBe(false);
    expect(checkContext._data).toEqual({
      messageKey: 'unsupported',
      values: ['foo', 'bar', 'baz']
    });
  });

  it('returns true when aria-errormessage is empty, if that is allowed', function () {
    axe.configure({
      standards: {
        ariaAttrs: {
          'aria-errormessage': {
            allowEmpty: true
          }
        }
      }
    });
    const vNode = queryFixture(
      '<div id="target" aria-errormessage=" " aria-invalid="true"></div>'
    );
    expect(
      getCheckEvaluate('aria-errormessage').call(
        checkContext,
        null,
        null,
        vNode
      )
    ).toBe(true);
  });

  it('should return true when aria-invalid is not set', function () {
    const vNode = queryFixture(
      '<div id="target" aria-errormessage="plain">' + '<div id="plain"></div>'
    );
    expect(
      getCheckEvaluate('aria-errormessage').call(
        checkContext,
        null,
        null,
        vNode
      )
    ).toBe(true);
  });

  it('should return true when aria-invalid=false', function () {
    const vNode = queryFixture(
      '<div id="target" aria-errormessage="plain" aria-invalid="false">' +
        '<div id="plain"></div>'
    );
    expect(
      getCheckEvaluate('aria-errormessage').call(
        checkContext,
        null,
        null,
        vNode
      )
    ).toBe(true);
  });

  it('returns false when aria-errormessage is empty, if that is not allowed', function () {
    axe.configure({
      standards: {
        ariaAttrs: {
          'aria-errormessage': {
            allowEmpty: false
          }
        }
      }
    });
    const vNode = queryFixture(
      '<div id="target" aria-errormessage=" " aria-invalid="true"></div>'
    );
    expect(
      getCheckEvaluate('aria-errormessage').call(
        checkContext,
        null,
        null,
        vNode
      )
    ).toBe(false);
  });

  it('should return false when hidden attribute is used', function () {
    const vNode = queryFixture(
      '<input type="text" id="target" aria-invalid="true" aria-errormessage="id-message-1">' +
        '<div id="id-message-1" hidden>Error message 1</div>'
    );
    expect(
      getCheckEvaluate('aria-errormessage').call(
        checkContext,
        null,
        null,
        vNode
      )
    ).toBe(false);
    expect(checkContext._data).toEqual({
      messageKey: 'hidden',
      values: ['id-message-1']
    });
  });

  it('should return false when display: "none" is used', function () {
    const vNode = queryFixture(
      '<input type="text" id="target" aria-invalid="true" aria-errormessage="id-message-1">' +
        '<div id="id-message-1" style="display: none">Error message 1</div>'
    );
    expect(
      getCheckEvaluate('aria-errormessage').call(
        checkContext,
        null,
        null,
        vNode
      )
    ).toBe(false);
    expect(checkContext._data).toEqual({
      messageKey: 'hidden',
      values: ['id-message-1']
    });
  });

  it('should return false when visibility: "hidden" is used', function () {
    const vNode = queryFixture(
      '<input type="text" id="target" aria-invalid="true" aria-errormessage="id-message-1">' +
        '<div id="id-message-1" style="visibility: hidden">Error message 1</div>'
    );
    expect(
      getCheckEvaluate('aria-errormessage').call(
        checkContext,
        null,
        null,
        vNode
      )
    ).toBe(false);
    expect(checkContext._data).toEqual({
      messageKey: 'hidden',
      values: ['id-message-1']
    });
  });

  it('should return false when aria-hidden=true is used', function () {
    const vNode = queryFixture(
      '<input type="text" id="target" aria-invalid="true" aria-errormessage="id-message-1">' +
        '<div id="id-message-1" aria-hidden="true">Error message 1</div>'
    );
    expect(
      getCheckEvaluate('aria-errormessage').call(
        checkContext,
        null,
        null,
        vNode
      )
    ).toBe(false);
    expect(checkContext._data).toEqual({
      messageKey: 'hidden',
      values: ['id-message-1']
    });
  });

  it('should return true when aria-hidden=false is used', function () {
    const vNode = queryFixture(
      '<input type="text" id="target" aria-invalid="true" aria-errormessage="id-message-1">' +
        '<div id="id-message-1" aria-live="assertive" aria-hidden="false">Error message 1</div>'
    );
    expect(
      getCheckEvaluate('aria-errormessage').call(
        checkContext,
        null,
        null,
        vNode
      )
    ).toBe(true);
  });

  it('should return true when no hidden functionality is used', function () {
    const vNode = queryFixture(
      '<input type="text" id="target" aria-invalid="true" aria-errormessage="id-message-1">' +
        '<div id="id-message-1" aria-live="assertive">Error message 1</div>'
    );
    expect(
      getCheckEvaluate('aria-errormessage').call(
        checkContext,
        null,
        null,
        vNode
      )
    ).toBe(true);
  });

  (shadowSupported ? it : xit)(
    'should return undefined if aria-errormessage value crosses shadow boundary',
    function () {
      const params = shadowCheckSetup(
        '<div id="target" aria-errormessage="live" aria-invalid="true"></div>',
        '<div id="live" aria-live="assertive"></div>'
      );
      expect(
        getCheckEvaluate('aria-errormessage').apply(checkContext, params)
      ).toBeUndefined();
    }
  );

  (shadowSupported ? it : xit)(
    'should return false if aria-errormessage and invalid reference are both inside shadow dom',
    function () {
      const params = shadowCheckSetup(
        '<div></div>',
        '<div id="target" aria-errormessage="live" aria-invalid="true"></div>' +
          '<div id="live"></div>'
      );
      expect(
        getCheckEvaluate('aria-errormessage').apply(checkContext, params)
      ).toBe(false);
    }
  );

  (shadowSupported ? it : xit)(
    'should return true if aria-errormessage and valid reference are both inside shadow dom',
    function () {
      const params = shadowCheckSetup(
        '<div></div>',
        '<div id="target" aria-errormessage="live" aria-invalid="true"></div>' +
          '<div id="live" aria-live="assertive"></div>'
      );
      expect(
        getCheckEvaluate('aria-errormessage').apply(checkContext, params)
      ).toBe(true);
    }
  );

  describe('SerialVirtualNode', function () {
    it('should return undefined', function () {
      const vNode = new axe.SerialVirtualNode({
        nodeName: 'div',
        attributes: {
          'aria-invalid': 'true',
          'aria-errormessage': 'test'
        }
      });
      expect(
        getCheckEvaluate('aria-errormessage').call(
          checkContext,
          null,
          null,
          vNode
        )
      ).toBeUndefined();
      expect(checkContext._data).toEqual({
        messageKey: 'idrefs',
        values: ['test']
      });
    });
  });
});
