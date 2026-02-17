import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
/*eslint no-new:0*/
describe('Context', () => {
  const { Context } = axe._thisWillBeDeletedDoNotUse.base;
  const { createNestedShadowDom } = axe.testUtils;
  const fixture = document.getElementById('fixture');

  function $id(id) {
    return document.getElementById(id);
  }
  const selectors = elms =>
    elms.map(elm => {
      const domNode = elm?.actualNode || elm;
      return domNode.id ? `#${domNode.id}` : domNode.nodeName.toLowerCase();
    });

  it('should not mutate exclude in input', () => {
    fixture.innerHTML = '<div id="foo"></div>';
    const context = { exclude: [['iframe', '#foo']] };

    new Context(context);
    expect(context).toEqual({ exclude: [['iframe', '#foo']] });
  });

  it('should not mutate its include input', () => {
    fixture.innerHTML = '<div id="foo"></div>';
    const context = { include: [['#foo']] };

    new Context(context);
    expect(context).toEqual({ include: [['#foo']] });
  });

  it('should not share memory with complex object', () => {
    fixture.innerHTML = '<div id="foo"><a href="">Click me</a></div>';
    const spec = {
      include: [['#foo'], ['a']],
      exclude: [['iframe', '#foo2']],
      size: { width: 100, height: 100 }
    };
    const context = new Context(spec);
    expect(spec.include).not.toBe(context.include);
    spec.include.forEach((_, index) => {
      expect(spec.include[index]).not.toBe(context.include[index]);
    });
    expect(spec.exclude).not.toBe(context.exclude);
    spec.exclude.forEach((_, index) => {
      expect(spec.exclude[index]).not.toBe(context.exclude[index]);
    });
    expect(spec.size).not.toBe(context.size);
  });

  it('should not share memory with simple array', () => {
    fixture.innerHTML = '<div id="foo"></div>';
    const spec = [['#foo']];
    const context = new Context(spec);
    expect(spec).not.toBe(context.include);
  });

  describe('include', () => {
    it('accepts a single selector', () => {
      fixture.innerHTML = '<div id="foo"></div>';
      const result = new Context('#foo');
      expect(selectors(result.include)).toEqual(['#foo']);
      expect(result.exclude).toHaveLength(0);
    });

    it('accepts frame selectors', () => {
      fixture.innerHTML = '<div id="foo"><div id="bar"></div></div>';
      const result = new Context([['#foo'], ['#bar']]);
      expect(selectors(result.include)).toEqual(['#foo', '#bar']);
      expect(result.exclude).toHaveLength(0);
    });

    it('accepts an array of strings as selectors', () => {
      fixture.innerHTML = '<div id="foo"><div id="bar"></div></div>';
      const context = new Context(['#foo', '#bar']);
      expect(selectors(context.include)).toEqual(['#foo', '#bar']);
      expect(context.exclude).toHaveLength(0);
    });

    it('accepts a node reference', () => {
      const div = document.createElement('div');
      fixture.appendChild(div);
      const result = new Context(div);
      expect([result.include[0].actualNode]).toEqual([div]);
    });

    it('does not match shadow DOM nodes with light DOM selection', () => {
      createNestedShadowDom(
        fixture,
        `<p id="p1">Light DOM</p>
        <article id="shadowHost">
          <p id="p2">Slotted light DOM</p>
        </article>`,
        `<section id="shadowHost"> <slot /> </section>
        <p id="p3">Shadow DOM</p>`
      );
      const result = new Context([[['p']]]);
      expect(selectors(result.include)).toEqual(['#p1', '#p2']);
    });

    it('accepts shadow DOM selectors', () => {
      createNestedShadowDom(
        fixture,
        '<article id="shadowHost"></article>',
        '<div><section id="shadowHost"></section></div>',
        '<h1 id="target">Hello world</h1>'
      );
      const result = new Context([[['#fixture > article', 'section', 'h1']]]);
      expect(result.include[0].props.id).toBe('target');
    });

    it('accepts a reference to a ShadowRoot', () => {
      createNestedShadowDom(
        fixture,
        '<article id="shadowHost"></article>',
        `<h1 id="h1">Heading</h1>
				<p id="p">Content</p>`
      );
      const shadowHost = fixture.querySelector('#shadowHost');
      const shadowRoot = shadowHost.shadowRoot;
      const result = new Context(shadowRoot);
      expect(selectors(result.include)).toEqual(['#h1', '#p']);
    });

    it('accepts a node reference consisting of nested divs', () => {
      const div1 = document.createElement('div');
      const div2 = document.createElement('div');
      div1.appendChild(div2);
      fixture.appendChild(div1);

      const result = new Context(div1);
      expect([result.include[0].actualNode]).toEqual([div1]);
    });

    it('accepts a node reference consisting of a form with nested controls', () => {
      const form = document.createElement('form');
      const input = document.createElement('input');

      form.appendChild(input);
      fixture.appendChild(form);

      const result = new Context(form);
      expect(result.include[0].actualNode).toEqual(form);
    });

    it('accepts an array of node references', () => {
      fixture.innerHTML = '<div id="foo"><div id="bar"></div></div>';
      const result = new Context([$id('foo'), $id('bar')]);
      expect([
        result.include[0].actualNode,
        result.include[1].actualNode
      ]).toEqual([$id('foo'), $id('bar')]);
    });

    it('removes any non-matched reference', () => {
      fixture.innerHTML = '<div id="foo"><div id="bar"></div></div>';
      const result = new Context([['#foo'], ['#baz'], ['#bar']]);
      expect(selectors(result.include)).toEqual(['#foo', '#bar']);
    });

    it('sorts the include nodes in document order', () => {
      fixture.innerHTML =
        '<div id="foo"><div id="bar"></div></div><div id="baz"></div>';
      const result = new Context([['#foo'], ['#baz'], ['#bar']]);
      expect(selectors(result.include)).toEqual(['#foo', '#bar', '#baz']);
    });

    it('removes any null reference', () => {
      fixture.innerHTML = '<div id="foo"><div id="bar"></div></div>';
      const result = new Context([$id('foo'), $id('bar'), null]);
      expect(selectors(result.include)).toEqual(['#foo', '#bar']);
    });

    it('accepts an array of mixed selectors and nodes', () => {
      fixture.innerHTML = '<div id="foo"><div id="bar"></div></div>';
      const div = document.createElement('div');
      div.id = 'baz';
      fixture.appendChild(div);

      const result = new Context([['#foo'], '#bar', div]);
      expect(selectors(result.include)).toEqual(['#foo', '#bar', '#baz']);
    });

    it('accepts jQuery-like objects', () => {
      fixture.innerHTML =
        '<div id="foo"></div><div id="bar"></div><div id="baz"></div>';
      const $test = {
        0: $id('foo'),
        1: $id('bar'),
        2: $id('baz'),
        length: 3
      };

      const result = new Context($test);
      expect(selectors(result.include)).toEqual(['#foo', '#bar', '#baz']);
    });

    describe('throwing errors', () => {
      let isInFrame;

      beforeEach(() => {
        isInFrame = axe.utils.respondable.isInFrame;
      });
      afterEach(() => {
        axe.utils.respondable.isInFrame = isInFrame;
      });

      it('should throw when no elements match the context', () => {
        fixture.innerHTML = '<div id="foo"></div>';
        expect(
          () => {
            new Context('#notAnElement');
          },
          Error,
          'No elements found for include in page Context'
        ).toThrow();
      });

      it.skip('should throw when no elements match the context inside a frame', () => {
        axe.utils.respondable.isInFrame = () => {
          return true;
        };

        fixture.innerHTML = '<div id="foo"></div>';
        expect(
          () => {
            new Context('#notAnElement');
          },
          Error,
          'No elements found for include in frame Context'
        ).toThrow();
      });
    });

    it('creates a flatTree property', () => {
      const context = new Context({ include: [document] });
      expect(Array.isArray(context.flatTree)).toBe(true);
      expect(context.flatTree.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('object definition', () => {
    it('should assign include/exclude', () => {
      const context = new Context({
        include: [['#fixture']],
        exclude: [['#mocha']]
      });
      expect(context).not.toBeNull();
      expect(Object.keys(context)).toEqual(
        expect.arrayContaining([
          'include',
          'exclude',
          'flatTree',
          'initiator',
          'page',
          'frames',
          'focusable',
          'size'
        ])
      );
      expect(Array.isArray(context.flatTree)).toBe(true);
      expect(context.flatTree.length).toBeGreaterThanOrEqual(1);
    });

    it('should disregard bad input, non-matching selectors', () => {
      const flatTree = axe.utils.getFlattenedTree(document);
      const context = new Context({
        include: [['#fixture'], ['#monkeys']],
        exclude: [['#bananas']]
      });
      expect(context).not.toBeNull();
      expect(Object.keys(context)).toEqual(
        expect.arrayContaining([
          'include',
          'exclude',
          'flatTree',
          'initiator',
          'page',
          'frames',
          'focusable',
          'size'
        ])
      );
      expect(context.include).toHaveLength(1);
      expect(context.include[0].actualNode.id).toBe(
        axe.utils.querySelectorAll(flatTree, '#fixture')[0].actualNode.id
      );
    });

    it('should disregard bad input (null)', () => {
      const result = new Context();

      expect(result.include).toHaveLength(1);
      expect(result.include[0].actualNode).toBe(document.documentElement);

      expect(result.exclude).toHaveLength(0);

      expect(result.initiator).toBe(true);
      expect(result.page).toBe(true);

      expect(result.frames).toHaveLength(0);
    });

    it('should default include to document', () => {
      const result = new Context({ exclude: [['#fixture']] });
      expect(result.include).toHaveLength(1);
      expect(result.include[0].actualNode).toBe(document.documentElement);

      expect(result.exclude).toHaveLength(1);
      expect(result.exclude[0].actualNode).toBe($id('fixture'));

      expect(result.initiator).toBe(true);
      expect(result.page).toBe(true);

      expect(result.frames).toHaveLength(0);
    });

    it('should default empty include to document', () => {
      const result = new Context({ include: [], exclude: [] });
      expect(result.include).toHaveLength(1);
      expect(result.include[0].actualNode).toBe(document.documentElement);
    });

    it('throws when it has a fromFrames prop', () => {
      expect(() => {
        new Context({
          include: [],
          fromFrames: ['frame', '#fixture']
        });
      }).toThrow();
    });

    it('throws when it has a fromShadowDom prop', () => {
      expect(() => {
        new Context({
          include: [],
          fromShadowDom: ['frame', '#fixture']
        });
      }).toThrow();
    });
  });

  describe('initiator', () => {
    it('should not be clobbered', () => {
      const result = new Context({
        initiator: false
      });
      expect(result.include).toHaveLength(1);
      expect(result.include[0].actualNode).toBe(document.documentElement);

      expect(result.exclude).toHaveLength(0);
      expect(result.initiator).toBe(false);
      expect(result.page).toBe(true);
      expect(result.frames).toHaveLength(0);
    });

    // document.hasOwnProperty is undefined in Firefox content scripts
    it('should not throw given really weird circumstances when hasOwnProperty is deleted from a document node?', () => {
      const spec = document.implementation.createHTMLDocument('ie is dumb');
      spec.hasOwnProperty = undefined;

      const result = new Context(spec);

      expect(result.include).toHaveLength(1);
      expect(result.include[0].actualNode).toBe(spec.documentElement);

      expect(result.exclude).toHaveLength(0);

      expect(result.initiator).toBe(true);
      expect(result.page).toBe(false);

      expect(result.frames).toHaveLength(0);
    });
  });

  describe('page', () => {
    it('takes the page argument as default', () => {
      expect(new Context({ page: true }).page).toBe(true);
      expect(new Context({ page: false }).page).toBe(false);
    });

    it('is true if the document element is included', () => {
      expect(new Context(document).page).toBe(true);
      expect(new Context(document.documentElement).page).toBe(true);
      expect(new Context('html').page).toBe(true);
      expect(new Context(':root').page).toBe(true);
    });

    it('is true, with exclude used', () => {
      // What matters is that the documentElement is included
      // not that parts within that are excluded
      expect(
        new Context({
          include: document,
          exclude: [['#mocha']]
        }).page
      ).toBe(true);
    });

    it('is false if the context does not include documentElement', () => {
      expect(new Context(fixture).page).toBe(false);
      expect(new Context('#fixture').page).toBe(false);
      expect(new Context([['#fixture']]).page).toBe(false);
      expect(new Context({ include: [['#fixture']] }).page).toBe(false);
    });
  });

  describe('focusable', () => {
    it('should default to true', () => {
      const result = new Context();
      expect(result.focusable).toBe(true);
    });

    it('should use passed in value', () => {
      const result = new Context({
        focusable: false
      });
      expect(result.focusable).toBe(false);
    });

    it('should reject bad values', () => {
      const result = new Context({
        focusable: 'hello'
      });
      expect(result.focusable).toBe(true);
    });
  });

  describe('size', () => {
    it('should default to empty object', () => {
      const result = new Context();
      expect(result.size).toEqual({});
    });

    it('should use passed in value', () => {
      const result = new Context({
        size: {
          width: 10,
          height: 20
        }
      });
      expect(result.size).toEqual({
        width: 10,
        height: 20
      });
    });

    it('should reject bad values', () => {
      const result = new Context({
        size: 'hello'
      });
      expect(result.size).toEqual({});
    });
  });

  describe('frames', () => {
    function iframeReady(src, context, id, cb, done) {
      const iframe = document.createElement('iframe');
      iframe.addEventListener('load', () => {
        try {
          cb(iframe);
          done();
        } catch (e) {
          done(e);
        }
      });
      iframe.src = src;
      iframe.id = id;
      context.appendChild(iframe);
    }

    it('adds frames that are explicitly included', done => {
      fixture.innerHTML = '<div id="outer"></div>';
      iframeReady(
        '../mock/frames/context.html',
        $id('outer'),
        'target',
        () => {
          const result = new Context('#target');
          expect(result.frames).toHaveLength(1);
          expect(result.frames[0].node).toEqual($id('target'));
        },
        done
      );
    });

    it('adds frames that are implicitly included', done => {
      fixture.innerHTML = '<div id="outer"></div>';
      iframeReady(
        '../mock/frames/context.html',
        $id('outer'),
        'target',
        () => {
          const result = new Context('#outer');
          expect(result.frames).toHaveLength(1);
          expect(result.frames[0].node).toEqual($id('target'));
        },
        done
      );
    });

    it('sets include', done => {
      fixture.innerHTML = '<div id="outer"></div>';
      iframeReady(
        '../mock/frames/context.html',
        $id('outer'),
        'target',
        () => {
          const result = new Context([['#target', '#foo']]);
          expect(result.frames).toHaveLength(1);

          expect(result.frames[0].node).toEqual($id('target'));
          expect(result.frames[0].include).toEqual([['#foo']]);
          expect(result.frames[0].exclude).toEqual([]);
        },
        done
      );
    });

    it('sets exclude', done => {
      fixture.innerHTML = '<div id="outer"></div>';
      iframeReady(
        '../mock/frames/context.html',
        $id('outer'),
        'target',
        () => {
          const result = new Context({
            exclude: [['#target', '#foo']]
          });
          expect(result.frames).toHaveLength(1);

          expect(result.frames[0].node).toEqual($id('target'));
          expect(result.frames[0].include).toEqual([]);
          expect(result.frames[0].exclude).toEqual([['#foo']]);
        },
        done
      );
    });

    it('sets initiator: false', done => {
      iframeReady(
        '../mock/frames/context.html',
        $id('fixture'),
        'target',
        () => {
          const result = new Context();
          expect(result.initiator).toBe(true);
          expect(result.frames).toHaveLength(1);
          expect(result.frames[0].initiator).toBe(false);
        },
        done
      );
    });

    it('finds frames inside shadow DOM trees', () => {
      createNestedShadowDom(
        fixture,
        '<article id="shadowHost"></article>',
        '<iframe id="target" srcdoc="<h1>My iframe page</h1>"></iframe>'
      );
      const result = new Context();
      expect(result.frames[0].node.id).toBe('target');
    });

    it('accepts frames inside shadow DOM selectors', () => {
      createNestedShadowDom(
        fixture,
        '<article id="shadowHost"></article>',
        '<div><section id="shadowHost"></section></div>',
        '<iframe id="target" srcdoc="<h1>My iframe page</h1>"></iframe>'
      );
      const result = new Context([
        [['#fixture > article', 'section', 'iframe'], ['h1']]
      ]);
      expect(result.frames[0].node.id).toBe('target');
    });

    it('skips frames excluded with shadow DOM selectors', () => {
      createNestedShadowDom(
        fixture,
        '<article id="shadowHost"></article>',
        '<div><section id="shadowHost"></section></div>',
        '<iframe id="target" srcdoc="<h1>My iframe page</h1>"></iframe>'
      );
      const result = new Context({
        exclude: [[['#fixture > article', 'section', 'iframe']]]
      });
      expect(result.frames).toHaveLength(0);
    });

    it('skips frames in excluded shadow trees', () => {
      createNestedShadowDom(
        fixture,
        '<article id="shadowHost"></article>',
        '<div><section id="shadowHost"></section></div>',
        '<iframe id="target" srcdoc="<h1>My iframe page</h1>"></iframe>'
      );
      const result = new Context({
        exclude: [[['#fixture > article', 'section']]]
      });
      expect(result.frames).toHaveLength(0);
    });

    describe('.page', () => {
      it('is true if context includes the document element', done => {
        iframeReady(
          '../mock/frames/context.html',
          $id('fixture'),
          'target',
          () => {
            const result = new Context({
              exclude: [['#mocha']]
            });
            expect(result.frames).toHaveLength(1);
            expect(result.frames[0].page).toBe(true);
          },
          done
        );
      });

      it("can be false, even if the frame's documentElement is included", done => {
        iframeReady(
          '../mock/frames/context.html',
          $id('fixture'),
          'target',
          () => {
            const result = new Context({
              include: [['#fixture']]
            });
            expect(result.frames).toHaveLength(1);
            expect(result.frames[0].page).toBe(false);
          },
          done
        );
      });
    });

    describe('.focusable', () => {
      it('is true if tabindex is 0', done => {
        iframeReady(
          '../mock/frames/context.html',
          $id('fixture'),
          'target',
          iframe => {
            iframe.tabIndex = '0';
            const result = new Context();
            expect(result.frames).toHaveLength(1);
            expect(result.frames[0].focusable).toBe(true);
          },
          done
        );
      });

      it('is false if the context has a negative tabindex', done => {
        iframeReady(
          '../mock/frames/context.html',
          $id('fixture'),
          'target',
          iframe => {
            iframe.tabIndex = '-1';
            const result = new Context('#fixture');
            expect(result.frames).toHaveLength(1);
            expect(result.frames[0].focusable).toBe(false);
          },
          done
        );
      });

      it('is false if the parent context is not focusable', done => {
        iframeReady(
          '../mock/frames/context.html',
          $id('fixture'),
          'target',
          () => {
            const result = new Context({
              include: [['#fixture']],
              focusable: false
            });
            expect(result.frames).toHaveLength(1);
            expect(result.frames[0].focusable).toBe(false);
          },
          done
        );
      });
    });

    describe('.size', () => {
      it('sets width and height of the frame', done => {
        iframeReady(
          '../mock/frames/context.html',
          $id('fixture'),
          'target',
          iframe => {
            iframe.width = '100';
            iframe.height = '200';
            const result = new Context('#fixture');
            const size = result.frames[0].size;
            expect(size.width).toBeCloseTo(105, 10);
            expect(size.height).toBeCloseTo(205, 10);
          },
          done
        );
      });

      it('works with CSS width / height', done => {
        iframeReady(
          '../mock/frames/context.html',
          $id('fixture'),
          'target',
          iframe => {
            iframe.setAttribute('style', 'width: 100px; height: 200px');
            const result = new Context('#fixture');
            const size = result.frames[0].size;
            expect(size.width).toBeCloseTo(105, 10);
            expect(size.height).toBeCloseTo(205, 10);
          },
          done
        );
      });
    });

    it('combines includes', done => {
      fixture.innerHTML = '<div id="outer"></div>';
      iframeReady(
        '../mock/frames/context.html',
        $id('outer'),
        'target',
        () => {
          const result = new Context([
            ['#target', '#foo'],
            ['#target', '#bar']
          ]);

          expect(result.frames).toHaveLength(1);
          expect(result.frames[0].node).toEqual($id('target'));
          expect(result.frames[0].include).toEqual([['#foo'], ['#bar']]);
          expect(result.frames[0].exclude).toEqual([]);
        },
        done
      );
    });

    it('does not include the same frame twice', done => {
      fixture.innerHTML = '<div id="outer"></div>';
      iframeReady(
        '../mock/frames/context.html',
        $id('outer'),
        'target',
        () => {
          const result = new Context([$id('target'), $id('target')]);
          expect(result.frames).toHaveLength(1);
          expect(result.frames[0].node).toEqual($id('target'));
        },
        done
      );
    });

    it('should filter out invisible frames', done => {
      fixture.innerHTML = '<div id="outer"></div>';
      iframeReady(
        '../mock/frames/context.html',
        $id('outer'),
        'target',
        () => {
          const frame = $id('target');
          frame.setAttribute('hidden', 'hidden');

          const result = new Context([$id('target')]);
          expect(result.frames).toEqual([]);
        },
        done
      );
    });

    it('should throw when frame could not be found', done => {
      fixture.innerHTML = '<div id="outer"></div>';
      iframeReady(
        '../mock/frames/context.html',
        $id('outer'),
        'target',
        () => {
          expect(() => {
            new Context(['#notAFrame', '#foo']);
          }).toThrow();
        },
        done
      );
    });
  });

  describe('with labelled fame selectors', () => {
    it('accepts a single labelled selector', () => {
      fixture.innerHTML = '<div id="foo"></div>';
      const result = new Context({
        fromFrames: ['#foo']
      });
      expect(selectors(result.include)).toEqual(['#foo']);
      expect(result.exclude).toHaveLength(0);
    });

    it('accepts multiple labelled selectors', () => {
      fixture.innerHTML = '<div id="foo"></div><div id="bar"></div>';
      const result = new Context([
        { fromFrames: ['#foo'] },
        { fromFrames: ['#bar'] }
      ]);
      expect(selectors(result.include)).toEqual(['#foo', '#bar']);
      expect(result.exclude).toHaveLength(0);
    });

    it('accepts labelled selectors on include & exclude', () => {
      fixture.innerHTML = '<div id="foo"></div><div id="bar"></div>';
      const result = new Context({
        include: [{ fromFrames: ['#foo'] }],
        exclude: { fromFrames: ['#bar'] }
      });
      expect(selectors(result.include)).toEqual(['#foo']);
      expect(selectors(result.exclude)).toEqual(['#bar']);
    });

    it('throws when not passed an array', () => {
      expect(() => {
        new Context({ fromFrames: '#fixture' });
      }).toThrow();
    });

    it('throws when fromShadowDom is on the same object', () => {
      expect(() => {
        new Context({
          fromFrames: ['#fixture'],
          fromShadowDom: ['#fixture']
        });
      }).toThrow();
    });

    it('throws when labelled frames are nested', () => {
      expect(() => {
        new Context({
          fromFrames: ['#fixture', { fromFrames: ['#fixture'] }]
        });
      }).toThrow();
    });

    describe('when the selector has length > 1', () => {
      it('sets the frame, rather than include / exclude', () => {
        fixture.innerHTML = `<iframe id="foo" srcdoc="
          <h1>Hello world</h1> <img>
        "></iframe>`;
        const result = new Context({
          include: { fromFrames: ['#foo', 'h1'] },
          exclude: { fromFrames: ['iframe', 'img'] }
        });
        expect(result.include).toHaveLength(0);
        expect(result.exclude).toHaveLength(0);
        expect(result.frames).toHaveLength(1);
      });

      it('creates a context for the frame', () => {
        fixture.innerHTML = `<iframe id="foo" srcdoc="
          <h1>Hello world</h1> <img>
        "></iframe>`;
        const result = new Context({
          include: { fromFrames: ['#foo', 'h1'] },
          exclude: { fromFrames: ['iframe', 'img'] }
        });
        const frameContext = result.frames[0];
        expect(result.frames).toHaveLength(1);
        expect(frameContext.include).toEqual([['h1']]);
        expect(frameContext.exclude).toEqual([['img']]);
      });
    });
  });

  describe('with labelled shadow DOM selectors', () => {
    it('accepts a single labelled selector', () => {
      createNestedShadowDom(
        fixture,
        '<article id="shadowHost"></article>',
        '<div><section id="shadowHost"></section></div>',
        '<h1 id="foo">Heading</h1>'
      );
      const result = new Context({
        fromShadowDom: ['#fixture > article', 'section', 'h1']
      });
      expect(selectors(result.include)).toEqual(['#foo']);
      expect(result.exclude).toHaveLength(0);
      expect(result.frames).toHaveLength(0);
    });

    it('accepts multiple labelled selectors', () => {
      createNestedShadowDom(
        fixture,
        '<article id="shadowHost"></article>',
        '<div><section id="shadowHost"></section></div>',
        '<div id="foo"></div><div id="bar"></div>'
      );
      const result = new Context([
        { fromShadowDom: ['#fixture > article', 'section', '#foo'] },
        { fromShadowDom: ['#fixture > article', 'section', '#bar'] }
      ]);
      expect(selectors(result.include)).toEqual(['#foo', '#bar']);
      expect(result.exclude).toHaveLength(0);
      expect(result.frames).toHaveLength(0);
    });

    it('accepts labelled selectors on include & exclude', () => {
      createNestedShadowDom(
        fixture,
        '<article id="shadowHost"></article>',
        '<h1 id="foo"></h1><h2 id="bar"></h2>'
      );
      const result = new Context({
        include: [{ fromShadowDom: ['#fixture > article', 'h1'] }],
        exclude: { fromShadowDom: ['#fixture > article', 'h2'] }
      });
      expect(selectors(result.include)).toEqual(['#foo']);
      expect(selectors(result.exclude)).toEqual(['#bar']);
    });

    it('throws when fromShadowDom does not contain an array', () => {
      fixture.innerHTML = '<h1>Hello World</h1>';
      expect(() => {
        new Context({ fromShadowDom: 'h1' });
      }).toThrow();
    });

    it('throws when containing a labelled frame selector', () => {
      createNestedShadowDom(
        fixture,
        '<article id="shadowHost"></article>',
        `<iframe id="foo" srcdoc="
          <h1>Hello World</h1>
        "></iframe>`
      );
      expect(() => {
        new Context({
          fromShadowDom: [
            '#fixture > article',
            { fromFrames: ['iframe', 'h1'] }
          ]
        });
      }).toThrow();
    });

    it('throws when containing another labelled shadow dom selector', () => {
      createNestedShadowDom(
        fixture,
        '<article id="shadowHost"></article>',
        '<div><section id="shadowHost"></section></div>',
        '<h1 id="foo">Heading</h1>'
      );
      expect(() => {
        new Context({
          fromShadowDom: [
            '#fixture > article',
            { fromShadowDom: ['section', 'h1'] }
          ]
        });
      }).toThrow();
    });

    describe('nested in a frame selector', () => {
      it('works for unlabelled frame selectors', () => {
        createNestedShadowDom(
          fixture,
          '<article id="shadowHost"></article>',
          `<iframe id="foo" srcdoc="
            <h1>Hello World</h1>
          "></iframe>`
        );
        const result = new Context([
          [
            {
              fromShadowDom: ['#fixture > article', 'iframe']
            },
            ['h1']
          ]
        ]);

        const frameNodes = result.frames.map(({ node }) => node);
        expect(selectors(frameNodes)).toEqual(['#foo']);
      });

      it('works for labelled frame selectors', () => {
        createNestedShadowDom(
          fixture,
          '<article id="shadowHost"></article>',
          `<iframe id="foo" srcdoc="
            <h1>Hello World</h1>
          "></iframe>`
        );
        const result = new Context({
          fromFrames: [
            {
              fromShadowDom: ['#fixture > article', 'iframe']
            },
            ['h1']
          ]
        });
        const frameNodes = result.frames.map(({ node }) => node);
        expect(selectors(frameNodes)).toEqual(['#foo']);
      });
    });
  });

  describe('ignores bad values', () => {
    it('passed directly into include', () => {
      const result = new Context([null, fixture, false, {}]);
      expect(selectors(result.include)).toEqual(['#fixture']);
      expect(result.exclude).toHaveLength(0);
    });

    it('in unlabelled frame selectors', () => {
      fixture.innerHTML = '<article id="foo"></article>';
      const result = new Context([
        [null],
        ['#fixture > article'],
        [fixture],
        [false],
        [{}]
      ]);
      expect(selectors(result.include)).toEqual(['#foo']);
      expect(result.exclude).toHaveLength(0);
    });

    it('in labelled frame selectors', () => {
      fixture.innerHTML = '<article id="foo"></article>';
      const result = new Context([
        { fromFrames: [null] },
        { fromFrames: ['#fixture > article'] },
        { fromFrames: [fixture] },
        { fromFrames: [false] },
        { fromFrames: [{}] }
      ]);
      expect(selectors(result.include)).toEqual(['#foo']);
      expect(result.exclude).toHaveLength(0);
    });

    it('in unlabelled shadow DOM selectors', () => {
      createNestedShadowDom(
        fixture,
        '<article id="shadowHost"></article>',
        '<h1 id="foo"></h1><h2 id="bar"></h2>'
      );
      const result = new Context([
        [['#fixture > article', null]],
        [['#fixture > article', 'h1']], // Valid
        [['#fixture > article', ['h2']]],
        [['#fixture > article', fixture]],
        [['#fixture > article', false]],
        [['#fixture > article', {}]]
      ]);
      expect(selectors(result.include)).toEqual(['#foo']);
      expect(result.exclude).toHaveLength(0);
    });

    it('in labelled shadow DOM selectors', () => {
      createNestedShadowDom(
        fixture,
        '<article id="shadowHost"></article>',
        '<h1 id="foo"></h1><h2 id="bar"></h2>'
      );
      const result = new Context([
        { fromShadowDom: ['#fixture > article', null] },
        { fromShadowDom: ['#fixture > article', 'h1'] }, // valid
        { fromShadowDom: ['#fixture > article', ['h1']] },
        { fromShadowDom: ['#fixture > article', fixture] },
        { fromShadowDom: ['#fixture > article', false] },
        { fromShadowDom: ['#fixture > article', {}] }
      ]);
      expect(selectors(result.include)).toEqual(['#foo']);
      expect(result.exclude).toHaveLength(0);
    });
  });
});
