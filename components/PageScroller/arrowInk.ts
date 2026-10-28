import { contrastRatio } from '@/components/Background/backdrop';

// Whether a scroll arrow over the sky (ScrollArrows.tsx) is drawn in white:
// while what is drawn behind it, the 3D head or a dark sky, leaves white at
// least WHITE_FROM to 1, judged from the middle of its backdrop samples
// (BackdropSampler) so a few lenses of bright sky in its glass do not decide.
// Once white it stays so until white falls under WHITE_UNTIL, so it never
// flickers at the edge. Otherwise it takes the cards' text colour.
const WHITE_FROM = 3.2;
const WHITE_UNTIL = 2.8;
const WHITE = 1;

export function isWhite(samples: number[], wasWhite: boolean) {
  if (!samples.length) return wasWhite;
  const sorted = [...samples].sort((a, b) => a - b);
  const middle = sorted[Math.floor(sorted.length / 2)]!;
  const ratio = contrastRatio(WHITE, middle);
  return ratio >= (wasWhite ? WHITE_UNTIL : WHITE_FROM);
}
