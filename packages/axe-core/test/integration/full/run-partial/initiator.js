describe('run-partial, initiator', function () {
  'use strict';
  const ruleName = 'document-title';
  const runPartialRecursive = axe.testUtils.runPartialRecursive;
  const clone = axe.utils.clone;

  beforeEach(function (done) {
    axe.testUtils.awaitNestedLoad(done);
  });

  it('gives the same results as axe.run when context.initiator is used', function (done) {
    const options = { runOnly: ruleName };
    const context = { exclude: [] };
    Promise.all(runPartialRecursive(clone(context), options))
      .then(function (partialResults) {
        return Promise.all([
          axe.finishRun(partialResults, options),
          axe.run(clone(context), options)
        ]);
      })
      .then(function (results) {
        const axeRunPartialResult = results[0];
        const axeRunResult = results[1];
        assert.lengthOf(axeRunPartialResult.violations, 0);
        axeRunPartialResult.testEnvironment = axeRunResult.testEnvironment;
        axeRunPartialResult.timestamp = axeRunResult.timestamp;
        assert.deepEqual(axeRunPartialResult, axeRunResult);
        done();
      })
      .catch(done);
  });
});
