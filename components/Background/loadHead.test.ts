import { describe, expect, it, vi } from 'vitest';

// three's loader, failing on its first load and succeeding after.
const loadAsync = vi.fn();
vi.mock('three', () => ({
  FileLoader: class {
    setResponseType() {
      return this;
    }
    loadAsync = loadAsync;
  },
}));

const { loadHead } = await import('./headGeometry');

describe('loading the head', () => {
  it('tries again after a failed load instead of keeping the failure', async () => {
    loadAsync.mockRejectedValueOnce(new Error('offline'));
    await expect(loadHead()).rejects.toThrow('offline');

    // An empty gzip stream: the retry unzips to nothing.
    const empty = new Uint8Array([
      0x1f, 0x8b, 8, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    loadAsync.mockResolvedValueOnce(empty.buffer);
    await expect(loadHead()).resolves.toBeInstanceOf(ArrayBuffer);
    expect(loadAsync).toHaveBeenCalledTimes(2);
  });
});
