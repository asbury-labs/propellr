import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('no-autoplay-audio-matches', function () {
  const fixture = document.getElementById('fixture');
  const queryFixture = axe.testUtils.queryFixture;
  const preloadOptions = { preload: { assets: ['media'] } };
  let rule;

  beforeEach(function () {
    rule = axe.utils.getRule('no-autoplay-audio');
  });

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('returns false for <audio> element that has no src attribute', function (done) {
    const vNode = queryFixture('<audio id="target"></audio>');
    axe.utils.preload(preloadOptions).then(function () {
      const actual = rule.matches(vNode.actualNode);
      expect(actual).toBe(false);
      done();
    });
  });

  it('returns false for <video> element that is paused', function (done) {
    const vNode = queryFixture(
      '<video id="target" autoplay="true" paused="true">' +
        '<source src="/test/assets/video.webm" type="video/webm" />' +
        '<source src="/test/assets/video.mp4" type="video/mp4" />' +
        '</video>'
    );
    axe.utils.preload(preloadOptions).then(function () {
      const actual = rule.matches(vNode.actualNode);
      expect(actual).toBe(false);
      done();
    });
  });

  it('returns false for <video> element that is muted', function (done) {
    const vNode = queryFixture(
      '<video id="target" autoplay="true" muted="true">' +
        '<source src="/test/assets/video.webm" type="video/webm" />' +
        '<source src="/test/assets/video.mp4" type="video/mp4" />' +
        '</video>'
    );
    axe.utils.preload(preloadOptions).then(function () {
      const actual = rule.matches(vNode.actualNode);
      expect(actual).toBe(false);
      done();
    });
  });
});
