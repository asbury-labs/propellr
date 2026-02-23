import { describe, it, afterEach, expect } from 'vitest';
import { shadowSupport, flatTreeSetup } from '../../../testutils';

declare const axe: any;
describe('dom.shadowElementsFromPoint', function () {
  const fixture = document.getElementById('fixture');
  const shadowSupported = shadowSupport.v1;

  afterEach(function () {
    document.getElementById('fixture').innerHTML = '';
  });

  (shadowSupported ? it : xit)(
    'should return an array from inside and outside of shadow dom',
    function () {
      fixture.innerHTML =
        '<div id="container" style="background-color:#000;position:relative;"></div>';
      const container = fixture.querySelector('#container');
      const shadow1 = container.attachShadow({ mode: 'open' });
      shadow1.innerHTML =
        '<p style="background-color:red;">Text</p>' +
        '<div id="shadowHost2" style="position:absolute;"></div>';
      const paragraph = shadow1.querySelector('p');
      const container2 = shadow1.querySelector('#shadowHost2');
      const shadow2 = container2.attachShadow({ mode: 'open' });
      shadow2.innerHTML = '<span>Text</span>';
      const shadowSpan = shadow2.querySelector('span');
      flatTreeSetup(fixture);

      container.scrollIntoView();

      const spanCoords = shadowSpan.getBoundingClientRect();
      const result = axe.commons.dom.shadowElementsFromPoint(
        spanCoords.x,
        spanCoords.y
      );
      const pCoords = paragraph.getBoundingClientRect();
      const result2 = axe.commons.dom.shadowElementsFromPoint(
        pCoords.x,
        pCoords.y
      );

      expect(result).toEqual(expect.arrayContaining([shadowSpan, container2]));
      expect(result).not.toContain(paragraph);
      expect(result2).toEqual(expect.arrayContaining([paragraph, container]));
      expect(result2).not.toContain(shadowSpan);
    }
  );

  it('does not throw when elementsFromPoints returns null', function () {
    const mockDocument = {
      elementsFromPoint: function () {
        return null;
      }
    };
    const out;
    expect(function () {
      out = axe.commons.dom.shadowElementsFromPoint(10, 10, mockDocument);
    }).not.toThrow();
    expect(out).toEqual([]);
  });
});
