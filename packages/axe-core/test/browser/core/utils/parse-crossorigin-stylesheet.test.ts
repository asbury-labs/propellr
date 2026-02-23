import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { assertStylesheet } from '../../../testutils';

declare const axe: any;
describe('axe.utils.parseCrossOriginStylesheet', () => {
  let dynamicDoc;
  let convertDataToStylesheet;

  beforeEach(() => {
    dynamicDoc = document.implementation.createHTMLDocument(
      'Dynamic document for testing axe.utils.parseCrossOriginStylesheet'
    );
    convertDataToStylesheet = axe.utils.getStyleSheetFactory(dynamicDoc);
  });

  afterEach(() => {
    dynamicDoc = undefined;
    convertDataToStylesheet = undefined;
  });

  it('returns cross-origin stylesheet', async () => {
    let importUrl =
      'https://cdnjs.cloudflare.com/ajax/libs/skeleton/2.0.4/skeleton.css';
    let options = {
      rootNode: document,
      shadowId: undefined,
      convertDataToStylesheet: convertDataToStylesheet,
      rootIndex: 1
    };
    let priority = [1, 0];
    let importedUrls = [];
    let isCrossOriginRequest = true;

    const data = await axe.utils.parseCrossOriginStylesheet(
      importUrl,
      options,
      priority,
      importedUrls,
      isCrossOriginRequest
    );
    expect(data).toBeDefined();
    expect(data.sheet).toBeDefined();

    expect(data.isCrossOrigin).toBe(isCrossOriginRequest);
    expect(data.priority).toEqual(priority);

    expect(data.sheet).toHaveProperty('cssRules');
    expect(data.sheet.cssRules.length).toBeGreaterThanOrEqual(1);

    assertStylesheet(
      data.sheet,
      '.container',
      '.container { position: relative; width: 100%; max-width: 960px; margin: 0px auto; padding: 0px 20px; box-sizing: border-box; }'
    );
  });

  it('rejects when given url to fetch is not found', async () => {
    let importUrl =
      'https://make-up-a-website-that-does-not-exist.com/style.css';
    let options = {
      rootNode: document,
      shadowId: undefined,
      convertDataToStylesheet: convertDataToStylesheet,
      rootIndex: 1
    };
    let priority = [1, 0];
    let importedUrls = [];
    let isCrossOriginRequest = true;
    await expect(
      axe.utils.parseCrossOriginStylesheet(
        importUrl,
        options,
        priority,
        importedUrls,
        isCrossOriginRequest
      )
    ).rejects.toBeDefined();
  });
});
