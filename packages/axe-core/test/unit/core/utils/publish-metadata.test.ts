import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('axe.utils.publishMetaData', () => {
  afterEach(() => {
    axe._audit = null;
  });

  it('should pull data from rules from axe._audit.data', () => {
    let expected = {
      foo: 'bar',
      bob: 'loblaw'
    };

    axe._load({
      rules: [],
      data: {
        rules: {
          cats: expected
        }
      }
    });

    let result = {
      id: 'cats',
      nodes: []
    };
    axe.utils.publishMetaData(result);

    expect(result.foo).toBe(expected.foo);
    expect(result.bob).toBe(expected.bob);
  });

  it('should pull data from checks from axe._audit.data', () => {
    let expected = {
      foo: 'bar',
      bob: 'loblaw'
    };

    axe._load({
      rules: [],
      data: {
        checks: {
          cats: expected
        }
      }
    });

    let result = {
      id: 'foo',
      nodes: [
        {
          any: [
            {
              id: 'cats'
            }
          ],
          all: [],
          none: []
        }
      ]
    };
    axe.utils.publishMetaData(result);
    expect(result.nodes[0].any[0].foo).toBe(expected.foo);
    expect(result.nodes[0].any[0].bar).toBe(expected.bar);
  });

  it('should execute messages', () => {
    axe._load({
      rules: [],
      data: {
        rules: {
          cats: {
            help: () => {
              return 'cats-rule';
            }
          }
        },
        checks: {
          'cats-NONE': {
            messages: {
              fail: () => {
                return 'fail-NONE';
              },
              pass: () => {
                return 'pass-NONE';
              }
            }
          },
          'cats-ANY': {
            messages: {
              fail: () => {
                return 'fail-ANY';
              },
              pass: () => {
                return 'pass-ANY';
              }
            }
          },
          'cats-ALL': {
            messages: {
              fail: () => {
                return 'fail-ALL';
              },
              pass: () => {
                return 'pass-ALL';
              }
            }
          }
        }
      }
    });

    let result = {
      id: 'cats',
      nodes: [
        {
          any: [
            {
              result: false,
              id: 'cats-ANY'
            }
          ],
          none: [
            {
              result: true,
              id: 'cats-NONE'
            }
          ],
          all: [
            {
              result: false,
              id: 'cats-ALL'
            }
          ]
        },
        {
          any: [
            {
              result: true,
              id: 'cats-ANY'
            }
          ],
          none: [
            {
              result: false,
              id: 'cats-NONE'
            }
          ],
          all: [
            {
              result: true,
              id: 'cats-ALL'
            }
          ]
        }
      ]
    };
    axe.utils.publishMetaData(result);
    expect(result).toEqual({
      id: 'cats',
      help: 'cats-rule',
      tags: [],
      nodes: [
        {
          any: [
            {
              result: false,
              id: 'cats-ANY',
              message: 'fail-ANY'
            }
          ],
          none: [
            {
              result: true,
              id: 'cats-NONE',
              message: 'fail-NONE'
            }
          ],
          all: [
            {
              result: false,
              id: 'cats-ALL',
              message: 'fail-ALL'
            }
          ]
        },
        {
          any: [
            {
              result: true,
              id: 'cats-ANY',
              message: 'pass-ANY'
            }
          ],
          none: [
            {
              result: false,
              id: 'cats-NONE',
              message: 'pass-NONE'
            }
          ],
          all: [
            {
              result: true,
              id: 'cats-ALL',
              message: 'pass-ALL'
            }
          ]
        }
      ]
    });
  });

  it('should return default incomplete message with no reason specified by the check', () => {
    axe._load({
      rules: [],
      data: {
        rules: {
          cats: {
            help: () => {
              return 'cats-rule';
            }
          }
        },
        checks: {
          'cats-NONE': {
            messages: {
              fail: () => {
                return 'fail-NONE';
              },
              pass: () => {
                return 'pass-NONE';
              },
              incomplete: {
                'incomplete-NONE-reason1':
                  "We couldn't tell because of some reason",
                'incomplete-NONE-reason2': 'Some other reason',
                default: 'Fallback message for no reason'
              }
            }
          },
          'cats-ANY': {
            messages: {
              fail: () => {
                return 'fail-ANY';
              },
              pass: () => {
                return 'pass-ANY';
              },
              incomplete: {
                'incomplete-ANY-reason1':
                  "We couldn't tell because of some reason",
                'incomplete-ANY-reason2': 'Some other reason',
                default: 'Fallback message for no reason'
              }
            }
          },
          'cats-ALL': {
            messages: {
              fail: () => {
                return 'fail-ALL';
              },
              pass: () => {
                return 'pass-ALL';
              },
              incomplete: {
                'incomplete-ALL-reason1':
                  "We couldn't tell because of some reason",
                'incomplete-ALL-reason2': 'Some other reason',
                default: 'Fallback message for no reason'
              }
            }
          }
        }
      }
    });

    let result = {
      id: 'cats',
      nodes: [
        {
          any: [
            {
              result: undefined,
              id: 'cats-ANY',
              data: {}
            }
          ],
          none: [
            {
              result: undefined,
              id: 'cats-NONE',
              data: {}
            }
          ],
          all: [
            {
              result: undefined,
              id: 'cats-ALL',
              data: {}
            }
          ]
        }
      ]
    };
    axe.utils.publishMetaData(result);
    expect(result).toEqual({
      id: 'cats',
      help: 'cats-rule',
      tags: [],
      nodes: [
        {
          any: [
            {
              result: undefined,
              id: 'cats-ANY',
              message: 'Fallback message for no reason',
              data: {}
            }
          ],
          none: [
            {
              result: undefined,
              id: 'cats-NONE',
              message: 'Fallback message for no reason',
              data: {}
            }
          ],
          all: [
            {
              result: undefined,
              id: 'cats-ALL',
              message: 'Fallback message for no reason',
              data: {}
            }
          ]
        }
      ]
    });
  });

  it('should fall back to a generic message if incomplete object fails', () => {
    axe._load({
      rules: [],
      data: {
        incompleteFallbackMessage: () => {
          return 'Dogs are the best';
        },
        rules: {
          cats: {
            help: () => {
              return 'cats-rule';
            }
          }
        },
        checks: {
          'cats-NONE': {
            messages: {
              fail: () => {
                return 'fail-NONE';
              },
              pass: () => {
                return 'pass-NONE';
              },
              incomplete: {}
            }
          },
          'cats-ANY': {
            messages: {
              fail: () => {
                return 'fail-ANY';
              },
              pass: () => {
                return 'pass-ANY';
              },
              incomplete: {}
            }
          },
          'cats-ALL': {
            messages: {
              fail: () => {
                return 'fail-ALL';
              },
              pass: () => {
                return 'pass-ALL';
              },
              incomplete: {}
            }
          }
        }
      }
    });

    let result = {
      id: 'cats',
      nodes: [
        {
          any: [
            {
              result: undefined,
              id: 'cats-ANY',
              data: {}
            }
          ],
          none: [
            {
              result: undefined,
              id: 'cats-NONE',
              data: {}
            }
          ],
          all: [
            {
              result: undefined,
              id: 'cats-ALL',
              data: {}
            }
          ]
        }
      ]
    };
    axe.utils.publishMetaData(result);
    expect(result).toEqual({
      id: 'cats',
      help: 'cats-rule',
      tags: [],
      nodes: [
        {
          any: [
            {
              result: undefined,
              id: 'cats-ANY',
              message: 'Dogs are the best',
              data: {}
            }
          ],
          none: [
            {
              result: undefined,
              id: 'cats-NONE',
              message: 'Dogs are the best',
              data: {}
            }
          ],
          all: [
            {
              result: undefined,
              id: 'cats-ALL',
              message: 'Dogs are the best',
              data: {}
            }
          ]
        }
      ]
    });
  });

  it('should handle incomplete reasons', () => {
    axe._load({
      rules: [],
      data: {
        rules: {
          cats: {
            help: () => {
              return 'cats-rule';
            }
          }
        },
        checks: {
          'cats-NONE': {
            messages: {
              fail: () => {
                return 'fail-NONE';
              },
              pass: () => {
                return 'pass-NONE';
              },
              incomplete: {
                'incomplete-NONE-reason1':
                  "We couldn't tell because of some reason",
                'incomplete-NONE-reason2': 'Some other reason',
                default: 'Fallback message for no reason'
              }
            }
          },
          'cats-ANY': {
            messages: {
              fail: () => {
                return 'fail-ANY';
              },
              pass: () => {
                return 'pass-ANY';
              },
              incomplete: {
                'incomplete-ANY-reason1':
                  "We couldn't tell because of some reason",
                'incomplete-ANY-reason2': 'Some other reason',
                default: 'Fallback message for no reason'
              }
            }
          },
          'cats-ALL': {
            messages: {
              fail: () => {
                return 'fail-ALL';
              },
              pass: () => {
                return 'pass-ALL';
              },
              incomplete: {
                'incomplete-ALL-reason1':
                  "We couldn't tell because of some reason",
                'incomplete-ALL-reason2': 'Some other reason',
                default: 'Fallback message for no reason'
              }
            }
          }
        }
      }
    });

    let result = {
      id: 'cats',
      nodes: [
        {
          any: [
            {
              result: undefined,
              id: 'cats-ANY',
              data: {
                missingData: 'incomplete-ANY-reason1'
              }
            }
          ],
          none: [
            {
              result: undefined,
              id: 'cats-NONE',
              data: {
                missingData: 'incomplete-NONE-reason1'
              }
            }
          ],
          all: [
            {
              result: undefined,
              id: 'cats-ALL',
              data: {
                missingData: 'incomplete-ALL-reason1'
              }
            }
          ]
        }
      ]
    };
    axe.utils.publishMetaData(result);
    expect(result).toEqual({
      id: 'cats',
      help: 'cats-rule',
      tags: [],
      nodes: [
        {
          any: [
            {
              result: undefined,
              id: 'cats-ANY',
              message: "We couldn't tell because of some reason",
              data: {
                missingData: 'incomplete-ANY-reason1'
              }
            }
          ],
          none: [
            {
              result: undefined,
              id: 'cats-NONE',
              message: "We couldn't tell because of some reason",
              data: {
                missingData: 'incomplete-NONE-reason1'
              }
            }
          ],
          all: [
            {
              result: undefined,
              id: 'cats-ALL',
              message: "We couldn't tell because of some reason",
              data: {
                missingData: 'incomplete-ALL-reason1'
              }
            }
          ]
        }
      ]
    });
  });

  it('should handle incomplete reasons with backwards compatibility', () => {
    axe._load({
      rules: [],
      data: {
        rules: {
          cats: {
            help: () => {
              return 'cats-rule';
            }
          }
        },
        checks: {
          'cats-NONE': {
            messages: {
              fail: () => {
                return 'fail-NONE';
              },
              pass: () => {
                return 'pass-NONE';
              },
              incomplete: {
                'incomplete-NONE-reason1':
                  "We couldn't tell because of reason #1",
                'incomplete-NONE-reason2': 'Some other reason',
                default: 'Fallback message for no reason'
              }
            }
          },
          'cats-ANY': {
            messages: {
              fail: () => {
                return 'fail-ANY';
              },
              pass: () => {
                return 'pass-ANY';
              },
              incomplete: {
                'incomplete-ANY-reason1':
                  "We couldn't tell because of reason #1",
                'incomplete-ANY-reason2': 'Some other reason',
                default: 'Fallback message for no reason'
              }
            }
          },
          'cats-ALL': {
            messages: {
              fail: () => {
                return 'fail-ALL';
              },
              pass: () => {
                return 'pass-ALL';
              },
              incomplete: {
                'incomplete-ALL-reason1':
                  "We couldn't tell because of reason #1",
                'incomplete-ALL-reason2': 'Some other reason',
                default: 'Fallback message for no reason'
              }
            }
          }
        }
      }
    });

    let result = {
      id: 'cats',
      nodes: [
        {
          any: [
            {
              result: undefined,
              id: 'cats-ANY',
              data: {
                missingData: [
                  {
                    reason: 'incomplete-ANY-reason1'
                  }
                ]
              }
            }
          ],
          none: [
            {
              result: undefined,
              id: 'cats-NONE',
              data: {
                missingData: [
                  {
                    reason: 'incomplete-NONE-reason1'
                  }
                ]
              }
            }
          ],
          all: [
            {
              result: undefined,
              id: 'cats-ALL',
              data: {
                missingData: [
                  {
                    reason: 'incomplete-ALL-reason1'
                  }
                ]
              }
            }
          ]
        }
      ]
    };
    axe.utils.publishMetaData(result);
    expect(result).toEqual({
      id: 'cats',
      help: 'cats-rule',
      tags: [],
      nodes: [
        {
          any: [
            {
              result: undefined,
              id: 'cats-ANY',
              message: "We couldn't tell because of reason #1",
              data: {
                missingData: [
                  {
                    reason: 'incomplete-ANY-reason1'
                  }
                ]
              }
            }
          ],
          none: [
            {
              result: undefined,
              id: 'cats-NONE',
              message: "We couldn't tell because of reason #1",
              data: {
                missingData: [
                  {
                    reason: 'incomplete-NONE-reason1'
                  }
                ]
              }
            }
          ],
          all: [
            {
              result: undefined,
              id: 'cats-ALL',
              message: "We couldn't tell because of reason #1",
              data: {
                missingData: [
                  {
                    reason: 'incomplete-ALL-reason1'
                  }
                ]
              }
            }
          ]
        }
      ]
    });
  });

  it('should not modify base configuration', () => {
    axe._load({
      rules: [],
      data: {
        rules: {
          cats: {
            help: () => {
              return 'cats-rule';
            }
          }
        },
        checks: {
          'cats-PASS': {
            failureMessage: () => {
              return 'cats-check';
            }
          },
          'cats-ANY': {
            failureMessage: () => {
              return 'cats-check2';
            }
          },
          'cats-ALL': {
            failureMessage: () => {
              return 'cats-check2';
            }
          }
        }
      }
    });
    axe.utils.publishMetaData({
      id: 'cats',
      nodes: [
        {
          any: [
            {
              result: false,
              id: 'cats-PASS'
            }
          ],
          none: [
            {
              result: true,
              id: 'cats-FAIL'
            }
          ],
          all: [
            {
              result: false,
              id: 'cats-ALL'
            }
          ]
        }
      ]
    });

    expect(axe._audit.data.checks['cats-PASS'].failureMessage).not.toBeNull();
    expect(axe._audit.data.checks['cats-ANY'].failureMessage).not.toBeNull();
    expect(axe._audit.data.checks['cats-ALL'].failureMessage).not.toBeNull();
  });

  it('should pull tags off rule object', () => {
    let expected = {
      foo: 'bar',
      bob: 'loblaw'
    };

    axe._load({
      rules: [
        {
          id: 'foo',
          tags: ['hai']
        }
      ],
      data: {
        checks: {
          cats: expected
        }
      }
    });

    let result = {
      id: 'foo',
      nodes: [
        {
          any: [
            {
              id: 'cats'
            }
          ],
          all: [],
          none: []
        }
      ]
    };
    axe.utils.publishMetaData(result);
    expect(result.tags).toEqual(['hai']);
  });

  describe('non-doT syntax', () => {
    it('should process ${data} syntax', () => {
      axe._load({
        rules: [],
        data: {
          rules: {
            cats: {
              help: 'cats-rule'
            }
          },
          checks: {
            'cats-ANY': {
              messages: {
                pass: 'pass-ANY ${data}',
                fail: 'fail-ANY ${data}'
              }
            }
          }
        }
      });

      let result = {
        id: 'cats',
        nodes: [
          {
            any: [
              {
                result: true,
                id: 'cats-ANY',
                data: 'cats'
              }
            ],
            none: [],
            all: []
          }
        ]
      };

      axe.utils.publishMetaData(result);
      expect(result).toEqual({
        id: 'cats',
        help: 'cats-rule',
        tags: [],
        nodes: [
          {
            any: [
              {
                result: true,
                id: 'cats-ANY',
                message: 'pass-ANY cats',
                data: 'cats'
              }
            ],
            none: [],
            all: []
          }
        ]
      });
    });

    it('should return default incomplete message with no reason specified by the check', () => {
      axe._load({
        rules: [],
        data: {
          rules: {
            cats: {
              help: 'cats-rule'
            }
          },
          checks: {
            'cats-NONE': {
              messages: {
                fail: 'fail-NONE',
                pass: 'pass-NONE',
                incomplete: {
                  'incomplete-NONE-reason1':
                    "We couldn't tell because of some reason",
                  'incomplete-NONE-reason2': 'Some other reason',
                  default: 'Fallback message for no reason'
                }
              }
            },
            'cats-ANY': {
              messages: {
                fail: 'fail-ANY',
                pass: 'pass-ANY',
                incomplete: {
                  'incomplete-ANY-reason1':
                    "We couldn't tell because of some reason",
                  'incomplete-ANY-reason2': 'Some other reason',
                  default: 'Fallback message for no reason'
                }
              }
            },
            'cats-ALL': {
              messages: {
                fail: 'fail-ALL',
                pass: 'pass-ALL',
                incomplete: {
                  'incomplete-ALL-reason1':
                    "We couldn't tell because of some reason",
                  'incomplete-ALL-reason2': 'Some other reason',
                  default: 'Fallback message for no reason'
                }
              }
            }
          }
        }
      });

      let result = {
        id: 'cats',
        nodes: [
          {
            any: [
              {
                result: undefined,
                id: 'cats-ANY',
                data: {}
              }
            ],
            none: [
              {
                result: undefined,
                id: 'cats-NONE',
                data: {}
              }
            ],
            all: [
              {
                result: undefined,
                id: 'cats-ALL',
                data: {}
              }
            ]
          }
        ]
      };
      axe.utils.publishMetaData(result);
      expect(result).toEqual({
        id: 'cats',
        help: 'cats-rule',
        tags: [],
        nodes: [
          {
            any: [
              {
                result: undefined,
                id: 'cats-ANY',
                message: 'Fallback message for no reason',
                data: {}
              }
            ],
            none: [
              {
                result: undefined,
                id: 'cats-NONE',
                message: 'Fallback message for no reason',
                data: {}
              }
            ],
            all: [
              {
                result: undefined,
                id: 'cats-ALL',
                message: 'Fallback message for no reason',
                data: {}
              }
            ]
          }
        ]
      });
    });

    it('should fall back to a generic message if incomplete object fails', () => {
      axe._load({
        rules: [],
        data: {
          incompleteFallbackMessage: 'Dogs are the best',
          rules: {
            cats: {
              help: 'cats-rule'
            }
          },
          checks: {
            'cats-NONE': {
              messages: {
                faiL: 'fail-NONE',
                pass: 'pass-NONE',
                incomplete: {}
              }
            },
            'cats-ANY': {
              messages: {
                faiL: 'fail-ANY',
                pass: 'pass-ANY',
                incomplete: {}
              }
            },
            'cats-ALL': {
              messages: {
                faiL: 'fail-ALL',
                pass: 'pass-ALL',
                incomplete: {}
              }
            }
          }
        }
      });

      let result = {
        id: 'cats',
        nodes: [
          {
            any: [
              {
                result: undefined,
                id: 'cats-ANY',
                data: {}
              }
            ],
            none: [
              {
                result: undefined,
                id: 'cats-NONE',
                data: {}
              }
            ],
            all: [
              {
                result: undefined,
                id: 'cats-ALL',
                data: {}
              }
            ]
          }
        ]
      };
      axe.utils.publishMetaData(result);
      expect(result).toEqual({
        id: 'cats',
        help: 'cats-rule',
        tags: [],
        nodes: [
          {
            any: [
              {
                result: undefined,
                id: 'cats-ANY',
                message: 'Dogs are the best',
                data: {}
              }
            ],
            none: [
              {
                result: undefined,
                id: 'cats-NONE',
                message: 'Dogs are the best',
                data: {}
              }
            ],
            all: [
              {
                result: undefined,
                id: 'cats-ALL',
                message: 'Dogs are the best',
                data: {}
              }
            ]
          }
        ]
      });
    });
  });

  it('should use fail message for rules with "reviewOnFaill: true"', () => {
    axe._load({
      rules: [
        {
          id: 'cats',
          reviewOnFail: true
        }
      ],
      data: {
        rules: {
          cats: {
            help: () => {
              return 'cats-rule';
            }
          }
        },
        checks: {
          'cats-NONE': {
            messages: {
              fail: () => {
                return 'fail-NONE';
              },
              pass: () => {
                return 'pass-NONE';
              }
            }
          },
          'cats-ANY': {
            messages: {
              fail: () => {
                return 'fail-ANY';
              },
              pass: () => {
                return 'pass-ANY';
              }
            }
          },
          'cats-ALL': {
            messages: {
              fail: () => {
                return 'fail-ALL';
              },
              pass: () => {
                return 'pass-ALL';
              }
            }
          }
        }
      }
    });

    let result = {
      id: 'cats',
      nodes: [
        {
          any: [
            {
              result: undefined,
              id: 'cats-ANY'
            }
          ],
          none: [
            {
              result: undefined,
              id: 'cats-NONE'
            }
          ],
          all: [
            {
              result: undefined,
              id: 'cats-ALL'
            }
          ]
        }
      ]
    };
    axe.utils.publishMetaData(result);
    expect(result.nodes).toEqual([
      {
        any: [
          {
            result: undefined,
            id: 'cats-ANY',
            message: 'fail-ANY'
          }
        ],
        none: [
          {
            result: undefined,
            id: 'cats-NONE',
            message: 'fail-NONE'
          }
        ],
        all: [
          {
            result: undefined,
            id: 'cats-ALL',
            message: 'fail-ALL'
          }
        ]
      }
    ]);
  });
});
