import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { queryFixture } from '../../testutils';

declare const axe: any;
describe('no-autoplay-audio-matches', function () {
  const fixture = document.getElementById('fixture');
  const preloadOptions = { preload: { assets: ['media'] } };
  let rule;

  beforeEach(function () {
    rule = axe.utils.getRule('no-autoplay-audio');
  });

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('returns false for <audio> element that has no src attribute', async function () {
    const vNode = queryFixture('<audio id="target"></audio>');
    await axe.utils.preload(preloadOptions);
    const actual = rule.matches(vNode.actualNode);
    expect(actual).toBe(false);
  });

  it('returns false for <video> element that is paused', async function () {
    const vNode = queryFixture(
      '<video id="target" autoplay="true" paused="true">' +
        '<source src="/test/assets/video.webm" type="video/webm" />' +
        '<source src="/test/assets/video.mp4" type="video/mp4" />' +
        '</video>'
    );
    await axe.utils.preload(preloadOptions);
    const actual = rule.matches(vNode.actualNode);
    expect(actual).toBe(false);
  });

  it('returns false for <video> element that is muted', async function () {
    const vNode = queryFixture(
      '<video id="target" autoplay="true" muted="true">' +
        '<source src="/test/assets/video.webm" type="video/webm" />' +
        '<source src="/test/assets/video.mp4" type="video/mp4" />' +
        '</video>'
    );
    await axe.utils.preload(preloadOptions);
    const actual = rule.matches(vNode.actualNode);
    expect(actual).toBe(false);
  });
});
