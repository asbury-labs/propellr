import { describe, it, expect, afterEach } from 'vitest';
import { checkSetup, checks } from '../../../testutils';

describe('caption', function () {
  const fixture = document.getElementById('fixture')!;

  afterEach(function () {
    fixture.innerHTML = '';
  });

  it('should return undefined if there is no track element', function () {
    const checkArgs = checkSetup('<audio></audio>', 'audio');
    expect(checks.caption.evaluate.apply(null, checkArgs)).toBeUndefined();
  });

  it('should return undefined if there is no kind=captions attribute', function () {
    const checkArgs = checkSetup(
      '<audio><track kind=descriptions></audio>',
      'audio'
    );
    expect(checks.caption.evaluate.apply(null, checkArgs)).toBeUndefined();
  });

  it('should pass if there is a kind=captions attribute', function () {
    const checkArgs = checkSetup(
      '<audio><track kind=captions></audio>',
      'audio'
    );
    expect(checks.caption.evaluate.apply(null, checkArgs)).toBe(false);
  });

  it(
    'should get track from composed tree',
    function () {
      const node = document.createElement('div');
      node.innerHTML = '<track kind=captions>';
      const shadow = node.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<audio><slot></slot></audio>';

      const checkArgs = checkSetup(node, {}, 'audio');
      expect(checks.caption.evaluate.apply(null, checkArgs)).toBe(false);
    }
  );
});
