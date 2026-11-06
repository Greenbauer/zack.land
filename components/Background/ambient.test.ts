import { describe, expect, it } from 'vitest';

import {
  Ambient,
  ambientFace,
  FACE_GAP,
  holdFace,
  SAG,
  startAmbient,
  stepAmbient,
  TILT_MAX,
  TILT_RETURN,
  tiltRoom,
  withFace,
} from './ambient';
import {
  BOLD_CHANCE,
  BOLD_LOOKS,
  FACE_LASTS,
  LASTS,
  LOOKS,
  paceOf,
} from './ambientLooks';

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

// Looking down toward a corner, where the head may tilt all it likes.
const CORNER = { x: 0.12, y: 0.35 };
const STRAIGHT = { x: 0, y: 0 };

// Ten minutes of the head's little movements at 60 frames a second, the head
// looking `look`.
function run(fps = 60, seconds = 600, random = seeded(9), look = CORNER) {
  let ambient = startAmbient(0, random);
  const frames: { time: number; ambient: Ambient }[] = [];
  for (let k = 1; k <= fps * seconds; k++) {
    ambient = stepAmbient(ambient, look, k / fps, 1 / fps, random);
    frames.push({ time: k / fps, ambient });
  }
  return frames;
}

describe("the head's little movements of its own", () => {
  const frames = run();

  it('tilts a little either way, never more than TILT_MAX', () => {
    const tilts = frames.map(({ ambient }) => ambient.tilt);
    expect(Math.max(...tilts)).toBeLessThanOrEqual(TILT_MAX);
    expect(Math.min(...tilts)).toBeGreaterThanOrEqual(-TILT_MAX);
    expect(Math.max(...tilts)).toBeGreaterThan(TILT_MAX / 2);
    expect(Math.min(...tilts)).toBeLessThan(-TILT_MAX / 2);
  });

  it('tilts quickly but smoothly, its speed never jumping between frames', () => {
    let biggest = 0;
    let fastest = 0;
    for (let k = 1; k < frames.length; k++) {
      const { tiltSpeed } = frames[k]!.ambient;
      fastest = Math.max(fastest, Math.abs(tiltSpeed));
      biggest = Math.max(
        biggest,
        Math.abs(tiltSpeed - frames[k - 1]!.ambient.tiltSpeed),
      );
    }
    // Quick: well over a tenth of a radian a second at its fastest.
    expect(fastest).toBeGreaterThan(0.15);
    // Smooth: it builds up to that over several frames (a spring sets off
    // with a third of it in its first), never snapping to it in one.
    expect(biggest).toBeLessThan(fastest / 2);
  });

  it('shows a passing look every few seconds, each kind in turn', () => {
    const seen = new Set<string>();
    let starts = 0;
    frames.forEach(({ ambient }, k) => {
      const face = ambient.face;
      if (face && face !== frames[k - 1]?.ambient.face) {
        starts++;
        seen.add(face.name);
      }
    });
    // A start every 2.5 to 7 seconds plus its own length, over ten minutes.
    expect(starts).toBeGreaterThan(600 / 9.8);
    expect(starts).toBeLessThan(600 / 3.7);
    expect([...seen].sort()).toEqual(Object.keys(LOOKS).sort());
  });

  it('moves the brows as a wave: one leads, the other follows, less', () => {
    const look = LOOKS.browFlick!('Left', 'Right');
    expect(look.browsUpLeft![2]).toBeUndefined();
    expect(look.browsUpRight![2]).toBeGreaterThan(0);
    expect(look.browsUpRight![1]).toBeLessThan(look.browsUpLeft![0]);
    // The follower is still at rest while the leader is already rising.
    const ambient: Ambient = {
      ...startAmbient(0),
      face: {
        name: 'browFlick',
        peaks: { browsUpLeft: 0.8, browsUpRight: 0.3 },
        lags: { browsUpRight: 0.15 },
        start: 0,
        end: 1,
      },
    };
    const early = ambientFace(ambient, 0.1);
    expect(early.browsUpLeft).toBeGreaterThan(0);
    expect(early.browsUpRight).toBe(0);
    expect(ambientFace(ambient, 0.3).browsUpRight).toBeGreaterThan(0);
  });

  it('never moves one side of the face alone: the other follows', () => {
    // The brows and lids split into halves (sideMorphs.ts): a look moving
    // one half moves the other too. (The mouth's pull to one side is one
    // whole shape.)
    const halves = (morph: string) =>
      /^(browsUp|squint)(Left|Right)$/.test(morph);
    for (const [name, look] of Object.entries(LOOKS)) {
      const parts = Object.keys(look('Left', 'Right')).filter(halves);
      const left = parts.filter((morph) => morph.endsWith('Left'));
      const right = parts.filter((morph) => morph.endsWith('Right'));
      expect(left.length > 0, name).toBe(right.length > 0);
    }
    // The mouth pulled aside: the other eye narrows too, less and a beat later.
    for (const name of ['aside']) {
      const parts = LOOKS[name]!('Left', 'Right');
      expect(parts.squintRight![1]).toBeLessThan(parts.squintLeft![0]);
      expect(parts.squintRight![2]).toBeGreaterThan(0);
    }
  });

  it('comes and goes without a jump, never past its peaks', () => {
    const previous: Record<string, number> = {};
    for (const { time, ambient } of frames) {
      const now = ambientFace(ambient, time);
      for (const [morph, value] of Object.entries(now)) {
        const peak = ambient.face!.peaks[morph]!;
        expect(value).toBeLessThanOrEqual(peak + 1e-9);
        // Even a quick flick takes a few frames to reach its height.
        expect(Math.abs(value - (previous[morph] ?? 0))).toBeLessThan(
          peak * 0.6,
        );
      }
      for (const morph of Object.keys(previous))
        previous[morph] = now[morph] ?? 0;
      Object.assign(previous, now);
    }
  });

  it('runs no look under the greeting, so none jumps on after it', () => {
    // A look under way as the greeting starts.
    let ambient: Ambient = {
      ...startAmbient(0),
      face: {
        name: 'press',
        peaks: { press: 0.8 },
        lags: {},
        start: 0,
        end: 3,
      },
      nextFace: 10,
    };
    const random = seeded(3);
    // Seven seconds of greeting, held each frame as MyHead.tsx does.
    let k = 60;
    for (; k <= 60 * 8; k++) {
      ambient = stepAmbient(ambient, STRAIGHT, k / 60, 1 / 60, random, true);
      ambient = holdFace(ambient, k / 60);
      expect(ambient.face).toBeNull();
    }
    // The face its own again: nothing at once, and the next look waits a
    // gap, then sets in from nothing.
    const back = k / 60;
    expect(ambientFace(ambient, back)).toEqual({});
    expect(ambient.nextFace).toBeGreaterThanOrEqual(
      back - 1 / 60 + FACE_GAP[0],
    );
    let first: Record<string, number> | null = null;
    for (; !first && k < 60 * 30; k++) {
      ambient = stepAmbient(ambient, STRAIGHT, k / 60, 1 / 60, random, true);
      if (ambient.face) first = ambientFace(ambient, k / 60);
    }
    for (const strength of Object.values(first!)) expect(strength).toBe(0);
  });

  it('lays the passing look over the face without passing whole', () => {
    const out = withFace({ smile: 0.9, gasp: 0.5 }, { smile: 0.2 });
    expect(out.smile).toBe(1);
    expect(out.gasp).toBe(0.5);
    expect(withFace({}, { smile: 0.2 }).smile).toBeCloseTo(0.2);
  });

  it('sets in, eases off a little at its height, and settles back slowly', () => {
    const { onset, offset } = paceOf('press');
    const ambient: Ambient = {
      ...startAmbient(0),
      face: { name: 'press', peaks: { press: 1 }, lags: {}, start: 0, end: 3 },
    };
    const at = (t: number) => ambientFace(ambient, t).press!;
    // Within about half a second it is there.
    expect(onset).toBeLessThanOrEqual(0.5);
    expect(at(onset)).toBe(1);
    // Never frozen: it eases off a little while held.
    expect(at(1.5)).toBeLessThan(at(onset + 0.1));
    expect(at(3 - offset)).toBeGreaterThan(1 - SAG - 0.01);
    // Letting go takes longer than setting in: about half gone a third of
    // the way in, then trailing off slowly to rest.
    expect(offset).toBeGreaterThan(onset);
    const start = at(3 - offset);
    expect(at(3 - (offset * 2) / 3) / start).toBeGreaterThan(0.3);
    expect(at(3 - (offset * 2) / 3) / start).toBeLessThan(0.7);
    expect(at(3 - offset / 3) / start).toBeGreaterThan(0.02);
    expect(at(3 - offset / 3) / start).toBeLessThan(0.1);
    expect(at(3)).toBe(0);
  });

  it('never changes speed suddenly, for every look', () => {
    // Every look at 60 frames a second, as short as it comes, each of its
    // morphs at full strength with its own lag: the change in speed from one
    // frame to the next stays within what the look's onset and offset allow
    // (a kink, where a brow following late reversed at its peak, changed
    // speed several times faster).
    for (const [name, look] of Object.entries({ ...LOOKS, ...BOLD_LOOKS })) {
      const { onset, offset } = paceOf(name);
      const parts = Object.entries(look('Left', 'Right'));
      const ambient: Ambient = {
        ...startAmbient(0),
        face: {
          name,
          peaks: Object.fromEntries(parts.map(([morph]) => [morph, 1])),
          lags: Object.fromEntries(
            parts.map(([morph, part]) => [morph, part[2] ?? 0]),
          ),
          start: 0,
          end: (LASTS[name] ?? FACE_LASTS)[0],
        },
      };
      const quickest = Math.min(onset, offset);
      for (const [morph] of parts) {
        const v = Array.from(
          { length: Math.ceil(ambient.face!.end * 60) + 2 },
          (_, k) => ambientFace(ambient, k / 60)[morph]!,
        );
        let worst = 0;
        for (let k = 2; k < v.length; k++)
          worst = Math.max(worst, Math.abs(v[k]! - 2 * v[k - 1]! + v[k - 2]!));
        // The minimum-jerk curve's own most, 5.8 / T^2, with room for the
        // curves multiplied.
        expect(worst * 3600, `${name} ${morph}`).toBeLessThan(
          12 / quickest ** 2,
        );
      }
    }
  });

  it('tilts looking down or toward a corner, not looking straight ahead', () => {
    expect(tiltRoom(CORNER)).toBe(1);
    expect(tiltRoom({ x: 0.12, y: 0 })).toBe(1);
    expect(tiltRoom({ x: -0.12, y: 0 })).toBe(1);
    expect(tiltRoom(STRAIGHT)).toBe(0);
    // Turned well to one side but level: no tilt either.
    expect(tiltRoom({ x: 0, y: 0.35 })).toBe(0);
    const side = run(60, 120, seeded(4), { x: 0, y: 0.35 });
    for (const { ambient } of side) expect(ambient.tilt).toBe(0);
    const straight = run(60, 120, seeded(4), STRAIGHT);
    for (const { ambient } of straight) expect(ambient.tilt).toBe(0);
  });

  it('comes back to level quickly when the head looks straight again', () => {
    const random = seeded(2);
    let ambient = startAmbient(0, random);
    // Tilted, looking toward a corner, until it holds a tilt.
    let k = 0;
    while (Math.abs(ambient.tilt) < TILT_MAX / 3 && k < 60 * 120) {
      k++;
      ambient = stepAmbient(ambient, CORNER, k / 60, 1 / 60, random);
    }
    expect(Math.abs(ambient.tilt)).toBeGreaterThan(TILT_MAX / 3);
    // Then straight ahead: nearly level within twice TILT_RETURN.
    for (let j = 0; j < 2 * TILT_RETURN * 60; j++) {
      k++;
      ambient = stepAmbient(ambient, STRAIGHT, k / 60, 1 / 60, random);
    }
    expect(Math.abs(ambient.tilt)).toBeLessThan(0.01);
  });

  it('tilts once at a time: from a tilt always back to level first', () => {
    const targets = frames
      .map(({ ambient }) => ambient.tiltTarget)
      .filter((t, k, all) => k === 0 || t !== all[k - 1]);
    for (let k = 1; k < targets.length; k++)
      expect(targets[k - 1] === 0 || targets[k] === 0).toBe(true);
    // Seldom: about one tilt every half minute over ten minutes.
    const tilts = targets.filter((t) => t !== 0).length;
    expect(tilts).toBeGreaterThan(8);
    expect(tilts).toBeLessThan(40);
  });

  it('drops a tilt when the head looks level, and waits to tilt again', () => {
    const random = seeded(2);
    let ambient = startAmbient(0, random);
    let k = 0;
    while (ambient.tiltTarget === 0 && k < 60 * 120) {
      k++;
      ambient = stepAmbient(ambient, CORNER, k / 60, 1 / 60, random);
    }
    // One frame looking level: the tilt is dropped, not just paused.
    k++;
    ambient = stepAmbient(ambient, STRAIGHT, k / 60, 1 / 60, random);
    expect(ambient.tiltTarget).toBe(0);
    // Looking down again straight away does not bring it back at once.
    k++;
    ambient = stepAmbient(ambient, CORNER, k / 60, 1 / 60, random);
    expect(ambient.tiltTarget).toBe(0);
  });
});

describe('the bold looks, looking around on its own', () => {
  // Half an hour looking around on its own.
  const random = seeded(5);
  let ambient = startAmbient(0, random);
  const starts: string[] = [];
  for (let k = 1; k <= 60 * 1800; k++) {
    const face = ambient.face;
    ambient = stepAmbient(ambient, CORNER, k / 60, 1 / 60, random, true);
    if (ambient.face && ambient.face !== face) starts.push(ambient.face.name);
  }

  it('mixes a bold look in now and then, each kind in turn', () => {
    const bold = starts.filter((name) => name in BOLD_LOOKS);
    expect(BOLD_CHANCE).toBeLessThanOrEqual(0.2);
    expect(bold.length / starts.length).toBeGreaterThan(BOLD_CHANCE - 0.06);
    expect(bold.length / starts.length).toBeLessThan(BOLD_CHANCE + 0.06);
    expect([...new Set(bold)].sort()).toEqual(Object.keys(BOLD_LOOKS).sort());
  });

  it('never makes them following the pointer', () => {
    const subtle = run();
    for (const { ambient } of subtle)
      if (ambient.face) expect(ambient.face.name in BOLD_LOOKS).toBe(false);
  });

  it('lets go of a bold look as soon as the pointer moves', () => {
    let held: Ambient = {
      ...startAmbient(0),
      face: { name: 'hmm', peaks: { press: 0.8 }, lags: {}, start: 0, end: 3 },
      nextFace: 10,
    };
    held = stepAmbient(held, STRAIGHT, 1, 1 / 60, seeded(1), true);
    expect(held.face?.end).toBe(3);
    held = stepAmbient(held, STRAIGHT, 1.02, 1 / 60, seeded(1), false);
    const { offset } = paceOf('hmm');
    expect(held.face!.end).toBeCloseTo(1.02 + offset);
    // From where it was, without a jump, and gone by then.
    const was = ambientFace(
      { ...held, face: { ...held.face!, end: 3 } },
      1.02,
    ).press!;
    expect(ambientFace(held, 1.02).press).toBeCloseTo(was);
    expect(ambientFace(held, 1.03).press).toBeGreaterThan(was - 0.05);
    held = stepAmbient(held, STRAIGHT, 1.03, 1 / 60, seeded(1), false);
    expect(held.face!.end).toBeCloseTo(1.02 + offset);
    held = stepAmbient(held, STRAIGHT, 1.1 + offset, 1 / 60, seeded(1), false);
    expect(held.face).toBeNull();
  });

  it('moves the whole face, well past the small looks, mouth closed', () => {
    for (const look of Object.values(BOLD_LOOKS)) {
      const parts = look('Left', 'Right');
      // At least one shape near its whole, and the brows always part of it.
      expect(Math.max(...Object.values(parts).map((p) => p[1]))).toBe(1);
      expect(Object.keys(parts).some((m) => m.startsWith('brows'))).toBe(true);
      // Never the open jaw or a gasp.
      for (const morph of ['gasp', 'jawOpen', 'mouthO'])
        expect(parts[morph]).toBeUndefined();
    }
    // The "hmm": lips pressed and pushed hard to one side under high brows.
    const hmm = BOLD_LOOKS.hmm!('Left', 'Right');
    expect(hmm.press![0]).toBeGreaterThanOrEqual(0.7);
    expect(hmm.mouthLeft![0]).toBeGreaterThanOrEqual(0.8);
    expect(hmm.browsUpLeft![0]).toBeGreaterThan(hmm.browsUpRight![0]);
  });

  it('holds a moment at its height before letting go', () => {
    const { onset, offset } = paceOf('hmm');
    const at = (t: number) =>
      ambientFace(
        {
          ...startAmbient(0),
          face: {
            name: 'hmm',
            peaks: { press: 1 },
            lags: {},
            start: 0,
            end: 3,
          },
        },
        t,
      ).press!;
    expect(at(onset / 4)).toBeLessThan(0.2);
    expect(at(onset)).toBe(1);
    expect(at(3 - offset)).toBeGreaterThan(1 - SAG);
    expect(at(3 - offset / 2)).toBeLessThan(0.8);
  });
});
