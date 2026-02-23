import { describe, it, beforeAll, afterAll, expect } from 'vitest';

declare const axe: any;
describe('standards.getElementsByContentType', function () {
  const getElementsByContentType =
    axe.commons.standards.getElementsByContentType;

  beforeAll(function () {
    axe._load({});
  });

  afterAll(function () {
    axe.reset();
  });

  it('should return a list of node names by content type', function () {
    // Source: https://html.spec.whatwg.org/multipage/dom.html#sectioning-content
    const sectioningContent = getElementsByContentType('sectioning');
    expect(sectioningContent).toEqual(['article', 'aside', 'nav', 'section']);
  });

  it('should return a default variants', function () {
    // Source: https://html.spec.whatwg.org/multipage/dom.html#embedded-content-2
    const sectioningContent = getElementsByContentType('embedded');
    expect(sectioningContent).toEqual([
      'audio',
      'canvas',
      'embed',
      'iframe',
      'img',
      'math',
      'object',
      'svg',
      'video'
    ]);
  });

  it('should return configured roles', function () {
    axe.configure({
      standards: {
        htmlElms: {
          myElm: {
            contentTypes: ['flow', 'sectioning']
          }
        }
      }
    });

    const structureRoles = getElementsByContentType('sectioning');
    expect(structureRoles).toContain('myElm');
  });

  it('should not return role that is configured to not be of the type', function () {
    axe.configure({
      standards: {
        htmlElms: {
          article: {
            contentTypes: ['flow']
          }
        }
      }
    });

    const structureRoles = getElementsByContentType('sectioning');
    expect(structureRoles).not.toContain('article');
  });
});
