import { isSmall } from './smallScreen';

// How finely the scene is drawn on a window `width` by `height` CSS pixels:
// its pixel ratio (the range three may pick from, by the screen's own) and
// how many samples smooth its edges. Every pass after the first draws the
// whole frame again, so each extra pixel and sample costs several times over.
// A phone's screen is dense enough to hide jagged edges and its GPU is
// small, so it draws at up to 1.5 pixels per CSS pixel without smoothing; a
// larger screen at up to 2, with 4 samples (8, drei's default, looks no
// smoother over the soft sky and glossy head).
export function renderQuality(width: number, height: number) {
  return isSmall(width, height)
    ? { dpr: [1, 1.5] as [number, number], samples: 0 }
    : { dpr: [1, 2] as [number, number], samples: 4 };
}
