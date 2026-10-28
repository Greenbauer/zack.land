import { describe, expect, it } from 'vitest';

import {
  Ambient,
  ambientFace,
  LOOKS,
  QUICK_LASTS,
  QUICK_LOOKS,
  startAmbient,
  stepAmbient,
  TILT_MAX,
  TILT_RETURN,
  tiltRoom,
  withAmbient,
} from './ambient';

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
    const look = LOOKS.oneBrow!('Left', 'Right');
    expect(look.browsUpLeft![2]).toBeUndefined();
    expect(look.browsUpRight![2]).toBeGreaterThan(0);
    expect(look.browsUpRight![1]).toBeLessThan(look.browsUpLeft![0]);
    const both = LOOKS.browsUp!('Right', 'Left');
    expect(both.browsUpLeft![2]).toBeGreaterThan(0);
    // The follower is still at rest while the leader is already rising.
    const ambient: Ambient = {
      ...startAmbient(0),
      face: {
        name: 'oneBrow',
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

  it('brings up brow looks most often', () => {
    const counts: Record<string, number> = {};
    frames.forEach(({ ambient }, k) => {
      const face = ambient.face;
      if (face && face !== frames[k - 1]?.ambient.face)
        counts[face.name] = (counts[face.name] ?? 0) + 1;
    });
    const brows = (counts.oneBrow ?? 0) + (counts.browsUp ?? 0);
    const rest =
      (counts.oneEye ?? 0) + (counts.purse ?? 0) + (counts.halfSmile ?? 0);
    expect(brows).toBeGreaterThan(rest);
  });

  it('comes and goes without a jump, never past its peaks', () => {
    const previous: Record<string, number> = {};
    for (const { time, ambient } of frames) {
      const now = ambientFace(ambient, time);
      for (const [morph, value] of Object.entries(now)) {
        const peak = ambient.face!.peaks[morph]!;
        expect(value).toBeLessThanOrEqual(peak);
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

  it('flicks the brows up and down quickly', () => {
    for (const { ambient } of frames) {
      const face = ambient.face;
      if (face && QUICK_LOOKS.has(face.name))
        expect(face.end - face.start).toBeLessThanOrEqual(QUICK_LASTS[1]);
    }
  });

  it('lays the passing look over the face without passing whole', () => {
    const ambient: Ambient = {
      ...startAmbient(0),
      face: {
        name: 'halfSmile',
        peaks: { smile: 0.2 },
        lags: {},
        start: 0,
        end: 2,
      },
    };
    const out = withAmbient({ smile: 0.9, gasp: 0.5 }, ambient, 1);
    expect(out.smile).toBe(1);
    expect(out.gasp).toBe(0.5);
    expect(withAmbient({}, ambient, 1).smile).toBeCloseTo(0.2);
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
