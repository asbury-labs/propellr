import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('frame-tested', function () {
  const checkEvaluate = axe.testUtils.getCheckEvaluate('frame-tested');
  const frameTestedAfter = checks['frame-tested'].after;

  describe('evaluate', function () {
    it('returns undefined', function () {
      expect(checkEvaluate()).toBeUndefined();
    });

    it('returns false if passed isViolation:true', function () {
      expect(checkEvaluate(null, { isViolation: true })).toBe(false);
    });
  });

  describe('after', function () {
    it('changes result to true if frame has been tested', function () {
      const results = [
        {
          result: undefined,
          node: {
            ancestry: ['html']
          }
        },
        {
          result: undefined,
          node: {
            ancestry: ['html > body > iframe#1']
          }
        },
        {
          result: undefined,
          node: {
            ancestry: ['html > body > iframe#2']
          }
        },
        {
          result: undefined,
          node: {
            ancestry: ['html > body > iframe#1', 'html']
          }
        },
        {
          result: undefined,
          node: {
            ancestry: ['html > body > iframe#2', 'html']
          }
        }
      ];

      const afterResults = frameTestedAfter(results);
      expect(afterResults).toHaveLength(2);

      expect(afterResults[0].result).toBe(true);
      expect(afterResults[0].node.ancestry).toEqual(['html > body > iframe#1']);

      expect(afterResults[1].result).toBe(true);
      expect(afterResults[1].node.ancestry).toEqual(['html > body > iframe#2']);
    });

    it('does not change result when iframe has not been tested', function () {
      const results = [
        {
          result: undefined,
          node: {
            ancestry: ['html']
          }
        },
        {
          result: undefined,
          node: {
            ancestry: ['html > body > iframe#1']
          }
        },
        {
          result: undefined,
          node: {
            ancestry: ['html > body > iframe#2']
          }
        },
        {
          result: false,
          node: {
            ancestry: ['html > body > iframe#3']
          }
        },
        {
          result: undefined,
          node: {
            ancestry: ['html > body > iframe#1', 'html']
          }
        }
      ];

      const afterResults = frameTestedAfter(results);
      expect(afterResults).toHaveLength(3);

      expect(afterResults[0].result).toBe(true);
      expect(afterResults[0].node.ancestry).toEqual(['html > body > iframe#1']);

      expect(afterResults[1].result).toBeUndefined();
      expect(afterResults[1].node.ancestry).toEqual(['html > body > iframe#2']);

      expect(afterResults[2].result).toBe(false);
      expect(afterResults[2].node.ancestry).toEqual(['html > body > iframe#3']);
    });

    it('works with shadow DOM', function () {
      const results = [
        {
          result: undefined,
          node: {
            ancestry: ['html']
          }
        },
        {
          result: undefined,
          node: {
            ancestry: [['html > body > custom-elm1', 'iframe#1']]
          }
        },
        {
          result: undefined,
          node: {
            ancestry: [['html > body > custom-elm1', 'iframe#2']]
          }
        },
        {
          result: undefined,
          node: {
            ancestry: [['html > body > custom-elm1', 'iframe#1'], 'html']
          }
        }
      ];

      const afterResults = frameTestedAfter(results);
      expect(afterResults).toHaveLength(2);

      expect(afterResults[0].result).toBe(true);
      expect(afterResults[0].node.ancestry).toEqual([
        ['html > body > custom-elm1', 'iframe#1']
      ]);

      expect(afterResults[1].result).toBeUndefined();
      expect(afterResults[1].node.ancestry).toEqual([
        ['html > body > custom-elm1', 'iframe#2']
      ]);
    });

    it('works with nested shadow DOM and iframes', function () {
      const results = [
        {
          result: undefined,
          node: {
            ancestry: ['html']
          }
        },
        {
          result: undefined,
          node: {
            ancestry: ['html > body > iframe#1']
          }
        },
        {
          result: undefined,
          node: {
            ancestry: [['html > body > custom-elm1', 'iframe#2']]
          }
        },
        {
          result: undefined,
          node: {
            ancestry: ['html > body > iframe#1', 'html']
          }
        },
        {
          result: undefined,
          node: {
            ancestry: [['html > body > custom-elm1', 'iframe#2'], 'html']
          }
        },
        {
          result: undefined,
          node: {
            ancestry: [
              ['html > body > custom-elm1', 'iframe#2'],
              ['html > body > other-element', 'iframe#3']
            ]
          }
        },
        {
          result: undefined,
          node: {
            ancestry: [
              ['html > body > custom-elm1', 'iframe#2'],
              ['html > body > other-element', 'iframe#4']
            ]
          }
        },
        {
          result: undefined,
          node: {
            ancestry: [
              ['html > body > custom-elm1', 'iframe#2'],
              ['html > body > other-element', 'iframe#3'],
              'html'
            ]
          }
        }
      ];

      const afterResults = frameTestedAfter(results);
      expect(afterResults).toHaveLength(4);

      expect(afterResults[0].result).toBe(true);
      expect(afterResults[0].node.ancestry).toEqual(['html > body > iframe#1']);

      expect(afterResults[1].result).toBe(true);
      expect(afterResults[1].node.ancestry).toEqual([
        ['html > body > custom-elm1', 'iframe#2']
      ]);

      expect(afterResults[2].result).toBe(true);
      expect(afterResults[2].node.ancestry).toEqual([
        ['html > body > custom-elm1', 'iframe#2'],
        ['html > body > other-element', 'iframe#3']
      ]);

      expect(afterResults[3].result).toBeUndefined();
      expect(afterResults[3].node.ancestry).toEqual([
        ['html > body > custom-elm1', 'iframe#2'],
        ['html > body > other-element', 'iframe#4']
      ]);
    });
  });
});
