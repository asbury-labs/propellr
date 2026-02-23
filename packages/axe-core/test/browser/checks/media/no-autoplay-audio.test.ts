import { describe, it, expect, afterEach } from 'vitest';
import { checkSetup, checks, MockCheckContext } from '../../../testutils';

declare const axe: any;
describe('no-autoplay-audio', () => {
  const check = checks['no-autoplay-audio'];
  const checkContext = MockCheckContext();
  const preloadOptions = { preload: { assets: ['media'] } };

  afterEach(() => {
    checkContext.reset();
  });

  it('returns undefined when <audio> has no source (duration cannot be interpreted)', async () => {
    const checkArgs = checkSetup('<audio id="target"></audio>');
    await axe.utils.preload(preloadOptions);
    expect(check.evaluate.apply(checkContext, checkArgs)).toBeUndefined();
  });

  it('returns undefined when <video> has no source (duration cannot be interpreted)', async () => {
    const checkArgs = checkSetup('<video id="target"><source src=""/></video>');
    await axe.utils.preload(preloadOptions);
    expect(check.evaluate.apply(checkContext, checkArgs)).toBeUndefined();
  });

  it('returns false when <audio> can autoplay and has no controls mechanism', async () => {
    const checkArgs = checkSetup(
      '<audio id="target" src="/test/assets/moon-speech.mp3" autoplay="true"></audio>'
    );
    await axe.utils.preload(preloadOptions);
    expect(check.evaluate.apply(checkContext, checkArgs)).toBe(false);
  });

  it('returns false when <video> can autoplay and has no controls mechanism', async () => {
    const checkArgs = checkSetup(`
      <video id="target" autoplay="true">
        <source src="/test/assets/video.webm" type="video/webm" />
        <source src="/test/assets/video.mp4" type="video/mp4" />
      </video>
    `);
    await axe.utils.preload(preloadOptions);
    expect(check.evaluate.apply(checkContext, checkArgs)).toBe(false);
  });

  it('returns false when <audio> plays less than allowed dutation but loops', async () => {
    const checkArgs = checkSetup(
      '<audio id="target" src="/test/assets/moon-speech.mp3#t=2,4" autoplay="true" loop="true"></audio>'
    );
    await axe.utils.preload(preloadOptions);
    expect(check.evaluate.apply(checkContext, checkArgs)).toBe(false);
  });

  it('returns false when <video> loops and has no controls mechanism when duration is unknown', () => {
    const checkArgs = checkSetup(`
      <video id="target" loop>
        <source src="/test/assets/video.webm#t=7,9" type="video/webm" />
        <source src="/test/assets/video.mp4#t=7,9" type="video/mp4" />
      </video>
    `);
    expect(check.evaluate.apply(checkContext, checkArgs)).toBe(false);
  });

  it('returns false when <audio> loops and has no controls mechanism when duration is unknown', () => {
    const checkArgs = checkSetup(
      '<audio id="target" src="/test/assets/moon-speech.mp3#t=2,4" loop="true"></audio>'
    );
    expect(check.evaluate.apply(checkContext, checkArgs)).toBe(false);
  });

  it('returns true when <video> can autoplay and duration is below allowed duration (by passing options)', async () => {
    const checkArgs = checkSetup(
      `
      <video id="target" autoplay="true">
        <source src="/test/assets/video.webm" type="video/webm" />
        <source src="/test/assets/video.mp4" type="video/mp4" />
      </video>`,
      { allowedDuration: 15 }
    );
    await axe.utils.preload(preloadOptions);
    expect(check.evaluate.apply(checkContext, checkArgs)).toBe(true);
  });

  it('returns true when <video> can autoplay and duration is below allowed duration (by setting playback range)', async () => {
    const checkArgs = checkSetup(`
      <video id="target" autoplay="true">
        <source src="/test/assets/video.webm#t=7,9" type="video/webm" />
        <source src="/test/assets/video.mp4#t=7,9" type="video/mp4" />
      </video>`);
    // Note: default allowed duration is 3s
    await axe.utils.preload(preloadOptions);
    expect(check.evaluate.apply(checkContext, checkArgs)).toBe(true);
  });

  it('returns true when <audio> can autoplay but has controls mechanism', async () => {
    const checkArgs = checkSetup(
      '<audio id="target" src="/test/assets/moon-speech.mp3" autoplay="true" controls></audio>'
    );
    await axe.utils.preload(preloadOptions);
    expect(check.evaluate.apply(checkContext, checkArgs)).toBe(true);
  });

  it('returns true when <video> can autoplay and has controls mechanism', async () => {
    const checkArgs = checkSetup(`
      <video id="target" autoplay="true" controls>
        <source src="/test/assets/video.webm" type="video/webm" />
        <source src="/test/assets/video.mp4" type="video/mp4" />
      </video>
    `);
    await axe.utils.preload(preloadOptions);
    expect(check.evaluate.apply(null, checkArgs)).toBe(true);
  });

  it('returns true when <video> loops and has controls mechanism when duration is unknown', () => {
    const checkArgs = checkSetup(`
      <video id="target" loop controls>
        <source src="/test/assets/video.webm#t=7,9" type="video/webm" />
        <source src="/test/assets/video.mp4#t=7,9" type="video/mp4" />
      </video>
    `);
    expect(check.evaluate.apply(checkContext, checkArgs)).toBe(true);
  });

  it('returns true when <audio> loops and has controls mechanism when duration is unknown', () => {
    const checkArgs = checkSetup(
      '<audio id="target" src="/test/assets/moon-speech.mp3#t=2,4" controls="true" loop="true"></audio>'
    );
    expect(check.evaluate.apply(checkContext, checkArgs)).toBe(true);
  });
});
