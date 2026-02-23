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
    let message = 'Hello ${data}';
    let output = axe.utils.processMessage(message, 'World!');
    expect(output).toBe('Hello World!');
  });

  it('should replace a ${ data } (with whitespace)', () => {
    let message = 'Hello ${ data }';
    let output = axe.utils.processMessage(message, 'World!');
    expect(output).toBe('Hello World!');
  });

  it('should replace ${data.prop}', () => {
    let message = 'Hello ${data.world}';
    let output = axe.utils.processMessage(message, { world: 'World!' });
    expect(output).toBe('Hello World!');
  });

  it('should replace ${data.prop}', () => {
    let message = 'Hello ${data.world}';
    let output = axe.utils.processMessage(message, { world: undefined });
    expect(output).toBe('Hello ');
  });

  it('should replace ${ data.prop } (with whitespace)', () => {
    let message = 'Hello ${ data.world }';
    let output = axe.utils.processMessage(message, { world: 'World!' });
    expect(output).toBe('Hello World!');
  });

  describe('data is array', () => {
    it('should replace ${data.values} with comma separated list of values', () => {
      let message = 'Output: ${data.values}';
      let output = axe.utils.processMessage(message, ['one', 'two']);
      expect(output).toBe('Output: one, two');
    });

    it('should handle singular message', () => {
      let message = {
        singular: 'Singular message: ${data.values}',
        plural: 'Plural messages: ${ data.values }'
      };
      let output = axe.utils.processMessage(message, ['one']);
      expect(output).toBe('Singular message: one');
    });

    it('should handle plural message', () => {
      let message = {
        singular: 'Singular message: ${data.values}',
        plural: 'Plural messages: ${ data.values }'
      };
      let output = axe.utils.processMessage(message, ['one', 'two']);
      expect(output).toBe('Plural messages: one, two');
    });
  });

  describe('message is object', () => {
    it('should handle message based on messageKey', () => {
      let message = {
        prop1: 'prop1 message',
        prop2: 'prop2 message'
      };
      let output = axe.utils.processMessage(message, { messageKey: 'prop2' });
      expect(output).toBe('prop2 message');
    });

    it('should replace ${data}', () => {
      let message = {
        prop1: 'prop1 message',
        prop2: '${data.world} message'
      };
      let output = axe.utils.processMessage(message, {
        messageKey: 'prop2',
        world: 'World!'
      });
      expect(output).toBe('World! message');
    });

    it('should use default message', () => {
      let message = {
        default: 'default message',
        prop1: 'prop1 message',
        prop2: 'prop2 message'
      };
      let output = axe.utils.processMessage(message);
      expect(output).toBe('default message');
    });

    it('should use fallback message if no default', () => {
      let message = {
        prop1: 'prop1 message',
        prop2: 'prop2 message'
      };
      let output = axe.utils.processMessage(message);
      expect(output).toBe('fallback message');
    });
  });
});
