import { describe, expect, it } from 'vitest';

import {
  collage,
  cropFor,
  CROPS,
  HEAD_REACH,
  headRight,
  taller,
  Tile,
} from './collageLayout';

const SIZES = [
  [600, 800],
  [900, 700],
  [360, 380],
];
// Banner Eyewear's three, Smart Bed's four squares, a shofar's four
// portraits, a video beside two squares, and one wide image.
const POSTS = [
  [16 / 9, 1, 1],
  [1, 1, 1, 1],
  [3 / 4, 3 / 4, 3 / 4, 3 / 4],
  [16 / 9, 1, 1],
  [16 / 9],
];

const overlap = (
  a: { x: number; y: number; width: number; height: number },
  b: typeof a,
) =>
  Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) *
  Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));

const outline = (tiles: readonly Tile[]) => ({
  left: Math.min(...tiles.map((t) => t.x)),
  right: Math.max(...tiles.map((t) => t.x + t.width)),
  top: Math.min(...tiles.map((t) => t.y)),
  bottom: Math.max(...tiles.map((t) => t.y + t.height)),
});

describe("a post image's crop", () => {
  it('is the shape nearest its picture', () => {
    expect(cropFor({ type: 'img', width: 960, height: 540 })).toBe(16 / 9);
    expect(cropFor({ type: 'img', width: 960, height: 768 })).toBe(4 / 3);
    expect(cropFor({ type: 'img', width: 700, height: 700 })).toBe(1);
    expect(cropFor({ type: 'img', width: 960, height: 1285 })).toBe(3 / 4);
  });

  it('is wide for a video and square for an image of unknown size', () => {
    expect(cropFor({ type: 'YouTube' })).toBe(16 / 9);
    expect(cropFor({ type: 'img' })).toBe(1);
    expect(CROPS).toContain(1);
  });
});

describe("a post's collage", () => {
  it.each(SIZES)(
    'keeps every tile its crop or one taller, inside a %i by %i box',
    (w, h) => {
      for (const aspects of POSTS) {
        const tiles = collage(aspects, w, h);
        expect(tiles).toHaveLength(aspects.length);
        tiles.forEach((tile, k) => {
          // Its crop, or one shape taller, to the nearest whole pixels.
          expect(
            [aspects[k]!, taller(aspects[k]!)].some(
              (crop) => Math.abs(tile.width - crop * tile.height) < 3,
            ),
          ).toBe(true);
          expect(tile.x).toBeGreaterThanOrEqual(-1e-9);
          expect(tile.y).toBeGreaterThanOrEqual(-1e-9);
          expect(tile.x + tile.width).toBeLessThanOrEqual(w + 1e-9);
          expect(tile.y + tile.height).toBeLessThanOrEqual(h + 1e-9);
        });
      }
    },
  );

  it.each(SIZES)('fills much of a %i by %i box', (w, h) => {
    for (const aspects of POSTS.filter((post) => post.length > 1)) {
      const area = collage(aspects, w, h).reduce(
        (sum, tile) => sum + tile.width * tile.height,
        0,
      );
      expect(area / (w * h)).toBeGreaterThan(0.45);
    }
  });

  it.each(SIZES)('touches edge to edge in a %i by %i box', (w, h) => {
    for (const aspects of POSTS) {
      const tiles = collage(aspects, w, h);
      for (const [k, a] of tiles.entries()) {
        expect(a.x).toBe(Math.round(a.x));
        expect(a.y).toBe(Math.round(a.y));
        expect(a.width).toBe(Math.round(a.width));
        expect(a.height).toBe(Math.round(a.height));
        for (const b of tiles.slice(k + 1)) expect(overlap(a, b)).toBe(0);
      }
      // No overlap and no gap: they cover their outline exactly.
      const { left, right, top, bottom } = outline(tiles);
      const area = tiles.reduce((sum, t) => sum + t.width * t.height, 0);
      expect(area).toBe((right - left) * (bottom - top));
    }
  });

  it.each(SIZES)('rounds only the outer corners in a %i by %i box', (w, h) => {
    for (const aspects of POSTS) {
      const tiles = collage(aspects, w, h);
      const { left, right, top, bottom } = outline(tiles);
      const rounded = tiles.flatMap((t) =>
        (
          [
            [t.x, t.y],
            [t.x + t.width, t.y],
            [t.x + t.width, t.y + t.height],
            [t.x, t.y + t.height],
          ] as const
        ).filter((_, corner) => t.round[corner]),
      );
      expect(rounded).toHaveLength(4);
      expect(rounded).toEqual(
        expect.arrayContaining([
          [left, top],
          [right, top],
          [right, bottom],
          [left, bottom],
        ]),
      );
    }
  });

  it('sits at the bottom of its box, by the card, at any height', () => {
    // Perf Sealers' one square, limited by a phone's width, in boxes of
    // three heights: no gap under it.
    for (const h of [520, 700, 900]) {
      const [tile] = collage([1], 500, h);
      expect(tile!.width).toBe(500);
      expect(tile!.y + tile!.height).toBe(h);
    }
  });

  it('has no tiles in an empty box or for no images', () => {
    expect(collage([], 600, 800)).toEqual([]);
    expect(collage([1], 0, 0)).toEqual([]);
  });
});

describe('a collage in the room the head leaves', () => {
  it('stacks up the side of the card before it spreads across', () => {
    // Banner Eyewear's three in the room between the head and the card.
    const tiles = collage([16 / 9, 1, 1], 384, 700);
    const left = Math.max(...tiles.map((tile) => tile.x));
    const right = Math.min(...tiles.map((tile) => tile.x + tile.width));
    // One column: every tile shares a stretch of the width.
    expect(right).toBeGreaterThan(left);
    const top = Math.min(...tiles.map((tile) => tile.y));
    const bottom = Math.max(...tiles.map((tile) => tile.y + tile.height));
    expect((bottom - top) / 700).toBeGreaterThan(0.85);
  });

  it('makes a main tile, such as a video, the largest, in its own shape', () => {
    // The Buoyancy Sorting Robot's video, a square GIF and a square photo.
    for (const [w, h] of SIZES as [number, number][]) {
      const tiles = collage([16 / 9, 1, 1], w, h, 0);
      const areas = tiles.map((tile) => tile.width * tile.height);
      expect(areas[0]).toBe(Math.max(...areas));
      expect(tiles[0]!.width / tiles[0]!.height).toBeCloseTo(16 / 9, 1);
    }
  });

  it('crops a picture one shape taller only when that fills more', () => {
    // A wide image alone in a tall, narrow space: taller fills more.
    const [narrow] = collage([16 / 9], 300, 700);
    expect(narrow!.width / narrow!.height).toBeCloseTo(4 / 3, 2);
    // In a wide, short space it keeps its own crop.
    const [wide] = collage([16 / 9], 900, 400);
    expect(wide!.width / wide!.height).toBeCloseTo(16 / 9, 2);
    expect(taller(3 / 4)).toBe(3 / 4);
  });

  it("reaches as far as the head's face", () => {
    expect(headRight(1440, 900)).toBe(360 + HEAD_REACH * 900);
  });
});
