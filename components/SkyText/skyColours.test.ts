import { describe, expect, it } from 'vitest';

import {
  contrastRatio,
  relativeLuminance,
} from '@/components/Background/backdrop';
import head from '@/theme/head.json';

import {
  ACCENT_RATIO,
  CROSSOVER,
  FAINT_ALPHA,
  isOnDark,
  MUTED_ALPHA,
  skyBehind,
  skyColours,
  SWITCH_MARGIN,
  TEXT_RATIO,
} from './skyColours';

// A CSS rgb() value's channels and alpha.
const parse = (value: string) => {
  const [r, g, b, a] = value.match(/[\d.]+/g)!.map(Number);
  return { rgb: [r!, g!, b!] as const, alpha: a ?? 1 };
};
const luminanceOf = (value: string) => relativeLuminance(...parse(value).rgb);
const hex = (value: string) =>
  '#' +
  parse(value)
    .rgb.map((c) => c.toString(16).padStart(2, '0'))
    .join('');

// Skies from the darkest indigo to the pink sunrise, as the sampler reads
// them (relative luminance).
const SKIES = [0.03, 0.07, 0.12, 0.148, 0.2, 0.3, 0.45];

describe('text and icons over the sky', () => {
  it('is the theme light over a dark sky, darkening toward its dark only as far as needed', () => {
    expect(hex(skyColours(0.05).text)).toBe(head.light);
    const overLight = luminanceOf(skyColours(0.6).text);
    expect(overLight).toBeLessThan(relativeLuminance(237, 228, 227));
    expect(overLight).toBeGreaterThan(relativeLuminance(1, 0, 24));
  });

  it('reads at 4.5:1, or as close as any colour can where none does', () => {
    const best = (sky: number) =>
      Math.max(
        contrastRatio(relativeLuminance(237, 228, 227), sky),
        contrastRatio(relativeLuminance(1, 0, 24), sky),
      );
    for (const sky of SKIES)
      expect(
        contrastRatio(luminanceOf(skyColours(sky).text), sky),
      ).toBeGreaterThanOrEqual(Math.min(TEXT_RATIO, best(sky)) - 0.05);
  });

  it('makes grey items and lines the same colour, partly see-through', () => {
    const { text, muted, faint } = skyColours(0.1);
    expect(parse(muted).rgb).toEqual(parse(text).rgb);
    expect(parse(muted).alpha).toBe(MUTED_ALPHA);
    expect(parse(faint).rgb).toEqual(parse(text).rgb);
    expect(parse(faint).alpha).toBe(FAINT_ALPHA);
    expect(MUTED_ALPHA).toBeLessThan(1);
  });
});

describe('accents over the sky', () => {
  it('is peach over a dark sky and deep indigo over a light one', () => {
    expect(hex(skyColours(0.03).accent)).toBe(head.peach);
    expect(hex(skyColours(0.45).accent)).toBe(head.indigo);
  });

  it('always reads at 3:1', () => {
    for (const sky of SKIES)
      expect(
        contrastRatio(luminanceOf(skyColours(sky).accent), sky),
      ).toBeGreaterThanOrEqual(ACCENT_RATIO - 0.05);
  });

  it('underlines a coloured link in another theme colour', () => {
    expect(hex(skyColours(0.05).underline)).toBe(head.rose);
    expect(hex(skyColours(0.45).underline)).toBe(head.purple);
  });
});

describe('what the colours are held against', () => {
  it("ignores the head's few bright reflections", () => {
    // A dark head with a handful of bright highlights: the text stays light.
    const behind = [...Array(44).fill(0.02), 0.6, 0.7, 0.8, 0.9];
    expect(skyBehind(behind)).toBe(0.02);
    expect(hex(skyColours(skyBehind(behind)).text)).toBe(head.light);
  });

  it('follows a sky that is light across most of the text', () => {
    const behind = [...Array(10).fill(0.05), ...Array(38).fill(0.4)];
    expect(skyBehind(behind)).toBe(0.4);
  });
});

describe('switching between light and dark text', () => {
  it('holds its side while the sky hovers around the crossover', () => {
    // A sky drifting a little either side of the crossover: no flicker.
    let onDark = isOnDark(CROSSOVER - 0.01);
    expect(onDark).toBe(true);
    for (const sky of [0.02, -0.02, 0.03, -0.03, 0.01].map(
      (d) => CROSSOVER + d,
    )) {
      onDark = isOnDark(sky, onDark);
      expect(onDark).toBe(true);
      expect(hex(skyColours(sky, true).text)).toBe(head.light);
    }
  });

  it('switches once the sky is clearly past it, either way', () => {
    expect(isOnDark(CROSSOVER + 0.05, true)).toBe(false);
    expect(isOnDark(CROSSOVER - 0.05, false)).toBe(true);
    expect(isOnDark(CROSSOVER - 0.03, false)).toBe(false);
  });

  it('keeps dark text dark just below the crossover', () => {
    expect(hex(skyColours(CROSSOVER - 0.02, false).text)).toBe(head.dark);
  });
});

describe('text held to its side while the sky rests at home', () => {
  it("takes the resting sky's side, whatever the sky reads", () => {
    expect(skyColours(0.9, true, true).onDark).toBe(true);
    expect(skyColours(0.01, false, false).onDark).toBe(false);
  });

  it('drops a side it took while the sky glided in', () => {
    // Light text, kept by the switch margin on a light sky just past the
    // crossover, turns dark once that light sky is at rest.
    const between = CROSSOVER + SWITCH_MARGIN / 2;
    expect(skyColours(between, true).onDark).toBe(true);
    expect(skyColours(between, true, false).onDark).toBe(false);
  });

  it('follows the sky while it moves', () => {
    expect(skyColours(0.9, true).onDark).toBe(false);
    expect(skyColours(0.01, false).onDark).toBe(true);
  });
});
