// When and how the tortillas fly for Texas Tech (TexasTechProps.tsx), in the
// head's own units, the head at the middle: a few always crossing behind it,
// as they filled the air at every kickoff (`flyerAt`), and now and then one
// thrown at it (`throwAt`), never two the same way running.

// A tortilla's radius: an 8-inch flour tortilla (20 cm across) at the head's
// own scale (fitGlasses.ts UNIT_MM), wider than the face, as a real one is.
export const TORTILLA_RADIUS = 56;

// A number from 0 to 1 for `k` and `n`, the same each time.
const pick = (k: number, n: number) => {
  const s = Math.sin(k * 127.1 + n * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// The ones crossing: how many, and each one's way: which side it comes from,
// how deep behind the head, how high it passes, how it arcs, how long a
// crossing takes and how long its whole loop is (it waits off the window in
// between), and, thrown like a disc, how it spins, leans and wobbles.
export const FLYERS = 8;
const FLIGHTS = Array.from({ length: FLYERS }, (_, k) => {
  const seconds = 2.4 + pick(k, 1) * 1.6;
  const depth = -130 - pick(k, 2) * 260;
  return {
    way: k % 2 ? 1 : -1,
    depth,
    // Off the window's side at that depth, whatever the window.
    off: 560 - depth * 0.9,
    base: -60 + pick(k, 3) * 150,
    arc: 20 + pick(k, 4) * 70,
    seconds,
    loop: seconds * (1.3 + pick(k, 5) * 0.4),
    // Spread out, so the air is never empty.
    phase: (k + pick(k, 6) * 0.6) / FLYERS,
    spin: (k % 2 ? 1 : -1) * (5 + pick(k, 7) * 5),
    lean: 0.35 + pick(k, 8) * 0.6,
    wobble: 0.1 + pick(k, 9) * 0.2,
  };
});

export type Flying = {
  x: number;
  y: number;
  z: number;
  lean: number;
  roll: number;
  spin: number;
};

// Where crossing tortilla `k` is `t` seconds in, or null while it waits off
// the window.
export function flyerAt(k: number, t: number): Flying | null {
  const f = FLIGHTS[k]!;
  const into = (((t / f.loop + f.phase) % 1) + 1) % 1;
  const u = (into * f.loop) / f.seconds;
  if (u > 1) return null;
  return {
    x: f.way * f.off * (2 * u - 1),
    y: f.base + f.arc * (4 * u * (1 - u) - 0.5),
    z: f.depth,
    lean: -Math.PI / 2 + f.lean + Math.sin(t * 3 + k) * f.wobble,
    roll: Math.sin(t * 2.2 + k * 2) * f.wobble,
    spin: t * f.spin,
  };
}

// The ones thrown at the head: the first only once the chapter has had a
// moment, then one now and then, GAP seconds apart (at least, at most).
const FIRST = 6;
// How long a thrown one flies before it hits.
export const FLIES = 0.85;
const GAP = [6, 13] as const;
// Where round the head they hit (radians from straight ahead, toward +x):
// the sides, never the middle of the face.
export const AZIMUTHS = [-92, -70, -50, 50, 66].map(
  (degrees) => (degrees * Math.PI) / 180,
);

export type Throw = {
  // When it is thrown, seconds into the chapter.
  at: number;
  // Which of AZIMUTHS it hits at, and how high.
  azimuth: number;
  up: number;
  // Whether it sticks and slides down before it falls, or glances off.
  kind: 'sticks' | 'glances';
  // How high its arc lobs, how long it sticks (seconds) and slides, and how
  // it spins in the air.
  lob: number;
  cling: number;
  slide: number;
  spin: number;
};

// How throw `k` at `azimuth` hits: never the same way twice running, so if
// the one `before` it did the same on the same side, it does the other.
function kindOf(k: number, azimuth: number, before?: Throw): Throw['kind'] {
  const kind = pick(k, 34) < 0.5 ? 'sticks' : 'glances';
  const sameSide = before && AZIMUTHS[before.azimuth]! * AZIMUTHS[azimuth]! > 0;
  if (!sameSide || before.kind !== kind) return kind;
  return kind === 'sticks' ? 'glances' : 'sticks';
}

// As many throws as anyone will stay for.
export const THROWS: Throw[] = (() => {
  const throws: Throw[] = [];
  let at = FIRST;
  let last = -1;
  for (let k = 0; k < 60; k++) {
    let azimuth = Math.floor(pick(k, 9) * AZIMUTHS.length);
    if (azimuth === last) azimuth = (azimuth + 1) % AZIMUTHS.length;
    const kind = kindOf(k, azimuth, throws.at(-1));
    throws.push({
      at,
      azimuth,
      up: -24 + pick(k, 22) * 40,
      kind,
      lob: 10 + pick(k, 23) * 90,
      cling: 0.8 + pick(k, 24) * 0.8,
      slide: 30 + pick(k, 25) * 26,
      spin: (pick(k, 26) < 0.5 ? -1 : 1) * (6 + pick(k, 27) * 6),
    });
    last = azimuth;
    at += GAP[0] + pick(k, 28) * (GAP[1] - GAP[0]);
  }
  return throws;
})();

// How long a throw lasts at most, from its hand to the floor, seconds.
export const THROW_SECONDS = 5;

// The throw in the air or on the head `t` seconds in, and how long since it
// was thrown, or null between throws.
export function throwAt(t: number): { thrown: Throw; since: number } | null {
  for (const thrown of THROWS) {
    const since = t - thrown.at;
    if (since < 0) return null;
    if (since < THROW_SECONDS) return { thrown, since };
  }
  return null;
}
