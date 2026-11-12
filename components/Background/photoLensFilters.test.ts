import { describe, expect, it, vi } from 'vitest';

// Just enough of a page for photoLens.ts outside a browser: cards marked
// data-glass-over (so no photo has to be found under them), and an SVG defs
// element that keeps the filters added to it by id.
const filters = new Set<string>();
const defs = {
  isConnected: true,
  insertAdjacentHTML: (_: string, markup: string) =>
    filters.add(/id="([^"]+)"/.exec(markup)![1]!),
  querySelector: (selector: string) => {
    const id = selector.slice(1);
    return filters.has(id) ? { remove: () => filters.delete(id) } : null;
  },
};
const canvas = () => ({
  getContext: () => ({
    createImageData: (w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4),
    }),
    putImageData: () => {},
  }),
  toDataURL: () => 'data:,',
});
vi.stubGlobal('HTMLElement', class {});
vi.stubGlobal('document', {
  body: { appendChild: () => {} },
  createElement: canvas,
  createElementNS: (_: string, name: string) =>
    name === 'defs'
      ? defs
      : { setAttribute: () => {}, style: {}, appendChild: () => {} },
  querySelectorAll: () => [],
});
vi.stubGlobal('getComputedStyle', () => ({ opacity: '1', zIndex: 'auto' }));

const { photoLenses } = await import('./photoLens');

const card = (width: number) =>
  ({
    isConnected: true,
    dataset: { glassOver: '' },
    previousElementSibling: null,
    style: { setProperty: () => {}, removeProperty: () => {} },
    getBoundingClientRect: () => ({ left: 0, top: 0, width, height: 300 }),
  }) as unknown as HTMLElement & { isConnected: boolean };

describe('the glass over photos, as cards come and go', () => {
  it('keeps one filter for each card on the page', () => {
    const a = card(400);
    const b = card(500);
    photoLenses([a, b], false);
    photoLenses([a, b], false);
    expect(filters.size).toBe(2);
  });

  it('drops the filter of a card that has left the page', () => {
    const cards = [card(410), card(420), card(430)];
    filters.clear();
    photoLenses(cards, false);
    expect(filters.size).toBe(3);
    // The next page: these cards are gone, a new one has come.
    for (const gone of cards) gone.isConnected = false;
    photoLenses([card(440)], false);
    expect(filters.size).toBe(1);
  });
});
