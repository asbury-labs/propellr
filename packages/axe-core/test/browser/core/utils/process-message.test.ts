import { describe, it, expect, beforeEach, afterAll } from 'vitest';

declare const axe: any;
describe('axe.utils.processMessage', () => {
  const original = axe._audit;

  beforeEach(() => {
    axe._audit = {
      data: {
        incompleteFallbackMessage: 'fallback message'
      }
    };
  });

  afterAll(() => {
    axe._audit = original;
  });

  it('should replace a ${data}', () => {
    const message = 'Hello ${data}';
    const output = axe.utils.processMessage(message, 'World!');
    expect(output).toBe('Hello World!');
  });

  it('should replace a ${ data } (with whitespace)', () => {
    const message = 'Hello ${ data }';
    const output = axe.utils.processMessage(message, 'World!');
    expect(output).toBe('Hello World!');
  });

  it('should replace ${data.prop}', () => {
    const message = 'Hello ${data.world}';
    const output = axe.utils.processMessage(message, { world: 'World!' });
    expect(output).toBe('Hello World!');
  });

  it('should replace ${data.prop}', () => {
    const message = 'Hello ${data.world}';
    const output = axe.utils.processMessage(message, { world: undefined });
    expect(output).toBe('Hello ');
  });

  it('should replace ${ data.prop } (with whitespace)', () => {
    const message = 'Hello ${ data.world }';
    const output = axe.utils.processMessage(message, { world: 'World!' });
    expect(output).toBe('Hello World!');
  });

  describe('data is array', () => {
    it('should replace ${data.values} with comma separated list of values', () => {
      const message = 'Output: ${data.values}';
      const output = axe.utils.processMessage(message, ['one', 'two']);
      expect(output).toBe('Output: one, two');
    });

    it('should handle singular message', () => {
      const message = {
        singular: 'Singular message: ${data.values}',
        plural: 'Plural messages: ${ data.values }'
      };
      const output = axe.utils.processMessage(message, ['one']);
      expect(output).toBe('Singular message: one');
    });

    it('should handle plural message', () => {
      const message = {
        singular: 'Singular message: ${data.values}',
        plural: 'Plural messages: ${ data.values }'
      };
      const output = axe.utils.processMessage(message, ['one', 'two']);
      expect(output).toBe('Plural messages: one, two');
    });
  });

  describe('message is object', () => {
    it('should handle message based on messageKey', () => {
      const message = {
        prop1: 'prop1 message',
        prop2: 'prop2 message'
      };
      const output = axe.utils.processMessage(message, { messageKey: 'prop2' });
      expect(output).toBe('prop2 message');
    });

    it('should replace ${data}', () => {
      const message = {
        prop1: 'prop1 message',
        prop2: '${data.world} message'
      };
      const output = axe.utils.processMessage(message, {
        messageKey: 'prop2',
        world: 'World!'
      });
      expect(output).toBe('World! message');
    });

    it('should use default message', () => {
      const message = {
        default: 'default message',
        prop1: 'prop1 message',
        prop2: 'prop2 message'
      };
      const output = axe.utils.processMessage(message);
      expect(output).toBe('default message');
    });

    it('should use fallback message if no default', () => {
      const message = {
        prop1: 'prop1 message',
        prop2: 'prop2 message'
      };
      const output = axe.utils.processMessage(message);
      expect(output).toBe('fallback message');
    });
  });
});
