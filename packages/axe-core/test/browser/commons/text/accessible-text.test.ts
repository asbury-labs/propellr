import { describe, it, beforeAll, afterAll, afterEach, expect } from 'vitest';
import { html, shadowSupport, flatTreeSetup } from '../../../testutils';

declare const axe: any;
describe('text.accessibleTextVirtual', () => {
  const fixture = document.getElementById('fixture');

  afterEach(() => {
    fixture.innerHTML = '';
    axe._tree = null;
  });

  it('is called through accessibleText with a DOM node', () => {
    const accessibleText = axe.commons.text.accessibleText;
    fixture.innerHTML = html` <label><input type="button" /></label> `;
    flatTreeSetup(fixture);
    const target = fixture.querySelector('input');
    expect(accessibleText(target)).toBe('');
  });

  it('should match the first example from the ARIA spec', () => {
    fixture.innerHTML = html`
      <ul role="menubar">
        <!-- Rule 2A: "File" label via aria-labelledby -->
        <li
          role="menuitem"
          aria-haspopup="true"
          aria-labelledby="fileLabel"
          id="rule2a"
        >
          <span id="fileLabel">File</span>
          <ul role="menu">
            <!-- Rule 2C: "New" label via Namefrom:contents -->
            <li role="menuitem" id="rule2c">New</li>
            <li role="menuitem">Open…</li>
            …
          </ul>
        </li>
      </ul>
    `;
    flatTreeSetup(fixture);

    const rule2a = axe.utils.querySelectorAll(axe._tree, '#rule2a')[0];
    const rule2c = axe.utils.querySelectorAll(axe._tree, '#rule2c')[0];

    expect(axe.commons.text.accessibleTextVirtual(rule2a)).toBe('File');
    expect(axe.commons.text.accessibleTextVirtual(rule2c)).toBe('New');
  });

  it('should match the second example from the ARIA spec', () => {
    fixture.innerHTML = html`
      <fieldset>
        <legend>Meeting alarms</legend>
        <!-- Rule 2A: "Beep" label given by native HTML label element -->
        <input type="checkbox" id="beep" /> <label for="beep">Beep</label>
        <br />
        <input type="checkbox" id="mtgTitle" />
        <label for="mtgTitle">Display the meeting title</label> <br />
        <!-- Rule 2B -->
        <input type="checkbox" id="flash" />
        <label for="flash">
          Flash the screen
          <!-- Rule 2A: label of text input given by aria-label, "Number of times to flash screen" -->
          <input
            type="text"
            value="3"
            size="2"
            id="numTimes"
            title="Number of times to flash screen"
          />
          times
        </label>
      </fieldset>
    `;
    flatTreeSetup(fixture);

    const rule2a = axe.utils.querySelectorAll(axe._tree, '#beep')[0];
    const rule2b = axe.utils.querySelectorAll(axe._tree, '#flash')[0];
    expect(axe.commons.text.accessibleTextVirtual(rule2a)).toBe('Beep');
    expect(axe.commons.text.accessibleTextVirtual(rule2b)).toBe(
      'Flash the screen 3 times'
    );
  });

  it('should use aria-labelledby if present', () => {
    fixture.innerHTML = html`
      <div id="t2label">
        This is
        <input
          type="text"
          value="the value"
          aria-labelledby="t1label"
          aria-label="ARIA Label"
          id="t1"
        />
        of <i>everything</i>
      </div>
      <div id="t1label">This is a <b>label</b></div>
      <label for="t1">HTML Label</label>
      <input type="text" id="t2" aria-labelledby="t2label" />
    `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, '#t1')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
      'This is a label'
    );
  });

  it('should use recusive aria-labelledby properly', () => {
    fixture.innerHTML = html`
      <div id="t2label">
        This is
        <input
          type="text"
          value="the value"
          aria-labelledby="t1 t1label"
          aria-label="ARIA Label"
          id="t1"
        />
        of <i>everything</i>
      </div>
      <div id="t1label">This is a <b>label</b></div>
      <label for="t1">HTML Label</label>
      <input type="text" id="t2" aria-labelledby="t2label" />
    `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, '#t1')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
      'ARIA Label This is a label'
    );
  });

  it('should include hidden text referred to with aria-labelledby', () => {
    fixture.innerHTML = html`
      <div id="t1label" style="display:none">
        This is a
        <span style="visibility:hidden">hidden </span>
        <span aria-hidden="true">secret</span>
      </div>
      <label for="t1">HTML Label</label>
      <input type="text" id="t1" aria-labelledby="t1label" />'
    `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, '#t1')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
      'This is a hidden secret'
    );
  });

  it('should allow setting the initial includeHidden value', () => {
    fixture.innerHTML = html`
      <label id="lbl1" style="display:none;">hidden label</label>
    `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, '#lbl1')[0];
    expect(
      axe.commons.text.accessibleTextVirtual(target, {
        includeHidden: false
      })
    ).toBe('');

    expect(
      axe.commons.text.accessibleTextVirtual(target, {
        includeHidden: true
      })
    ).toBe('hidden label');
  });

  it('should use aria-label if present with no labelledby', () => {
    fixture.innerHTML = html`
      <div id="t2label">
        This is
        <input type="text" value="the value" aria-label="ARIA Label" id="t1" />
        of <i>everything</i>
      </div>
      <div id="t1label">This is a <b>label</b></div>
      <label for="t1">HTML Label</label>
      <input type="text" id="t2" aria-labelledby="t2label" />
    `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, '#t1')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe('ARIA Label');
  });

  it('should use alt on imgs with no ARIA', () => {
    fixture.innerHTML = html`
      <div id="t2label">
        This is <input type="text" value="the value" id="t1" /> of
        <i>everything</i>
      </div>
      <img alt="Alt text goes here" id="target" />
      <div id="t1label">This is a <b>label</b></div>
      <label for="t1">HTML Label</label>
      <input type="text" id="t2" aria-labelledby="t2label" />
    `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, '#target')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
      'Alt text goes here'
    );
  });

  it('should use alt on image inputs with no ARIA', () => {
    fixture.innerHTML = html`
      <div id="t2label">
        This is <input type="text" value="the value" id="t1" /> of
        <i>everything</i>
      </div>
      <input type="image" alt="Alt text goes here" id="target" />
      <div id="t1label">This is a <b>label</b></div>
      <label for="t1">HTML Label</label>
      <input type="text" id="t2" aria-labelledby="t2label" />'
    `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, '#target')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
      'Alt text goes here'
    );
  });

  it('should use not use alt on text inputs with no ARIA', () => {
    fixture.innerHTML = html`
      <div id="t2label">
        This is <input type="text" value="the value" id="t1" /> of
        <i>everything</i>
      </div>
      <input type="text" alt="Alt text goes here" id="target" />
      <div id="t1label">This is a <b>label</b></div>
      <label for="t1">HTML Label</label>
      <input type="text" id="t2" aria-labelledby="t2label" />
    `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, '#target')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe('');
  });

  it('should use HTML label if no ARIA information', () => {
    fixture.innerHTML = html`
      <div id="t2label">
        This is <input type="text" value="the value" id="t1" /> of
        <i>everything</i>
      </div>
      <div id="t1label">This is a <b>label</b></div>
      <label for="t1">HTML Label</label>
      <input type="text" id="t2" aria-labelledby="t2label" />
    `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, '#t1')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe('HTML Label');
  });

  it('should handle last ditch title attribute', () => {
    fixture.innerHTML = html`
      <div id="t2label">
        This is
        <input
          type="text"
          value="the value"
          aria-labelledby="t1label"
          aria-label="ARIA Label"
          id="t1"
        />
        of <i title="italics"></i>
      </div>
      <div id="t1label">This is a <b>label</b></div>
      <label for="t1">HTML Label</label>
      <input type="text" id="t2" aria-labelledby="t2label" />
    `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, '#t2label')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
      'This is This is a label of italics'
    );
  });

  it('should handle totally empty elements', () => {
    fixture.innerHTML = html`
      <div id="t2label">
        This is
        <input
          type="text"
          value="the value"
          aria-labelledby="t1label"
          aria-label="ARIA Label"
          id="t1"
        />
        of <i></i>
      </div>
      <div id="t1label">This is a <b>label</b></div>
      <label for="t1">HTML Label</label>
      <input type="text" id="t2" aria-labelledby="t2label" />
    `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, '#t2label')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
      'This is This is a label of'
    );
  });

  it('should handle author name-from roles properly', () => {
    fixture.innerHTML = html`
      <div id="t2label" role="heading">
        This is
        <input
          type="text"
          value="the value"
          aria-labelledby="t1label"
          aria-label="ARIA Label"
          id="t1"
        />
        of <i role="alert">everything</i>
      </div>
      <div id="t1label">This is a <b>label</b></div>
      <label for="t1">HTML Label</label>
      <input type="text" id="t2" aria-labelledby="t2label" />
    `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, '#t2label')[0];
    // Chrome 114: "This is the value of "
    // Firefox 115: "This is ARIA Label the value everything"
    // Safari 16.5: This is the value This is a label of everything
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
      'This is This is a label of everything'
    );
  });

  it('should only show each node once when label is before input', () => {
    fixture.innerHTML = html`
      <div id="target">
        <label for="tb1">My form input</label> <input type="text" id="tb1" />
      </div>
    `;
    flatTreeSetup(fixture);
    const target = axe.utils.querySelectorAll(axe._tree, '#target')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
      'My form input'
    );
  });

  it('should only show each node once when label follows input', () => {
    fixture.innerHTML = html`
      <div id="target">
        <input type="text" id="tb1" />
      </div>
      <label for="tb1">My form input</label>
    `;
    flatTreeSetup(fixture);
    const target = axe.utils.querySelectorAll(axe._tree, '#target')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
      'My form input'
    );
  });

  it('should handle nested inputs in normal context', () => {
    fixture.innerHTML = html`
      <div id="t2label">
        This is
        <input
          type="text"
          value="the value"
          aria-labelledby="t1label"
          aria-label="ARIA Label"
          id="t1"
        />
        of <i>everything</i>
      </div>
      <div id="t1label">This is a <b>label</b></div>
      <label for="t1">HTML Label</label>
      <input type="text" id="t2" aria-labelledby="t2label" />
    `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, '#t2label')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
      'This is This is a label of everything'
    );
  });

  it('should use handle nested inputs properly in labelledby context', () => {
    fixture.innerHTML = html`
      <div id="t2label">
        This is
        <input
          type="text"
          value="the value"
          aria-labelledby="t1label"
          aria-label="ARIA Label"
          id="t1"
        />
        of <i>everything</i>
      </div>
      <div id="t1label">This is a <b>label</b></div>
      <label for="t1">HTML Label</label>
      <input type="text" id="t2" aria-labelledby="t2label" />
    `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, '#t2')[0];
    // Chrome 114: This is the value of everything
    // Firefox 115: This is ARIA Label the value of everything
    // Safari 16.5: THis is This is a label of everything
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
      'This is ARIA Label of everything'
    );
  });

  it('should use ignore hidden inputs', () => {
    fixture.innerHTML = html`
      <div id="t2label">
        This is <input type="hidden" value="the value" Label" id="t1"> of
        <i>everything</i>
      </div>
      <div id="t1label">This is a <b>label</b></div>
      <label for="t1">HTML Label</label>
      <input type="text" id="t2" aria-labelledby="t2label" />
    `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, '#t2')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
      'This is of everything'
    );
  });

  it('should use handle inputs with no type as if they were text inputs', () => {
    fixture.innerHTML = html`
      <div id="t2label">
        This is
        <input value="the value" aria-labelledby="t1label" id="t1" />
        of <i>everything</i>
      </div>
      <div id="t1label">This is a <b>label</b></div>
      <label for="t1">HTML Label</label>
      <input type="text" id="t2" aria-labelledby="t2label" />
    `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, '#t2')[0];
    // Chrome 114: "This is the value of everything"
    // Firefox 115: "This is the value of everything"
    // Safari 16.5: "This is This is a label of everything"
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
      'This is the value of everything'
    );
  });

  it('should use handle nested selects properly in labelledby context', () => {
    fixture.innerHTML = html`
      <div id="t2label">
        This is
        <select multiple aria-labelledby="t1label" id="t1">
          <option selected>first</option>
          <option>second</option>
          <option selected>third</option>
        </select>
        of <i>everything</i>
      </div>
      <div id="t1label">This is a <b>label</b></div>
      <label for="t1">HTML Label</label>
      <input type="text" id="t2" aria-labelledby="t2label" />
    `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, '#t2')[0];
    // Chrome 114: "This is first third of everything"
    // Firefox 115: "This is of everything"
    // Safari 16.5: "This is first third of everything"
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
      'This is first third of everything'
    );
  });

  it('should use handle nested textareas properly in labelledby context', () => {
    fixture.innerHTML = html`
      <div id="t2label">
        This is
        <textarea aria-labelledby="t1label" id="t1">the value</textarea>
        of <i>everything</i>
      </div>
      <div id="t1label">This is a <b>label</b></div>
      <label for="t1">HTML Label</label>
      <input type="text" id="t2" aria-labelledby="t2label" />
    `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, '#t2')[0];
    // Chrome 114: "This is the value of everything"
    // Firefox 115: "This is the value of everything"
    // Safari 16.5: "This is This is a label of everything"
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
      'This is the value of everything'
    );
  });

  it('should use handle ARIA labels properly in labelledby context', () => {
    fixture.innerHTML = html` <div id="t2label">
        This
        <span aria-label="not a span">span</span>
        is
        <input
          type="text"
          value="the value"
          aria-labelledby="t1label"
          id="t1"
        />
        of <i>everything</i>
      </div>
      <div id="t1label">This is a <b>label</b></div>
      <label for="t1">HTML Label</label>
      <input type="text" id="t2" aria-labelledby="t2label" />`;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, '#t2')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
      'This not a span is the value of everything'
    );
  });

  it('should come up empty if input is labeled only by select options', () => {
    fixture.innerHTML = html`
      <label for="target">
        <select id="select">
          <option selected="selected">Chosen</option>
          <option>Not Selected</option>
        </select>
      </label>
      <input id="target" type="text" />
    `;
    flatTreeSetup(fixture);
    const target = axe.utils.querySelectorAll(axe._tree, '#target')[0];
    // Chrome 114: "Chosen"
    // Firefox 115: "Chosen"
    // Safari 16.5: "Chosen"
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Chosen');
  });

  it("should be empty if input is labeled by labeled select (ref'd string labels have spotty support)", () => {
    fixture.innerHTML = html`
      <label for="select">My Select</label>
      <label for="target">
        <select id="select">
          <option selected="selected">Chosen</option>
          <option>Not Selected</option>
        </select>
      </label>
      <input id="target" type="text" />
    `;
    flatTreeSetup(fixture);
    const target = axe.utils.querySelectorAll(axe._tree, '#target')[0];
    // Chrome 114: "Chosen"
    // Firefox 115: "Chosen"
    // Safari 16.5: "Chosen"
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Chosen');
  });

  it('should be empty for an empty label wrapping a select', () => {
    fixture.innerHTML = html`
      <label>
        <span class="label"></span>
        <select id="target">
          <option value="1" selected="selected">Please choose a region</option>
          <option value="2">Coastal</option>
          <option value="3">Forest</option>
          <option value="4">Grasslands</option>
          <option value="5">Mountains</option>
        </select>
      </label>
    `;
    flatTreeSetup(fixture);
    const target = axe.utils.querySelectorAll(axe._tree, '#target')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe('');
  });

  it('should not return select options if input is aria-labelled by a select', () => {
    fixture.innerHTML = html`
      <label>
        <select id="select">
          <option selected="selected">Chosen</option>
          <option>Not Selected</option>
        </select>
      </label>
      <input aria-labelledby="select" type="text" id="target" />
    `;
    flatTreeSetup(fixture);
    const target = axe.utils.querySelectorAll(axe._tree, '#target')[0];
    // Chrome 114: "Chosen"
    // Firefox 115: "Chosen"
    // Safari 16.5: "Chosen"
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Chosen');
  });

  it('shoud properly fall back to title', () => {
    fixture.innerHTML = html`
      <a href="#" role="presentation" title="Hello"></a>
    `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, 'a')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Hello');
  });

  it('should give text even for role=presentation on anchors', () => {
    fixture.innerHTML = html` <a href="#" role="presentation">Hello</a> `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, 'a')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Hello');
  });

  it('should give text even for role=presentation on buttons', () => {
    fixture.innerHTML = html` <button role="presentation">Hello</button> `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, 'button')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Hello');
  });

  it('should give text even for role=presentation on summary', () => {
    fixture.innerHTML = html` <summary role="presentation">Hello</summary> `;
    flatTreeSetup(fixture);
    const target = axe.utils.querySelectorAll(axe._tree, 'summary')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Hello');
  });

  it('shoud properly fall back to title', () => {
    fixture.innerHTML = html` <a href="#" role="none" title="Hello"></a> `;
    flatTreeSetup(fixture);
    const target = axe.utils.querySelectorAll(axe._tree, 'a')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Hello');
  });

  it('should give text even for role=none on anchors', () => {
    fixture.innerHTML = html` <a href="#" role="none">Hello</a> `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, 'a')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Hello');
  });

  it('should give text even for role=none on buttons', () => {
    fixture.innerHTML = html` <button role="none">Hello</button> `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, 'button')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Hello');
  });

  it('should give text even for role=none on summary', () => {
    fixture.innerHTML = html` <summary role="none">Hello</summary> `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, 'summary')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Hello');
  });

  it('should not add extra spaces around phrasing elements', () => {
    fixture.innerHTML = html` <a href="#">Hello<span>World</span></a> `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, 'a')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe('HelloWorld');
  });

  it('should add spaces around non-phrasing elements', () => {
    fixture.innerHTML = html`
      <a href="#"
        >Hello
        <div>World</div></a
      >
    `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, 'a')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Hello World');
  });

  it('should not look at scripts', () => {
    fixture.innerHTML =
      '<a href="#"><script> const ajiasdf = true; </script></a>';
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, 'a')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe('');
  });

  it('should use <label> for input buttons', () => {
    fixture.innerHTML = html` <label><input type="button" /></label> `;
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe('');
  });

  it('should not stop when attributes contain whitespace', () => {
    fixture.innerHTML =
      '<button aria-label=" " aria-labelledby=" ">Hello World</button>';
    flatTreeSetup(fixture);

    const target = axe.utils.querySelectorAll(axe._tree, 'button')[0];
    expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Hello World');
  });

  (!!document.fonts ? it : xit)(
    'should allow ignoring icon ligatures',
    done => {
      const materialFont = new FontFace(
        'Material Icons',
        'url(https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2)'
      );
      materialFont.load().then(() => {
        document.fonts.add(materialFont);

        fixture.innerHTML =
          '<button id="target">Hello World<span style="font-family: \'Material Icons\'">delete</span></button>';
        flatTreeSetup(fixture);

        const target = axe.utils.querySelectorAll(axe._tree, 'button')[0];
        try {
          expect(
            axe.commons.text.accessibleTextVirtual(target, {
              ignoreIconLigature: true
            })
          ).toBe('Hello World');
          done();
        } catch (err) {
          done(err);
        }
      });
    }
  );

  (shadowSupport.v1 ? it : xit)(
    'should only find aria-labelledby element in the same context ',
    () => {
      fixture.innerHTML = html`
        <div id="t2label">
          This is
          <input
            type="text"
            value="the value"
            aria-labelledby="t1label"
            aria-label="ARIA Label"
            id="t1"
          />
          of <i>everything</i>
        </div>
        <div id="shadow"></div>
      `;

      const shadow = document
        .getElementById('shadow')
        .attachShadow({ mode: 'open' });
      shadow.innerHTML = html`
        <div id="t1label">This is a <b>label</b></div>
        <label for="t1">HTML Label</label>
        <input type="text" id="t2" aria-labelledby="t2label" />
      `;

      flatTreeSetup(fixture);
      const target = axe.utils.querySelectorAll(axe._tree, '#t1')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe('ARIA Label');
    }
  );

  (shadowSupport.v1 ? it : xit)(
    'should find attributes within a shadow tree',
    () => {
      fixture.innerHTML = html` <div id="shadow"></div> `;

      const shadow = document
        .getElementById('shadow')
        .attachShadow({ mode: 'open' });
      shadow.innerHTML = '<input type="text" id="t1" title="I will be king">';

      flatTreeSetup(fixture);
      const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'I will be king'
      );
    }
  );

  (shadowSupport.v1 ? it : xit)(
    'should find attributes within a slot on the shadow tree',
    () => {
      fixture.innerHTML =
        '<div id="shadow"><input type="text" id="t1" title="you will be queen"></div>';

      const shadow = document
        .getElementById('shadow')
        .attachShadow({ mode: 'open' });
      shadow.innerHTML = '<slot></slot>';

      flatTreeSetup(fixture);
      const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'you will be queen'
      );
    }
  );

  (shadowSupport.v1 ? it : xit)(
    'should find fallback content for shadow DOM',
    () => {
      fixture.innerHTML = html` <div id="shadow"></div> `;

      const shadow = document
        .getElementById('shadow')
        .attachShadow({ mode: 'open' });
      shadow.innerHTML = html`
        <input type="text" id="t1" />
        <label for="t1"><slot>Fallback content heroes</slot></label>
      `;

      flatTreeSetup(fixture);
      const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Fallback content heroes'
      );
    }
  );

  describe('figure', () => {
    it('should check aria-labelledby', () => {
      fixture.innerHTML = html`
        <div id="t1">Hello</div>
        <figure aria-labelledby="t1">
          Not part of a11yName
          <figcaption>Fail</figcaption>
        </figure>
      `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'figure')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Hello');
    });

    it('should check aria-label', () => {
      fixture.innerHTML = html`
        <figure aria-label="Hello">
          Not part of a11yName
          <figcaption>Fail</figcaption>
        </figure>
        ';
      `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'figure')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Hello');
    });

    it('should check the figures figcaption', () => {
      fixture.innerHTML =
        '<figure>Not part of a11yName <figcaption>Hello</figcaption></figure>';
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'figure')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Hello');
    });

    it('should check title on figure', () => {
      fixture.innerHTML =
        '<figure title="Hello">Not part of a11yName <figcaption></figcaption></figure>';
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'figure')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Hello');
    });

    it('should fall back to innerText of figure', () => {
      fixture.innerHTML = html`
        <figure>
          Hello
          <figcaption></figcaption>
        </figure>
      `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'figure')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Hello');
    });

    (shadowSupport.v1 ? it : xit)(
      'should check within the composed (shadow) tree',
      () => {
        const node = document.createElement('div');
        node.innerHTML = 'Hello';
        const shadowRoot = node.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML =
          '<figure>Not part of a11yName <figcaption><slot></slot></figcaption></figure>';
        fixture.appendChild(node);
        flatTreeSetup(fixture);

        const target = axe.utils.querySelectorAll(axe._tree, 'figure')[0];
        expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Hello');
      }
    );
  });

  describe('img', () => {
    it('should work with aria-labelledby attribute', () => {
      fixture.innerHTML = html`
        <div id="t1">Hello</div>
        <div id="t2">World</div>
        <img aria-labelledby="t1 t2" />
      `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'img')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should work with aria-label attribute', () => {
      fixture.innerHTML = html` <img aria-label="Hello World" /> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'img')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should work with alt attribute', () => {
      fixture.innerHTML = html` <img alt="Hello World" /> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'img')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should work with title attribute', () => {
      fixture.innerHTML = html` <img title="Hello World" /> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'img')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });
  });

  describe('input buttons', () => {
    it('should find value for input type=button', () => {
      fixture.innerHTML = html` <input type="button" value="Hello" /> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Hello');
    });

    it('should find value for input type=reset', () => {
      fixture.innerHTML = html` <input type="reset" value="Hello" /> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Hello');
    });

    it('should find value for input type=submit', () => {
      fixture.innerHTML = html` <input type="submit" value="Hello" /> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Hello');
    });

    it('should provide a default value for input type="submit"', () => {
      fixture.innerHTML = html` <input type="submit" /> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        target.actualNode.value || 'Submit'
      );
    });

    it('should provide a default value for input type="reset"', () => {
      fixture.innerHTML = html` <input type="reset" /> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
      const defaultText = axe.commons.text.accessibleTextVirtual(target);
      expect(typeof defaultText).toBe('string');
      expect(defaultText).toBe(target.actualNode.value || 'Reset');
    });

    it('should find title for input type=button', () => {
      fixture.innerHTML = html` <input type="button" title="Hello" /> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Hello');
    });

    it('should find title for input type=reset', () => {
      fixture.innerHTML = html` <input type="reset" title="Hello" /> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
      // IE does not use title; but will use default value instead
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        target.actualNode.value || 'Hello'
      );
    });

    it('should find title for input type=submit', () => {
      fixture.innerHTML = html` <input type="submit" title="Hello" /> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
      // Again, default value takes precedence over title
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        target.actualNode.value || 'Hello'
      );
    });
  });

  describe('tables', () => {
    it('should work with aria-labelledby', () => {
      fixture.innerHTML = html`
        <div id="t1">Hello</div>
        <div id="t2">World</div>
        <table aria-labelledby="t1 t2"></table>
      `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'table')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should work with aria-label', () => {
      fixture.innerHTML = html` <table aria-label="Hello World"></table> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'table')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should work with the caption element', () => {
      fixture.innerHTML =
        '<table><caption>Hello World</caption><tr><td>Stuff</td></tr></table>';
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'table')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should work with the title attribute', () => {
      fixture.innerHTML = html` <table title="Hello World"></table> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'table')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should work with the summary attribute', () => {
      fixture.innerHTML = html` <table summary="Hello World"></table> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'table')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should prefer summary attribute over title attribute', () => {
      // Chrome 114: "Hello world"
      // Firefox 115: "Hello world"
      // Safari 16.5: "Hello world"
      fixture.innerHTML = html`
        <table summary="Hello World" title="FAIL"></table>
      `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'table')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });
  });

  describe('text inputs', () => {
    const types = ['text', 'password', 'search', 'tel', 'email', 'url', null];

    it('should find aria-labelledby', () => {
      types.forEach(function (type) {
        const t = type ? ' type="' + type + '"' : '';
        fixture.innerHTML = html`
          <div id="t1">Hello</div>
          <div id="t2">World</div>
          <input ${t} aria-labelledby="t1 t2" />
        `;
        flatTreeSetup(fixture);

        const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
        expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
          'Hello World'
        );
      });
    });

    it('should find aria-label', () => {
      types.forEach(function (type) {
        const t = type ? ' type="' + type + '"' : '';
        fixture.innerHTML = `<input ${t} aria-label="Hello World">`;
        flatTreeSetup(fixture);

        const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
        expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
          'Hello World'
        );
      });
    });

    it('should find an implicit label', () => {
      types.forEach(function (type) {
        const t = type ? ' type="' + type + '"' : '';
        fixture.innerHTML = `<label for="t1">Hello World<input ${t}></label>`;
        flatTreeSetup(fixture);

        const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
        expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
          'Hello World'
        );
      });
    });

    it('should find an explicit label', () => {
      types.forEach(function (type) {
        const t = type ? ' type="' + type + '"' : '';
        fixture.innerHTML = `<label for="t1">Hello World</label><input ${t} id="t1">`;
        flatTreeSetup(fixture);

        const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
        expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
          'Hello World'
        );
      });
    });

    it('should find implicit labels with id that does not match to a label', () => {
      types.forEach(function (type) {
        const t = type ? ' type="' + type + '"' : '';
        fixture.innerHTML = `<label for="t1">Hello World<input ${t} id="foo"></label>`;
        flatTreeSetup(fixture);

        const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
        expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
          'Hello World'
        );
      });
    });

    it('should find a placeholder attribute', () => {
      types.forEach(function (type) {
        const t = type ? ' type="' + type + '"' : '';
        fixture.innerHTML = `<input ${t} placeholder="Hello World">`;
        flatTreeSetup(fixture);

        const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
        expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
          'Hello World'
        );
      });
    });

    it('should find a title attribute', () => {
      types.forEach(function (type) {
        const t = type ? ' type="' + type + '"' : '';
        fixture.innerHTML = `<input ${t} title="Hello World">`;
        flatTreeSetup(fixture);

        const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
        expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
          'Hello World'
        );
      });
    });

    it('should otherwise be empty string', () => {
      types.forEach(function (type) {
        const t = type ? ' type="' + type + '"' : '';
        fixture.innerHTML = `<input ${t}>`;
        flatTreeSetup(fixture);

        const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
        expect(axe.commons.text.accessibleTextVirtual(target)).toBe('');
      });
    });
  });

  describe('textarea', () => {
    it('should find aria-labelledby', () => {
      fixture.innerHTML = html`
        <div id="t1">Hello</div>
        <div id="t2">World</div>
        <textarea aria-labelledby="t1 t2"></textarea>
      `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'textarea')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should find aria-label', () => {
      fixture.innerHTML = html`
        <textarea aria-label="Hello World"></textarea>
      `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'textarea')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should find an implicit label', () => {
      fixture.innerHTML = `<label for="t1">Hello World<textarea></textarea></label>`;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'textarea')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should find an explicit label', () => {
      fixture.innerHTML = `<label for="t1">Hello World</label><textarea id="t1"></textarea>`;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'textarea')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should find a placeholder attribute', () => {
      fixture.innerHTML = html`
        <textarea placeholder="Hello World"></textarea>
      `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'textarea')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should find a title attribute', () => {
      fixture.innerHTML = html` <textarea title="Hello World"></textarea> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'textarea')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should otherwise be empty string', () => {
      fixture.innerHTML = html` <textarea></textarea> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'textarea')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe('');
    });
  });

  describe('image inputs', () => {
    it('should find aria-labelledby', () => {
      fixture.innerHTML = html`
        <div id="t1">Hello</div>
        <div id="t2">World</div>
        <input type="image" aria-labelledby="t1 t2" />
      `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should find aria-label', () => {
      fixture.innerHTML = html`
        <input type="image" aria-label="Hello World" />
      `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should find an alt attribute', () => {
      fixture.innerHTML = html` <input type="image" alt="Hello World" /> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should find a title attribute', () => {
      fixture.innerHTML = html` <input type="image" title="Hello World" /> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should otherwise be "Submit" string', () => {
      fixture.innerHTML = html` <input type="image" /> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'input')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe('Submit');
    });
  });

  describe('a', () => {
    it('should find aria-labelledby', () => {
      fixture.innerHTML = html`
        <div id="t1">Hello</div>
        <div id="t2">World</div>
        <a aria-labelledby="t1 t2"></a>
      `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'a')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should find aria-label', () => {
      fixture.innerHTML = html` <a aria-label="Hello World"></a> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'a')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should check subtree', () => {
      fixture.innerHTML = html`
        <a
          ><span>Hello<span> World</span></span></a
        >
      `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'a')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should find a title attribute', () => {
      fixture.innerHTML = html` <a title="Hello World"></a> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'a')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should otherwise be empty string', () => {
      fixture.innerHTML = html` <a></a> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'a')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe('');
    });

    it('should use text from a table with a single cell and role=presentation', () => {
      fixture.innerHTML = html`
        <a href="example.html">
          <table role="presentation">
            <tr>
              <td>Descriptive Link Text</td>
            </tr>
          </table>
        </a>
      `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'a')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Descriptive Link Text'
      );
    });
  });

  describe('button', () => {
    it('should find aria-labelledby', () => {
      fixture.innerHTML = html`
        <div id="t1">Hello</div>
        <div id="t2">World</div>
        <button aria-labelledby="t1 t2"></button>
      `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'button')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should find aria-label', () => {
      fixture.innerHTML = html` <button aria-label="Hello World"></button> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'button')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should check subtree', () => {
      fixture.innerHTML =
        '<button><span>Hello<span> World</span></span></button>';
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'button')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should find a title attribute', () => {
      fixture.innerHTML = html` <button title="Hello World"></button> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'button')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe(
        'Hello World'
      );
    });

    it('should otherwise be empty string', () => {
      fixture.innerHTML = html` <button></button> `;
      flatTreeSetup(fixture);

      const target = axe.utils.querySelectorAll(axe._tree, 'button')[0];
      expect(axe.commons.text.accessibleTextVirtual(target)).toBe('');
    });
  });

  describe('text level semantics', () => {
    const tags = [
      'em',
      'strong',
      'small',
      's',
      'cite',
      'q',
      'dfn',
      'abbr',
      'time',
      'code',
      'var',
      'samp',
      'kbd',
      'sub',
      'sup',
      'i',
      'b',
      'u',
      'mark',
      'ruby',
      'rt',
      'rp',
      'bdi',
      'bdo',
      'br',
      'wbr'
    ];

    it('should find aria-labelledby', () => {
      tags.forEach(function (tag) {
        fixture.innerHTML = html`
          <div id="t1">Hello</div>
          <div id="t2">World</div>
        `;
        flatTreeSetup(fixture);

        const elm = document.createElement(tag);
        elm.setAttribute('aria-labelledby', 't1 t2');
        elm.style.display = 'inline'; // Firefox hides some of these elements because reasons...
        fixture.appendChild(elm);
        flatTreeSetup(fixture);

        const target = axe.utils.getNodeFromTree(elm);
        const result = axe.commons.text.accessibleTextVirtual(target);
        expect(result).toBe('Hello World');
      });
    });

    it('should find aria-label', () => {
      tags.forEach(function (tag) {
        const elm = document.createElement(tag);
        elm.setAttribute('aria-label', 'Hello World');
        elm.style.display = 'inline'; // Firefox hack, see above
        fixture.appendChild(elm);
        flatTreeSetup(fixture);

        const target = axe.utils.getNodeFromTree(elm);
        const result = axe.commons.text.accessibleTextVirtual(target);
        expect(result).toBe('Hello World');
      });
    });

    it('should find a title attribute', () => {
      tags.forEach(function (tag) {
        const elm = document.createElement(tag);
        elm.setAttribute('title', 'Hello World');
        elm.style.display = 'inline'; // Firefox hack, see above
        fixture.appendChild(elm);
        flatTreeSetup(fixture);

        const target = axe.utils.getNodeFromTree(elm);
        const result = axe.commons.text.accessibleTextVirtual(target);
        expect(result).toBe('Hello World');
      });
    });

    it('should otherwise be empty string', () => {
      tags.forEach(function (tag) {
        fixture.innerHTML = `<${tag}></${tag}>`;
        flatTreeSetup(fixture);

        const target = axe.utils.querySelectorAll(axe._tree, tag)[0];
        expect(axe.commons.text.accessibleTextVirtual(target)).toBe('');
      });
    });

    it('inserts a space before img alt text', () => {
      const accessibleText = axe.commons.text.accessibleText;
      fixture.innerHTML =
        '<a id="test" href="../images/index.html">Images tool test page<img id="img18" aria-label="aria-label text" alt="logo" src="../images/Accessibility.jpg" width="50" height="50"></a>';
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe(
        'Images tool test page aria-label text'
      );
    });
  });

  describe('text.accessibleText acceptance tests', () => {
    // Tests borrowed from the AccName 1.1 testing docs
    // https://www.w3.org/wiki/AccName_1.1_Testable_Statements#Name_test_case_539

    const ariaValuetext = xit; // Not acc supported
    const pseudoText = xit; // Not acc supported

    const accessibleText = axe.commons.text.accessibleText;
    let _unsupported;

    beforeAll(() => {
      _unsupported = axe.commons.text.unsupported.accessibleNameFromFieldValue;
      axe.commons.text.unsupported.accessibleNameFromFieldValue = [];
    });
    afterAll(() => {
      axe.commons.text.unsupported.accessibleNameFromFieldValue = _unsupported;
    });

    afterEach(() => {
      fixture.innerHTML = html``;
      axe._tree = null;
    });

    it('passes test 1', () => {
      fixture.innerHTML = html`
        <input type="button" aria-label="Rich" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Rich');
    });

    it('passes test 2', () => {
      fixture.innerHTML = html`
        <div id="ID1">Rich's button</div>
        <input type="button" aria-labelledby="ID1" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe("Rich's button");
    });

    it('passes test 3', () => {
      fixture.innerHTML = html`
        <div id="ID1">Rich's button</div>
        <input type="button" aria-label="bar" aria-labelledby="ID1" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe("Rich's button");
    });

    it('passes test 4', () => {
      fixture.innerHTML = html` <input type="reset" id="test" /> `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Reset');
    });

    it('passes test 5', () => {
      fixture.innerHTML = html` <input type="button" id="test" value="foo" /> `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo');
    });

    it('passes test 6', () => {
      fixture.innerHTML =
        '<input src="baz.html" type="image" id="test" alt="foo"/>';
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo');
    });

    it('passes test 7', () => {
      fixture.innerHTML = html`
        <label for="test">States:</label>
        <input type="text" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('States:');
    });

    it('passes test 8', () => {
      fixture.innerHTML = html`
        <label for="test">
          foo
          <input type="text" value="David" />
        </label>
        <input type="text" id="test" value="baz" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo David');
    });

    it('passes test 9', () => {
      fixture.innerHTML = html`
        <label for="test">
          crazy
          <select name="member" size="1" role="menu" tabindex="0">
            <option role="menuitem" value="beard" selected="true">clown</option>
            <option role="menuitem" value="scuba">rich</option>
          </select>
        </label>
        <input type="text" id="test" value="baz" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy');
    });

    ariaValuetext('passes test 10', () => {
      fixture.innerHTML = html`
        <label for="test">
          crazy
          <div
            role="spinbutton"
            aria-valuetext="Monday"
            aria-valuemin="1"
            aria-valuemax="7"
            aria-valuenow="4"
          ></div>
        </label>
        <input type="text" id="test" value="baz" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy Monday');
    });

    it('passes test 11', () => {
      fixture.innerHTML = html`
        <label for="test">
          crazy
          <div
            role="spinbutton"
            aria-valuemin="1"
            aria-valuemax="7"
            aria-valuenow="4"
          ></div>
        </label>
        <input type="text" id="test" value="baz" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy 4');
    });

    it('passes test 12', () => {
      fixture.innerHTML =
        '<input type="text" id="test" title="crazy" value="baz"/>';
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy');
    });

    pseudoText('passes test 13', () => {
      fixture.innerHTML = html`
        <style>
          label:before {
            content: 'fancy ';
          }
        </style>
        <label for="test">fruit</label>
        <input type="text" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('fancy fruit');
    });

    pseudoText('passes test 14', () => {
      fixture.innerHTML = html`
        <style type="text/css">
          [data-after]:after {
            content: attr(data-after);
          }
        </style>
        <label for="test" data-after="test content"></label>
        <input type="text" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('test content');
    });

    it('passes test 15', () => {
      fixture.innerHTML = html`
        <img id="test" src="foo.jpg" aria-label="1" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('1');
    });

    it('passes test 16', () => {
      fixture.innerHTML =
        '<img id="test" src="foo.jpg" aria-label="1" alt="a" title="t"/>';
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('1');
    });

    // To the best of my knowledge, this test is incorrect
    // Chrome and Firefox seem to return "peanuts", so does axe-core.
    xit('passes test 17', () => {
      fixture.innerHTML = html`
        <input type="text" value="peanuts" id="test" />
        <img aria-labelledby="test" src="foo.jpg" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('');
    });

    it('passes test 18', () => {
      fixture.innerHTML =
        '<img id="test" aria-labelledby="test" src="foo.jpg"/>';
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('');
    });

    // To the best of my knowledge, this test is incorrect
    // Chrome and Firefox seem to return "peanuts", so does axe-core.
    xit('passes test 19', () => {
      fixture.innerHTML = html`
        <input type="text" value="peanuts" id="test" />
        <img aria-labelledby="test" aria-label="1" src="foo.jpg" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('');
    });

    it('passes test 20', () => {
      fixture.innerHTML =
        '<img id="test" aria-labelledby="test" aria-label="1" src="foo.jpg"/>';
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('1');
    });

    it('passes test 21', () => {
      fixture.innerHTML = html`
        <input type="text" value="peanuts" id="ID1" />
        <input type="text" value="popcorn" id="ID2" />
        <input type="text" value="apple jacks" id="ID3" />
        <img aria-labelledby="ID1 ID2 ID3" id="test" src="foo.jpg" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('peanuts popcorn apple jacks');
    });

    it('passes test 22', () => {
      fixture.innerHTML = html`
        <input type="text" value="peanuts" id="ID1" />
        <img
          id="test"
          aria-label="l"
          aria-labelledby="test ID1"
          src="foo.jpg"
        />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('l peanuts');
    });

    it('passes test 23', () => {
      fixture.innerHTML = html`
        <input type="text" value="peanuts" id="ID1" />
        <input type="text" value="popcorn" id="ID2" />
        <img
          id="test"
          aria-label="l"
          aria-labelledby="test ID1 ID2"
          src="foo.jpg"
        />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('l peanuts popcorn');
    });

    it('passes test 24', () => {
      fixture.innerHTML = html`
        <input type="text" value="peanuts" id="ID1" />
        <input type="text" value="popcorn" id="ID2" />
        <input type="text" value="apple jacks" id="ID3" />
        <img
          id="test"
          aria-label="l"
          aria-labelledby="test ID1 ID2 ID3"
          alt="a"
          title="t"
          src="foo.jpg"
        />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('l peanuts popcorn apple jacks');
    });

    it('passes test 25', () => {
      fixture.innerHTML = html`
        <input type="text" value="peanuts" id="ID1" />
        <input type="text" value="popcorn" id="ID2" />
        <input type="text" value="apple jacks" id="ID3" />
        <img
          id="test"
          aria-label=""
          aria-labelledby="test ID1 ID2 ID3"
          alt=""
          title="t"
          src="foo.jpg"
        />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('t peanuts popcorn apple jacks');
    });

    it('passes test 26', () => {
      fixture.innerHTML = html`
        <div id="test" aria-labelledby="ID1">foo</div>
        <span id="ID1">bar</span>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('bar');
    });

    it('passes test 27', () => {
      fixture.innerHTML = html` <div id="test" aria-label="Tag">foo</div> `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Tag');
    });

    it('passes test 28', () => {
      fixture.innerHTML = html`
        <div id="test" aria-labelledby="ID1" aria-label="Tag">foo</div>
        <span id="ID1">bar</span>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('bar');
    });

    it('passes test 29', () => {
      fixture.innerHTML = html`
        <div id="test" aria-labelledby="ID0 ID1" aria-label="Tag">foo</div>
        <span id="ID0">bar</span>
        <span id="ID1">baz</span>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('bar baz');
    });

    // Should only pass in strict mode
    it('passes test 30', () => {
      fixture.innerHTML = html` <div id="test">Div with text</div> `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target, { strict: true })).toBe('');
    });

    it('passes test 31', () => {
      fixture.innerHTML = html` <div id="test" role="button">foo</div> `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo');
    });

    it('passes test 32', () => {
      fixture.innerHTML = html`
        <div
          id="test"
          role="button"
          title="Tag"
          style="outline:medium solid black; width:2em; height:1em;"
        ></div>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Tag');
    });

    it('passes test 33', () => {
      fixture.innerHTML = html`
        <div id="ID1">foo</div>
        <a id="test" href="test.html" aria-labelledby="ID1">bar</a>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo');
    });

    it('passes test 34', () => {
      fixture.innerHTML = html`
        <a id="test" href="test.html" aria-label="Tag">ABC</a>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Tag');
    });

    it('passes test 35', () => {
      fixture.innerHTML = html`
        <a href="test.html" id="test" aria-labelledby="ID1" aria-label="Tag"
          >foo</a
        >
        <p id="ID1">bar</p>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('bar');
    });

    it('passes test 36', () => {
      fixture.innerHTML = html`
        <a
          href="test.html"
          id="test"
          aria-labelledby="test ID1"
          aria-label="Tag"
        ></a>
        <p id="ID1">foo</p>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Tag foo');
    });

    it('passes test 37', () => {
      fixture.innerHTML = html` <a href="test.html" id="test">ABC</a> `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('ABC');
    });

    it('passes test 38', () => {
      fixture.innerHTML = html`
        <a href="test.html" id="test" title="Tag"></a>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Tag');
    });

    it('passes test 39', () => {
      fixture.innerHTML = html`
        <input id="test" type="text" aria-labelledby="ID1 ID2 ID3" />
        <p id="ID1">foo</p>
        <p id="ID2">bar</p>
        <p id="ID3">baz</p>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo bar baz');
    });

    it('passes test 40', () => {
      fixture.innerHTML = html`
        <input id="test" type="text" aria-label="bar" aria-labelledby="ID1 test">
        <div id="ID1">foo</label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo bar');
    });

    it('passes test 41', () => {
      fixture.innerHTML = html`
        <input id="test" type="text" />
        <label for="test">foo</label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo');
    });

    it('passes test 42', () => {
      fixture.innerHTML = html`
        <input type="password" id="test" />
        <label for="test">foo</label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo');
    });

    it('passes test 43', () => {
      fixture.innerHTML = html`
        <input type="checkbox" id="test">
        <label for="test">foo</label></body>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo');
    });

    it('passes test 44', () => {
      fixture.innerHTML = html`
        <input type="radio" id="test" />
        <label for="test">foo</label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo');
    });

    it('passes test 45', () => {
      fixture.innerHTML = html`
        <input type="file" id="test" />
        <label for="test">foo</label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo');
    });

    it('passes test 46', () => {
      fixture.innerHTML = html`
        <input type="image" id="test" />
        <label for="test">foo</label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo');
    });

    it('passes test 47', () => {
      fixture.innerHTML = html`
        <input type="checkbox" id="test" />
        <label for="test">foo<input type="text" value="bar" />baz</label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo bar baz');
    });

    it('passes test 48', () => {
      fixture.innerHTML = html`
        <input type="text" id="test" />
        <label for="test">foo<input type="text" value="bar" />baz</label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo bar baz');
    });

    it('passes test 49', () => {
      fixture.innerHTML = html`
        <input type="password" id="test" />
        <label for="test">foo<input type="text" value="bar" />baz</label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo bar baz');
    });

    it('passes test 50', () => {
      fixture.innerHTML = html`
        <input type="radio" id="test" />
        <label for="test">foo<input type="text" value="bar" />baz</label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo bar baz');
    });

    it('passes test 51', () => {
      fixture.innerHTML = html`
        <input type="file" id="test" />
        <label for="test">foo <input type="text" value="bar" /> baz</label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo bar baz');
    });

    pseudoText('passes test 52', () => {
      fixture.innerHTML = html`
        <style type="text/css">
          label:before {
            content: 'foo';
          }
          label:after {
            content: 'baz';
          }
        </style>
        <form>
          <label for="test" title="bar"
            ><input id="test" type="text" name="test" title="buz"
          /></label>
        </form>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo bar baz');
    });

    pseudoText('passes test 53', () => {
      fixture.innerHTML = html`
        <style type="text/css">
          label:before {
            content: 'foo';
          }
          label:after {
            content: 'baz';
          }
        </style>
        <form>
          <label for="test" title="bar"
            ><input id="test" type="password" name="test" title="buz"
          /></label>
        </form>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo bar baz');
    });

    pseudoText('passes test 54', () => {
      fixture.innerHTML = html`
        <style type="text/css">
          label:before {
            content: 'foo';
          }
          label:after {
            content: 'baz';
          }
        </style>
        <form>
          <label for="test"
            ><input id="test" type="checkbox" name="test" title=" bar "
          /></label>
        </form>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo baz');
    });

    pseudoText('passes test 55', () => {
      fixture.innerHTML = html`
        <style type="text/css">
          label:before {
            content: 'foo';
          }
          label:after {
            content: 'baz';
          }
        </style>
        <form>
          <label for="test"
            ><input id="test" type="radio" name="test" title=" bar "
          /></label>
        </form>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo baz');
    });

    pseudoText('passes test 56', () => {
      fixture.innerHTML = html`
        <style type="text/css">
          label:before {
            content: 'foo';
          }
          label:after {
            content: 'baz';
          }
        </style>
        <form>
          <label for="test"
            ><input id="test" type="file" name="test" title="bar"
          /></label>
        </form>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo baz');
    });

    pseudoText('passes test 57', () => {
      fixture.innerHTML = html`
        <style type="text/css">
          label:before {
            content: 'foo';
          }
          label:after {
            content: 'baz';
          }
        </style>
        <form>
          <label for="test"
            ><input
              id="test"
              type="image"
              src="foo.jpg"
              name="test"
              title="bar"
          /></label>
        </form>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo baz');
    });

    it('passes test 58', () => {
      fixture.innerHTML = html`
        <label for="test">States:</label>
        <input type="password" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('States:');
    });

    it('passes test 59', () => {
      fixture.innerHTML = html`
        <label for="test">States:</label>
        <input type="checkbox" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('States:');
    });

    it('passes test 60', () => {
      fixture.innerHTML =
        '<label for="test">States:</label><input type="radio" id="test"/>';
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('States:');
    });

    it('passes test 61', () => {
      fixture.innerHTML =
        '<label for="test">File:</label><input type="file" id="test"/>';
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('File:');
    });

    it('passes test 62', () => {
      fixture.innerHTML = html`
        <label for="test">States:</label>
        <input type="image" id="test" src="foo.jpg" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('States:');
    });

    it('passes test 63', () => {
      fixture.innerHTML = html`
        <label for="test">
          foo
          <input type="text" value="David" />
        </label>
        <input type="password" id="test" value="baz" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo David');
    });

    it('passes test 64', () => {
      fixture.innerHTML = html`
        <label for="test">
          foo
          <input type="text" value="David" />
        </label>
        <input type="checkbox" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo David');
    });

    it('passes test 65', () => {
      fixture.innerHTML = html`
        <label for="test">
          foo
          <input type="text" value="David" />
        </label>
        <input type="radio" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo David');
    });

    it('passes test 66', () => {
      fixture.innerHTML = html`
        <label for="test">
          foo
          <input type="text" value="David" />
        </label>
        <input type="file" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo David');
    });

    it('passes test 67', () => {
      fixture.innerHTML = html`
        <label for="test">
          foo
          <input type="text" value="David" />
        </label>
        <input type="image" id="test" src="foo.jpg" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo David');
    });

    it('passes test 68', () => {
      fixture.innerHTML = html`
        <label for="test">
          crazy
          <select name="member" size="1" role="menu" tabindex="0">
            <option role="menuitem" value="beard" selected="true">clown</option>
            <option role="menuitem" value="scuba">rich</option>
          </select>
        </label>
        <input type="password" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy');
    });

    it('passes test 69', () => {
      fixture.innerHTML = html`
        <label for="test">
          crazy
          <select name="member" size="1" role="menu" tabindex="0">
            <option role="menuitem" value="beard" selected="true">clown</option>
            <option role="menuitem" value="scuba">rich</option>
          </select>
        </label>
        <input type="checkbox" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy');
    });

    it('passes test 70', () => {
      fixture.innerHTML = html`
        <label for="test">
          crazy
          <select name="member" size="1" role="menu" tabindex="0">
            <option role="menuitem" value="beard" selected="true">clown</option>
            <option role="menuitem" value="scuba">rich</option>
          </select>
        </label>
        <input type="radio" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy');
    });

    it('passes test 71', () => {
      fixture.innerHTML = html`
        <label for="test">
          crazy
          <select name="member" size="1" role="menu" tabindex="0">
            <option role="menuitem" value="beard" selected="true">clown</option>
            <option role="menuitem" value="scuba">rich</option>
          </select>
        </label>
        <input type="file" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy');
    });

    it('passes test 72', () => {
      fixture.innerHTML = html`
        <label for="test">
          crazy
          <select name="member" size="1" role="menu" tabindex="0">
            <option role="menuitem" value="beard" selected="true">clown</option>
            <option role="menuitem" value="scuba">rich</option>
          </select>
        </label>
        <input type="image" id="test" src="foo.jpg" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy');
    });

    ariaValuetext('passes test 73', () => {
      fixture.innerHTML = html`
        <label for="test">
          crazy
          <div
            role="spinbutton"
            aria-valuetext="Monday"
            aria-valuemin="1"
            aria-valuemax="7"
            aria-valuenow="4"
          ></div>
        </label>
        <input type="password" value="baz" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy Monday');
    });

    ariaValuetext('passes test 74', () => {
      fixture.innerHTML = html`
        <label for="test">
          crazy
          <div
            role="spinbutton"
            aria-valuetext="Monday"
            aria-valuemin="1"
            aria-valuemax="7"
            aria-valuenow="4"
          ></div>
        </label>
        <input type="checkbox" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy Monday');
    });

    ariaValuetext('passes test 75', () => {
      fixture.innerHTML = html`
        <label for="test">
          crazy
          <div
            role="spinbutton"
            aria-valuetext="Monday"
            aria-valuemin="1"
            aria-valuemax="7"
            aria-valuenow="4"
          ></div>
        </label>
        <input type="radio" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy Monday');
    });

    ariaValuetext('passes test 76', () => {
      fixture.innerHTML = html`
        <label for="test">
          crazy
          <div
            role="spinbutton"
            aria-valuetext="Monday"
            aria-valuemin="1"
            aria-valuemax="7"
            aria-valuenow="4"
          ></div>
        </label>
        <input type="file" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy Monday');
    });

    ariaValuetext('passes test 77', () => {
      fixture.innerHTML = html`
        <label for="test">
          crazy
          <div
            role="spinbutton"
            aria-valuetext="Monday"
            aria-valuemin="1"
            aria-valuemax="7"
            aria-valuenow="4"
          ></div>
        </label>
        <input type="image" src="foo.jpg" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy Monday');
    });

    it('passes test 78', () => {
      fixture.innerHTML = html`
        <label for="test">
          crazy
          <div
            role="spinbutton"
            aria-valuemin="1"
            aria-valuemax="7"
            aria-valuenow="4"
          ></div>
        </label>
        <input type="password" id="test" value="baz" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy 4');
    });

    it('passes test 79', () => {
      fixture.innerHTML = html`
        <label for="test">
          crazy
          <div
            role="spinbutton"
            aria-valuemin="1"
            aria-valuemax="7"
            aria-valuenow="4"
          ></div>
        </label>
        <input type="checkbox" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy 4');
    });

    it('passes test 80', () => {
      fixture.innerHTML = html`
        <label for="test">
          crazy
          <div
            role="spinbutton"
            aria-valuemin="1"
            aria-valuemax="7"
            aria-valuenow="4"
          ></div>
        </label>
        <input type="radio" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy 4');
    });

    it('passes test 81', () => {
      fixture.innerHTML = html`
        <label for="test">
          crazy
          <div
            role="spinbutton"
            aria-valuemin="1"
            aria-valuemax="7"
            aria-valuenow="4"
          ></div>
        </label>
        <input type="file" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy 4');
    });

    it('passes test 82', () => {
      fixture.innerHTML = html`
        <label for="test">
          crazy
          <div
            role="spinbutton"
            aria-valuemin="1"
            aria-valuemax="7"
            aria-valuenow="4"
          ></div>
        </label>
        <input type="image" src="foo.jpg" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy 4');
    });

    it('passes test 83', () => {
      fixture.innerHTML =
        '<input type="password" id="test" title="crazy" value="baz"/>';
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy');
    });

    it('passes test 84', () => {
      fixture.innerHTML = html`
        <input type="checkbox" id="test" title="crazy" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy');
    });

    it('passes test 85', () => {
      fixture.innerHTML = html`
        <input type="radio" id="test" title="crazy" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy');
    });

    it('passes test 86', () => {
      fixture.innerHTML = html` <input type="file" id="test" title="crazy" /> `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy');
    });

    it('passes test 87', () => {
      fixture.innerHTML =
        '<input type="image" src="foo.jpg" id="test" title="crazy"/>';
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('crazy');
    });

    pseudoText('passes test 88', () => {
      fixture.innerHTML = html`
        <style>
          label:before {
            content: 'fancy ';
          }
        </style>
        <label for="test">fruit</label>
        <input type="password" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('fancy fruit');
    });

    pseudoText('passes test 89', () => {
      fixture.innerHTML = html`
        <style>
          label:before {
            content: 'fancy ';
          }
        </style>
        <label for="test">fruit</label>
        <input type="checkbox" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('fancy fruit');
    });

    pseudoText('passes test 90', () => {
      fixture.innerHTML = html`
        <style>
          label:before {
            content: 'fancy ';
          }
        </style>
        <label for="test">fruit</label>
        <input type="radio" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('fancy fruit');
    });

    pseudoText('passes test 91', () => {
      fixture.innerHTML = html`
        <style>
          label:before {
            content: 'fancy ';
          }
        </style>
        <label for="test">fruit</label>
        <input type="file" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('fancy fruit');
    });

    pseudoText('passes test 92', () => {
      fixture.innerHTML = html`
        <style>
          label:before {
            content: 'fancy ';
          }
        </style>
        <label for="test">fruit</label>
        <input type="image" src="foo.jpg" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('fancy fruit');
    });

    pseudoText('passes test 93', () => {
      fixture.innerHTML = html`
        <style>
          label:after {
            content: ' fruit';
          }
        </style>
        <label for="test">fancy</label>
        <input type="password" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('fancy fruit');
    });

    pseudoText('passes test 94', () => {
      fixture.innerHTML = html`
        <style>
          label:after {
            content: ' fruit';
          }
        </style>
        <label for="test">fancy</label>
        <input type="checkbox" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('fancy fruit');
    });

    pseudoText('passes test 95', () => {
      fixture.innerHTML = html`
        <style>
          label:after {
            content: ' fruit';
          }
        </style>
        <label for="test">fancy</label>
        <input type="radio" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('fancy fruit');
    });

    pseudoText('passes test 96', () => {
      fixture.innerHTML = html`
        <style>
          label:after {
            content: ' fruit';
          }
        </style>
        <label for="test">fancy</label>
        <input type="file" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('fancy fruit');
    });

    pseudoText('passes test 97', () => {
      fixture.innerHTML = html`
        <style>
          label:after {
            content: ' fruit';
          }
        </style>
        <label for="test">fancy</label>
        <input type="image" src="foo.jpg" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('fancy fruit');
    });

    it('passes test 98', () => {
      fixture.innerHTML = html`
        <input type="checkbox" id="test" />
        <label for="test"
          >Flash the screen
          <div role="combobox">
            <div role="textbox"></div>
            <ul role="listbox" style="list-style-type: none;">
              <li role="option" aria-selected="true">1</li>
              <li role="option">2</li>
              <li role="option">3</li>
            </ul>
          </div>
          times.
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Flash the screen 1 times.');
    });

    it('passes test 99', () => {
      fixture.innerHTML = html`
        <input type="checkbox" id="test" />
        <label for="test"
          >Flash the screen
          <span role="menu">
            <span role="menuitem" aria-selected="true">1</span>
            <span role="menuitem" hidden>2</span>
            <span role="menuitem" hidden>3</span>
          </span>
          times.
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Flash the screen times.');
    });

    it('passes test 100', () => {
      fixture.innerHTML = html`
        <input type="checkbox" id="test" />
        <label for="test"
          >Flash the screen
          <select size="1">
            <option selected="selected">1</option>
            <option>2</option>
            <option>3</option>
          </select>
          times.
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Flash the screen 1 times.');
    });

    it('passes test 101', () => {
      fixture.innerHTML = html`
        <input type="checkbox" id="test" />
        <label for="test"
          >foo
          <input
            role="slider"
            type="range"
            value="5"
            min="1"
            max="10"
            aria-valuenow="5"
            aria-valuemin="1"
            aria-valuemax="10"
          />
          baz
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo 5 baz');
    });

    it('passes test 102', () => {
      fixture.innerHTML = html`
        <input type="checkbox" id="test" />
        <label for="test"
          >foo
          <input
            role="spinbutton"
            type="number"
            value="5"
            min="1"
            max="10"
            aria-valuenow="5"
            aria-valuemin="1"
            aria-valuemax="10"
          />
          baz
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo 5 baz');
    });

    it('passes test 103', () => {
      fixture.innerHTML = html`
        <input type="checkbox" id="test" title="foo" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo');
    });

    it('passes test 104', () => {
      fixture.innerHTML = html`
        <input type="file" id="test" />
        <label for="test"
          >Flash the screen
          <div role="combobox">
            <div role="textbox"></div>
            <ul role="listbox" style="list-style-type: none;">
              <li role="option" aria-selected="true">1</li>
              <li role="option">2</li>
              <li role="option">3</li>
            </ul>
          </div>
          times.
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Flash the screen 1 times.');
    });

    it('passes test 105', () => {
      fixture.innerHTML = html`
        <input type="file" id="test" />
        <label for="test"
          >Flash the screen
          <span role="menu">
            <span role="menuitem" aria-selected="true">1</span>
            <span role="menuitem" hidden>2</span>
            <span role="menuitem" hidden>3</span>
          </span>
          times.
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Flash the screen times.');
    });

    it('passes test 106', () => {
      fixture.innerHTML = html`
        <input type="file" id="test" />
        <label for="test"
          >Flash the screen
          <select size="1">
            <option selected="selected">1</option>
            <option>2</option>
            <option>3</option>
          </select>
          times.
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Flash the screen 1 times.');
    });

    it('passes test 107', () => {
      fixture.innerHTML = html`
        <input type="file" id="test" />
        <label for="test"
          >foo
          <input
            role="slider"
            type="range"
            value="5"
            min="1"
            max="10"
            aria-valuenow="5"
            aria-valuemin="1"
            aria-valuemax="10"
          />
          baz
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo 5 baz');
    });

    it('passes test 108', () => {
      fixture.innerHTML = html`
        <input type="file" id="test" />
        <label for="test"
          >foo
          <input
            role="spinbutton"
            type="number"
            value="5"
            min="1"
            max="10"
            aria-valuenow="5"
            aria-valuemin="1"
            aria-valuemax="10"
          />
          baz
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo 5 baz');
    });

    it('passes test 109', () => {
      fixture.innerHTML = html` <input type="file" id="test" title="foo" /> `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo');
    });

    it('passes test 110', () => {
      fixture.innerHTML =
        '<input type="image" src="test.png" id="test" title="foo" />';
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo');
    });

    it('passes test 111', () => {
      fixture.innerHTML = html`
        <input type="password" id="test" />
        <label for="test"
          >Flash the screen
          <div role="combobox">
            <div role="textbox"></div>
            <ul role="listbox" style="list-style-type: none;">
              <li role="option" aria-selected="true">1</li>
              <li role="option">2</li>
              <li role="option">3</li>
            </ul>
          </div>
          times.
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Flash the screen 1 times.');
    });

    it('passes test 112', () => {
      fixture.innerHTML = html`
        <input type="password" id="test" />
        <label for="test"
          >Flash the screen
          <span role="menu">
            <span role="menuitem" aria-selected="true">1</span>
            <span role="menuitem" hidden>2</span>
            <span role="menuitem" hidden>3</span>
          </span>
          times.
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Flash the screen times.');
    });

    it('passes test 113', () => {
      fixture.innerHTML = html`
        <input type="password" id="test" />
        <label for="test"
          >Flash the screen
          <select size="1">
            <option selected="selected">1</option>
            <option>2</option>
            <option>3</option>
          </select>
          times.
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Flash the screen 1 times.');
    });

    it('passes test 114', () => {
      fixture.innerHTML = html`
        <input type="password" id="test" />
        <label for="test"
          >foo
          <input
            role="slider"
            type="range"
            value="5"
            min="1"
            max="10"
            aria-valuenow="5"
            aria-valuemin="1"
            aria-valuemax="10"
          />
          baz
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo 5 baz');
    });

    it('passes test 115', () => {
      fixture.innerHTML = html`
        <input type="password" id="test" />
        <label for="test"
          >foo
          <input
            role="spinbutton"
            type="number"
            value="5"
            min="1"
            max="10"
            aria-valuenow="5"
            aria-valuemin="1"
            aria-valuemax="10"
          />
          baz
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo 5 baz');
    });

    it('passes test 116', () => {
      fixture.innerHTML = html`
        <input type="password" id="test" title="foo" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo');
    });

    it('passes test 117', () => {
      fixture.innerHTML = html`
        <input type="radio" id="test" />
        <label for="test"
          >Flash the screen
          <div role="combobox">
            <div role="textbox"></div>
            <ul role="listbox" style="list-style-type: none;">
              <li role="option" aria-selected="true">1</li>
              <li role="option">2</li>
              <li role="option">3</li>
            </ul>
          </div>
          times.
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Flash the screen 1 times.');
    });

    it('passes test 118', () => {
      fixture.innerHTML = html`
        <input type="radio" id="test" />
        <label for="test"
          >Flash the screen
          <span role="menu">
            <span role="menuitem" aria-selected="true">1</span>
            <span role="menuitem" hidden>2</span>
            <span role="menuitem" hidden>3</span>
          </span>
          times.
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Flash the screen times.');
    });

    it('passes test 119', () => {
      fixture.innerHTML = html`
        <input type="radio" id="test" />
        <label for="test"
          >Flash the screen
          <select size="1">
            <option selected="selected">1</option>
            <option>2</option>
            <option>3</option>
          </select>
          times.
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Flash the screen 1 times.');
    });

    it('passes test 120', () => {
      fixture.innerHTML = html`
        <input type="radio" id="test" />
        <label for="test"
          >foo
          <input
            role="slider"
            type="range"
            value="5"
            min="1"
            max="10"
            aria-valuenow="5"
            aria-valuemin="1"
            aria-valuemax="10"
          />
          baz
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo 5 baz');
    });

    it('passes test 121', () => {
      fixture.innerHTML = html`
        <input type="radio" id="test" />
        <label for="test"
          >foo
          <input
            role="spinbutton"
            type="number"
            value="5"
            min="1"
            max="10"
            aria-valuenow="5"
            aria-valuemin="1"
            aria-valuemax="10"
          />
          baz
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo 5 baz');
    });

    it('passes test 122', () => {
      fixture.innerHTML = html` <input type="radio" id="test" title="foo" /> `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo');
    });

    it('passes test 123', () => {
      fixture.innerHTML = html`
        <input type="text" id="test" />
        <label for="test"
          >Flash the screen
          <div role="combobox">
            <div role="textbox"></div>
            <ul role="listbox" style="list-style-type: none;">
              <li role="option" aria-selected="true">1</li>
              <li role="option">2</li>
              <li role="option">3</li>
            </ul>
          </div>
          times.
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Flash the screen 1 times.');
    });

    it('passes test 124', () => {
      fixture.innerHTML = html`
        <input type="text" id="test" />
        <label for="test"
          >Flash the screen
          <span role="menu">
            <span role="menuitem" aria-selected="true">1</span>
            <span role="menuitem" hidden>2</span>
            <span role="menuitem" hidden>3</span>
          </span>
          times.
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Flash the screen times.');
    });

    it('passes test 125', () => {
      fixture.innerHTML = html`
        <input type="text" id="test" />
        <label for="test"
          >Flash the screen
          <select size="1">
            <option selected="selected">1</option>
            <option>2</option>
            <option>3</option>
          </select>
          times.
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Flash the screen 1 times.');
    });

    it('passes test 126', () => {
      fixture.innerHTML = html`
        <input type="text" id="test" />
        <label for="test"
          >foo
          <input
            role="slider"
            type="range"
            value="5"
            min="1"
            max="10"
            aria-valuenow="5"
            aria-valuemin="1"
            aria-valuemax="10"
          />
          baz
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo 5 baz');
    });

    it('passes test 127', () => {
      fixture.innerHTML = html`
        <input type="text" id="test" />
        <label for="test"
          >foo
          <input
            role="spinbutton"
            type="number"
            value="5"
            min="1"
            max="10"
            aria-valuenow="5"
            aria-valuemin="1"
            aria-valuemax="10"
          />
          baz
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo 5 baz');
    });

    it('passes test 128', () => {
      fixture.innerHTML = html` <input type="text" id="test" title="foo" /> `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('foo');
    });

    // Skip from 128 - 138 as those are name description cases

    it('passes test 139', () => {
      fixture.innerHTML = html`
        <style>
          .hidden {
            display: none;
          }
        </style>
        <div id="test" role="link" tabindex="0">
          <span aria-hidden="true"><i> Hello, </i></span>
          <span>My</span> name is
          <div>
            <img src="file.jpg" title="Bryan" alt="" role="presentation" />
          </div>
          <span role="presentation" aria-label="Eli">
            <span aria-label="Garaventa">Zambino</span>
          </span>
          <span>the weird.</span>
          (QED)
          <span class="hidden"
            ><i><b>and don't you forget it.</b></i></span
          >
          <table>
            <tr>
              <td>Where</td>
              <td style="visibility:hidden;"><div>in</div></td>
              <td><div style="display:none;">the world</div></td>
              <td>are my marbles?</td>
            </tr>
          </table>
        </div>
      `;

      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      // Chrome 114: "My name is Garaventa the weird. (QED) Where are my marbles?""
      // Firefox 115: "My name is Bryan Eli the weird. (QED) Where are my marbles?"
      // Safari 16.5: "My name is Eli the weird. (QED) Where are my marbles?"
      expect(accessibleText(target)).toBe(
        'My name is Eli the weird. (QED) Where are my marbles?'
      );
    });

    it('passes test 140', () => {
      fixture.innerHTML = html`
        <style>
          .hidden {
            display: none;
          }
        </style>
        <input id="test" type="text" aria-labelledby="lblId" />
        <div id="lblId">
          <span aria-hidden="true"><i> Hello, </i></span>
          <span>My</span> name is
          <div>
            <img src="file.jpg" title="Bryan" alt="" role="presentation" />
          </div>
          <span role="presentation" aria-label="Eli">
            <span aria-label="Garaventa">Zambino</span>
          </span>
          <span>the weird.</span>
          (QED)
          <span class="hidden"
            ><i><b>and don't you forget it.</b></i></span
          >
          <table>
            <tr>
              <td>Where</td>
              <td style="visibility:hidden;"><div>in</div></td>
              <td><div style="display:none;">the world</div></td>
              <td>are my marbles?</td>
            </tr>
          </table>
        </div>
      `;

      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe(
        'My name is Eli the weird. (QED) Where are my marbles?'
      );
    });

    // Disabling this, axe has a buggy implicitName computation
    //  shouldn't be a big deal
    xit('passes test 141', () => {
      fixture.innerHTML = html`
        <style>
          .hidden {
            display: none;
          }
        </style>
        <input type="text" id="test" />
        <label for="test" id="label">
          <span aria-hidden="true"><i> Hello, </i></span>
          <span>My</span> name is
          <div>
            <img src="file.jpg" title="Bryan" alt="" role="presentation" />
          </div>
          <span role="presentation" aria-label="Eli">
            <span aria-label="Garaventa">Zambino</span>
          </span>
          <span>the weird.</span>
          (QED)
          <span class="hidden"
            ><i><b>and don't you forget it.</b></i></span
          >
          <table>
            <tr>
              <td>Where</td>
              <td style="visibility:hidden;"><div>in</div></td>
              <td><div style="display:none;">the world</div></td>
              <td>are my marbles?</td>
            </tr>
          </table>
        </label>
      `;

      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe(
        'My name is Eli the weird. (QED) Where are my marbles?'
      );
    });

    it('passes test 143', () => {
      fixture.innerHTML = html`
        <style>
          .hidden {
            display: none;
          }
        </style>
        <div>
          <input
            id="test"
            type="text"
            aria-labelledby="lbl1 lbl2"
            aria-describedby="descId"
          />
          <span>
            <span aria-hidden="true" id="lbl1">Important</span>
            <span class="hidden">
              <span aria-hidden="true" id="lbl2">stuff</span>
            </span>
          </span>
        </div>
        <div class="hidden">
          <div id="descId">
            <span aria-hidden="true"><i> Hello, </i></span>
            <span>My</span> name is
            <div>
              <img src="file.jpg" title="Bryan" alt="" role="presentation" />
            </div>
            <span role="presentation" aria-label="Eli">
              <span aria-label="Garaventa">Zambino</span>
            </span>
            <span>the weird.</span>
            (QED)
            <span class="hidden"
              ><i><b>and don't you forget it.</b></i></span
            >
            <table>
              <tr>
                <td>Where</td>
                <td style="visibility:hidden;"><div>in</div></td>
                <td><div style="display:none;">the world</div></td>
                <td>are my marbles?</td>
              </tr>
            </table>
          </div>
        </div>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Important stuff');
    });

    it('passes test 144', () => {
      fixture.innerHTML =
        '<input id="test" role="combobox" type="text" title="Choose your language" value="English">';
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Choose your language');
    });

    it('passes test 145', () => {
      fixture.innerHTML = html`
        <div
          id="test"
          role="combobox"
          tabindex="0"
          title="Choose your language."
        >
          <span> English </span>
        </div>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Choose your language.');
    });

    it('passes test 147', () => {
      fixture.innerHTML = html`
        <input type="checkbox" id="test" />
        <label for="test"
          >Flash the screen
          <ul role="listbox" style="list-style-type: none;">
            <li role="option" aria-selected="true">1</li>
            <li role="option">2</li>
            <li role="option">3</li>
          </ul>
          times.
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Flash the screen 1 times.');
    });

    pseudoText('passes test 148', () => {
      fixture.innerHTML = html`
        <input type="checkbox" id="test" />
        <label for="test"
          >Flash the screen
          <div role="textbox" contenteditable>1</div>
          times.
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Flash the screen 1 times.');
    });

    it('passes test 149', () => {
      fixture.innerHTML = html`
        <label for="test">a test</label>
        <label>This <input type="checkbox" id="test" /> is</label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('a test This is');
    });

    it('passes test 150', () => {
      fixture.innerHTML = html`
        <label>This <input type="checkbox" id="test" /> is</label>
        <label for="test">a test</label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('This is a test');
    });

    it('passes test 151', () => {
      fixture.innerHTML = html`
        <input type="file" id="test" />
        <label for="test"
          >W<i>h<b>a</b></i
          >t<br />is
          <div>
            your
            <div>name<b>?</b></div>
          </div></label
        >
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('What is your name?');
    });

    pseudoText('passes test 152', () => {
      fixture.innerHTML = html`
        <style>
          label:before {
            content: 'This';
            display: block;
          }
          label:after {
            content: '.';
          }
        </style>
        <label for="test">is a test</label>
        <input type="text" id="test" />
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('This is a test.');
    });

    it('passes test 153', () => {
      fixture.innerHTML = html`
        <style>
          .hidden {
            display: none;
          }
        </style>
        <input type="file" id="test" />
        <label for="test">
          <span class="hidden">1</span><span>2</span>
          <span style="visibility: hidden;">3</span><span>4</span>
          <span hidden>5</span><span>6</span> <span aria-hidden="true">7</span
          ><span>8</span> <span aria-hidden="false" class="hidden">9</span
          ><span>10</span>
        </label>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('2 4 6 8 10');
    });

    it('passes test 154', () => {
      fixture.innerHTML = html`
        <input type="file" id="test" />
        <label for="test"
          >Flash <span aria-owns="id1">the screen</span> times.</label
        >
        <div>
          <div id="id1" role="combobox" aria-owns="id2">
            <div role="textbox"></div>
          </div>
        </div>
        <div>
          <ul id="id2" role="listbox" style="list-style-type: none;">
            <li role="option">1</li>
            <li role="option" aria-selected="true">2</li>
            <li role="option">3</li>
          </ul>
        </div>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Flash the screen 2 times.');
    });

    it('passes test 155', () => {
      fixture.innerHTML = html`
        <input type="file" id="test" />
        <label for="test"
          >Flash <span aria-owns="id1">the screen</span> times.</label
        >
        <div id="id1">
          <div role="combobox">
            <div role="textbox"></div>
            <ul role="listbox" style="list-style-type: none;">
              <li role="option" aria-selected="true">1</li>
              <li role="option">2</li>
              <li role="option">3</li>
            </ul>
          </div>
        </div>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Flash the screen 1 times.');
    });

    it('passes test 156', () => {
      fixture.innerHTML = html`
        <style>
          .hidden {
            display: none;
          }
        </style>
        <div id="test" role="link" tabindex="0">
          <span aria-hidden="true"><i> Hello, </i></span>
          <span>My</span> name is
          <div>
            <img src="file.jpg" title="Bryan" alt="" role="presentation" />
          </div>
          <span role="presentation" aria-label="Eli"
            ><span aria-label="Garaventa">Zambino</span></span
          >
          <span>the weird.</span>
          (QED)
          <span class="hidden"
            ><i><b>and don't you forget it.</b></i></span
          >
        </div>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('My name is Eli the weird. (QED)');
    });

    it('passes test 158', () => {
      fixture.innerHTML = html`
        <a id="test" href="#" aria-label="California" title="San Francisco">
          United States
        </a>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('California');
    });

    it('passes test 159', () => {
      fixture.innerHTML = html`
        <h2 id="test">
          Country of origin:
          <input
            role="combobox"
            type="text"
            title="Choose your country."
            value="United States"
          />
        </h2>
      `;
      flatTreeSetup(fixture);
      const target = fixture.querySelector('#test');
      expect(accessibleText(target)).toBe('Country of origin: United States');
    });

    /**
	// In case anyone even wants it, here's the script used to generate these test cases
	function getTestCase(content, index = 0) {
		const regex = new RegExp('if given\n([^]*)\nthen the accessible name of the element with id of "(.*)" is "(.*)"')
		const out = content.match(regex)
		if (!out || out.length !== 4) {
			return;
		}

		const [, html, id, expected] = out;
		const strings = html.split(/\n/g).map(
			line => `'${line.substr(2)}'`
		).join(' +\n      ') + ';'

		return `
		it('passes test ${index + 1}', () => {
			fixture.innerHTML = ${strings}
			flatTreeSetup(fixture);
			const target = fixture.querySelector('#${id}');
			expect(accessibleText(target)).toBe('${expected}');
		});`
	}*/
  });
});
