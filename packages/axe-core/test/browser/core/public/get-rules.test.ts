import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('axe.getRules', () => {
  const ver = axe.version.substring(0, axe.version.lastIndexOf('.'));

  beforeEach(() => {
    axe._load({
      messages: [],
      rules: [
        {
          id: 'awesomeRule1',
          selector: '',
          excludeHidden: false,
          any: [],
          tags: ['tag1']
        },
        {
          id: 'awesomeRule2',
          any: [],
          tags: ['tag1', 'tag2'],
          actIds: ['abc123', 'xyz789']
        }
      ],
      data: {
        rules: {
          awesomeRule1: {
            description: 'some interesting information',
            help: 'halp'
          },
          awesomeRule2: {
            description: 'also some interesting information',
            help: 'halp me!'
          }
        }
      }
    });
  });

  afterEach(() => {
    axe._audit = null;
  });

  it('should return rules', () => {
    let retValue = axe.getRules(['tag1']);
    expect(Array.isArray(retValue)).toBe(true);
    expect(retValue).toHaveLength(2);
    expect(retValue[0].ruleId).toBe('awesomeRule1');
    expect(retValue[0].description).toBe('some interesting information');
    expect(retValue[0].help).toBe('halp');
    expect(retValue[0].helpUrl).toBe(
      'https://dequeuniversity.com/rules/axe/' +
        ver +
        '/awesomeRule1?application=axeAPI'
    );
    expect(retValue[0].tags).toEqual(['tag1']);

    expect(retValue[1].ruleId).toBe('awesomeRule2');
    expect(retValue[1].description).toBe('also some interesting information');
    expect(retValue[1].help).toBe('halp me!');
    expect(retValue[1].helpUrl).toBe(
      'https://dequeuniversity.com/rules/axe/' +
        ver +
        '/awesomeRule2?application=axeAPI'
    );
    expect(retValue[1].tags).toEqual(['tag1', 'tag2']);
    expect(retValue[1].actIds).toEqual(['abc123', 'xyz789']);

    retValue = axe.getRules(['tag2']);
    expect(Array.isArray(retValue)).toBe(true);
    expect(retValue).toHaveLength(1);
    expect(retValue[0].ruleId).toBe('awesomeRule2');
    expect(retValue[0].description).toBe('also some interesting information');
    expect(retValue[0].help).toBe('halp me!');
    expect(retValue[0].helpUrl).toBe(
      'https://dequeuniversity.com/rules/axe/' +
        ver +
        '/awesomeRule2?application=axeAPI'
    );
    expect(retValue[0].tags).toEqual(['tag1', 'tag2']);
    expect(retValue[0].actIds).toEqual(['abc123', 'xyz789']);
  });

  it('should not return nothing', () => {
    const retValue = axe.getRules(['bob']);
    expect(Array.isArray(retValue)).toBe(true);
    expect(retValue).toHaveLength(0);
  });

  it('should return all rules if given no tags - undefined', () => {
    const retValue = axe.getRules();
    expect(retValue[0].ruleId).toBe('awesomeRule1');
    expect(retValue[0].description).toBe('some interesting information');
    expect(retValue[0].help).toBe('halp');
    expect(retValue[0].helpUrl).toBe(
      'https://dequeuniversity.com/rules/axe/' +
        ver +
        '/awesomeRule1?application=axeAPI'
    );
    expect(retValue[0].tags).toEqual(['tag1']);

    expect(retValue[1].ruleId).toBe('awesomeRule2');
    expect(retValue[1].description).toBe('also some interesting information');
    expect(retValue[1].help).toBe('halp me!');
    expect(retValue[1].helpUrl).toBe(
      'https://dequeuniversity.com/rules/axe/' +
        ver +
        '/awesomeRule2?application=axeAPI'
    );
    expect(retValue[1].tags).toEqual(['tag1', 'tag2']);
    expect(retValue[1].actIds).toEqual(['abc123', 'xyz789']);
  });

  it('should return all rules if given empty array', () => {
    const retValue = axe.getRules([]);
    expect(retValue[0].ruleId).toBe('awesomeRule1');
    expect(retValue[0].description).toBe('some interesting information');
    expect(retValue[0].help).toBe('halp');
    expect(retValue[0].helpUrl).toBe(
      'https://dequeuniversity.com/rules/axe/' +
        ver +
        '/awesomeRule1?application=axeAPI'
    );
    expect(retValue[0].tags).toEqual(['tag1']);

    expect(retValue[1].ruleId).toBe('awesomeRule2');
    expect(retValue[1].description).toBe('also some interesting information');
    expect(retValue[1].help).toBe('halp me!');
    expect(retValue[1].helpUrl).toBe(
      'https://dequeuniversity.com/rules/axe/' +
        ver +
        '/awesomeRule2?application=axeAPI'
    );
    expect(retValue[1].tags).toEqual(['tag1', 'tag2']);
    expect(retValue[1].actIds).toEqual(['abc123', 'xyz789']);
  });
});
