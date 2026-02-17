import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('has-widget-role', () => {
  const queryFixture = axe.testUtils.queryFixture;
  const checkContext = axe.testUtils.MockCheckContext();

  afterEach(() => {
    checkContext._data = null;
  });

  it('should return false for elements with no role', () => {
    const vNode = queryFixture('<div id="target"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for elements with nonsensical roles', () => {
    const vNode = queryFixture(
      '<div id="target" role="buttonbuttonbutton"></div>'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  // Widget roles
  it('should return true for role=button', () => {
    const vNode = queryFixture('<div id="target" role="button"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=checkbox', () => {
    const vNode = queryFixture('<div id="target" role="checkbox"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=gridcell', () => {
    const vNode = queryFixture('<div id="target" role="gridcell"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=link', () => {
    const vNode = queryFixture('<div id="target" role="link"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=menuitem', () => {
    const vNode = queryFixture('<div id="target" role="menuitem"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=menuitemcheckbox', () => {
    const vNode = queryFixture(
      '<div id="target" role="menuitemcheckbox"></div>'
    );
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=menuitemradio', () => {
    const vNode = queryFixture('<div id="target" role="menuitemradio"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=option', () => {
    const vNode = queryFixture('<div id="target" role="option"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=progressbar', () => {
    const vNode = queryFixture('<div id="target" role="progressbar"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=radio', () => {
    const vNode = queryFixture('<div id="target" role="radio"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=scrollbar', () => {
    const vNode = queryFixture('<div id="target" role="scrollbar"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=searchbox', () => {
    const vNode = queryFixture('<div id="target" role="searchbox"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=slider', () => {
    const vNode = queryFixture('<div id="target" role="slider"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=spinbutton', () => {
    const vNode = queryFixture('<div id="target" role="spinbutton"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=switch', () => {
    const vNode = queryFixture('<div id="target" role="switch"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=tab', () => {
    const vNode = queryFixture('<div id="target" role="tab"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=textbox', () => {
    const vNode = queryFixture('<div id="target" role="textbox"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=treeitem', () => {
    const vNode = queryFixture('<div id="target" role="treeitem"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  // Composite widget roles
  it('should return true for role=combobox', () => {
    const vNode = queryFixture('<div id="target" role="combobox"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=grid', () => {
    const vNode = queryFixture('<div id="target" role="grid"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=listbox', () => {
    const vNode = queryFixture('<div id="target" role="listbox"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=menu', () => {
    const vNode = queryFixture('<div id="target" role="menu"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=menubar', () => {
    const vNode = queryFixture('<div id="target" role="menubar"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=radiogroup', () => {
    const vNode = queryFixture('<div id="target" role="radiogroup"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=tablist', () => {
    const vNode = queryFixture('<div id="target" role="tablist"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=tree', () => {
    const vNode = queryFixture('<div id="target" role="tree"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return true for role=treegrid', () => {
    const vNode = queryFixture('<div id="target" role="treegrid"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(true);
  });

  it('should return false for role=application', () => {
    const vNode = queryFixture('<div id="target" role="application"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=article', () => {
    const vNode = queryFixture('<div id="target" role="article"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=cell', () => {
    const vNode = queryFixture('<div id="target" role="cell"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=columnheader', () => {
    const vNode = queryFixture('<div id="target" role="columnheader"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=definition', () => {
    const vNode = queryFixture('<div id="target" role="definition"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=directory', () => {
    const vNode = queryFixture('<div id="target" role="directory"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=document', () => {
    const vNode = queryFixture('<div id="target" role="document"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=feed', () => {
    const vNode = queryFixture('<div id="target" role="feed"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=figure', () => {
    const vNode = queryFixture('<div id="target" role="figure"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=group', () => {
    const vNode = queryFixture('<div id="target" role="group"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=heading', () => {
    const vNode = queryFixture('<div id="target" role="heading"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=img', () => {
    const vNode = queryFixture('<div id="target" role="img"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=list', () => {
    const vNode = queryFixture('<div id="target" role="list"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=listitem', () => {
    const vNode = queryFixture('<div id="target" role="listitem"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=math', () => {
    const vNode = queryFixture('<div id="target" role="math"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=none', () => {
    const vNode = queryFixture('<div id="target" role="none"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=note', () => {
    const vNode = queryFixture('<div id="target" role="note"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=presentation', () => {
    const vNode = queryFixture('<div id="target" role="presentation"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=row', () => {
    const vNode = queryFixture('<div id="target" role="row"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=rowgroup', () => {
    const vNode = queryFixture('<div id="target" role="rowgroup"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=rowheader', () => {
    const vNode = queryFixture('<div id="target" role="rowheader"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=table', () => {
    const vNode = queryFixture('<div id="target" role="table"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=tabpanel', () => {
    const vNode = queryFixture('<div id="target" role="tabpanel"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=term', () => {
    const vNode = queryFixture('<div id="target" role="term"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=toolbar', () => {
    const vNode = queryFixture('<div id="target" role="toolbar"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  // Landmark Roles
  it('should return false for role=banner', () => {
    const vNode = queryFixture('<div id="target" role="banner"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=complementary', () => {
    const vNode = queryFixture('<div id="target" role="complementary"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=contentinfo', () => {
    const vNode = queryFixture('<div id="target" role="contentinfo"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=form', () => {
    const vNode = queryFixture('<div id="target" role="form"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=main', () => {
    const vNode = queryFixture('<div id="target" role="main"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=navigation', () => {
    const vNode = queryFixture('<div id="target" role="navigation"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=region', () => {
    const vNode = queryFixture('<div id="target" role="region"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });

  it('should return false for role=search', () => {
    const vNode = queryFixture('<div id="target" role="search"></div>');
    expect(
      axe.testUtils
        .getCheckEvaluate('has-widget-role')
        .call(checkContext, null, null, vNode)
    ).toBe(false);
  });
});
