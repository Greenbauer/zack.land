import { describe, expect, it } from 'vitest';

import { shownPart } from './mediaBender';

describe('the part of a picture its box shows', () => {
  it('shows all of a picture drawn to fill its box', () => {
    expect(
      shownPart({ width: 100, height: 50 }, { width: 10, height: 10 }, 'fill'),
    ).toEqual([0, 0, 1, 1]);
  });

  it('crops a covering picture to the middle, to the box’s shape', () => {
    // A square picture in a box twice as wide as tall: its middle half down.
    expect(
      shownPart(
        { width: 200, height: 100 },
        { width: 400, height: 400 },
        'cover',
      ),
    ).toEqual([0, 0.25, 1, 0.5]);
    // A wide picture in a square box: its middle half across.
    expect(
      shownPart(
        { width: 100, height: 100 },
        { width: 800, height: 400 },
        'cover',
      ),
    ).toEqual([0.25, 0, 0.5, 1]);
  });

  it('shows all of a picture not yet loaded', () => {
    expect(
      shownPart({ width: 100, height: 50 }, { width: 0, height: 0 }, 'cover'),
    ).toEqual([0, 0, 1, 1]);
  });
});
