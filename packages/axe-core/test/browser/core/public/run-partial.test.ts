import { describe, it, expect, afterEach, beforeAll } from 'vitest';

declare const axe: any;
describe('axe.runPartial', () => {
  const fixture = document.getElementById('fixture');
  const DqElement = axe.utils.DqElement;
  const dqElementKeys = Object.keys(new DqElement(null).toJSON());

  afterEach(() => {
    fixture.innerHTML = '';
  });

  it('Uses axe._tree if it already exists', () => {
    return new Promise<void>((done, reject) => {
      axe._tree = [axe.setup(fixture)];
      fixture.innerHTML = '<img>';
      axe
        .runPartial(document, { runOnly: 'image-alt' })
        .then(partialResult => {
          let result = partialResult.results[0];
          // 0, because <img> was added after the tree was constructed
          expect(result.nodes).toHaveLength(0);
          done();
        })
        .catch(reject);
    });
  });

  it('cleans up after resolving', () => {
    return new Promise<void>((done, reject) => {
      axe
        .runPartial(document, { runOnly: 'image-alt' })
        .then(() => {
          expect(axe._tree).toBeUndefined();
          expect(axe._selectorData).toBeUndefined();
          expect(axe._running).toBe(false);
          done();
        })
        .catch(reject);
    });
  });

  it('normalizes the options argument', () => {
    return new Promise<void>((done, reject) => {
      axe
        .runPartial(/* no context */ { runOnly: 'image-alt' })
        .then(partialResult => {
          expect(partialResult.results).toHaveLength(1);
          expect(partialResult.results[0].id).toBe('image-alt');
          done();
        })
        .catch(reject);
    });
  });

  it('does not mutate the options object', () => {
    return new Promise<void>((done, reject) => {
      let options = {};
      axe
        .runPartial(options)
        .then(() => {
          expect(options).toEqual({});
          done();
        })
        .catch(reject);
    });
  });

  it('ignores { elementRef: true } option', async () => {
    const options = { elementRef: true };
    const result = await axe.runPartial(options);
    for (const nodeResult of result.results[0].nodes) {
      expect(nodeResult.node.element).toBeUndefined();
    }
  });

  describe('result', () => {
    let partialResult;
    beforeAll(async () => {
      // Safe: test-only static HTML for DOM fixture
      fixture.innerHTML = '<img>';
      partialResult = await axe.runPartial(document, { runOnly: 'image-alt' });
    });

    it('returns a result with all the valid properties', () => {
      let result = partialResult.results[0];
      expect(partialResult.results).toHaveLength(1);
      expect(Object.keys(result)).toEqual(
        expect.arrayContaining(['id', 'result', 'pageLevel', 'impact', 'nodes'])
      );
      expect(result.id).toBe('image-alt');

      let checkResult = result.nodes[0];
      expect(result.nodes).toHaveLength(1);
      expect(Object.keys(checkResult)).toEqual(
        expect.arrayContaining(['any', 'all', 'none', 'node'])
      );
      expect(checkResult.node.selector).toEqual(['img']);
    });

    it('returns check results with a serialized node', () => {
      let checkResult = partialResult.results[0].nodes[0];
      expect(partialResult.results[0].nodes).toHaveLength(1);
      expect(Object.keys(checkResult)).toEqual(
        expect.arrayContaining(['any', 'all', 'none', 'node'])
      );
      expect(checkResult.node).not.toBeInstanceOf(DqElement);
      expect(Object.keys(checkResult.node)).toEqual(
        expect.arrayContaining(dqElementKeys)
      );
    });

    it('does not return DqElement objects', () => {
      for (const result of partialResult.results) {
        for (const nodeResult of result.nodes) {
          expect(nodeResult.node).not.toBeInstanceOf(DqElement);
          const checks = [
            ...nodeResult.any,
            ...nodeResult.all,
            ...nodeResult.none
          ];
          for (const check of checks) {
            for (const relatedNode of check.relatedNodes) {
              expect(relatedNode).not.toBeInstanceOf(DqElement);
            }
          }
        }
      }
    });

    it('can be serialized using JSON.stringify', () => {
      expect(() => {
        JSON.stringify(partialResult);
      }).not.toThrow();
    });
  });

  describe('frames', () => {
    let partialResult;
    beforeAll(async () => {
      fixture.innerHTML =
        '<main>' +
        ' <iframe id="foo"></iframe>' +
        ' <iframe id="bar"></iframe>' +
        '</main>' +
        '<iframe id="baz"></iframe>';

      partialResult = await axe.runPartial('#fixture > main', {
        runOnly: 'image-alt'
      });
    });

    it('only has frames in context', () => {
      expect(partialResult.frames).toHaveLength(2);
      expect(partialResult.frames[0].selector).toEqual(['#foo']);
      expect(partialResult.frames[1].selector).toEqual(['#bar']);
    });

    it('provides serialized frame info', () => {
      partialResult.frames.forEach(frame => {
        expect(Object.keys(frame)).toEqual(
          expect.arrayContaining(dqElementKeys)
        );
      });
    });
  });

  describe('environmentData', () => {
    it('includes environment data for the initiator', () => {
      return new Promise<void>((done, reject) => {
        let context = {
          include: [['#fixture']]
        };
        axe
          .runPartial(context, { runOnly: 'image-alt' })
          .then(out => {
            const keys = Object.keys(axe.utils.getEnvironmentData());
            expect(Object.keys(out.environmentData)).toEqual(
              expect.arrayContaining(keys)
            );
            done();
          })
          .catch(reject);
      });
    });

    it('is undefined for frames', () => {
      return new Promise<void>((done, reject) => {
        let context = {
          include: [['#fixture']],
          initiator: false
        };
        axe
          .runPartial(context, { runOnly: 'image-alt' })
          .then(out => {
            expect(out.environmentData).toBeUndefined();
            done();
          })
          .catch(reject);
      });
    });
  });

  describe('guards', () => {
    const audit = axe._audit;
    afterEach(() => {
      axe._audit = audit;
      axe._running = false;
    });

    it('throws when axe._audit is undefined', () => {
      axe._audit = null;
      expect(() => {
        axe.runPartial();
      }).toThrow();
    });

    it('throws if axe is already running', () => {
      return new Promise<void>((done, reject) => {
        axe.runPartial().then(() => {
          done();
        });
        expect(() => {
          axe.runPartial();
        }).toThrow();
      });
    });
  });
});
