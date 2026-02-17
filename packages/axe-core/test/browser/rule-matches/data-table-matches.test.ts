import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('data-table-matches', function () {
  const fixture = document.getElementById('fixture');
  const fixtureSetup = axe.testUtils.fixtureSetup;
  let rule;

  beforeEach(function () {
    rule = axe.utils.getRule('th-has-data-cells');
  });

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should return false if table has role="presentation"', function () {
    fixtureSetup(
      '<table role="presentation" id="target">' +
        '  <tr> <th>hi</th> <td></td> </tr>' +
        '  <tr> <th>hi</th> <td></td> </tr>' +
        '</table>'
    );

    const vNode = axe.utils.querySelectorAll(axe._tree[0], 'table')[0];
    expect(rule.matches(vNode.actualNode, vNode)).toBe(false);
  });

  it('should return false if table has role="none"', function () {
    fixtureSetup(
      '<table role="none" id="target">' +
        '  <tr> <th>hi</th> <td></td> </tr>' +
        '  <tr> <th>hi</th> <td></td> </tr>' +
        '</table>'
    );

    const vNode = axe.utils.querySelectorAll(axe._tree[0], 'table')[0];
    expect(rule.matches(vNode.actualNode, vNode)).toBe(false);
  });

  it('should return true if table is a data table', function () {
    fixtureSetup(
      '<table id="target">' +
        '	<caption>Table caption</caption>' +
        '	<tr><th scope="col">Heading 1</th><th scope="col">Heading 2</th></tr>' +
        '	<tr><td>Thing 1</td><td>Thing 2</td></tr>' +
        '</table>'
    );

    const vNode = axe.utils.querySelectorAll(axe._tree[0], 'table')[0];
    expect(rule.matches(vNode.actualNode, vNode)).toBe(true);
  });
});
