import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
/**
 * NOTE:
 * `document.styleSheets` does not recognize dynamically injected stylesheets after `load` via `beforeEach`/ `before`,
 * so tests for disabled and external stylesheets are done in `integration` tests
 * Refer Directory: `./test/full/preload-cssom/**.*`
 */
describe('axe.utils.preloadCssom', () => {
  let treeRoot;

  function addStyleToHead() {
    const css = 'html {font-size: inherit;}';
    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    style.id = 'preloadCssomTestHeadSheet';
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    head.appendChild(style);
  }

  function removeStyleFromHead() {
    const s = document.getElementById('preloadCssomTestHeadSheet');
    if (s) {
      s.parentNode.removeChild(s);
    }
  }

  beforeEach(() => {
    addStyleToHead();
    treeRoot = axe._tree = axe.utils.getFlattenedTree(document);
  });

  afterEach(() => {
    removeStyleFromHead();
  });

  it('returns CSSOM object containing an array of sheets', done => {
    let actual = axe.utils.preloadCssom({ treeRoot: treeRoot });
    actual
      .then(cssom => {
        expect(cssom.length).toBeGreaterThanOrEqual(2);
        done();
      })
      .catch(error => {
        done(error);
      });
  });

  it('returns CSSOM and ensure that each object have defined properties', done => {
    let actual = axe.utils.preloadCssom({ treeRoot: treeRoot });
    actual
      .then(cssom => {
        expect(cssom.length).toBeGreaterThanOrEqual(2);
        cssom.forEach(o => {
          expect(Object.keys(o)).toEqual(
            expect.arrayContaining([
              'root',
              'shadowId',
              'sheet',
              'isCrossOrigin',
              'priority'
            ])
          );
        });
        done();
      })
      .catch(error => {
        done(error);
      });
  });

  it('returns false if number of sheets returned does not match stylesheets defined in document', done => {
    let actual = axe.utils.preloadCssom({ treeRoot: treeRoot });
    actual
      .then(cssom => {
        expect(cssom.length <= 1).toBe(false);
        done();
      })
      .catch(error => {
        done(error);
      });
  });

  it('returns all stylesheets and ensure each sheet has property cssRules', done => {
    let actual = axe.utils.preloadCssom({ treeRoot: treeRoot });
    actual
      .then(cssom => {
        cssom.forEach(s => {
          expect(s.sheet).toBeDefined();
          expect(s.sheet).toHaveProperty('cssRules');
        });
        done();
      })
      .catch(error => {
        done(error);
      });
  });
});
