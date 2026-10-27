import { describe, expect, it } from 'vitest';

import { galleryLayout } from './postGallery';

// The cells a layout makes: columns times rows, less what spans take up.
const cells = (count: number) => {
  const { grid, cell } = galleryLayout(count);
  const [, columns, rows] = grid.match(/grid-cols-(\d) grid-rows-(\d)/)!;
  const spanned = Array.from({ length: count }, (_, k) => cell(k)).filter(
    (c) => c === 'row-span-2',
  ).length;
  return Number(columns) * Number(rows) - spanned;
};

describe("a post's gallery", () => {
  it('has a cell for each image, with none left empty', () => {
    for (const count of [1, 2, 3, 4]) expect(cells(count)).toBe(count);
  });

  it('gives the first of three images the whole left side', () => {
    const { cell } = galleryLayout(3);
    expect([cell(0), cell(1), cell(2)]).toEqual(['row-span-2', '', '']);
  });
});
