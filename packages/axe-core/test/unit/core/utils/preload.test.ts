import { describe, it, expect, beforeEach } from 'vitest';

declare const axe: any;
describe('axe.utils.preload', () => {
  const fixture = document.getElementById('fixture');

  beforeEach(() => {
    axe.setup(fixture);
  });

  it('returns `undefined` when `preload` option is set to false.', done => {
    let options = {
      preload: false
    };
    let actual = axe.utils.preload(options);
    actual
      .then(results => {
        expect(results).toBeUndefined();
        done();
      })
      .catch(error => {
        done(error);
      });
  });

  it('returns assets with `cssom`, verify result is same output from `preloadCssom` fn', done => {
    let options = {
      preload: {
        assets: ['cssom']
      }
    };
    let actual = axe.utils.preload(options);
    actual
      .then(results => {
        expect(results).toBeDefined();
        expect(results).toHaveProperty('cssom');

        axe.utils.preloadCssom(options).then(resultFromPreloadCssom => {
          expect(results.cssom).toEqual(resultFromPreloadCssom);
          done();
        });
      })
      .catch(done);
  });

  describe('axe.utils.shouldPreload', () => {
    it('should return true if preload configuration is valid', () => {
      let actual = axe.utils.shouldPreload({
        preload: {
          assets: ['cssom']
        }
      });
      expect(actual).toBe(true);
    });

    it('should return true if preload is undefined', () => {
      let actual = axe.utils.shouldPreload({
        preload: undefined
      });
      expect(actual).toBe(true);
    });

    it('should return true if preload is null', () => {
      let actual = axe.utils.shouldPreload({
        preload: null
      });
      expect(actual).toBe(true);
    });

    it('should return true if preload is not set', () => {
      let actual = axe.utils.shouldPreload({});
      expect(actual).toBe(true);
    });

    it('should return false if preload configuration is invalid', () => {
      let options = {
        preload: {
          errorProperty: ['cssom']
        }
      };
      let actual = axe.utils.shouldPreload(options);
      expect(actual).toBe(false);
    });
  });

  describe('axe.utils.getPreloadConfig', () => {
    it('should return default assets if preload configuration is not set', () => {
      let actual = axe.utils.getPreloadConfig({}).assets;
      let expected = ['cssom', 'media'];
      expect(actual).toEqual(expected);
    });

    it('should return default assets if preload options is set to true', () => {
      let actual = axe.utils.getPreloadConfig({}).assets;
      let expected = ['cssom', 'media'];
      expect(actual).toEqual(expected);
    });

    it('should return default timeout value if not configured', () => {
      let actual = axe.utils.getPreloadConfig({}).timeout;
      let expected = 10000;
      expect(actual).toBe(expected);
    });

    it('should throw error if requested asset type is not supported', () => {
      let options = {
        preload: {
          assets: ['some-unsupported-asset']
        }
      };
      let actual = () => {
        axe.utils.getPreloadConfig(options);
      };
      let expected = Error;
      expect(actual).toThrow(expected);
    });

    it('should remove any duplicate assets passed via preload configuration', () => {
      let options = {
        preload: {
          assets: ['cssom', 'cssom']
        }
      };
      let actual = axe.utils.getPreloadConfig(options);
      expect(actual).toHaveProperty('assets');
      ['assets', 'timeout'].forEach(k => expect(actual).toHaveProperty(k));
      expect(actual.assets).toHaveLength(1);
    });
  });
});
