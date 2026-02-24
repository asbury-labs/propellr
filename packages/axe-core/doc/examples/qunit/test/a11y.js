/* global QUnit, document, axe */

QUnit.module('axe');

QUnit.test('should report that good HTML is good', function (assert) {
  const n = document.getElementById('working');
  assert.expect(2);

  const done = assert.async();
  axe.run(n, function (err, result) {
    assert.equal(err, null);
    assert.equal(result.violations.length, 0);
    done();
  });
});

QUnit.test('should report that bad HTML is bad', function (assert) {
  const n = document.getElementById('broken');
  assert.expect(2);

  const done = assert.async();
  axe.run(n, function (err, result) {
    assert.equal(err, null);
    assert.equal(result.violations.length, 1);
    done();
  });
});
