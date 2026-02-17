import { describe, it, expect, beforeEach, afterEach } from 'vitest';

declare const axe: any;
describe('axe.utils.getCheckMessage', () => {
  const getCheckMessage = axe.utils.getCheckMessage;

  beforeEach(() => {
    axe._audit = {
      data: {
        checks: {
          'my-check': {
            messages: {
              pass: 'Pass message',
              fail: 'Fail message',
              incomplete: 'Incomplete message'
            }
          }
        }
      }
    };
  });

  afterEach(() => {
    axe._audit = undefined;
  });

  it('should return the pass message', () => {
    expect(getCheckMessage('my-check', 'pass')).toBe('Pass message');
  });

  it('should return the fail message', () => {
    expect(getCheckMessage('my-check', 'fail')).toBe('Fail message');
  });

  it('should return the incomplete message', () => {
    expect(getCheckMessage('my-check', 'incomplete')).toBe(
      'Incomplete message'
    );
  });

  it('should handle data', () => {
    axe._audit.data.checks['my-check'].messages.pass =
      'Pass message with ${data.message}';
    expect(
      getCheckMessage('my-check', 'pass', { message: 'hello world!' })
    ).toBe('Pass message with hello world!');
  });

  it('should error when check does not exist', () => {
    expect(() => {
      getCheckMessage('invalid-check', 'pass');
    }).toThrow();
  });

  it('should error when check message does not exist', () => {
    expect(() => {
      getCheckMessage('invalid-check', 'invalid');
    }).toThrow();
  });
});
