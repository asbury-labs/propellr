import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.preloadMedia', () => {
  const fixtureSetup = axe.testUtils.fixtureSetup;

  it('returns empty array when there are no media nodes to be preloaded', async () => {
    axe._tree = axe.utils.getFlattenedTree(document);

    const result = await axe.utils.preloadMedia({ treeRoot: axe._tree[0] });
    expect(result.length).toBe(0);
  });

  it('returns empty array when <audio> has no source', async () => {
    fixtureSetup('<audio autoplay="true" controls></audio>');

    const result = await axe.utils.preloadMedia({ treeRoot: axe._tree[0] });
    expect(result.length).toBe(0);
  });

  it('returns empty array when <video> has no source', async () => {
    fixtureSetup('<video id="target" autoplay="true"><source src=""/></video>');
    const result = await axe.utils.preloadMedia({ treeRoot: axe._tree[0] });
    expect(result.length).toBe(0);
  });

  it('returns empty array when media node does not preload', async () => {
    fixtureSetup(`
      <video id="target" autoplay="true" preload="none">
        <source src="/test/assets/video.mp4" type="video/mp4" />
      </video>
    `);
    const result = await axe.utils.preloadMedia({ treeRoot: axe._tree[0] });
    expect(result.length).toBe(0);
  });

  it('returns empty array when media node is muted', async () => {
    fixtureSetup(`
      <video id="target" autoplay="true" muted>
        <source src="/test/assets/video.mp4" type="video/mp4" />
      </video>
    `);
    const result = await axe.utils.preloadMedia({ treeRoot: axe._tree[0] });
    expect(result.length).toBe(0);
  });

  it('returns empty array when media node is paused', async () => {
    fixtureSetup(`
      <video id="target" autoplay="true" paused>
        <source src="/test/assets/video.mp4" type="video/mp4" />
      </video>
    `);
    const result = await axe.utils.preloadMedia({ treeRoot: axe._tree[0] });
    expect(result.length).toBe(0);
  });

  it('returns media node (audio) after their metadata has been preloaded', async () => {
    fixtureSetup(
      '<audio src="/test/assets/moon-speech.mp3" autoplay="true" controls></audio>'
    );

    const result = await axe.utils.preloadMedia({ treeRoot: axe._tree[0] });
    expect(result.length).toBe(1);
    expect(result[0].readyState > 0).toBe(true);
    expect(Math.round(result[0].duration)).toBe(27);
  });

  it('returns media nodes (audio, video) after their metadata has been preloaded', async () => {
    fixtureSetup(
      // 1 audio elm
      '<audio src="/test/assets/moon-speech.mp3" autoplay="true"></audio>' +
        // 1 video elm
        '<video autoplay="true">' +
        '<source src="/test/assets/video.mp4" type="video/mp4" />' +
        '<source src="/test/assets/video.webm" type="video/webm" />' +
        '</video>'
    );

    const result = await axe.utils.preloadMedia({ treeRoot: axe._tree[0] });
    expect(result.length).toBe(2);
    expect(result[0].readyState > 0).toBe(true);
    expect(Math.round(result[0].duration)).toBe(27);

    expect(result[1].readyState > 0).toBe(true);
    expect(Math.round(result[1].duration)).toBe(14);
  });
});
