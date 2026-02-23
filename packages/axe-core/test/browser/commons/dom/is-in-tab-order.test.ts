import { describe, it, expect } from 'vitest';
import { queryFixture } from '../../../testutils';

declare const axe: any;
describe('dom.isInTabOrder', function () {
  const isInTabOrder = axe.commons.dom.isInTabOrder;

  it('should return false for presentation element with negative tabindex', function () {
    const target = queryFixture('<div id="target" tabindex="-1"></div>');
    expect(isInTabOrder(target)).toBe(false);
  });

  it('should return true for presentation element with positive tabindex', function () {
    const target = queryFixture('<div id="target" tabindex="1"></div>');
    expect(isInTabOrder(target)).toBe(true);
  });

  it('should return false for presentation element with tabindex not set', function () {
    const target = queryFixture('<div id="target"></div>');
    expect(isInTabOrder(target)).toBe(false);
  });

  it('should return false for presentation element with tabindex set to non-parseable value', function () {
    const target = queryFixture('<div id="target" tabindex="foobar"></div>');
    expect(isInTabOrder(target)).toBe(false);
  });

  it('should return false for presentation element with tabindex not set and role of natively focusable element', function () {
    const target = queryFixture('<div id="target" role="button"></div>');
    expect(isInTabOrder(target)).toBe(false);
  });

  it('should return true for natively focusable element with tabindex 0', function () {
    const target = queryFixture('<button id="target" tabindex="0"></button>');
    expect(isInTabOrder(target)).toBe(true);
  });

  it('should return true for natively focusable element with tabindex 1', function () {
    const target = queryFixture('<button id="target" tabindex="1"></button>');
    expect(isInTabOrder(target)).toBe(true);
  });

  it('should return false for natively focusable element with tabindex -1', function () {
    const target = queryFixture('<button id="target" tabindex="-1"></button>');
    expect(isInTabOrder(target)).toBe(false);
  });

  it('should return true for natively focusable element with tabindex not set', function () {
    const target = queryFixture('<button id="target"></button>');
    expect(isInTabOrder(target)).toBe(true);
  });

  it('should return true for natively focusable element with tabindex set to empty string', function () {
    const target = queryFixture('<button id="target" tabindex=""></button>');
    expect(isInTabOrder(target)).toBe(true);
  });

  it('should return true for natively focusable element with tabindex set to non-parseable value', function () {
    const target = queryFixture(
      '<button id="target" tabindex="foobar"></button>'
    );
    expect(isInTabOrder(target)).toBe(true);
  });

  it('should return false for disabled', function () {
    const target = queryFixture('<button id="target" disabled></button>');
    expect(isInTabOrder(target)).toBe(false);
  });

  it('should return false for disabled natively focusable element with tabindex', function () {
    const target = queryFixture(
      '<button id="target" disabled tabindex="0"></button>'
    );
    expect(isInTabOrder(target)).toBe(false);
  });

  it('should return false for hidden inputs', function () {
    const target = queryFixture('<input type="hidden" id="target"></input>');
    expect(isInTabOrder(target)).toBe(false);
  });

  it('should return false for non-element nodes', function () {
    const target = queryFixture('<span id="target">Hello World</span>');
    expect(isInTabOrder(target.children[0])).toBe(false);
  });

  it('should return false for natively focusable hidden element', function () {
    const target = queryFixture('<button id="target" hidden></button>');
    expect(isInTabOrder(target)).toBe(false);
  });

  it('should return for false hidden element with tabindex 1', function () {
    const target = queryFixture('<div id="target" tabindex="1" hidden></div>');
    expect(isInTabOrder(target)).toBe(false);
  });
});
