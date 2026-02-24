import { describe, it, expect, beforeAll, afterAll } from 'vitest';

declare const axe: any;
describe('utils.getEnvironmentData', () => {
  let __audit;
  const getEnvironmentData = axe.utils.getEnvironmentData;
  beforeAll(() => {
    __audit = axe._audit;
    axe._audit = { brand: 'Deque' };
  });

  afterAll(() => {
    axe._audit = __audit;
  });

  it('returns the first argument, if it is truthy', () => {
    const input = {
      testEngine: {
        name: 'axe-core',
        version: axe.version
      }
    };
    const output = getEnvironmentData(input);
    expect(input).toBe(output);
  });

  it('should return a `testEngine` property', () => {
    const data = getEnvironmentData();
    expect(typeof data.testEngine).toBe('object');
    expect(data.testEngine.name).toBe('axe-core');
    expect(data.testEngine.version).toBe(axe.version);
  });

  it('should return a `testRunner` property', () => {
    const data = getEnvironmentData();
    expect(typeof data.testRunner).toBe('object');
    expect(data.testRunner.name).toBe(axe._audit.brand);
  });

  it('should return a `testEnvironment` property', () => {
    const data = getEnvironmentData();
    expect(typeof data.testEnvironment).toBe('object');
    expect(data.testEnvironment.userAgent).toBeTruthy();
    expect(data.testEnvironment.windowWidth).toBeTruthy();
    expect(data.testEnvironment.windowHeight).toBeTruthy();
    expect(data.testEnvironment.orientationAngle).not.toBeNull();
    expect(data.testEnvironment.orientationType).not.toBeNull();
  });

  it('should return a `timestamp` property`', () => {
    const data = getEnvironmentData();
    expect(data.timestamp).toBeDefined();
  });

  it('should return a `url` property', () => {
    const data = getEnvironmentData();
    expect(data.url).toBeDefined();
  });

  // TODO: remove or update test once we are testing axe-core in jsdom and
  // other supported environments as what this is testing should be done in
  // those environment tests
  it('gets data from the `win` parameter when passed', () => {
    const data = getEnvironmentData(null, {
      screen: {
        orientation: {
          type: 'fictional',
          angle: 'slanted'
        }
      },
      navigator: {
        userAgent: 'foo'
      },
      location: {
        href: 'foo://'
      },
      innerWidth: 321,
      innerHeight: 123
    });

    delete data.timestamp;
    expect(data).toEqual({
      testEngine: {
        name: 'axe-core',
        version: axe.version
      },
      testRunner: {
        name: axe._audit.brand
      },
      testEnvironment: {
        userAgent: 'foo',
        windowWidth: 321,
        windowHeight: 123,
        orientationAngle: 'slanted',
        orientationType: 'fictional'
      },
      url: 'foo://'
    });
  });
});
