import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.constants', () => {
  it('should create an object', () => {
    expect(typeof axe.constants).toBe('object');
  });

  it('should have a results array', () => {
    expect(Array.isArray(axe.constants.results)).toBe(true);
  });

  it('should have PASS', () => {
    expect(axe.constants.PASS).toBe('passed');
  });

  it('should have FAIL', () => {
    expect(axe.constants.FAIL).toBe('failed');
  });

  it('should have NA', () => {
    expect(axe.constants.NA).toBe('inapplicable');
  });

  it('should have CANTTELL', () => {
    expect(axe.constants.CANTTELL).toBe('cantTell');
  });

  it('should have priorities for results', () => {
    expect(axe.constants.NA_PRIO).toBe(0);
  });

  it('should have groups for results', () => {
    expect(axe.constants.FAIL_GROUP).toBe('violations');
  });

  it('should have a gridSize', () => {
    expect(axe.constants.gridSize).toBe(200);
  });

  it('should have a selectorSimilarFilterLimit', () => {
    expect(axe.constants.selectorSimilarFilterLimit).toBe(700);
  });

  it('has a serializableErrorProps array', () => {
    expect(Array.isArray(axe.constants.serializableErrorProps)).toBe(true);
    axe.constants.serializableErrorProps.forEach(prop => {
      expect(typeof prop).toBe('string');
    });
  });
});
