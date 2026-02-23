import { describe, it, expect, afterAll, vi } from 'vitest';

declare const axe: any;
describe('frameMessenger', () => {
  let stub;

  afterAll(() => {
    stub.mockRestore();
  });

  it('should call into axe.utils.respondable.updateMessenger', () => {
    stub = vi.spyOn(axe.utils.respondable, 'updateMessenger');
    axe.frameMessenger();
    expect(stub).toHaveBeenCalled();
  });
});
