import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
/*global axe*/
describe('axe.utils.areStylesSet', () => {
  const fixture = document.getElementById('fixture');

  afterEach(() => {
    fixture.innerHTML = '';
  });

  it('should return true if `display:none` is set', () => {
    fixture.innerHTML =
      '<div id="target" style="display:none;">Display None</div>';

    let el = document.getElementById('target');
    expect(
      axe.utils.areStylesSet(
        el,
        [{ property: 'display', value: 'none' }],
        'body'
      )
    ).toBe(true);
  });

  it('should return true if `display:none` is set', () => {
    fixture.innerHTML =
      '<div style="display:none;"><div id="target">Display None</div></div>';

    let el = document.getElementById('target');
    expect(
      axe.utils.areStylesSet(
        el,
        [{ property: 'display', value: 'none' }],
        'body'
      )
    ).toBe(true);
  });

  it('should return true if `visibility:hidden` is set', () => {
    fixture.innerHTML =
      '<div style="visibility:hidden;"><div id="target">Display None</div></div>';

    let el = document.getElementById('target');
    expect(
      axe.utils.areStylesSet(
        el,
        [{ property: 'visibility', value: 'hidden' }],
        'body'
      )
    ).toBe(true);
  });

  it('should return true if `visibility:hidden` is set', () => {
    fixture.innerHTML =
      '<div id="target" style="visibility:hidden;">Display None</div>';

    let el = document.getElementById('target');
    expect(
      axe.utils.areStylesSet(
        el,
        [{ property: 'visibility', value: 'hidden' }],
        'body'
      )
    ).toBe(true);
  });

  it('should return true if `visibility:hidden` is set', () => {
    fixture.innerHTML =
      '<div id="target" style="visibility:hidden;">Display None</div>';

    let el = document.getElementById('target');
    expect(
      axe.utils.areStylesSet(
        el,
        [
          {
            property: 'display',
            value: 'none'
          },
          {
            property: 'visibility',
            value: 'hidden'
          }
        ],
        'body'
      )
    ).toBe(true);
  });

  it('should return true if `visibility:hidden` is set', () => {
    fixture.innerHTML =
      '<div style="visibility:hidden;"><div id="target">Display None</div></div>';

    let el = document.getElementById('target');
    expect(
      axe.utils.areStylesSet(
        el,
        [
          {
            property: 'display',
            value: 'none'
          },
          {
            property: 'visibility',
            value: 'hidden'
          }
        ],
        'body'
      )
    ).toBe(true);
  });

  it('should return true if `display:none` is set', () => {
    fixture.innerHTML =
      '<div style="display:none;"><div id="target">Display None</div></div>';

    let el = document.getElementById('target');
    expect(
      axe.utils.areStylesSet(
        el,
        [
          {
            property: 'display',
            value: 'none'
          },
          {
            property: 'visibility',
            value: 'hidden'
          }
        ],
        'body'
      )
    ).toBe(true);
  });

  it('should return false if nothing is set', () => {
    fixture.innerHTML =
      '<div style=""><div id="target">Display None</div></div>';

    let el = document.getElementById('target');
    expect(
      axe.utils.areStylesSet(
        el,
        [
          {
            property: 'display',
            value: 'none'
          },
          {
            property: 'visibility',
            value: 'hidden'
          }
        ],
        'body'
      )
    ).toBe(false);
  });
});
