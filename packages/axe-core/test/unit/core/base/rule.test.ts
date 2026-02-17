import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('Rule', () => {
  const Rule = axe._thisWillBeDeletedDoNotUse.base.Rule;
  const Check = axe._thisWillBeDeletedDoNotUse.base.Check;
  const metadataFunctionMap =
    axe._thisWillBeDeletedDoNotUse.base.metadataFunctionMap;
  const fixture = document.getElementById('fixture');
  const { fixtureSetup, captureError } = axe.testUtils;
  const noop = () => {};
  const isNotCalled = err => {
    throw err || new Error('Reject should not be called');
  };

  afterEach(() => {
    fixture.innerHTML = '';
  });

  it('should accept two parameters', () => {
    expect(Rule).toHaveLength(2);
  });

  describe('prototype', () => {
    describe('gather', () => {
      it('should gather nodes which match the selector', () => {
        const node = document.createElement('div');
        node.id = 'monkeys';
        fixture.appendChild(node);

        const rule = new Rule({
          selector: '#monkeys'
        });
        let nodes = rule.gather({
          include: [axe.utils.getFlattenedTree(fixture)[0]],
          exclude: [],
          frames: []
        });

        expect(nodes).toHaveLength(1);
        expect(nodes[0].actualNode).toBe(node);

        node.id = 'bananas';
        nodes = rule.gather({
          include: [axe.utils.getFlattenedTree(fixture)[0]],
          exclude: [],
          frames: []
        });

        expect(nodes).toHaveLength(0);
      });

      it('should return a real array', () => {
        const rule = new Rule({
          selector: 'div'
        });
        const result = rule.gather({
          include: [axe.utils.getFlattenedTree(fixture)[0]],
          exclude: [],
          frames: []
        });

        expect(Array.isArray(result)).toBe(true);
      });

      it('should take a context parameter', () => {
        const node = document.createElement('div');
        fixture.appendChild(node);

        const rule = new Rule({
          selector: 'div'
        });
        const nodes = rule.gather({
          include: [
            axe.utils.getFlattenedTree(
              document.getElementById('fixture').firstChild
            )[0]
          ]
        });

        expect(
          nodes.map(n => {
            return n.actualNode;
          })
        ).toEqual([node]);
      });

      it('should default to all nodes if selector is not specified', () => {
        const nodes = [fixture];
        let node = document.createElement('div');

        fixture.appendChild(node);
        nodes.push(node);

        node = document.createElement('div');

        fixture.appendChild(node);
        nodes.push(node);

        const rule = new Rule({}),
          result = rule.gather({
            include: [
              axe.utils.getFlattenedTree(document.getElementById('fixture'))[0]
            ]
          });

        expect(result).toHaveLength(3);
        expect(
          result.map(n => {
            return n.actualNode;
          })
        ).toEqual(expect.arrayContaining(nodes));
        expect(nodes).toEqual(
          expect.arrayContaining(
            result.map(n => {
              return n.actualNode;
            })
          )
        );
      });
      it('should exclude hidden elements', () => {
        fixtureSetup('<div style="display: none"><span>HEHEHE</span></div>');

        const rule = new Rule({}),
          result = rule.gather({
            include: [
              axe.utils.getFlattenedTree(
                document.getElementById('fixture').firstChild
              )[0]
            ]
          });

        expect(result).toHaveLength(0);
      });
      it('should include hidden elements if excludeHidden is false', () => {
        fixtureSetup('<div style="display: none"></div>');

        const rule = new Rule({
          excludeHidden: false
        });
        const result = rule.gather({
          include: [
            axe.utils.getFlattenedTree(
              document.getElementById('fixture').firstChild
            )[0]
          ]
        });

        expect(
          result.map(n => {
            return n.actualNode;
          })
        ).toEqual([fixture.firstChild]);
      });
    });

    describe('run', () => {
      it('should run #matches', done => {
        const div = document.createElement('div');
        fixture.appendChild(div);
        let success = false;
        const rule = new Rule({
          matches: node => {
            expect(node).toBe(div);
            success = true;
            return [];
          }
        });

        rule.run(
          {
            include: [axe.utils.getFlattenedTree(div)[0]]
          },
          {},
          () => {
            expect(success).toBe(true);
            done();
          },
          isNotCalled
        );
      });

      it('should pass a virtualNode to #matches', done => {
        const div = document.createElement('div');
        fixture.appendChild(div);
        let success = false,
          rule = new Rule({
            matches: (node, virtualNode) => {
              expect(virtualNode.actualNode).toBe(div);
              success = true;
              return [];
            }
          });

        rule.run(
          {
            include: [axe.utils.getFlattenedTree(div)[0]]
          },
          {},
          () => {
            expect(success).toBe(true);
            done();
          },
          isNotCalled
        );
      });

      it('should pass a context to #matches', done => {
        const div = document.createElement('div');
        fixture.appendChild(div);
        let success = false,
          rule = new Rule({
            matches: (node, virtualNode, context) => {
              expect(context).toBeDefined();
              ['cssom', 'include', 'exclude'].forEach(k =>
                expect(context).toHaveProperty(k)
              );
              expect(context.include).toHaveLength(1);
              success = true;
              return [];
            }
          });

        rule.run(
          {
            include: [axe.utils.getFlattenedTree(div)[0]]
          },
          {},
          () => {
            expect(success).toBe(true);
            done();
          },
          isNotCalled
        );
      });

      it('should execute Check#run on its child checks - any', done => {
        fixtureSetup('<blink>Hi</blink>');
        let success = false;
        const rule = new Rule(
          {
            any: ['cats']
          },
          {
            checks: {
              cats: {
                run: (node, options, context, resolve) => {
                  success = true;
                  resolve(true);
                }
              }
            }
          }
        );

        rule.run(
          {
            include: [axe.utils.getFlattenedTree(fixture)[0]]
          },
          {},
          () => {
            expect(success).toBe(true);
            done();
          },
          isNotCalled
        );
      });

      it('should execute Check#run on its child checks - all', done => {
        fixtureSetup('<blink>Hi</blink>');
        let success = false;
        const rule = new Rule(
          {
            all: ['cats']
          },
          {
            checks: {
              cats: {
                run: (node, options, context, resolve) => {
                  success = true;
                  resolve(true);
                }
              }
            }
          }
        );

        rule.run(
          {
            include: [axe.utils.getFlattenedTree(fixture)[0]]
          },
          {},
          () => {
            expect(success).toBe(true);
            done();
          },
          isNotCalled
        );
      });

      it('should execute Check#run on its child checks - none', done => {
        fixtureSetup('<blink>Hi</blink>');
        let success = false;
        const rule = new Rule(
          {
            none: ['cats']
          },
          {
            checks: {
              cats: {
                run: (node, options, context, resolve) => {
                  success = true;
                  resolve(true);
                }
              }
            }
          },
          isNotCalled
        );

        rule.run(
          {
            include: [axe.utils.getFlattenedTree(fixture)[0]]
          },
          {},
          () => {
            expect(success).toBe(true);
            done();
          },
          isNotCalled
        );
      });

      it('should pass the matching option to check.run', done => {
        fixtureSetup('<blink>Hi</blink>');
        const options = {
          checks: {
            cats: {
              enabled: 'bananas',
              options: 'minkeys'
            }
          }
        };
        const rule = new Rule(
          {
            none: ['cats']
          },
          {
            checks: {
              cats: {
                id: 'cats',
                run: (node, opts, context, resolve) => {
                  expect(opts.enabled).toBe('bananas');
                  expect(opts.options).toBe('minkeys');
                  resolve(true);
                }
              }
            }
          }
        );
        rule.run(
          {
            include: [axe.utils.getFlattenedTree(document)[0]]
          },
          options,
          () => {
            done();
          },
          isNotCalled
        );
      });

      it('should pass the matching option to check.run defined on the rule over global', done => {
        fixtureSetup('<blink>Hi</blink>');
        const options = {
          rules: {
            cats: {
              checks: {
                cats: {
                  enabled: 'apples',
                  options: 'apes'
                }
              }
            }
          },
          checks: {
            cats: {
              enabled: 'bananas',
              options: 'minkeys'
            }
          }
        };

        const rule = new Rule(
          {
            id: 'cats',
            any: [
              {
                id: 'cats'
              }
            ]
          },
          {
            checks: {
              cats: {
                id: 'cats',
                run: (node, opts, context, resolve) => {
                  expect(opts.enabled).toBe('apples');
                  expect(opts.options).toBe('apes');
                  resolve(true);
                }
              }
            }
          }
        );
        rule.run(
          {
            include: [axe.utils.getFlattenedTree(document)[0]]
          },
          options,
          () => {
            done();
          },
          isNotCalled
        );
      });

      it('should filter out null results', () => {
        const rule = new Rule(
          {
            selector: '#fixture',
            any: ['cats']
          },
          {
            checks: {
              cats: {
                id: 'cats',
                run: () => {}
              }
            }
          }
        );
        rule.run(
          {
            include: [axe.utils.getFlattenedTree(document)[0]]
          },
          {},
          r => {
            expect(r.nodes).toHaveLength(0);
          },
          isNotCalled
        );
      });

      describe.skip('DqElement', () => {
        let origDqElement;
        let isDqElementCalled;

        beforeEach(() => {
          isDqElementCalled = false;
          origDqElement = axe.utils.DqElement;
          axe.utils.DqElement = () => {
            isDqElementCalled = true;
          };
          fixtureSetup('<blink>Hi</blink>');
        });

        afterEach(() => {
          axe.utils.DqElement = origDqElement;
        });

        it('is created for matching nodes', done => {
          const rule = new Rule(
            {
              all: ['cats']
            },
            {
              checks: {
                cats: new Check({
                  id: 'cats',
                  enabled: true,
                  evaluate: () => {
                    return true;
                  },
                  matches: () => {
                    return true;
                  }
                })
              }
            }
          );
          rule.run(
            {
              include: [axe.utils.getFlattenedTree(fixture)[0]]
            },
            {},
            () => {
              expect(isDqElementCalled).toBe(true);
              done();
            },
            isNotCalled
          );
        });

        it('is not created for disabled checks', done => {
          const rule = new Rule(
            {
              all: ['cats']
            },
            {
              checks: {
                cats: new Check({
                  id: 'cats',
                  enabled: false,
                  evaluate: () => {},
                  matches: () => {
                    return true;
                  }
                })
              }
            }
          );
          rule.run(
            {
              include: [axe.utils.getFlattenedTree(fixture)[0]]
            },
            {},
            () => {
              expect(isDqElementCalled).toBe(false);
              done();
            },
            isNotCalled
          );
        });

        it('is created for matching nodes', done => {
          const rule = new Rule(
            {
              all: ['cats']
            },
            {
              checks: {
                cats: new Check({
                  id: 'cats',
                  enabled: true,
                  evaluate: () => {
                    return true;
                  }
                })
              }
            }
          );
          rule.run(
            {
              include: [axe.utils.getFlattenedTree(fixture)[0]]
            },
            {},
            () => {
              expect(isDqElementCalled).toBe(true);
              done();
            },
            isNotCalled
          );
        });

        it('is not created for disabled checks', done => {
          const rule = new Rule(
            {
              all: ['cats']
            },
            {
              checks: {
                cats: new Check({
                  id: 'cats',
                  enabled: false,
                  evaluate: () => {}
                })
              }
            }
          );
          rule.run(
            {
              include: [axe.utils.getFlattenedTree(fixture)[0]]
            },
            {},
            () => {
              expect(isDqElementCalled).toBe(false);
              done();
            },
            isNotCalled
          );
        });
      });

      it('should pass thrown errors to the reject param', done => {
        fixtureSetup('<blink>Hi</blink>');
        const rule = new Rule(
          { none: ['cats'] },
          {
            checks: {
              cats: {
                run: () => {
                  throw new Error('Holy hand grenade');
                }
              }
            }
          }
        );

        rule.run(
          {
            include: [axe.utils.getFlattenedTree(fixture)[0]]
          },
          {},
          noop,
          err => {
            expect(err.message).toBe('Holy hand grenade');
            done();
          },
          isNotCalled
        );
      });

      it('should pass reject calls to the reject param', done => {
        fixtureSetup('<blink>Hi</blink>');
        const rule = new Rule(
          {
            none: ['cats']
          },
          {
            checks: {
              cats: {
                run: (nope, options, context, resolve, reject) => {
                  reject(new Error('your reality'));
                }
              }
            }
          }
        );

        rule.run(
          {
            include: [axe.utils.getFlattenedTree(fixture)[0]]
          },
          {},
          noop,
          err => {
            expect(err.message).toBe('your reality');
            done();
          },
          isNotCalled
        );
      });

      it('should mark checks as incomplete if reviewOnFail is set to true', done => {
        axe.setup();
        const rule = new Rule(
          {
            reviewOnFail: true,
            all: ['cats'],
            any: ['cats'],
            none: ['dogs']
          },
          {
            checks: {
              cats: new Check({
                id: 'cats',
                evaluate: () => {
                  return false;
                }
              }),
              dogs: new Check({
                id: 'dogs',
                evaluate: () => {
                  return true;
                }
              })
            }
          }
        );

        rule.run(
          {
            include: [axe.utils.getFlattenedTree(fixture)[0]]
          },
          {},
          results => {
            expect(results.nodes[0].all[0].result).toBeUndefined();
            expect(results.nodes[0].any[0].result).toBeUndefined();
            expect(results.nodes[0].none[0].result).toBeUndefined();
            done();
          },
          isNotCalled
        );
      });

      describe('error handling', () => {
        it('should return a RuleError if #matches throws', done => {
          const rule = new Rule({
            id: 'fizz',
            matches: () => {
              throw new Error('this is an error');
            }
          });
          axe.setup();
          rule.run(
            { include: [axe.utils.getFlattenedTree(fixture)[0]] },
            {},
            isNotCalled,
            captureError(err => {
              expect(err).toBeInstanceOf(axe.utils.RuleError);
              expect(err.message).toContain('this is an error');
              expect(err.ruleId).toBe('fizz');
              expect(err.method).toBe('#matches');
              expect(err.errorNode.selector).toEqual(['#fixture']);
              done();
            }, done)
          );
        });

        it('should return a RuleError if check.evaluate throws', done => {
          const rule = new Rule(
            { id: 'garden', any: ['plants'] },
            {
              checks: {
                plants: new Check({
                  id: 'plants',
                  enabled: true,
                  evaluate: () => {
                    throw new Error('zombies ate my pants');
                  }
                })
              }
            }
          );
          axe.setup();
          rule.run(
            { include: axe.utils.getFlattenedTree(fixture) },
            {},
            isNotCalled,
            captureError(err => {
              expect(err).toBeInstanceOf(axe.utils.RuleError);
              expect(err.message).toContain('zombies ate my pants');
              expect(err.ruleId).toBe('garden');
              expect(err.method).toBe('plants#evaluate');
              expect(err.errorNode.selector).toEqual(['#fixture']);
              done();
            }, done)
          );
        });
      });

      describe('NODE rule', () => {
        it('should create a RuleResult', () => {
          axe.setup();
          const orig = window.RuleResult;
          let success = false;
          window.RuleResult = r => {
            this.nodes = [];
            expect(rule).toBe(r);
            success = true;
          };

          const rule = new Rule(
            {
              any: [
                {
                  evaluate: () => {},
                  id: 'cats'
                }
              ]
            },
            {
              checks: {
                cats: {
                  run: (node, options, context, resolve) => {
                    success = true;
                    resolve(true);
                  }
                }
              }
            }
          );
          rule.run(
            {
              include: [axe.utils.getFlattenedTree(document)[0]]
            },
            {},
            noop,
            isNotCalled
          );
          expect(success).toBe(true);

          window.RuleResult = orig;
        });

        it('should execute rule callback', () => {
          axe.setup();
          let success = false;

          const rule = new Rule(
            {
              any: [
                {
                  evaluate: () => {},
                  id: 'cats'
                }
              ]
            },
            {
              checks: {
                cats: {
                  run: (node, options, context, resolve) => {
                    success = true;
                    resolve(true);
                  }
                }
              }
            }
          );
          rule.run(
            {
              include: [axe.utils.getFlattenedTree(document)[0]]
            },
            {},
            () => {
              success = true;
            },
            isNotCalled
          );
          expect(success).toBe(true);
        });
      });
    });

    describe('runSync', () => {
      it('should run #matches', () => {
        const div = document.createElement('div');
        fixture.appendChild(div);
        let success = false;
        const rule = new Rule({
          matches: node => {
            expect(node).toBe(div);
            success = true;
            return [];
          }
        });

        try {
          rule.runSync(
            {
              include: [axe.utils.getFlattenedTree(div)[0]]
            },
            {}
          );
          expect(success).toBe(true);
        } catch (err) {
          isNotCalled(err);
        }
      });

      it('should pass a virtualNode to #matches', () => {
        const div = document.createElement('div');
        fixture.appendChild(div);
        let success = false;
        const rule = new Rule({
          matches: (node, virtualNode) => {
            expect(virtualNode.actualNode).toBe(div);
            success = true;
            return [];
          }
        });

        try {
          rule.runSync(
            {
              include: [axe.utils.getFlattenedTree(div)[0]]
            },
            {}
          );
          expect(success).toBe(true);
        } catch (err) {
          isNotCalled(err);
        }
      });

      it('should pass a context to #matches', () => {
        const div = document.createElement('div');
        fixture.appendChild(div);
        let success = false;
        const rule = new Rule({
          matches: (node, virtualNode, context) => {
            expect(context).toBeDefined();
            ['cssom', 'include', 'exclude'].forEach(k =>
              expect(context).toHaveProperty(k)
            );
            expect(context.include).toHaveLength(1);
            success = true;
            return [];
          }
        });

        try {
          rule.runSync(
            {
              include: [axe.utils.getFlattenedTree(div)[0]]
            },
            {}
          );
          expect(success).toBe(true);
        } catch (err) {
          isNotCalled(err);
        }
      });

      it('should handle an error in #matches', () => {
        const div = document.createElement('div');
        div.setAttribute('style', '#fff');
        fixture.appendChild(div);
        let success = false;
        const rule = new Rule({
          matches: () => {
            throw new Error('this is an error');
          }
        });

        try {
          rule.runSync(
            {
              include: [axe.utils.getFlattenedTree(div)[0]]
            },
            {}
          );
          isNotCalled();
        } catch {
          expect(success).toBe(false);
        }
      });

      it('should execute Check#runSync on its child checks - any', () => {
        fixtureSetup('<blink>Hi</blink>');
        let success = false;
        const rule = new Rule(
          {
            any: ['cats']
          },
          {
            checks: {
              cats: {
                runSync: () => {
                  success = true;
                }
              }
            }
          }
        );

        try {
          rule.runSync(
            {
              include: [axe.utils.getFlattenedTree(fixture)[0]]
            },
            {}
          );
          expect(success).toBe(true);
        } catch (err) {
          isNotCalled(err);
        }
      });

      it('should execute Check#runSync on its child checks - all', () => {
        fixtureSetup('<blink>Hi</blink>');
        let success = false;
        const rule = new Rule(
          {
            all: ['cats']
          },
          {
            checks: {
              cats: {
                runSync: () => {
                  success = true;
                }
              }
            }
          }
        );

        try {
          rule.runSync(
            {
              include: [axe.utils.getFlattenedTree(fixture)[0]]
            },
            {}
          );
          expect(success).toBe(true);
        } catch (err) {
          isNotCalled(err);
        }
      });

      it('should execute Check#run on its child checks - none', () => {
        fixtureSetup('<blink>Hi</blink>');
        let success = false;
        const rule = new Rule(
          {
            none: ['cats']
          },
          {
            checks: {
              cats: {
                runSync: () => {
                  success = true;
                }
              }
            }
          },
          isNotCalled
        );

        try {
          rule.runSync(
            {
              include: [axe.utils.getFlattenedTree(fixture)[0]]
            },
            {}
          );
          expect(success).toBe(true);
        } catch (err) {
          isNotCalled(err);
        }
      });

      it('should pass the matching option to check.runSync', () => {
        fixtureSetup('<blink>Hi</blink>');
        const options = {
          checks: {
            cats: {
              enabled: 'bananas',
              options: 'minkeys'
            }
          }
        };
        const rule = new Rule(
          {
            none: ['cats']
          },
          {
            checks: {
              cats: {
                id: 'cats',
                runSync: (node, opts) => {
                  expect(opts.enabled).toBe('bananas');
                  expect(opts.options).toBe('minkeys');
                }
              }
            }
          }
        );

        try {
          rule.runSync(
            {
              include: [axe.utils.getFlattenedTree(document)[0]]
            },
            options
          );
        } catch (err) {
          isNotCalled(err);
        }
      });

      it('should pass the matching option to check.runSync defined on the rule over global', () => {
        fixtureSetup('<blink>Hi</blink>');
        const options = {
          rules: {
            cats: {
              checks: {
                cats: {
                  enabled: 'apples',
                  options: 'apes'
                }
              }
            }
          },
          checks: {
            cats: {
              enabled: 'bananas',
              options: 'minkeys'
            }
          }
        };

        const rule = new Rule(
          {
            id: 'cats',
            any: [
              {
                id: 'cats'
              }
            ]
          },
          {
            checks: {
              cats: {
                id: 'cats',
                runSync: (node, opts) => {
                  expect(opts.enabled).toBe('apples');
                  expect(opts.options).toBe('apes');
                }
              }
            }
          }
        );

        try {
          rule.runSync(
            {
              include: [axe.utils.getFlattenedTree(document)[0]]
            },
            options
          );
        } catch (err) {
          isNotCalled(err);
        }
      });

      it('should filter out null results', () => {
        const rule = new Rule(
          {
            selector: '#fixture',
            any: ['cats']
          },
          {
            checks: {
              cats: {
                id: 'cats',
                runSync: () => {}
              }
            }
          }
        );

        try {
          const r = rule.runSync(
            {
              include: [axe.utils.getFlattenedTree(document)[0]]
            },
            {}
          );
          expect(r.nodes).toHaveLength(0);
        } catch (err) {
          isNotCalled(err);
        }
      });

      describe.skip('DqElement', () => {
        let origDqElement;
        let isDqElementCalled;

        beforeEach(() => {
          isDqElementCalled = false;
          origDqElement = axe.utils.DqElement;
          axe.utils.DqElement = () => {
            isDqElementCalled = true;
          };
          fixtureSetup('<blink>Hi</blink>');
        });

        afterEach(() => {
          axe.utils.DqElement = origDqElement;
        });

        it('is created for matching nodes', () => {
          const rule = new Rule(
            {
              all: ['cats']
            },
            {
              checks: {
                cats: new Check({
                  id: 'cats',
                  enabled: true,
                  evaluate: () => {
                    return true;
                  },
                  matches: () => {
                    return true;
                  }
                })
              }
            }
          );

          try {
            rule.runSync(
              {
                include: [axe.utils.getFlattenedTree(fixture)[0]]
              },
              {}
            );
            expect(isDqElementCalled).toBe(true);
          } catch (err) {
            isNotCalled(err);
          }
        });

        it('is not created for disabled checks', () => {
          const rule = new Rule(
            {
              all: ['cats']
            },
            {
              checks: {
                cats: new Check({
                  id: 'cats',
                  enabled: false,
                  evaluate: () => {},
                  matches: () => {
                    return true;
                  }
                })
              }
            }
          );

          try {
            rule.runSync(
              {
                include: [axe.utils.getFlattenedTree(fixture)[0]]
              },
              {}
            );
            expect(isDqElementCalled).toBe(false);
          } catch (err) {
            isNotCalled(err);
          }
        });

        it('is created for matching nodes', () => {
          const rule = new Rule(
            {
              all: ['cats']
            },
            {
              checks: {
                cats: new Check({
                  id: 'cats',
                  enabled: true,
                  evaluate: () => {
                    return true;
                  }
                })
              }
            }
          );

          try {
            rule.runSync(
              {
                include: [axe.utils.getFlattenedTree(fixture)[0]]
              },
              {}
            );
            expect(isDqElementCalled).toBe(true);
          } catch (err) {
            isNotCalled(err);
          }
        });

        it('is not created for disabled checks', () => {
          const rule = new Rule(
            {
              all: ['cats']
            },
            {
              checks: {
                cats: new Check({
                  id: 'cats',
                  enabled: false,
                  evaluate: () => {}
                })
              }
            }
          );
          rule.runSync(
            {
              include: [axe.utils.getFlattenedTree(fixture)[0]]
            },
            {},
            () => {
              expect(isDqElementCalled).toBe(false);
            },
            isNotCalled
          );
        });

        it('should not be called when there is no actualNode', () => {
          const rule = new Rule(
            {
              all: ['cats']
            },
            {
              checks: {
                cats: new Check({
                  id: 'cats',
                  evaluate: () => {}
                })
              }
            }
          );
          rule.excludeHidden = false; // so we don't call utils.isHidden
          const vNode = {
            shadowId: undefined,
            children: [],
            parent: undefined,
            _cache: {},
            _isHidden: null,
            _attrs: {
              type: 'text',
              autocomplete: 'not-on-my-watch'
            },
            props: {
              nodeType: 1,
              nodeName: 'input',
              id: null,
              type: 'text'
            },
            hasClass: () => {
              return false;
            },
            attr: attrName => {
              return this._attrs[attrName];
            },
            hasAttr: attrName => {
              return !!this._attrs[attrName];
            }
          };
          rule.runSync(
            {
              include: [vNode]
            },
            {},
            () => {
              expect(isDqElementCalled).toBe(false);
            },
            isNotCalled
          );
        });
      });

      it('should pass thrown errors to the reject param', () => {
        fixtureSetup('<blink>Hi</blink>');
        const rule = new Rule(
          {
            none: ['cats']
          },
          {
            checks: {
              cats: {
                runSync: () => {
                  throw new Error('Holy hand grenade');
                }
              }
            }
          }
        );

        try {
          rule.runSync(
            {
              include: [axe.utils.getFlattenedTree(fixture)[0]]
            },
            {}
          );
          isNotCalled();
        } catch (err) {
          expect(err.message).toBe('Holy hand grenade');
        }
      });

      it('should mark checks as incomplete if reviewOnFail is set to true', () => {
        axe.setup();
        const rule = new Rule(
          {
            reviewOnFail: true,
            all: ['cats'],
            any: ['cats'],
            none: ['dogs']
          },
          {
            checks: {
              cats: new Check({
                id: 'cats',
                evaluate: () => {
                  return false;
                }
              }),
              dogs: new Check({
                id: 'dogs',
                evaluate: () => {
                  return true;
                }
              })
            }
          }
        );

        const results = rule.runSync(
          {
            include: [axe.utils.getFlattenedTree(fixture)[0]]
          },
          {}
        );

        expect(results.nodes[0].all[0].result).toBeUndefined();
        expect(results.nodes[0].any[0].result).toBeUndefined();
        expect(results.nodes[0].none[0].result).toBeUndefined();
      });

      describe.skip('NODE rule', () => {
        it('should create a RuleResult', () => {
          const orig = window.RuleResult;
          let success = false;
          window.RuleResult = r => {
            this.nodes = [];
            expect(rule).toBe(r);
            success = true;
          };

          const rule = new Rule(
            {
              any: [
                {
                  evaluate: () => {},
                  id: 'cats'
                }
              ]
            },
            {
              checks: {
                cats: {
                  runSync: () => {}
                }
              }
            }
          );

          try {
            rule.runSync(
              {
                include: [axe.utils.getFlattenedTree(document)[0]]
              },
              {}
            );
            expect(success).toBe(true);
          } catch (err) {
            isNotCalled(err);
          }

          window.RuleResult = orig;
        });

        it('should execute rule callback', () => {
          let success = false;

          const rule = new Rule(
            {
              any: [
                {
                  evaluate: () => {},
                  id: 'cats'
                }
              ]
            },
            {
              checks: {
                cats: {
                  runSync: () => {
                    success = true;
                  }
                }
              }
            }
          );

          try {
            rule.runSync(
              {
                include: [axe.utils.getFlattenedTree(document)[0]]
              },
              {}
            );
          } catch (err) {
            isNotCalled(err);
          }

          expect(success).toBe(true);
        });
      });
    });

    describe('after', () => {
      it('should execute Check#after with options', () => {
        let success = false;

        const rule = new Rule(
          {
            id: 'cats',
            any: ['cats']
          },
          {
            checks: {
              cats: {
                id: 'cats',
                enabled: true,
                after: (results, options) => {
                  expect(options).toEqual({ dogs: true });
                  success = true;
                  return results;
                }
              }
            }
          }
        );

        rule.after(
          {
            id: 'cats',
            nodes: [
              {
                all: [],
                none: [],
                any: [
                  {
                    id: 'cats',
                    result: true
                  }
                ]
              }
            ]
          },
          { checks: { cats: { options: { dogs: true } } } }
        );

        expect(success).toBe(true);
      });

      it('should add the check node to the check result', () => {
        let success = false;

        const rule = new Rule(
          {
            id: 'cats',
            any: ['cats']
          },
          {
            checks: {
              cats: {
                id: 'cats',
                enabled: true,
                after: results => {
                  expect(results[0].node).toBe('customNode');
                  success = true;
                  return results;
                }
              }
            }
          }
        );

        rule.after(
          {
            id: 'cats',
            nodes: [
              {
                all: [],
                none: [],
                any: [
                  {
                    id: 'cats',
                    result: true
                  }
                ],
                node: 'customNode'
              }
            ]
          },
          { checks: { cats: { options: { dogs: true } } } }
        );

        expect(success).toBe(true);
      });

      it('should filter removed checks', () => {
        const rule = new Rule(
          {
            id: 'cats',
            any: ['cats']
          },
          {
            checks: {
              cats: {
                id: 'cats',
                after: results => {
                  return [results[0]];
                }
              }
            }
          }
        );

        const result = rule.after(
          {
            id: 'cats',
            nodes: [
              {
                any: [],
                none: [],
                all: [
                  {
                    id: 'cats',
                    result: true
                  }
                ]
              },
              {
                any: [],
                none: [],
                all: [
                  {
                    id: 'cats',
                    result: false
                  }
                ]
              }
            ]
          },
          { checks: { cats: { options: { dogs: true } } } }
        );

        expect(result.nodes).toHaveLength(1);
        expect(result.nodes[0].all[0].id).toBe('cats');
        expect(result.nodes[0].all[0].result).toBe(true);
      });

      it('should combine all checks for pageLevel rules', () => {
        const rule = new Rule({});

        const result = rule.after(
          {
            id: 'cats',
            pageLevel: true,
            nodes: [
              {
                any: [],
                none: [],
                all: [
                  {
                    id: 'cats',
                    result: false
                  }
                ]
              },
              {
                any: [],
                none: [
                  {
                    id: 'dogs',
                    result: false
                  }
                ],
                all: []
              },
              {
                any: [
                  {
                    id: 'monkeys',
                    result: false
                  }
                ],
                none: [],
                all: []
              }
            ]
          },
          { checks: { cats: { options: { dogs: true } } } }
        );

        expect(result.nodes).toHaveLength(1);
      });

      it('should throw a RuleError if check.after throws', () => {
        const rule = new Rule(
          { id: 'dogs', any: ['cats'] },
          {
            checks: {
              cats: {
                id: 'cats',
                enabled: true,
                after: () => {
                  throw new Error('this is an error');
                }
              }
            }
          }
        );
        axe.setup();
        try {
          rule.after(
            {
              id: 'cats',
              nodes: [
                {
                  all: [],
                  none: [],
                  any: [{ id: 'cats', result: true }],
                  node: new axe.utils.DqElement(fixture)
                }
              ]
            },
            {}
          );
          expect(true).toBe(false) /* 'Should have thrown' */;
        } catch (err) {
          expect(err).toBeInstanceOf(axe.utils.RuleError);
          expect(err.message).toContain('this is an error');
          expect(err.ruleId).toBe('dogs');
          expect(err.method).toBe('cats#after');
          expect(err.errorNode.selector).toEqual(['#fixture']);
        }
      });
    });

    describe('reviewOnFail', () => {
      it('should mark checks as incomplete if reviewOnFail is set to true for all', () => {
        axe.setup();
        const rule = new Rule(
          {
            id: 'cats',
            reviewOnFail: true,
            all: ['cats'],
            any: [],
            none: []
          },
          {
            checks: {
              cats: new Check({
                id: 'cats',
                enabled: true,
                after: results => {
                  results[0].result = false;
                  return results;
                }
              })
            }
          }
        );

        const result = rule.after(
          {
            id: 'cats',
            nodes: [
              {
                any: [],
                none: [],
                all: [
                  {
                    id: 'cats',
                    result: true
                  }
                ]
              }
            ]
          },
          { checks: { cats: { options: {} } } }
        );

        expect(result.nodes[0].any).toHaveLength(0);
        expect(result.nodes[0].none).toHaveLength(0);
        expect(result.nodes[0].all[0].result).toBeUndefined();
      });

      it('should mark checks as incomplete if reviewOnFail is set to true for any', () => {
        const rule = new Rule(
          {
            id: 'cats',
            reviewOnFail: true,
            all: [],
            any: ['cats'],
            none: []
          },
          {
            checks: {
              cats: new Check({
                id: 'cats',
                enabled: true,
                after: results => {
                  results[0].result = false;
                  return results;
                }
              })
            }
          }
        );

        const result = rule.after(
          {
            id: 'cats',
            nodes: [
              {
                any: [
                  {
                    id: 'cats',
                    result: true
                  }
                ],
                none: [],
                all: []
              }
            ]
          },
          { checks: { cats: { options: {} } } }
        );

        expect(result.nodes[0].any[0].result).toBeUndefined();
        expect(result.nodes[0].none).toHaveLength(0);
        expect(result.nodes[0].all).toHaveLength(0);
      });

      it('should mark checks as incomplete if reviewOnFail is set to true for none', () => {
        const rule = new Rule(
          {
            id: 'cats',
            reviewOnFail: true,
            all: [],
            any: [],
            none: ['cats']
          },
          {
            checks: {
              cats: new Check({
                id: 'cats',
                enabled: true,
                after: results => {
                  results[0].result = true;
                  return results;
                }
              })
            }
          }
        );

        const result = rule.after(
          {
            id: 'cats',
            nodes: [
              {
                any: [],
                none: [
                  {
                    id: 'cats',
                    result: false
                  }
                ],
                all: []
              }
            ]
          },
          { checks: { cats: { options: {} } } }
        );

        expect(result.nodes[0].any).toHaveLength(0);
        expect(result.nodes[0].none[0].result).toBeUndefined();
        expect(result.nodes[0].all).toHaveLength(0);
      });
    });
  });

  describe('spec object', () => {
    describe('.selector', () => {
      it('should be set', () => {
        const spec = {
          selector: '#monkeys'
        };
        expect(new Rule(spec).selector).toBe(spec.selector);
      });

      it('should default to *', () => {
        const spec = {};
        expect(new Rule(spec).selector).toBe('*');
      });
    });

    describe('.enabled', () => {
      it('should be set', () => {
        const spec = {
          enabled: false
        };
        expect(new Rule(spec).enabled).toBe(spec.enabled);
      });

      it('should default to true', () => {
        const spec = {};
        expect(new Rule(spec).enabled).toBe(true);
      });

      it('should default to true if given a bad value', () => {
        const spec = {
          enabled: 'monkeys'
        };
        expect(new Rule(spec).enabled).toBe(true);
      });
    });

    describe('.excludeHidden', () => {
      it('should be set', () => {
        const spec = {
          excludeHidden: false
        };
        expect(new Rule(spec).excludeHidden).toBe(spec.excludeHidden);
      });

      it('should default to true', () => {
        const spec = {};
        expect(new Rule(spec).excludeHidden).toBe(true);
      });

      it('should default to true if given a bad value', () => {
        const spec = {
          excludeHidden: 'monkeys'
        };
        expect(new Rule(spec).excludeHidden).toBe(true);
      });
    });

    describe('.pageLevel', () => {
      it('should be set', () => {
        const spec = {
          pageLevel: false
        };
        expect(new Rule(spec).pageLevel).toBe(spec.pageLevel);
      });

      it('should default to false', () => {
        const spec = {};
        expect(new Rule(spec).pageLevel).toBe(false);
      });

      it('should default to false if given a bad value', () => {
        const spec = {
          pageLevel: 'monkeys'
        };
        expect(new Rule(spec).pageLevel).toBe(false);
      });
    });

    describe('.reviewOnFail', () => {
      it('should be set', () => {
        const spec = {
          reviewOnFail: true
        };
        expect(new Rule(spec).reviewOnFail).toBe(spec.reviewOnFail);
      });

      it('should default to false', () => {
        const spec = {};
        expect(new Rule(spec).reviewOnFail).toBe(false);
      });

      it('should default to false if given a bad value', () => {
        const spec = {
          reviewOnFail: 'monkeys'
        };
        expect(new Rule(spec).reviewOnFail).toBe(false);
      });
    });

    describe('.id', () => {
      it('should be set', () => {
        const spec = {
          id: 'monkeys'
        };
        expect(new Rule(spec).id).toBe(spec.id);
      });

      it('should have no default', () => {
        const spec = {};
        expect(new Rule(spec).id).toBe(spec.id);
      });
    });

    describe('.impact', () => {
      it('should be set', () => {
        const spec = {
          impact: 'critical'
        };
        expect(new Rule(spec).impact).toBe(spec.impact);
      });

      it('should have no default', () => {
        const spec = {};
        expect(new Rule(spec).impact).toBeUndefined();
      });

      it('throws if impact is invalid', () => {
        expect(() => {
          // eslint-disable-next-line no-new
          new Rule({ impact: 'hello' });
        }).toThrow();
      });
    });

    describe('.any', () => {
      it('should be set', () => {
        const spec = {
          any: [
            {
              name: 'monkeys'
            },
            {
              name: 'bananas'
            },
            {
              name: 'pajamas'
            }
          ]
        };
        expect(new Rule(spec)).toHaveProperty('any');
      });
    });

    describe('.all', () => {
      it('should be set', () => {
        const spec = {
          all: [
            {
              name: 'monkeys'
            },
            {
              name: 'bananas'
            },
            {
              name: 'pajamas'
            }
          ]
        };
        expect(new Rule(spec)).toHaveProperty('all');
      });
    });

    describe('.none', () => {
      it('should be set', () => {
        const spec = {
          none: [
            {
              name: 'monkeys'
            },
            {
              name: 'bananas'
            },
            {
              name: 'pajamas'
            }
          ]
        };
        expect(new Rule(spec)).toHaveProperty('none');
      });
    });

    describe('.matches', () => {
      it('should be set', () => {
        const spec = {
          matches: () => {}
        };
        expect(new Rule(spec).matches).toBe(spec.matches);
      });

      it('should default to prototype', () => {
        const spec = {};
        expect(new Rule(spec).matches).toBe(Rule.prototype.matches);
      });

      it('should turn a string into a function', () => {
        const spec = {
          matches: '() => {return "blah";}'
        };
        expect(new Rule(spec).matches()).toBe('blah');
      });
    });

    describe('.tags', () => {
      it('should be set', () => {
        const spec = {
          tags: ['foo', 'bar']
        };
        expect(new Rule(spec).tags).toEqual(spec.tags);
      });

      it('should default to empty array', () => {
        const spec = {};
        expect(new Rule(spec).tags).toEqual([]);
      });
    });

    describe('.actIds', () => {
      it('should be set', () => {
        const spec = {
          actIds: ['abc123', 'xyz789']
        };
        expect(new Rule(spec).actIds).toEqual(spec.actIds);
      });

      it('should default to undefined', () => {
        const spec = {};
        expect(new Rule(spec).actIds).toBeUndefined();
      });
    });
  });

  describe('configure', () => {
    beforeEach(() => {
      Rule.prototype._get = attr => {
        return this[attr];
      };
    });
    afterEach(() => {
      delete Rule.prototype._get;
    });
    it('should be a function that takes one argument', () => {
      expect(typeof Rule.prototype.configure).toBe('function');
      expect(new Rule({}).configure).toHaveLength(1);
    });
    it('should NOT override the id', () => {
      const rule = new Rule({ id: 'foo' });

      expect(rule._get('id')).toBe('foo');
      rule.configure({ id: 'fong' });
      expect(rule._get('id')).toBe('foo');
    });
    it('should NOT override a random property', () => {
      const rule = new Rule({ id: 'foo' });

      rule.configure({ fong: 'fong' });
      expect(rule._get('fong')).toBe(undefined);
    });
    it('should override the selector', () => {
      const rule = new Rule({ selector: 'foo' });

      expect(rule._get('selector')).toBe('foo');
      rule.configure({ selector: 'fong' });
      expect(rule._get('selector')).toBe('fong');
    });
    it('should override excludeHidden', () => {
      const rule = new Rule({ excludeHidden: false });

      expect(rule._get('excludeHidden')).toBe(false);
      rule.configure({ excludeHidden: true });
      expect(rule._get('excludeHidden')).toBe(true);
    });
    it('should override enabled', () => {
      const rule = new Rule({ enabled: false });

      expect(rule._get('enabled')).toBe(false);
      rule.configure({ enabled: true });
      expect(rule._get('enabled')).toBe(true);
    });
    it('should override pageLevel', () => {
      const rule = new Rule({ pageLevel: false });

      expect(rule._get('pageLevel')).toBe(false);
      rule.configure({ pageLevel: true });
      expect(rule._get('pageLevel')).toBe(true);
    });
    it('should override reviewOnFail', () => {
      const rule = new Rule({ reviewOnFail: false });

      expect(rule._get('reviewOnFail')).toBe(false);
      rule.configure({ reviewOnFail: true });
      expect(rule._get('reviewOnFail')).toBe(true);
    });
    it('should override any', () => {
      const rule = new Rule({ any: ['one', 'two'] });

      expect(rule._get('any')).toEqual(['one', 'two']);
      rule.configure({ any: [] });
      expect(rule._get('any')).toEqual([]);
    });
    it('should override all', () => {
      const rule = new Rule({ all: ['one', 'two'] });

      expect(rule._get('all')).toEqual(['one', 'two']);
      rule.configure({ all: [] });
      expect(rule._get('all')).toEqual([]);
    });
    it('should override none', () => {
      const rule = new Rule({ none: ['none', 'two'] });

      expect(rule._get('none')).toEqual(['none', 'two']);
      rule.configure({ none: [] });
      expect(rule._get('none')).toEqual([]);
    });
    it('should override tags', () => {
      const rule = new Rule({ tags: ['tags', 'two'] });

      expect(rule._get('tags')).toEqual(['tags', 'two']);
      rule.configure({ tags: [] });
      expect(rule._get('tags')).toEqual([]);
    });
    it('should override matches (doT.js function)', () => {
      const rule = new Rule({ matches: '() => {return "matches";}' });

      expect(rule._get('matches')()).toBe('matches');
      rule.configure({ matches: '() => {return "does not match";}' });
      expect(rule._get('matches')()).toBe('does not match');
    });
    it('should override matches (metadata function name)', () => {
      axe._load({});
      metadataFunctionMap['custom-matches'] = () => {
        return 'custom-matches';
      };
      metadataFunctionMap['other-matches'] = () => {
        return 'other-matches';
      };

      const rule = new Rule({ matches: 'custom-matches' });

      expect(rule._get('matches')()).toBe('custom-matches');
      rule.configure({ matches: 'other-matches' });
      expect(rule._get('matches')()).toBe('other-matches');

      delete metadataFunctionMap['custom-matches'];
      delete metadataFunctionMap['other-matches'];
    });
    it('should error if matches does not match an ID', () => {
      function fn() {
        const rule = new Rule({});
        rule.configure({ matches: 'does-not-exist' });
      }

      expect(fn).toThrow(
        'Function ID does not exist in the metadata-function-map: does-not-exist'
      );
    });
    it('should override impact', () => {
      const rule = new Rule({ impact: 'minor' });

      expect(rule._get('impact')).toBe('minor');
      rule.configure({ impact: 'serious' });
      expect(rule._get('impact')).toBe('serious');
    });
    it('should throw if impact impact', () => {
      const rule = new Rule({ impact: 'minor' });

      expect(() => {
        rule.configure({ impact: 'hello' });
      }).toThrow();
    });
  });
});
