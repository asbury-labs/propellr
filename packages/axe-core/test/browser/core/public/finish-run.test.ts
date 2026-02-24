import { describe, it, expect, afterEach, vi } from 'vitest';

declare const axe: any;
describe('axe.finishRun', () => {
  const fixture = document.querySelector('#fixture');

  afterEach(() => {
    fixture.innerHTML = '';
  });

  it('takes a single partial results and outputs a finished report', () => {
    return new Promise<void>((done, reject) => {
      axe
        .runPartial()
        .then(result => {
          return axe.finishRun([result]);
        })
        .then(results => {
          expect(results).toHaveProperty('violations');
          expect(results).toHaveProperty('passes');
          expect(results).toHaveProperty('incomplete');
          expect(results).toHaveProperty('inapplicable');
          done();
        })
        .catch(reject);
    });
  });

  it('does not mutate the options object', () => {
    return new Promise<void>((done, reject) => {
      const options = {};
      axe
        .runPartial(options)
        .then(result => {
          return axe.finishRun([result], options);
        })
        .then(() => {
          expect(options).toEqual({});
          done();
        })
        .catch(reject);
    });
  });

  it('uses option.reporter to create the report', () => {
    return new Promise<void>((done, reject) => {
      axe
        .runPartial()
        .then(partialResult => {
          return axe.finishRun([partialResult], { reporter: 'raw' });
        })
        .then(rawResults => {
          expect(rawResults.length).not.toBe(0);
          rawResults.forEach(rawResult => {
            expect(rawResult).toHaveProperty('violations');
            expect(rawResult).toHaveProperty('passes');
            expect(rawResult).toHaveProperty('incomplete');
            expect(rawResult).toHaveProperty('inapplicable');
          });
          done();
        })
        .catch(reject);
    });
  });

  it('defaults options.reporter to v1', () => {
    return new Promise<void>((done, reject) => {
      axe
        .runPartial()
        .then(partialResult => {
          return axe.finishRun([partialResult]);
        })
        .then(results => {
          expect(results.toolOptions.reporter).toBe('v1');
          done();
        })
        .catch(reject);
    });
  });

  it('normalizes the runOnly option in the reporter', () => {
    return new Promise<void>((done, reject) => {
      axe
        .runPartial()
        .then(partialResult => {
          return axe.finishRun([partialResult], { runOnly: 'region' });
        })
        .then(results => {
          expect(results.toolOptions.runOnly).toEqual({
            type: 'rule',
            values: ['region']
          });
          done();
        })
        .catch(reject);
    });
  });

  it('takes partialResult.environmentData to the reporter', () => {
    return new Promise<void>((done, reject) => {
      const testEngine = {
        name: 'dummy-engine',
        version: '1.2.3.4.5'
      };
      axe
        .runPartial()
        .then(partialResult => {
          partialResult.environmentData = { testEngine: testEngine };
          return axe.finishRun([partialResult], { runOnly: 'region' });
        })
        .then(results => {
          expect(results.testEngine).toEqual(testEngine);
          done();
        })
        .catch(reject);
    });
  });

  it('can report violations results', () => {
    return new Promise<void>((done, reject) => {
      // Safe: test-only static HTML for DOM fixture
      fixture.innerHTML = '<div aria-label="foo"></div>';
      axe
        .runPartial(
          { include: [['#fixture']] },
          { runOnly: 'aria-prohibited-attr' }
        )
        .then(result => {
          return axe.finishRun([result]);
        })
        .then(results => {
          expect(results.violations).toHaveLength(1);
          expect(results.passes).toHaveLength(0);
          expect(results.incomplete).toHaveLength(0);
          expect(results.inapplicable).toHaveLength(0);
          done();
        })
        .catch(reject);
    });
  });

  it('can report passes results', () => {
    return new Promise<void>((done, reject) => {
      // Safe: test-only static HTML for DOM fixture
      fixture.innerHTML = '<div role="button" aria-label="foo"></div>';

      axe
        .runPartial(
          { include: [['#fixture']] },
          { runOnly: 'aria-allowed-attr' }
        )
        .then(result => {
          return axe.finishRun([result]);
        })
        .then(results => {
          expect(results.violations).toHaveLength(0);
          expect(results.passes).toHaveLength(1);
          expect(results.incomplete).toHaveLength(0);
          expect(results.inapplicable).toHaveLength(0);
          done();
        })
        .catch(reject);
    });
  });

  it('can report incomplete results', () => {
    return new Promise<void>((done, reject) => {
      // Safe: test-only static HTML for DOM fixture
      fixture.innerHTML = '<div aria-describedby="missing"></div>';

      axe
        .runPartial(
          { include: [['#fixture']] },
          { runOnly: 'aria-valid-attr-value' }
        )
        .then(result => {
          return axe.finishRun([result]);
        })
        .then(results => {
          expect(results.violations).toHaveLength(0);
          expect(results.passes).toHaveLength(0);
          expect(results.incomplete).toHaveLength(1);
          expect(results.inapplicable).toHaveLength(0);
          done();
        })
        .catch(reject);
    });
  });

  it('can report inapplicable results', () => {
    return new Promise<void>((done, reject) => {
      axe
        .runPartial(
          { include: [['#fixture']] },
          { runOnly: 'aria-allowed-attr' }
        )
        .then(result => {
          return axe.finishRun([result]);
        })
        .then(results => {
          expect(results.violations).toHaveLength(0);
          expect(results.passes).toHaveLength(0);
          expect(results.incomplete).toHaveLength(0);
          expect(results.inapplicable).toHaveLength(1);
          done();
        })
        .catch(reject);
    });
  });

  it('takes multiple partial results and outputs a finished report', () => {
    return new Promise<void>((done, reject) => {
      // Safe: test-only static HTML for DOM fixture
      fixture.innerHTML =
        '<div id="fail" aria-label="foo"></div>' +
        '<div id="pass" role="button" aria-label="foo"></div>' +
        '<div id="incomplete" aria-describedby="missing"></div>';
      const allResults = [];

      axe
        .runPartial({ include: [['#pass']] }, { runOnly: 'aria-allowed-attr' })
        .then(results => {
          allResults.push(results);
          return axe.runPartial(
            { include: [['#fail']] },
            { runOnly: 'aria-prohibited-attr' }
          );
        })
        .then(results => {
          allResults.push(results);
          return axe.runPartial(
            { include: [['#incomplete']] },
            { runOnly: 'aria-valid-attr-value' }
          );
        })
        .then(results => {
          return axe.finishRun(allResults.concat(results));
        })
        .then(results => {
          expect(results.violations).toHaveLength(1);
          expect(results.passes).toHaveLength(1);
          expect(results.incomplete).toHaveLength(1);
          expect(results.inapplicable).toHaveLength(0);
          done();
        })
        .catch(reject);
    });
  });

  it('rejects with sync reporter errors', async () => {
    axe.addReporter('throwing', () => {
      throw new Error('Something went wrong');
    });
    const options = { reporter: 'throwing' };

    // Safe: test-only static HTML for DOM fixture
    fixture.innerHTML = '<h1>Hello world</h1>';
    const partial = await axe.runPartial('#fixture', options);
    try {
      await axe.finishRun([partial], options);
      expect(true).toBe(false) /* 'Should have thrown' */;
    } catch (err) {
      expect(err.message).toBe('Something went wrong');
    }
  });

  it('rejects with async reporter errors', async () => {
    axe.addReporter('throwing', (results, options, resolve, reject) => {
      setTimeout(() => {
        reject(new Error('Something went wrong'));
      }, 10);
    });
    const options = { reporter: 'throwing' };

    // Safe: test-only static HTML for DOM fixture
    fixture.innerHTML = '<h1>Hello world</h1>';
    const partial = await axe.runPartial('#fixture', options);
    try {
      await axe.finishRun([partial], options);
      expect(true).toBe(false) /* 'Should have thrown' */;
    } catch (err) {
      expect(err.message).toBe('Something went wrong');
    }
  });

  describe('frames', () => {
    function createIframe(html, parent) {
      return new Promise(resolve => {
        parent = parent || fixture;
        const doc = parent.ownerDocument;
        const iframe = doc.createElement('iframe');
        parent.appendChild(iframe);
        const frameDoc = iframe.contentDocument;
        frameDoc.write(html + '<script src="/axe.js"></script>');
        frameDoc.close();
        frameDoc.querySelector('script').onload = () => {
          resolve(iframe.contentWindow);
        };
      });
    }

    it('reconstructs which node is in which frame', () => {
      return new Promise<void>((done, reject) => {
        createIframe('<h1></h1>')
          .then(frameWin => {
            return Promise.all([
              window.axe.runPartial({ runOnly: 'empty-heading' }),
              frameWin.axe.runPartial({ runOnly: 'empty-heading' })
            ]);
          })
          .then(axe.finishRun)
          .then(results => {
            const nodes = results.violations[0].nodes;
            expect(nodes[0].target).toEqual(['iframe', 'h1']);
            done();
          })
          .catch(reject);
      });
    });

    it('handles nodes in nested iframes', () => {
      return new Promise<void>((done, reject) => {
        const windows = [window];
        // Safe: test-only static HTML for DOM fixture
        fixture.innerHTML = '<h1></h1>';
        createIframe('<h2></h2>')
          .then(frameWin => {
            windows.push(frameWin);
            return createIframe('<h3></h3>', frameWin.document.body);
          })
          .then(nestedWin => {
            windows.push(nestedWin);
            const promisedResults = windows.map(win => {
              return win.axe.runPartial({ runOnly: 'empty-heading' });
            });
            return Promise.all(promisedResults);
          })
          .then(axe.finishRun)
          .then(results => {
            const nodes = results.violations[0].nodes;
            expect(nodes[0].target).toEqual(['h1']);
            expect(nodes[1].target).toEqual(['iframe', 'h2']);
            expect(nodes[2].target).toEqual(['iframe', 'iframe', 'h3']);
            done();
          })
          .catch(reject);
      });
    });

    it('should handle null results and set target correctly', () => {
      return new Promise<void>((done, reject) => {
        const windows = [window];
        // Safe: test-only static HTML for DOM fixture
        fixture.innerHTML = '<h1></h1>';
        createIframe('<h2></h2>')
          .then(frameWin => {
            windows.push(frameWin);
            return createIframe('<h3></h3>');
          })
          .then(nestedWin => {
            windows.push(nestedWin);
            const promisedResults = windows.map(win => {
              return win.axe.runPartial({ runOnly: 'empty-heading' });
            });
            return Promise.all(promisedResults);
          })
          .then(partialResults => {
            partialResults[1] = null;
            return partialResults;
          })
          .then(axe.finishRun)
          .then(results => {
            const nodes = results.violations[0].nodes;
            expect(nodes[0].target).toEqual(['h1']);
            expect(nodes[1].target).toEqual(['iframe:nth-child(3)', 'h3']);
            done();
          })
          .catch(reject);
      });
    });
  });

  describe('calling audit.after', () => {
    it('passes results with iframe ancestries', () => {
      return new Promise<void>((done, reject) => {
        // Safe: test-only static HTML for DOM fixture
        fixture.innerHTML = '<i id="i"></i> <i id="i"></i>';
        axe
          .runPartial(fixture, { runOnly: 'duplicate-id' })
          .then(partialResult => {
            return axe.finishRun([partialResult], { runOnly: 'duplicate-id' });
          })
          .then(result => {
            const nodes = result.violations[0].nodes;
            const relatedNodes = nodes[0].any[0].relatedNodes;

            expect(nodes).toHaveLength(1);
            expect(nodes[0].target).toEqual(['i:nth-child(1)']);
            expect(relatedNodes).toHaveLength(1);
            expect(relatedNodes[0].target).toEqual(['i:nth-child(2)']);
            done();
          })
          .catch(reject);
      });
    });

    it('provides the options object', () => {
      return new Promise<void>((done, reject) => {
        let spy;
        // Safe: test-only static HTML for DOM fixture
        fixture.innerHTML = '<i id="i"></i> <i id="i"></i>';
        axe
          .runPartial(fixture, { runOnly: 'duplicate-id' })
          .then(partialResult => {
            spy = vi.spyOn(axe._audit, 'after');
            return axe.finishRun([partialResult], { runOnly: 'duplicate-id' });
          })
          .then(() => {
            expect(axe._audit.after.args).toHaveLength(1);
            expect(axe._audit.after.args[0][1]).toEqual({
              runOnly: { type: 'rule', values: ['duplicate-id'] },
              reporter: 'v1'
            });
            spy.mockRestore();
            done();
          })
          .catch(err => {
            spy.mockRestore();
            reject(err);
          });
      });
    });
  });
});
