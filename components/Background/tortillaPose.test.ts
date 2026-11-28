import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { headDepth } from './headDepthFixture';
import { expressions, meshes } from './headFixture';
import { drapeSurface, everyFace, frameAt } from './tortillaDrape';
import { AZIMUTHS, FLIES, Throw, TORTILLA_RADIUS } from './tortillaFlight';
import { holdOf, poseThrow } from './tortillaPose';

const skin = meshes.get('skin')!.positions;
// A flat round: its middle, then rings out to its edge.
const rest: number[] = [0, 0, 0];
for (const ring of [0.25, 0.5, 0.75, 1])
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    rest.push(
      Math.cos(a) * ring * TORTILLA_RADIUS,
      Math.sin(a) * ring * TORTILLA_RADIUS,
      0,
    );
  }
const thrown = (kind: Throw['kind'], azimuth: number): Throw => ({
  at: 0,
  azimuth,
  up: -6,
  kind,
  lob: 40,
  cling: 1.5,
  slide: 20,
  spin: 8,
});
const places = AZIMUTHS.map((azimuth) => {
  const frame = frameAt(azimuth);
  return { frame, surface: drapeSurface(skin, frame) };
});
const pose = (t: Throw, since: number) => {
  const out = new Float32Array(rest.length);
  const { frame, surface } = places[t.azimuth]!;
  poseThrow(t, since, rest, frame, surface, out);
  return Array.from({ length: rest.length / 3 }, (_, i) =>
    new Vector3().fromArray(out, i * 3),
  );
};
const middle = (points: Vector3[]) => points[0]!;

describe('a tortilla thrown at the head', () => {
  it('lies over the cheek whatever face the head makes', () => {
    const head = meshes.get('skin')!;
    const moves = head.morphs.map(({ indices, moves: sparse }) => {
      const dense = new Float32Array(skin.length);
      indices.forEach((v, k) =>
        dense.set(sparse.subarray(k * 3, k * 3 + 3), v * 3),
      );
      return dense;
    });
    const frame = frameAt(AZIMUTHS.at(-2)!);
    const surface = drapeSurface(everyFace(skin, moves), frame);
    const smile = moves[expressions.indexOf('smile')]!;
    for (let k = 0; k < skin.length; k += 3 * 7) {
      const at = [0, 1, 2].map((axis) => skin[k + axis]! + smile[k + axis]!);
      const [across, up, out] = frame.local(at[0]!, at[1]!, at[2]!);
      if (Math.abs(across) > 30 || Math.abs(up + 12) > 30 || out < 0) continue;
      expect(surface(across, up) - out).toBeGreaterThan(-0.6);
    }
  });

  it('comes in from off the side, flat and round', () => {
    for (let a = 0; a < AZIMUTHS.length; a++) {
      const points = pose(thrown('sticks', a), 0.05);
      const centre = middle(points);
      expect(Math.sign(centre.x)).toBe(Math.sign(AZIMUTHS[a]!));
      expect(Math.abs(centre.x)).toBeGreaterThan(450);
      for (const p of points.slice(-24))
        expect(p.distanceTo(centre)).toBeCloseTo(TORTILLA_RADIUS, 1);
    }
  });

  it('meets the head where it lands with no jump', () => {
    for (const kind of ['sticks', 'glances'] as const) {
      const before = pose(thrown(kind, 1), FLIES - 0.001);
      const after = pose(thrown(kind, 1), FLIES + 0.001);
      before.forEach((p, i) => expect(p.distanceTo(after[i]!)).toBeLessThan(4));
      expect(holdOf(FLIES)).toBe(1);
      expect(holdOf(FLIES - 0.25)).toBe(0);
    }
  });

  it('touches the head as it lands, not the air beside it', () => {
    for (let a = 0; a < AZIMUTHS.length; a++) {
      const nearest = Math.max(
        ...pose(thrown('sticks', a), FLIES).map((p) => headDepth(p)),
      );
      expect(nearest).toBeGreaterThan(-4);
    }
  });

  it('lies wrapped on the head, never inside it, bent far from flat', () => {
    for (let a = 0; a < AZIMUTHS.length; a++) {
      const points = pose(thrown('sticks', a), FLIES + 0.9);
      for (const p of points) expect(headDepth(p)).toBeLessThan(0.6);
      // Its edges fold back past its middle: it is not a flat card.
      const { frame } = places[a]!;
      const outs = points.map((p) => frame.local(p.x, p.y, p.z)[2]);
      expect(Math.max(...outs) - Math.min(...outs)).toBeGreaterThan(18);
    }
  });

  it('never passes into the head, landing or leaving', () => {
    for (const kind of ['sticks', 'glances'] as const)
      for (let a = 0; a < AZIMUTHS.length; a++)
        for (let on = 0; on < 2.4; on += 0.06)
          for (const p of pose(thrown(kind, a), FLIES + on))
            if (p.y > -60)
              expect(
                headDepth(p),
                `${kind} ${a} ${on.toFixed(2)}`,
              ).toBeLessThan(1.5);
  }, 60_000);

  it('sticks and slides down, then peels off and falls away', () => {
    const t = thrown('sticks', 1);
    const y = (since: number) => middle(pose(t, FLIES + since)).y;
    expect(y(1.4)).toBeLessThan(y(0.2));
    expect(y(0.2) - y(1.4)).toBeLessThan(30);
    expect(y(3)).toBeLessThan(-250);
  });

  it('or glances off at once, out to the side, and falls away', () => {
    const t = thrown('glances', 4);
    const { frame } = places[4]!;
    const out = (since: number) => {
      const p = middle(pose(t, FLIES + since));
      return frame.local(p.x, p.y, p.z)[2];
    };
    expect(out(0.6)).toBeGreaterThan(out(0.1) + 30);
    expect(middle(pose(t, FLIES + 1.4)).y).toBeLessThan(-250);
  });
});
