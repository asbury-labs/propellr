import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
declare const checks: any;
describe('dlitem', function () {
  const fixture = document.getElementById('fixture');
  const checkSetup = axe.testUtils.checkSetup;
  const shadowSupport = axe.testUtils.shadowSupport;

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should pass if the dlitem has a parent <dl>', function () {
    const checkArgs = checkSetup('<dl><dt id="target">My list item</dt></dl>');

    expect(checks.dlitem.evaluate.apply(null, checkArgs)).toBe(true);
  });

  it('should fail if the dt element has an incorrect parent', function () {
    const checkArgs = checkSetup(
      '<video><dt id="target">My list item</dt></video>'
    );

    expect(checks.dlitem.evaluate.apply(null, checkArgs)).toBe(false);
  });

  it('should pass if the dt element has a parent <dl> with role="list"', function () {
    const checkArgs = checkSetup(
      '<dl role="list"><dt id="target">My list item</dt></dl>'
    );
    expect(checks.dlitem.evaluate.apply(null, checkArgs)).toBe(true);
  });

  it('should pass if the dt element has a parent <dl> with role="presentation"', function () {
    const checkArgs = checkSetup(
      '<dl role="presentation"><dt id="target">My list item</dt></dl>'
    );
    expect(checks.dlitem.evaluate.apply(null, checkArgs)).toBe(true);
  });

  it('should fail if the dt element has a parent <dl> with a changed role', function () {
    const checkArgs = checkSetup(
      '<dl role="menubar"><dt id="target">My list item<</dt>/dl>'
    );
    expect(checks.dlitem.evaluate.apply(null, checkArgs)).toBe(false);
  });

  it('should pass if the dt element has a parent <dl> with an abstract role', function () {
    const checkArgs = checkSetup(
      '<dl role="section"><dt id="target">My list item</dt></dl>'
    );
    expect(checks.dlitem.evaluate.apply(null, checkArgs)).toBe(true);
  });

  it('should pass if the dt element has a parent <dl> with an invalid role', function () {
    const checkArgs = checkSetup(
      '<dl role="invalid-role"><dt id="target">My list item</dt></dl>'
    );
    expect(checks.dlitem.evaluate.apply(null, checkArgs)).toBe(true);
  });

  it('should fail if the dt element has a parent <dl> with a changed role', function () {
    const checkArgs = checkSetup(
      '<dl role="menubar"><dt id="target">My list item</dt></dl>'
    );
    expect(checks.dlitem.evaluate.apply(null, checkArgs)).toBe(false);
  });

  it('returns true if the dd/dt is in a div with a dl as grandparent', function () {
    const nodeNames = ['dd', 'dt'];
    nodeNames.forEach(function (nodeName) {
      const checkArgs = checkSetup(
        '<dl><div><' +
          nodeName +
          ' id="target">My list item</' +
          nodeName +
          '></div></dl>'
      );
      expect(checks.dlitem.evaluate.apply(null, checkArgs)).toBe(true);
    });
  });

  it('returns false if the dd/dt is in a div with a role with a dl as grandparent with a list role', function () {
    const nodeNames = ['dd', 'dt'];
    nodeNames.forEach(function (nodeName) {
      const checkArgs = checkSetup(
        '<dl><div role="list"><' +
          nodeName +
          ' id="target">My list item</' +
          nodeName +
          '></div></dl>'
      );
      expect(checks.dlitem.evaluate.apply(null, checkArgs)).toBe(false);
    });
  });

  it('returns false if the dd/dt is in a div[role=presentation] with a dl as grandparent', function () {
    const nodeNames = ['dd', 'dt'];
    nodeNames.forEach(function (nodeName) {
      const checkArgs = checkSetup(
        '<dl><div role="presentation"><' +
          nodeName +
          ' id="target">My list item</' +
          nodeName +
          '></div></dl>'
      );
      expect(checks.dlitem.evaluate.apply(null, checkArgs)).toBe(true);
    });
  });

  it('returns false if the dd/dt is in a div[role=none] with a dl as grandparent', function () {
    const nodeNames = ['dd', 'dt'];
    nodeNames.forEach(function (nodeName) {
      const checkArgs = checkSetup(
        '<dl><div role="none"><' +
          nodeName +
          ' id="target">My list item</' +
          nodeName +
          '></div></dl>'
      );
      expect(checks.dlitem.evaluate.apply(null, checkArgs)).toBe(true);
    });
  });

  (shadowSupport.v1 ? it : xit)(
    'should return true in a shadow DOM pass',
    function () {
      const node = document.createElement('div');
      node.innerHTML = '<dt>My list item </dt>';
      const shadow = node.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<dl><slot></slot></dl>';

      const checkArgs = checkSetup(node, 'dt');
      expect(checks.dlitem.evaluate.apply(null, checkArgs)).toBe(true);
    }
  );

  (shadowSupport.v1 ? it : xit)(
    'should return false in a shadow DOM fail',
    function () {
      const node = document.createElement('div');
      node.innerHTML = '<dt>My list item </dt>';
      const shadow = node.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<div><slot></slot></div>';

      const checkArgs = checkSetup(node, 'dt');
      expect(checks.dlitem.evaluate.apply(null, checkArgs)).toBe(false);
    }
  );

  (shadowSupport.v1 ? it : xit)(
    'should return true when the item is grouped in dl > div in a shadow DOM',
    function () {
      const node = document.createElement('div');
      node.innerHTML = '<dt>My list item </dt>';
      const shadow = node.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<dl><div><slot></slot></div></dl>';

      const checkArgs = checkSetup(node, 'dt');
      expect(checks.dlitem.evaluate.apply(null, checkArgs)).toBe(true);
    }
  );
});
