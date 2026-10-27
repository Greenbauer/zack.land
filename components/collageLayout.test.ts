import { describe, expect, it } from 'vitest';

import {
  collage,
  cropFor,
  CROPS,
  GROW,
  HEAD_REACH,
  headRight,
  NUDGE,
  taller,
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
const seeds = (n: number) => Array.from({ length: n }, (_, k) => `/a/${k}.jpg`);

const overlap = (
  a: { x: number; y: number; width: number; height: number },
  b: typeof a,
) =>
  Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) *
  Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));

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
        const tiles = collage(aspects, seeds(aspects.length), w, h);
        expect(tiles).toHaveLength(aspects.length);
        tiles.forEach((tile, k) => {
          // Its crop, or one shape taller.
          const aspect = tile.width / tile.height;
          expect(
            [aspects[k]!, taller(aspects[k]!)].some(
              (crop) => Math.abs(crop - aspect) < 1e-6,
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
      const area = collage(aspects, seeds(aspects.length), w, h).reduce(
        (sum, tile) => sum + tile.width * tile.height,
        0,
      );
      expect(area / (w * h)).toBeGreaterThan(0.45);
    }
  });

  it.each(SIZES)(
    'overlaps its tiles only a little, in a %i by %i box',
    (w, h) => {
      // Each tile grows and moves at most this share of its size.
      const most = (GROW - 1) / 2 + NUDGE;
      for (const aspects of POSTS) {
        const tiles = collage(aspects, seeds(aspects.length), w, h);
        for (const [k, a] of tiles.entries())
          for (const b of tiles.slice(k + 1)) {
            const smaller = Math.min(a.width * a.height, b.width * b.height);
            expect(overlap(a, b) / smaller).toBeLessThan(2 * most + 0.02);
          }
      }
    },
  );

  it('scatters the same way every time, and each image its own way', () => {
    const once = collage([1, 1, 1, 1], seeds(4), 600, 800);
    expect(collage([1, 1, 1, 1], seeds(4), 600, 800)).toEqual(once);
    expect(new Set(once.map((tile) => tile.tilt.toFixed(3))).size).toBe(4);
  });

  it('has no tiles in an empty box or for no images', () => {
    expect(collage([], [], 600, 800)).toEqual([]);
    expect(collage([1], seeds(1), 0, 0)).toEqual([]);
  });
});

describe('a collage in the room the head leaves', () => {
  it('stacks up the side of the card before it spreads across', () => {
    // Banner Eyewear's three in the room between the head and the card.
    const tiles = collage([16 / 9, 1, 1], seeds(3), 384, 700);
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
      const tiles = collage([16 / 9, 1, 1], seeds(3), w, h, 0);
      const areas = tiles.map((tile) => tile.width * tile.height);
      expect(areas[0]).toBe(Math.max(...areas));
      expect(tiles[0]!.width / tiles[0]!.height).toBeCloseTo(16 / 9, 5);
    }
  });

  it('crops a picture one shape taller only when that fills more', () => {
    // A wide image alone in a tall, narrow space: taller fills more.
    const [narrow] = collage([16 / 9], seeds(1), 300, 700);
    expect(narrow!.width / narrow!.height).toBeCloseTo(4 / 3, 5);
    // In a wide, short space it keeps its own crop.
    const [wide] = collage([16 / 9], seeds(1), 900, 400);
    expect(wide!.width / wide!.height).toBeCloseTo(16 / 9, 5);
    expect(taller(3 / 4)).toBe(3 / 4);
  });

  it("reaches as far as the head's face", () => {
    expect(headRight(1440, 900)).toBe(360 + HEAD_REACH * 900);
  });
});
