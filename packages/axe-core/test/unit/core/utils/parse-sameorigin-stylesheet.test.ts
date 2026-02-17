import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('axe.utils.parseSameOriginStylesheet', () => {
  let stylesForPage;
  const styleSheets = {
    emptyStyleTag: {
      id: 'emptyStyleTag',
      text: ''
    },
    styleTagWithOneImport: {
      id: 'styleTagWithOneImport',
      text: '@import "../integration/full/preload-cssom/base.css";'
    },
    inlineStyle: {
      id: 'inlineStyle',
      text: '.inline-css { font-weight:normal; }'
    }
  };
  let dynamicDoc;
  let convertDataToStylesheet;

  beforeEach(() => {
    dynamicDoc = document.implementation.createHTMLDocument(
      'Dynamic document for testing axe.utils.parseSameOriginStylesheet'
    );
    convertDataToStylesheet = axe.utils.getStyleSheetFactory(dynamicDoc);
  });

  afterEach(done => {
    dynamicDoc = undefined;
    convertDataToStylesheet = undefined;
    axe.testUtils.removeStyleSheets(stylesForPage).then(() => {
      done();
      stylesForPage = undefined;
    });
  });

  it('returns empty results when given sheet has no cssRules', done => {
    // add style that has no styles
    stylesForPage = [styleSheets.emptyStyleTag];

    axe.testUtils.addStyleSheets(stylesForPage).then(() => {
      // get recently added sheet
      const sheet = Array.from(document.styleSheets).filter(styleSheet => {
        return styleSheet.ownerNode.id === styleSheets.emptyStyleTag.id;
      })[0];
      // parse sheet
      const options = {
        rootNode: document,
        shadowId: undefined,
        convertDataToStylesheet: convertDataToStylesheet
      };
      const priority = [1, 0];
      const importedUrls = [];
      const isCrossOriginRequest = false;
      axe.utils
        .parseSameOriginStylesheet(
          sheet,
          options,
          priority,
          importedUrls,
          false
        )
        .then(data => {
          expect(data).toBeDefined();
          expect(data.sheet).toBeDefined();
          expect(data.isCrossOrigin).toBe(isCrossOriginRequest);
          expect(data.priority).toEqual(priority);
          expect(data.sheet).toHaveProperty('cssRules');
          expect(data.sheet.cssRules.length === 0).toBe(true);
          done();
        });
    });
  });

  it('returns @import rule specified in the stylesheet', done => {
    // add style that has @import style
    stylesForPage = [styleSheets.styleTagWithOneImport];

    axe.testUtils.addStyleSheets(stylesForPage).then(() => {
      // get recently added sheet
      const sheet = Array.from(document.styleSheets).filter(styleSheet => {
        return styleSheet.ownerNode.id === styleSheets.styleTagWithOneImport.id;
      })[0];
      // parse sheet
      const options = {
        rootNode: document,
        shadowId: undefined,
        convertDataToStylesheet: convertDataToStylesheet
      };
      const priority = [1, 0];
      const importedUrls = [];
      const isCrossOriginRequest = false;
      axe.utils
        .parseSameOriginStylesheet(
          sheet,
          options,
          priority,
          importedUrls,
          false
        )
        .then(data => {
          expect(data).toBeDefined();

          const parsedImportData = data[0];
          expect(parsedImportData.sheet).toBeDefined();
          expect(parsedImportData.isCrossOrigin).toBe(isCrossOriginRequest);
          // as @import is a style with in @imported sheet, an additional priority is appended.
          expect(parsedImportData.priority).toEqual([1, 0, 0]);
          expect(parsedImportData.sheet).toHaveProperty('cssRules');
          expect(parsedImportData.sheet.cssRules.length).toBeGreaterThanOrEqual(
            1
          );
          axe.testUtils.assertStylesheet(
            parsedImportData.sheet,
            '.style-from-base-css',
            '.style-from-base-css {font-size: 100%; }'
          );
          done();
        });
    });
  });

  it('returns inline style specified in the stylesheet', done => {
    // add style that has @import style
    stylesForPage = [styleSheets.inlineStyle];

    axe.testUtils.addStyleSheets(stylesForPage).then(() => {
      // get recently added sheet
      const sheet = Array.from(document.styleSheets).filter(styleSheet => {
        return styleSheet.ownerNode.id === styleSheets.inlineStyle.id;
      })[0];
      // parse sheet
      const options = {
        rootNode: document,
        shadowId: undefined,
        convertDataToStylesheet: convertDataToStylesheet
      };
      const priority = [1, 0];
      const importedUrls = [];
      const isCrossOriginRequest = false;
      axe.utils
        .parseSameOriginStylesheet(
          sheet,
          options,
          priority,
          importedUrls,
          false
        )
        .then(data => {
          expect(data).toBeDefined();
          expect(data.sheet).toBeDefined();
          expect(data.isCrossOrigin).toBe(isCrossOriginRequest);
          expect(data.priority).toEqual([1, 0]);
          expect(data.sheet).toHaveProperty('cssRules');
          expect(data.sheet.cssRules.length).toBeGreaterThanOrEqual(1);
          axe.testUtils.assertStylesheet(
            data.sheet,
            '.inline-css',
            '.inline-css { font-weight:normal; }'
          );
          done();
        });
    });
  });

  /**
   * Note:
   * Only single workflow of resolving either the `@import` or `inline` styles can be tested here.
   * Multiple resolutions from a given stylesheet containing a combination of styles are test as integration tests.
   * See: `/tests/full/integration/preload-cssom.html`
   */
});
