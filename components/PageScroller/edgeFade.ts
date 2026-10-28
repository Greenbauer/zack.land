// The page scrolls inside a fixed box (PageScroller) whose mask makes what
// scrolls under the header, and under the footer that always shows at the
// bottom, fade out the way the background's bust fades into the haze. At the
// top it is gone above `clear` (partway down the header's text, so behind
// the header there is only sky or the faint start of the fade), whole below
// `solid`, and eases between the two (pixels from the top of the window).
// The bottom mirrors it from the footer's top edge, whatever the footer's
// height (--footer-height, which the footer keeps up to date). Page content,
// and the side menu that sticks, start at `pageTop`, where the fade is all
// but done; the page ends as far above the footer.
export type Fade = { clear: number; solid: number; pageTop: number };

// A long, slow fade on a wide screen; a short one on a phone, where every
// pixel between the header and the footer counts.
export const WIDE: Fade = { clear: 32, solid: 208, pageTop: 160 };
export const NARROW: Fade = { clear: 40, solid: 104, pageTop: 86 };
// Where WIDE takes over (Tailwind's md).
export const WIDE_FROM = 768;

// The header's text ends 58 pixels down; the bottom fade sits as far inside
// the footer as the top one starts above that.
const HEADER_TEXT_END = 58;
// Until the footer is measured: its height on a wide screen.
const FOOTER_HEIGHT = 'var(--footer-height, 58px)';

// Enough stops that the eased ramp reads as one soft gradient.
const STEPS = 16;

const smootherstep = (t: number) => t * t * t * (t * (6 * t - 15) + 10);

export function edgeFade({ clear, solid, pageTop }: Fade) {
  const insideFooter = HEADER_TEXT_END - clear;
  const ramp = Array.from({ length: STEPS + 1 }, (_, k) => {
    const t = k / STEPS;
    return {
      alpha: +smootherstep(t).toFixed(3),
      reach: clear + t * (solid - clear),
    };
  });
  // Transparent to black down from the top, and back to transparent toward
  // the footer, eased like the bust's haze (smootherstep).
  const mask = `linear-gradient(to bottom, ${[
    ...ramp.map(({ alpha, reach }) => `rgba(0, 0, 0, ${alpha}) ${reach}px`),
    ...[...ramp]
      .reverse()
      .map(
        ({ alpha, reach }) =>
          `rgba(0, 0, 0, ${alpha}) calc(100% - ${FOOTER_HEIGHT} + ${insideFooter + clear - reach}px)`,
      ),
  ].join(', ')})`;
  return {
    mask,
    // The space below the page's end, so its last line can scroll up to
    // where the bottom fade is as far along as the top's at pageTop.
    pageBottom: `calc(${FOOTER_HEIGHT} - ${insideFooter}px + ${pageTop - clear}px)`,
    // A portfolio post fills the space between the two fades, and the next
    // starts postGap below it, where the bottom fade has hidden it: scrolling
    // snaps from one post to the next, each its own full page.
    postGap: pageTop - clear,
  };
}

// The mask's opacity `y` pixels down a window `height` tall whose footer is
// `footer` tall: how much of what scrolls there shows. For what is drawn
// behind the page rather than in it (the cards' frosting, in the 3D scene:
// components/Background/glass.ts), to fade the same way.
export function fadeAt(
  y: number,
  height: number,
  footer: number,
  { clear, solid }: Fade,
) {
  const eased = (reach: number) =>
    smootherstep(Math.min(Math.max((reach - clear) / (solid - clear), 0), 1));
  const insideFooter = HEADER_TEXT_END - clear;
  return Math.min(eased(y), eased(height - footer + insideFooter + clear - y));
}

// What of the mask the scroller's own scrollbar takes, along its right side:
// the mask would fade it too, so a strip as wide as the scrollbar
// (--scrollbar-width, which ScrollbarWidth.tsx keeps up to date; none where
// the scrollbar floats over the page) is left whole.
const SCROLLBAR_STRIP = [
  'mask-size: 100% 100%, var(--scrollbar-width, 0px) 100%',
  'mask-position: 0 0, 100% 0',
  'mask-repeat: no-repeat',
];

// The fade as CSS variables on the scroller, for it and the page inside:
// --page-top, --page-bottom, --post-height and --post-gap.
export function edgeFadeCss(selector: string) {
  const rules = (fade: Fade) => {
    const { mask, pageBottom, postGap } = edgeFade(fade);
    const layers = `${mask}, linear-gradient(#000, #000)`;
    return [
      `--page-top: ${fade.pageTop}px`,
      `--page-bottom: ${pageBottom}`,
      '--post-height: calc(100dvh - var(--page-top) - var(--page-bottom))',
      `--post-gap: ${postGap}px`,
      `mask-image: ${layers}`,
      `-webkit-mask-image: ${layers}`,
      ...SCROLLBAR_STRIP,
      ...SCROLLBAR_STRIP.map((rule) => `-webkit-${rule}`),
    ].join('; ');
  };
  return `${selector} { ${rules(NARROW)} } @media (min-width: ${WIDE_FROM}px) { ${selector} { ${rules(WIDE)} } }`;
}

// The scroller's id, for what finds it from outside (the pager, the scroll
// arrows, the glass).
export const PAGE_SCROLLER_ID = 'page';
