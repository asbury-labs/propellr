describe('axe.utils.getSelector', function () {
  'use strict';
  before(function () {
    axe.setup();
  });
  it('should work on namespaced elements', function () {
    const fixture = document.querySelector('#fixture');
    const node = fixture.firstElementChild;
    const sel = axe.utils.getSelector(node);
    const result = document.querySelectorAll(sel);
    assert.lengthOf(result, 1);
    assert.equal(result[0], node);
  });
});
