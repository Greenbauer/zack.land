import {
  contrastRatio,
  relativeLuminance,
} from '@/components/Background/backdrop';
import head from '@/theme/head.json';

// Whether a scroll arrow over the sky (ScrollArrows.tsx) is drawn in the
// theme's light: while what is drawn behind it, the 3D head or a dark sky,
// leaves the light at least LIGHT_FROM to 1 (WCAG AA for its small text),
// judged from the middle of its backdrop samples (BackdropSampler) so a few
// lenses of bright sky in its glass do not decide. Over a mid sky, where the
// light falls short of that, the cards' dark text reads better, so it takes
// the cards' text colour. Once light it stays so until the light falls under
// LIGHT_UNTIL, so it never flickers at the edge.
const LIGHT_FROM = 4.5;
const LIGHT_UNTIL = 4;
const LIGHT = relativeLuminance(
  ...([1, 3, 5].map((k) => parseInt(head.light.slice(k, k + 2), 16)) as [
    number,
    number,
    number,
  ]),
);

export function isLight(samples: number[], wasLight: boolean) {
  if (!samples.length) return wasLight;
  const sorted = [...samples].sort((a, b) => a - b);
  const middle = sorted[Math.floor(sorted.length / 2)]!;
  const ratio = contrastRatio(LIGHT, middle);
  return ratio >= (wasLight ? LIGHT_UNTIL : LIGHT_FROM);
}
