import { describe, it, afterEach, expect } from 'vitest';

declare const axe: any;
describe('is-current-page-link', function () {
  const isCurrentPageLink = axe.commons.dom.isCurrentPageLink;
  const currentPage = window.location.origin + window.location.pathname;
  const base;

  afterEach(function () {
    if (base) {
      document.head.removeChild(base);
    }
  });

  it('should return true for hash links', function () {
    const anchor = document.createElement('a');
    anchor.href = '#main';
    document.body.appendChild(anchor);
    expect(isCurrentPageLink(anchor)).toBe(true);
  });

  it('should return true for relative links to the same page', function () {
    const anchor = document.createElement('a');
    anchor.href = window.location.pathname;
    expect(isCurrentPageLink(anchor)).toBe(true);
  });

  it('should return true for absolute links to the same page', function () {
    const anchor = document.createElement('a');
    anchor.href = currentPage;
    expect(isCurrentPageLink(anchor)).toBe(true);
  });

  it('should return true for angular skip links', function () {
    const anchor = document.createElement('a');
    anchor.href = '/#main';
    expect(isCurrentPageLink(anchor)).toBe(true);
  });

  it('should return false for just "#"', function () {
    const anchor = document.createElement('a');
    anchor.href = '#';
    expect(isCurrentPageLink(anchor)).toBe(false);
  });

  it('should return false for relative links to a different page', function () {
    const anchor = document.createElement('a');
    anchor.href = '/foo/bar/index.html';
    expect(isCurrentPageLink(anchor)).toBe(false);
  });

  it('should return false for absolute links to a different page', function () {
    const anchor = document.createElement('a');
    anchor.href = 'https://my-page.com/foo/bar/index.html';
    expect(isCurrentPageLink(anchor)).toBe(false);
  });

  it('should return false for angular router links (#!)', function () {
    const anchor = document.createElement('a');
    anchor.href = '#!main';
    expect(isCurrentPageLink(anchor)).toBe(false);
  });

  it('should return false for angular router links (#/)', function () {
    const anchor = document.createElement('a');
    anchor.href = '#/main';
    expect(isCurrentPageLink(anchor)).toBe(false);
  });
});
