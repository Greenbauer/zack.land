import fs from 'node:fs';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchEarly, SCENE_FILES } from './sceneFiles';

const root = path.join(__dirname, '../..');
// Every address under /background/ that the scene's own code names.
const named = fs
  .readdirSync(__dirname)
  .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
  .flatMap((file) => [
    ...fs
      .readFileSync(path.join(__dirname, file), 'utf8')
      .matchAll(/['"](\/background\/[^'"]+)['"]/g),
  ])
  .map((match) => match[1]!);

describe('the scene files fetched early', () => {
  it('are every file the scene names, so none is found late', () => {
    // The sky's, named in JSX (double quotes), is one of them.
    expect(named.some((file) => file.endsWith('.hdr'))).toBe(true);
    for (const file of named) expect(SCENE_FILES).toContain(file);
  });

  it('are all served from public/', () => {
    for (const file of SCENE_FILES)
      expect(fs.existsSync(path.join(root, 'public', file)), file).toBe(true);
  });

  it("are fetched by the layout's first script", () => {
    const layout = fs.readFileSync(
      path.join(root, 'app/(root)/layout.tsx'),
      'utf8',
    );
    expect(layout).toContain(
      '__html: `(${fetchEarly})(${JSON.stringify(SCENE_FILES)})`',
    );
  });
});

describe('fetchEarly', () => {
  // A page at https://zack.land whose network answers each fetch with a
  // response naming the call (1, 2, ...).
  function page() {
    let calls = 0;
    const network = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(String(++calls)),
    );
    const window = { fetch: network as typeof fetch };
    vi.stubGlobal('window', window);
    vi.stubGlobal('location', { href: 'https://zack.land/contact' });
    vi.stubGlobal('fetch', (...args: Parameters<typeof fetch>) =>
      window.fetch(...args),
    );
    return { window, network };
  }
  const text = async (response: Promise<Response>) => (await response).text();
  afterEach(() => vi.unstubAllGlobals());

  it('starts every download at once', () => {
    const { network } = page();
    fetchEarly(['/a.bin', '/b.bin']);
    expect(network.mock.calls.map(([url]) => url)).toEqual([
      '/a.bin',
      '/b.bin',
    ]);
  });

  it("hands each download to the page's first fetch of it, as three asks", async () => {
    const { window, network } = page();
    fetchEarly(['/a.bin', '/b.bin']);
    const request = new Request('https://zack.land/a.bin', {
      credentials: 'same-origin',
    });
    expect(await text(window.fetch(request))).toBe('1');
    expect(await text(window.fetch('/b.bin'))).toBe('2');
    expect(network).toHaveBeenCalledTimes(2);
  });

  it('sends a second fetch of a file, and any other, to the network', async () => {
    const { window, network } = page();
    fetchEarly(['/a.bin', '/b.bin']);
    await window.fetch('/a.bin');
    expect(await text(window.fetch('/a.bin'))).toBe('3');
    expect(await text(window.fetch('/api/email', { method: 'POST' }))).toBe(
      '4',
    );
    expect(network).toHaveBeenCalledTimes(4);
  });

  it('gives fetch back once every download is handed over', async () => {
    const { window, network } = page();
    fetchEarly(['/a.bin']);
    expect(window.fetch).not.toBe(network);
    await window.fetch('/a.bin');
    expect(window.fetch).toBe(network);
  });

  it('tries a failed download again when the loader asks for it', async () => {
    const { window, network } = page();
    network.mockRejectedValueOnce(new TypeError('offline'));
    fetchEarly(['/a.bin']);
    expect(await text(window.fetch('/a.bin'))).toBe('1');
    expect(network).toHaveBeenCalledTimes(2);
  });

  it('runs from its own source, as the inline script runs it', async () => {
    const { window, network } = page();
    new Function(`(${fetchEarly})(${JSON.stringify(['/a.bin'])})`)();
    expect(await text(window.fetch('/a.bin'))).toBe('1');
    expect(network).toHaveBeenCalledTimes(1);
  });
});
