import { describe, expect, it } from 'vitest';

import {
  Aim,
  AIM_REACH,
  aimAt,
  AIMS,
  chooseAim,
  colourfulness,
  NOW,
  SWEEPS,
  toneMap,
  untoneMap,
  View,
} from './titleAim';

// The name's floor (TitleName.tsx).
const FLOOR = 2;
// The page shows the probe's light as is.
const calibration = { gain: 1, ceiling: 1 };

// A made-up sky as the probe would measure it: the letters' brightness as
// shown, by aim, and the sky behind, now. `current` is the sheet's aim (the
// probe's NOW row).
function view(
  shown: (..._aim: [aim: Aim]) => number,
  current: Aim,
  behind = 0.2,
  colour: (..._aim: [aim: Aim]) => number[] = (aim) => {
    const grey = shown(aim);
    return [grey, grey, grey];
  },
): View {
  const at = (row: number) => (row === NOW ? current : aimAt(row));
  return {
    light: (row) => untoneMap(shown(at(row))),
    colour: (row) => colour(at(row)).map(untoneMap),
    behind: () => untoneMap(behind),
  };
}

// The sky behind the name at 0.2 (a mid-toned sky): lighter letters read at
// 0.45 and up, darker ones at 0.075 and below. Here aims tilted left show
// dark sky, tilted right bright sky, and the middle sky's own brightness.
const banded = (aim: Aim) => (aim.x < -0.5 ? 0.02 : aim.x > 0.5 ? 0.7 : 0.25);
const at = (x: number): Aim => ({ x, y: 0, sweepX: 1, sweepY: 0 });
// One point of the name, as the page shows it, with the sky above and below.
const check = (shown: number, behind = 0.2) => [
  { point: 0, shown, behind: [behind, behind] },
];

describe('the aim grid', () => {
  it('lays out every tilt with every sweep direction, once', () => {
    const seen = new Set<string>();
    for (let row = 0; row < AIMS; row++) seen.add(JSON.stringify(aimAt(row)));
    expect(seen.size).toBe(AIMS);
    expect(aimAt(0)).toMatchObject({ x: -AIM_REACH, y: -AIM_REACH });
    expect(aimAt(AIMS - 1)).toMatchObject({ x: AIM_REACH, y: AIM_REACH });
    for (const [k, [x, y]] of SWEEPS.entries()) {
      const aim = aimAt(k * (AIMS / SWEEPS.length));
      expect([aim.sweepX, aim.sweepY]).toEqual([x, y]);
      expect(Math.hypot(x!, y!)).toBeCloseTo(1);
    }
  });
});

describe('the tone map', () => {
  it('undoes itself', () => {
    for (const shown of [0.01, 0.2, 0.5, 0.9])
      expect(toneMap(untoneMap(shown))).toBeCloseTo(shown, 4);
  });
});

describe('colourfulness', () => {
  it('scores greys of one tone as no palette at all', () => {
    expect(colourfulness([[0.5, 0.5, 0.5]])).toBe(0);
  });

  it('grows with saturation, with spread of hue, and with spread of tone', () => {
    const pale = colourfulness([[0.9, 0.85, 0.9]]);
    const pink = colourfulness([[0.9, 0.4, 0.6]]);
    expect(pink).toBeGreaterThan(pale);
    const oneHue = colourfulness([
      [0.9, 0.4, 0.6],
      [0.9, 0.4, 0.6],
    ]);
    const twoHues = colourfulness([
      [0.9, 0.4, 0.6],
      [0.3, 0.5, 0.9],
    ]);
    expect(twoHues).toBeGreaterThan(oneHue);
    expect(
      colourfulness([
        [0.1, 0.1, 0.1],
        [0.8, 0.8, 0.8],
      ]),
    ).toBeGreaterThan(0);
  });
});

describe('choosing where the name faces', () => {
  it('stays put while the name reads', () => {
    const current = at(1);
    const chosen = chooseAim(
      [view(banded, current)],
      check(0.7),
      calibration,
      current,
      FLOOR,
      true,
      false,
    );
    expect(chosen).toEqual({
      aim: current,
      worst: expect.any(Number),
      flip: false,
    });
  });

  it('turns to sky that reads, on its own side, once it fades into the sky', () => {
    const current = at(0);
    const chosen = chooseAim(
      [view(banded, current)],
      // A shade lighter than the sky: on the light side, unreadable.
      check(0.25),
      calibration,
      current,
      FLOOR,
      true,
      false,
    );
    expect(chosen.flip).toBe(false);
    expect(chosen.aim.x).toBeGreaterThan(0.5);
    expect(chosen.worst).toBeGreaterThanOrEqual(FLOOR);
  });

  it('flips to the other side only when its own side cannot read', () => {
    // No bright sky anywhere: the light side tops out at the sky's own
    // brightness.
    const dull = (aim: Aim) => (aim.x < -0.5 ? 0.02 : 0.25);
    const current = at(1);
    const choose = (mayFlip: boolean) =>
      chooseAim(
        [view(dull, current)],
        check(0.25),
        calibration,
        current,
        FLOOR,
        mayFlip,
        false,
      );
    const flipped = choose(true);
    expect(flipped.flip).toBe(true);
    expect(flipped.aim.x).toBeLessThan(-0.5);
    // Not yet allowed to flip (just flipped): it keeps to its own side.
    const held = choose(false);
    expect(held.flip).toBe(false);
    expect(held.aim.x).toBeGreaterThan(-0.5);
  });

  it('flips for a near miss only once it has waited', () => {
    // The light side gets the name to 1.8:1: short of the floor, but not by
    // much.
    const nearly = (aim: Aim) =>
      aim.x < -0.5 ? 0.02 : aim.x > 0.5 ? 0.4 : 0.25;
    const current = at(1);
    const choose = (patient: boolean) =>
      chooseAim(
        [view(nearly, current)],
        check(0.4),
        calibration,
        current,
        FLOOR,
        true,
        patient,
      );
    expect(choose(false).flip).toBe(false);
    expect(choose(true).flip).toBe(true);
  });

  it('moves early when the sky is turning toward its own brightness', () => {
    // Ahead, the sky behind brightens to 0.4: only the brightest aims still
    // read there.
    const bright = (aim: Aim) =>
      aim.x < -0.5 ? 0.02 : aim.x > 1 ? 0.95 : aim.x > 0.5 ? 0.7 : 0.25;
    const current = at(0.8);
    const chosen = chooseAim(
      [view(bright, current), view(bright, current, 0.4)],
      check(0.7),
      calibration,
      current,
      FLOOR,
      true,
      false,
    );
    expect(chosen.aim.x).toBeGreaterThan(1);
  });

  it('drifts toward more colour while it reads, a step at a time', () => {
    const current = at(1);
    // The sky a step to the right is pink; everything else on the light
    // side is grey.
    const pinkFrom = current.x + 0.2;
    const colour = (aim: Aim) =>
      aim.x > pinkFrom ? [0.9, 0.45, 0.7] : [0.7, 0.7, 0.7];
    const shown = (aim: Aim) => (aim.x > pinkFrom ? 0.65 : banded(aim));
    const chosen = chooseAim(
      [view(shown, current, 0.2, colour)],
      check(0.7),
      calibration,
      current,
      FLOOR,
      true,
      false,
    );
    expect(chosen.aim.x).toBeGreaterThan(pinkFrom);
    // One step, not a leap across the sky.
    expect(chosen.aim.x - current.x).toBeLessThan(0.6);
  });
});
