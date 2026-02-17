import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.getStyleSheetFactory', () => {
  const dynamicDoc = document.implementation.createHTMLDocument(
    'Dynamic document for testing axe.utils.getStyleSheetFactory'
  );

  it('throws if there is no argument of dynamicDocument', () => {
    expect(() => {
      axe.utils.getStyleSheetFactory();
    }).toThrow();
  });

  it('returns a function when passed argument of dynamicDocument', () => {
    let actual = axe.utils.getStyleSheetFactory(dynamicDoc);
    expect(typeof actual).toBe('function');
  });

  it('returns a CSSOM stylesheet, when invoked with data (text)', () => {
    const stylesheetFactory = axe.utils.getStyleSheetFactory(dynamicDoc);
    let actual = stylesheetFactory({
      data: '.someStyle{background-color:red;}',
      root: document,
      priority: [1, 0]
    });

    expect(actual).toBeDefined();
    expect(Object.keys(actual)).toEqual(
      expect.arrayContaining([
        'sheet',
        'isCrossOrigin',
        'shadowId',
        'root',
        'priority'
      ])
    );
    expect(actual.priority).toEqual([1, 0]);
    axe.testUtils.assertStylesheet(
      actual.sheet,
      '.someStyle',
      '.someStyle{background-color:red;}'
    );
  });
});
