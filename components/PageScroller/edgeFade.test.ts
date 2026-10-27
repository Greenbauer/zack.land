import { describe, expect, it } from 'vitest';

import {
  edgeFade,
  edgeFadeCss,
  Fade,
  NARROW,
  WIDE,
  WIDE_FROM,
} from './edgeFade';

// The top stops as [opacity, pixels from the top of the window].
const topStops = (fade: Fade) =>
  [
    ...edgeFade(fade).mask.matchAll(
      /rgba\(0, 0, 0, ([\d.]+)\) (\d+(?:\.\d+)?)px/g,
    ),
  ].map(([, alpha, px]) => [Number(alpha), Number(px)] as const);

// The bottom stops as [opacity, pixels up from the bottom of the window]
// for a footer `height` tall.
const bottomStops = (fade: Fade, height: number) =>
  [
    ...edgeFade(fade).mask.matchAll(
      /rgba\(0, 0, 0, ([\d.]+)\) calc\(100% - var\(--footer-height, 58px\) \+ (-?[\d.]+)px\)/g,
    ),
  ].map(([, alpha, px]) => [Number(alpha), height - Number(px)] as const);

// The opacity at `px` down, between the stops either side of it.
const opacityAt = (fade: Fade, px: number) => {
  const stops = topStops(fade);
  const k = stops.findIndex(([, at]) => at >= px);
  if (k <= 0) return stops[Math.max(k, 0)]![0];
  const [[a0, p0], [a1, p1]] = [stops[k - 1]!, stops[k]!];
  return a0 + ((a1 - a0) * (px - p0)) / (p1 - p0);
};

// The page's space below its end, for a footer `height` tall.
const pageBottomAt = (fade: Fade, height: number) => {
  const [, a, b, c] = edgeFade(fade)
    .pageBottom.replace('var(--footer-height, 58px)', `${height}px`)
    .match(/calc\((\d+)px - (\d+)px \+ (\d+)px\)/)!;
  return Number(a) - Number(b) + Number(c);
};

describe.each([
  ['a wide screen', WIDE, 0.1],
  ['a phone', NARROW, 0.2],
] as const)(
  'page content fading at the edges, on %s',
  (_, fade, behindText) => {
    it('hides everything above the fade and shows everything below it', () => {
      const stops = topStops(fade);
      expect(stops[0]).toEqual([0, fade.clear]);
      expect(stops.at(-1)).toEqual([1, fade.solid]);
      // The header's text runs from about 22 to 58 pixels down: at most the
      // faint start of the fade reaches behind it.
      expect(opacityAt(fade, 58)).toBeLessThan(behindText);
    });

    it('eases in, without a hard edge', () => {
      const stops = topStops(fade);
      expect(stops.length).toBeGreaterThan(8);
      for (let k = 1; k < stops.length; k++) {
        expect(stops[k]![0]).toBeGreaterThanOrEqual(stops[k - 1]![0]);
        expect(stops[k]![1]).toBeGreaterThan(stops[k - 1]![1]);
        // No step jumps more than a fifth of the way.
        expect(stops[k]![0] - stops[k - 1]![0]).toBeLessThan(0.2);
      }
    });

    it('has page content start where it is nearly whole', () => {
      expect(opacityAt(fade, fade.pageTop)).toBeGreaterThan(0.85);
    });

    it('mirrors the top fade at the bottom, against a 58 pixel footer', () => {
      // The header's text ends 58 down: against a footer that tall the bottom
      // fade is the top's, upside down.
      expect(bottomStops(fade, 58)).toEqual([...topStops(fade)].reverse());
    });

    it('moves the bottom fade up with a taller footer, keeping its shape', () => {
      const short = bottomStops(fade, 58);
      const tall = bottomStops(fade, 166);
      expect(tall.map(([alpha]) => alpha)).toEqual(
        short.map(([alpha]) => alpha),
      );
      tall.forEach(([, px], k) => expect(px - short[k]![1]).toBe(108));
    });

    it('ends the page where the bottom fade is as far along as the top at pageTop', () => {
      expect(pageBottomAt(fade, 58)).toBe(fade.pageTop);
      expect(pageBottomAt(fade, 166)).toBe(fade.pageTop + 108);
    });
  },
);

describe('the fade on each screen', () => {
  it('is shorter on a phone, giving its posts more room', () => {
    expect(NARROW.solid - NARROW.clear).toBeLessThan(WIDE.solid - WIDE.clear);
    expect(NARROW.pageTop).toBeLessThan(WIDE.pageTop);
  });

  it("sets the phone's fade, then the wide one from Tailwind's md", () => {
    const css = edgeFadeCss('#page');
    const [narrow, wide] = css.split(`@media (min-width: ${WIDE_FROM}px)`);
    expect(narrow).toContain(`--page-top: ${NARROW.pageTop}px`);
    expect(narrow).toContain(edgeFade(NARROW).mask);
    expect(wide).toContain(`--page-top: ${WIDE.pageTop}px`);
    expect(wide).toContain(edgeFade(WIDE).mask);
    expect(WIDE_FROM).toBe(768);
  });
});
