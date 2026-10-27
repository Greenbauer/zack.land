// Where the name's curved sheet should face, so every part of the name
// mirrors sky that stands out from what is behind it (TitleName.tsx).
//
// The name is a mirror of the real sky: each point shows the sky in the
// direction its surface reflects the view. Facing the same patch of sky that
// is behind it, a letter vanishes into it. So the sheet's facing (its aim, a
// tilt added to the whole sheet's normals) is chosen from a grid of aims: the
// light each part of the name would show at each is measured by three's own
// shading (titleProbe.ts) and compared with what the page shows behind that
// part. An aim that keeps every part readable, near the current one, wins.

// The sheet's facing: a tilt of the whole sheet (x, y), and which way its
// curve bends the surface from its left end to its right (sweepX, sweepY: a
// direction, at the sheet's full sweep). A level sweep runs the reflection
// along the sky, through its hues; a slanted one also runs it from the dark
// ground through the bright horizon to the sky, through its tones: so the
// name always carries the sky's whole palette, from end to end.
export type Aim = { x: number; y: number; sweepX: number; sweepY: number };

// The aims tried: tilts from -AIM_REACH to AIM_REACH in AIM_STEPS steps each
// way, with the full sweep in each of SWEEPS' directions (degrees from
// level, rising to the right).
export const AIM_STEPS = 13;
export const AIM_REACH = 1.6;
export const SWEEPS = [0, 30, 60, -30, -60, 180, 150, 120, 210, 240].map(
  (degrees) => [
    Math.cos((degrees * Math.PI) / 180),
    Math.sin((degrees * Math.PI) / 180),
  ],
);
export const AIMS = AIM_STEPS * AIM_STEPS * SWEEPS.length;

// The aim in a row of the grid (titleProbe.ts lays it out the same way).
export function aimAt(row: number): Aim {
  const square = AIM_STEPS * AIM_STEPS;
  const r = row % square;
  const step = (2 * AIM_REACH) / (AIM_STEPS - 1);
  return {
    x: -AIM_REACH + Math.floor(r / AIM_STEPS) * step,
    y: -AIM_REACH + (r % AIM_STEPS) * step,
    sweepX: SWEEPS[Math.floor(row / square)]![0]!,
    sweepY: SWEEPS[Math.floor(row / square)]![1]!,
  };
}

// three's ACES filmic tone mapping (exposure 1) on a luminance, as the page
// shows it: Narkowicz's fit, after three's 1 / 0.6 exposure scale.
export const toneMap = (l: number) => {
  const x = l / 0.6;
  return Math.min(
    Math.max((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0),
    1,
  );
};

// The light (before tone mapping) that `toneMap` turns into `shown`.
export function untoneMap(shown: number) {
  let [low, high] = [0, 64];
  for (let step = 0; step < 40; step++) {
    const middle = (low + high) / 2;
    if (toneMap(middle) < shown) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

const ratio = (a: number, b: number) =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

// How the page shows the probe's light: tone mapped after a gain, then
// scaled by a ceiling. The colour grading darkens and compresses the
// brightest tones, which a gain alone cannot follow.
export type Calibration = { gain: number; ceiling: number };

export const shownAs = (light: number, { gain, ceiling }: Calibration) =>
  toneMap(light * gain) * ceiling;

// A point of the name (a column of the probe): its luminance as the page
// shows it now, and the luminances the page shows around it.
export type Check = { point: number; shown: number; behind: number[] };

// How far the page's own reading of a point may correct the probe's
// prediction for it, either way.
const CORRECTION = 1.6;

// The probe's grid row for the sheet's current aim (titleProbe.ts).
export const NOW = AIMS;

// Room kept above the target, as the sky keeps turning while the name turns
// to follow: the name moves on once it falls below KEEP times the target,
// toward an aim at HEADROOM times it, so it is still readable on arrival.
const KEEP = 1.1;
const HEADROOM = 1.3;
// Among aims that read, the name prefers more contrast (up to CONTRAST_CAP
// times the target: past that, more only pushes it toward black or white),
// more colour (each unit of COLOURFULNESS worth COLOUR_WEIGHT of contrast),
// and a shorter turn: each unit of turn costs TURN_COST of contrast. Changing
// the sweep costs double: on the way, the colours flatten.
const CONTRAST_CAP = 1.5;
const COLOUR_WEIGHT = 30;
const TURN_COST = 0.8;
const SWEEP_COST = 2;
// While readable, the name still turns toward a readable aim this much more
// colourful (and at least MORE_COLOUR more), at the world's pace.
const RICHER = 1.25;
const MORE_COLOUR = 0.03;
// It gets there step by step, each step to an aim within this reach (in
// tilt and sweep direction) that is readable now and where the sky is
// turning, so it never crosses unreadable aims on the way.
const STEP = 0.6;
// A flip passes through tones that vanish, so the name flips only when its
// own side cannot keep this share of the target, or (`patient`) after it has
// stayed short of the target a while.
const FLIP_BELOW = 0.75;
// How much an aim's contrast where the sky is turning counts, against its
// contrast now.
const AHEAD_WEIGHT = 0.7;

// What the probe measured for one turn of the sky (titleProbe.ts): the
// letters' light at each aim, and the sky behind each point.
export type View = {
  light: (..._cell: [row: number, point: number]) => number;
  colour: (..._cell: [row: number, point: number]) => number[];
  behind: (..._point: [point: number]) => number;
};

// How much of a palette a set of colours (each red, green, blue, 0 to 1, as
// shown) spans: Hasler and Süsstrunk's colourfulness, which grows both with
// how far the colours spread from one another and with how saturated they
// are on average, on opponent axes (red against green, yellow against blue),
// plus the spread of their tones, dark to light (TONE_WEIGHT).
const TONE_WEIGHT = 0.5;
// How much the colours' average saturation counts: three times Hasler and
// Süsstrunk's 0.3, so a palette of pale near-whites scores low.
const SATURATION_WEIGHT = 1;

export function colourfulness(colours: number[][]) {
  if (!colours.length) return 0;
  const rg = colours.map(([r, g]) => r! - g!);
  const yb = colours.map(([r, g, b]) => 0.5 * (r! + g!) - b!);
  const mean = (values: number[]) =>
    values.reduce((sum, v) => sum + v, 0) / values.length;
  const spread = (values: number[]) => {
    const m = mean(values);
    return mean(values.map((v) => (v - m) ** 2));
  };
  const tone = colours.map(
    ([r, g, b]) => 0.2126 * r! + 0.7152 * g! + 0.0722 * b!,
  );
  return (
    Math.sqrt(spread(rg) + spread(yb)) +
    SATURATION_WEIGHT * Math.hypot(mean(rg), mean(yb)) +
    TONE_WEIGHT * Math.sqrt(spread(tone))
  );
}

// The name graded over the sky now (views[0]) and where it is turning
// (the other views). The probe's predictions are scaled by what the page
// shows now over what the probe predicts now, point by point: what the probe
// misses at a point (the grading's tint, a stroke's edge) it likely misses
// at every aim and turn. So the current aim, now, is graded exactly as the
// page shows it. What is behind a point later is what the page shows behind
// it now, changed as the probe says the sky behind it changes.
class Grader {
  private readonly corrections: number[];
  private readonly behind: number[][][];

  constructor(
    private readonly views: View[],
    private readonly checks: Check[],
    private readonly calibration: Calibration,
  ) {
    const [now] = views;
    const fit = (measured: number, predicted: number) =>
      Math.min(
        Math.max((measured + 0.002) / (predicted + 0.002), 1 / CORRECTION),
        CORRECTION,
      );
    this.corrections = checks.map(({ point, shown }) =>
      fit(shown, shownAs(now!.light(NOW, point), calibration)),
    );
    this.behind = views.map((view) =>
      checks.map(({ point, behind }) => {
        const change =
          (shownAs(view.behind(point), calibration) + 0.002) /
          (shownAs(now!.behind(point), calibration) + 0.002);
        return behind.map((b) => Math.min(b * change, 1));
      }),
    );
  }

  // An aim's worst contrast now and over the views ahead, how colourful it
  // shows the name now, and whether it shows the name lighter than what is
  // behind it (on average) now, or darker.
  grade(row: number) {
    let worst = Infinity;
    let ahead = Infinity;
    let shownSum = 0;
    let behindSum = 0;
    let behindCount = 0;
    const colours: number[][] = [];
    this.views.forEach((view, t) =>
      this.checks.forEach(({ point }, k) => {
        if (!t)
          colours.push(
            view
              .colour(row, point)
              .map((c) =>
                Math.min(
                  shownAs(c, this.calibration) * this.corrections[k]!,
                  1,
                ),
              ),
          );
        const shown = Math.min(
          shownAs(view.light(row, point), this.calibration) *
            this.corrections[k]!,
          1,
        );
        if (!t) shownSum += shown;
        for (const b of this.behind[t]![k]!) {
          if (t) ahead = Math.min(ahead, ratio(shown, b));
          else worst = Math.min(worst, ratio(shown, b));
          if (!t) {
            behindSum += b;
            behindCount++;
          }
        }
      }),
    );
    return {
      worst,
      ahead,
      colour: colourfulness(colours),
      lighter: shownSum / this.checks.length > behindSum / behindCount,
    };
  }
}

// Where the sheet should face, from the probe's views of the sky now and
// ahead (`views`), and how the page shows them (`calibration`).
//
// While every checked point keeps `target` contrast now and ahead, with
// room to spare (KEEP), the name stays as it is, unless a readable aim is
// clearly more colourful (RICHER). Otherwise it moves to an aim that does
// now, near, with a margin, and readable ahead (TURN_COST, AHEAD_WEIGHT), on
// the same side (lighter or darker than what is behind it). Only if none on that side does, its own
// side's best is well short (FLIP_BELOW) or short and `patient`, and one on
// the other side does, it flips to the best of those (`flip`), when
// `mayFlip`. Failing that, it takes its own side's best.
export function chooseAim(
  views: View[],
  checks: Check[],
  calibration: Calibration,
  current: Aim,
  target: number,
  mayFlip: boolean,
  patient: boolean,
): { aim: Aim; worst: number; flip: boolean } {
  const grader = new Grader(views, checks, calibration);
  const now = grader.grade(NOW);
  const readable = now.worst >= target * KEEP && now.ahead >= target * KEEP;
  const { same, other, richest, best } = survey(grader, now, current, target);
  // Readable, the name drifts toward a clearly more colourful readable aim,
  // lighter or darker than the sky or both: past the floor, the palette
  // matters most.
  if (readable)
    return richest.colour >
      Math.max(now.colour * RICHER, now.colour + MORE_COLOUR)
      ? { aim: richest.aim, worst: richest.worst, flip: false }
      : { aim: current, worst: now.worst, flip: false };
  if (same.score > -Infinity)
    return { aim: same.aim, worst: same.worst, flip: false };
  const short = best.worst < (patient ? 1 : FLIP_BELOW) * target;
  if (mayFlip && other.score > -Infinity && short)
    return { aim: other.aim, worst: other.worst, flip: true };
  return { aim: best.aim, worst: best.worst, flip: false };
}

// One candidate aim, and how it did.
type Pick = { aim: Aim; score: number; worst: number; colour: number };
const unpicked = (aim: Aim): Pick => ({
  aim,
  score: -Infinity,
  worst: 0,
  colour: 0,
});

// How far the sheet turns from one aim to another, a change of sweep
// direction counted `sweepCost` times over.
const turn = (a: Aim, b: Aim, sweepCost: number) =>
  Math.hypot(
    a.x - b.x,
    a.y - b.y,
    sweepCost * (a.sweepX - b.sweepX),
    sweepCost * (a.sweepY - b.sweepY),
  );

// Whether an aim is a step from `current` that reads, with headroom, now and
// where the sky is turning.
const isStep = (
  graded: ReturnType<Grader['grade']>,
  aim: Aim,
  current: Aim,
  goal: number,
) =>
  turn(aim, current, 1) <= STEP && graded.worst >= goal && graded.ahead >= goal;

// The grid's best aims for chooseAim: the best-scoring that read on the
// name's own side (`same`, with headroom) and on the other (`other`), the most
// colourful a step away that reads now and ahead (`richest`), and the own
// side's most readable, read or not (`best`).
function survey(
  grader: Grader,
  now: ReturnType<Grader['grade']>,
  current: Aim,
  target: number,
) {
  const goal = target * HEADROOM;
  const picks = {
    same: unpicked(current),
    other: unpicked(current),
    richest: unpicked(current),
    best: { aim: current, worst: now.worst },
  };
  for (let row = 0; row < AIMS; row++) {
    const graded = grader.grade(row);
    const aim = aimAt(row);
    const ownSide = graded.lighter === now.lighter;
    if (ownSide && graded.worst > picks.best.worst)
      picks.best = { aim, worst: graded.worst };
    // A move on the same side keeps headroom; a flip takes any aim that
    // reads, as staying put does not.
    if (graded.worst < (ownSide ? goal : target)) continue;
    const pick: Pick = {
      aim,
      worst: graded.worst,
      colour: graded.colour,
      score:
        Math.min(graded.worst, CONTRAST_CAP * target) +
        AHEAD_WEIGHT * Math.min(graded.ahead, CONTRAST_CAP * target) +
        COLOUR_WEIGHT * graded.colour -
        TURN_COST * turn(aim, current, SWEEP_COST),
    };
    const side = ownSide ? 'same' : 'other';
    if (pick.score > picks[side].score) picks[side] = pick;
    if (
      isStep(graded, aim, current, goal) &&
      pick.colour > picks.richest.colour
    )
      picks.richest = pick;
  }
  return picks;
}
