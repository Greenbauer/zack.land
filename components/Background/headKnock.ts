// The head's jolt when something hits it (a thrown tortilla, TexasTechProps
// .tsx): it is knocked away from the side it was hit on and tilted over, then
// springs back, rocking once or twice. MyHead.tsx lays it over the head's
// turn each frame.

// How far it is knocked round and tilted at its furthest, about (radians),
// how fast it rocks, and how fast that dies away (per second).
const ROUND = 0.2;
const TILT = 0.16;
const ROCK = 11;
const DAMP = 4.5;

// When it was last hit (seconds, performance.now() / 1000) and on which side
// (1 toward +x, -1 toward -x).
export const headKnock = { at: -Infinity, side: 1 };

// How far it is knocked at `now`: `round` added to its turn to the side, and
// `tilt` to its tilt.
export function knockAt(now: number): { round: number; tilt: number } {
  const since = now - headKnock.at;
  if (!(since >= 0) || since > 2) return { round: 0, tilt: 0 };
  const rock = Math.sin(since * ROCK) * Math.exp(-since * DAMP);
  return {
    round: -headKnock.side * ROUND * rock,
    tilt: headKnock.side * TILT * rock,
  };
}
