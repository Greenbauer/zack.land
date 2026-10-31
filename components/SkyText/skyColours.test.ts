import { describe, expect, it } from 'vitest';

import {
  contrastRatio,
  relativeLuminance,
} from '@/components/Background/backdrop';
import head from '@/theme/head.json';

import {
  ACCENT_RATIO,
  CROSSOVER,
  darkText,
  FAINT_ALPHA,
  isOnDark,
  restingSide,
  skyBehind,
  skyColours,
  SWITCH_MARGIN,
  TEXT_RATIO,
  themeText,
  WORD_SHARE,
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
  it('is the theme light over a dark sky, and over a light one the lightest darker theme colour that reads', () => {
    expect(hex(skyColours(0.05).text)).toBe(head.light);
    // A very light sky: the theme's purple already reads.
    expect(hex(skyColours(0.7).text)).toBe(head.purple);
    // A paler mid sky: purple falls short, blue reads.
    expect(contrastRatio(relativeLuminance(89, 77, 105), 0.3)).toBeLessThan(
      TEXT_RATIO,
    );
    expect(hex(skyColours(0.3).text)).toBe(head.blue);
  });

  it('is always one of the theme colours, never a blend', () => {
    const swatches = Object.values(head);
    for (let sky = 0; sky <= 1; sky += 0.01)
      for (const wasOnDark of [true, false, undefined])
        expect(swatches).toContain(hex(skyColours(sky, wasOnDark).text));
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

  it('gives text no see-through grey, only a faint line in its colour', () => {
    for (const sky of [0.02, 0.1, 0.5, 0.9]) {
      const colours = skyColours(sky);
      expect(colours).not.toHaveProperty('muted');
      expect(parse(colours.text).alpha).toBe(1);
      expect(parse(colours.faint).rgb).toEqual(parse(colours.text).rgb);
      expect(parse(colours.faint).alpha).toBe(FAINT_ALPHA);
    }
  });
});

describe('the theme colour that reads', () => {
  it('takes the lightest darker colour that reaches the ratio', () => {
    for (const sky of [0.2, 0.3, 0.45, 0.7, 0.9]) {
      const text = darkText(sky, TEXT_RATIO);
      expect(
        contrastRatio(relativeLuminance(...text), sky),
      ).toBeGreaterThanOrEqual(TEXT_RATIO);
    }
    // Nothing reads against a sky this dark: the darkest it has.
    expect(darkText(0.12, TEXT_RATIO)).toEqual([1, 0, 24]);
  });

  it('keeps the light wherever it reads, as the home subtitle does', () => {
    expect(themeText(0.05, TEXT_RATIO)).toEqual([237, 228, 227]);
    expect(themeText(0.6, TEXT_RATIO)).toEqual([89, 77, 105]);
  });
});

describe('accents over the sky', () => {
  it('is peach over a dark sky and deep indigo over a light one', () => {
    expect(hex(skyColours(0.03).accent)).toBe(head.peach);
    expect(hex(skyColours(0.45).accent)).toBe(head.indigo);
  });

  it('is the light, not a blend, where peach falls short of 3:1', () => {
    // Peach against a mid sky of 0.14 is about 2.5:1.
    expect(hex(skyColours(0.14, true).accent)).toBe(head.light);
    const swatches = Object.values(head);
    for (let sky = 0; sky <= 1; sky += 0.01)
      for (const wasOnDark of [true, false])
        expect(swatches).toContain(hex(skyColours(sky, wasOnDark).accent));
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

describe('text held to its side once the sky’s side is settled', () => {
  it("takes its view's side, whatever the sky reads", () => {
    expect(skyColours(0.9, true, true).onDark).toBe(true);
    expect(skyColours(0.01, false, false).onDark).toBe(false);
  });

  it('drops a side it took before the sky was drawn', () => {
    // Light text, kept by the switch margin on a light sky just past the
    // crossover, turns dark once that light sky's side is settled.
    const between = CROSSOVER + SWITCH_MARGIN / 2;
    expect(skyColours(between, true).onDark).toBe(true);
    expect(skyColours(between, true, false).onDark).toBe(false);
  });

  it('follows the sky until its side is settled', () => {
    expect(skyColours(0.9, true).onDark).toBe(false);
    expect(skyColours(0.01, false).onDark).toBe(true);
  });
});

describe('which side text takes once settled', () => {
  it("takes its view's side, but a word that follows what is behind it does not", () => {
    expect(restingSide({ settled: true, light: true }, false)).toBe(false);
    expect(restingSide({ settled: true, light: false }, false)).toBe(true);
    // The footer's words, over the dark head on a light sky: their own side.
    expect(restingSide({ settled: true, light: true }, true)).toBeUndefined();
    expect(restingSide({ settled: false, light: true }, false)).toBeUndefined();
  });

  it('gives a word over the dark head light text, though the sky is light', () => {
    const own = restingSide({ settled: true, light: true }, true);
    expect(skyColours(0.02, false, own).onDark).toBe(true);
  });
});

describe('what a single word is held against', () => {
  it('is the middle of what is behind it: a bright streak across the head does not turn it dark', () => {
    const behind = [...Array(28).fill(0.02), ...Array(20).fill(0.6)];
    expect(skyBehind(behind, WORD_SHARE)).toBe(0.02);
    expect(skyColours(skyBehind(behind, WORD_SHARE)).onDark).toBe(true);
    // Held against the lighter share, as other text is, it would go dark.
    expect(skyColours(skyBehind(behind)).onDark).toBe(false);
  });
});
