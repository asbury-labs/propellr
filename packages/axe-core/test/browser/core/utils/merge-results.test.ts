import { describe, it, expect } from 'vitest';
import { queryFixture } from '../../../testutils';

declare const axe: any;
describe('axe.utils.mergeResults', () => {
  const RuleError = axe.utils.RuleError;

  it('should normalize empty results', () => {
    let result = axe.utils.mergeResults([
      { results: [] },
      { results: [{ id: 'a', result: 'b' }] }
    ]);
    expect(result).toEqual([
      {
        id: 'a',
        result: 'b'
      }
    ]);
  });

  it('merges frame content, including all selector types', () => {
    let iframe = queryFixture('<iframe id="target"></iframe>').actualNode;
    let node = {
      selector: ['#foo'],
      xpath: ['html/#foo'],
      ancestry: ['html > div'],
      nodeIndexes: [123]
    };
    let result = axe.utils.mergeResults([
      {
        frameElement: iframe,
        results: [
          {
            id: 'a',
            result: 'b',
            nodes: [{ node: node }]
          }
        ]
      }
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].nodes).toHaveLength(1);

    let node = result[0].nodes[0].node;
    expect(node.selector).toEqual(['#target', '#foo']);
    expect(node.xpath).toEqual(["//iframe[@id='target']", 'html/#foo']);
    expect(node.ancestry).toEqual([
      'html > body > div:nth-child(1) > iframe',
      'html > div'
    ]);
    expect(node.nodeIndexes).toEqual([1, 123]);
  });

  it('merges frame specs', () => {
    let iframe = queryFixture('<iframe id="target"></iframe>').actualNode;
    const frameSpec = new axe.utils.DqElement(iframe).toJSON();
    let node = {
      selector: ['#foo'],
      xpath: ['html/#foo'],
      ancestry: ['html > div'],
      nodeIndexes: [123]
    };
    let result = axe.utils.mergeResults([
      {
        frameSpec: frameSpec,
        results: [
          {
            id: 'a',
            result: 'b',
            nodes: [{ node: node }]
          }
        ]
      }
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].nodes).toHaveLength(1);

    let node = result[0].nodes[0].node;
    expect(node.selector).toEqual(['#target', '#foo']);
    expect(node.xpath).toEqual(["//iframe[@id='target']", 'html/#foo']);
    expect(node.ancestry).toEqual([
      'html > body > div:nth-child(1) > iframe',
      'html > div'
    ]);
    expect(node.nodeIndexes).toEqual([1, 123]);
  });

  it('sorts results from iframes into their correct DOM position', () => {
    let result = axe.utils.mergeResults([
      {
        results: [
          {
            id: 'a',
            result: 'a',
            nodes: [
              {
                node: {
                  selector: ['h1'],
                  nodeIndexes: [1]
                }
              }
            ]
          },
          {
            id: 'a',
            result: 'd',
            nodes: [
              {
                node: {
                  selector: ['h4'],
                  nodeIndexes: [4]
                }
              }
            ]
          },
          {
            id: 'a',
            result: 'b',
            nodes: [
              {
                node: {
                  selector: ['iframe1', 'h2'],
                  nodeIndexes: [2, 1],
                  fromFrame: true
                }
              }
            ]
          },
          {
            id: 'a',
            result: 'c',
            nodes: [
              {
                node: {
                  selector: ['iframe1', 'h3'],
                  nodeIndexes: [2, 2],
                  fromFrame: true
                }
              }
            ]
          }
        ]
      }
    ]);

    let ids = result[0].nodes.map(el => {
      return el.node.selector.join(' >> ');
    });
    expect(ids).toEqual(['h1', 'iframe1 >> h2', 'iframe1 >> h3', 'h4']);
  });

  it('sorts nested iframes', () => {
    let result = axe.utils.mergeResults([
      {
        results: [
          {
            id: 'heading-order',
            result: true,
            nodes: [
              {
                node: {
                  selector: ['h1'],
                  nodeIndexes: [1]
                }
              },
              {
                node: {
                  selector: ['h5'],
                  nodeIndexes: [3]
                }
              }
            ]
          },
          {
            id: 'heading-order',
            result: true,
            nodes: [
              {
                node: {
                  selector: ['iframe1', 'h2'],
                  nodeIndexes: [2, 1],
                  fromFrame: true
                }
              },
              {
                node: {
                  selector: ['iframe1', 'h4'],
                  nodeIndexes: [2, 3],
                  fromFrame: true
                }
              }
            ]
          },
          {
            id: 'heading-order',
            result: true,
            nodes: [
              {
                node: {
                  selector: ['iframe1', 'iframe2', 'h3'],
                  nodeIndexes: [2, 2, 1],
                  fromFrame: true
                }
              }
            ]
          }
        ]
      }
    ]);

    let ids = result[0].nodes.map(el => {
      return el.node.selector.join(' >> ');
    });
    expect(ids).toEqual([
      'h1',
      'iframe1 >> h2',
      'iframe1 >> iframe2 >> h3',
      'iframe1 >> h4',
      'h5'
    ]);
  });

  it('sorts results even if nodeIndexes are empty', () => {
    let result = axe.utils.mergeResults([
      {
        results: [
          {
            id: 'heading-order',
            result: true,
            nodes: [
              {
                node: {
                  selector: ['h1'],
                  nodeIndexes: [1]
                }
              },
              {
                node: {
                  selector: ['nill'],
                  nodeIndexes: []
                }
              },
              {
                node: {
                  selector: ['h3'],
                  nodeIndexes: [3]
                }
              }
            ]
          },
          {
            id: 'heading-order',
            result: true,
            nodes: [
              {
                node: {
                  selector: ['nill'],
                  nodeIndexes: []
                }
              }
            ]
          },
          {
            id: 'heading-order',
            result: true,
            nodes: [
              {
                node: {
                  selector: ['iframe1', 'h2'],
                  nodeIndexes: [2, 1],
                  fromFrame: true
                }
              },
              {
                node: {
                  selector: ['nill'],
                  nodeIndexes: []
                }
              }
            ]
          }
        ]
      }
    ]);

    let ids = result[0].nodes.map(el => {
      return el.node.selector.join(' >> ');
    });
    // Order of "nill" varies in IE
    expect(ids).toEqual(['h1', 'iframe1 >> h2', 'h3', 'nill', 'nill', 'nill']);
  });

  it('sorts results even if nodeIndexes are undefined', () => {
    let result = axe.utils.mergeResults([
      {
        results: [
          {
            id: 'heading-order',
            result: true,
            nodes: [
              {
                node: {
                  selector: ['h1'],
                  nodeIndexes: [1]
                }
              },
              {
                node: {
                  selector: ['nill']
                }
              },
              {
                node: {
                  selector: ['h3'],
                  nodeIndexes: [3]
                }
              }
            ]
          },
          {
            id: 'heading-order',
            result: true,
            nodes: [
              {
                node: {
                  selector: ['nill']
                }
              }
            ]
          },
          {
            id: 'heading-order',
            result: true,
            nodes: [
              {
                node: {
                  selector: ['iframe1', 'h2'],
                  nodeIndexes: [2, 1],
                  fromFrame: true
                }
              },
              {
                node: {
                  selector: ['nill']
                }
              }
            ]
          }
        ]
      }
    ]);

    let ids = result[0].nodes.map(el => {
      return el.node.selector.join(' >> ');
    });
    // Order of "nill" varies in IE
    expect(ids).toEqual(['h1', 'iframe1 >> h2', 'h3', 'nill', 'nill', 'nill']);
  });

  it('sorts nodes all placed on the same result', () => {
    let result = axe.utils.mergeResults([
      {
        results: [
          {
            id: 'iframe',
            result: 'inapplicable',
            nodes: [
              {
                node: {
                  selector: ['#level0', '#level1', '#level2a'],
                  nodeIndexes: [12, 14, 14]
                }
              },
              {
                node: {
                  selector: ['#level0', '#level1', '#level2b'],
                  nodeIndexes: [12, 14, 16]
                }
              },
              {
                node: {
                  selector: ['#level0', '#level1'],
                  nodeIndexes: [12, 14]
                }
              },
              {
                node: {
                  selector: ['#level0'],
                  nodeIndexes: [12]
                }
              }
            ]
          }
        ]
      }
    ]);

    let ids = result[0].nodes.map(el => {
      return el.node.selector.join(' >> ');
    });

    expect(ids).toEqual([
      '#level0',
      '#level0 >> #level1',
      '#level0 >> #level1 >> #level2a',
      '#level0 >> #level1 >> #level2b'
    ]);
  });

  describe('errors', () => {
    it('sets error if it is present', () => {
      const result = axe.utils.mergeResults([
        { results: [{ id: 'a', result: 'b', error: new Error('test') }] }
      ]);
      expect(result[0].error.message).toBe('test');
    });

    it('picks the first error if there are multiple', () => {
      const result = axe.utils.mergeResults([
        {
          results: [
            {
              id: 'error-occurred',
              result: undefined,
              nodes: [{ node: { selector: ['h1'], nodeIndexes: [1] } }]
            },
            {
              id: 'error-occurred',
              result: undefined,
              error: new RuleError({ error: new Error('test 1') }),
              nodes: [
                {
                  node: {
                    selector: ['iframe1', 'h2'],
                    nodeIndexes: [2, 1],
                    fromFrame: true
                  }
                }
              ]
            },
            {
              id: 'error-occurred',
              result: undefined,
              error: new RuleError({ error: new Error('test 2') }),
              nodes: [
                {
                  node: {
                    selector: ['iframe2', 'h3'],
                    nodeIndexes: [3, 1],
                    fromFrame: true
                  }
                }
              ]
            }
          ]
        }
      ]);

      expect(result[0].error.message).toBe('test 1');
    });
  });
});
