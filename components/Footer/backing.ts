import { contrastRatio } from '@/components/Background/backdrop';

// Whether the footer's text needs a flat backing (Footer/index.tsx): when
// what is behind it is both much darker and much lighter than itself, as
// where it crosses the head's dark chest and the pale sky on a phone, no one
// text colour reads over all of it. Judged from the backdrop's samples
// (BackdropSampler): its darker and lighter tenths at least BACK_FROM to 1
// apart, and once backed it stays so until they come under BACK_UNTIL, so it
// never flickers at the edge.
const BACK_FROM = 3;
const BACK_UNTIL = 2.5;

export function needsBacking(samples: number[], wasBacked: boolean) {
  if (!samples.length) return wasBacked;
  const sorted = [...samples].sort((a, b) => a - b);
  const dark = sorted[Math.floor(0.1 * (sorted.length - 1))]!;
  const light = sorted[Math.ceil(0.9 * (sorted.length - 1))]!;
  return contrastRatio(light, dark) >= (wasBacked ? BACK_UNTIL : BACK_FROM);
}
