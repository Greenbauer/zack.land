import { glide } from './headPlace';
import { Gaze, TIP, TURN } from './wander';

// What the head does when it loses the pointer it has been following
// (leftAlone.ts: the pointer goes out of the window, or stops long enough for
// the head to greet): it looks for it, as a person does who has lost sight
// of something. A few quick glances, each a short shift of the head held a
// moment: first on past where it lost it (the way it was looking), then
// across the other way, then partway back, the brows drawn a little
// together and the eyes narrowed (SEARCH_FACE). Then it gives up.

// Each glance's shift, how long it takes to settle (glide's seconds), and
// how long the look is then held, in seconds: quicker than looking around on
// its own (wander.ts), as a search is.
const SHIFT = [0.35, 0.45] as const;
const HOLD = [0.3, 0.55] as const;
// How far each glance goes, in radians of turn from where it lost the
// pointer: on past it, back across, and partway back; and how far it tips
// up or down with it, at most.
const PAST = [0.12, 0.2] as const;
const ACROSS = [0.3, 0.45] as const;
const BACK = [0.1, 0.2] as const;
const TIP_BY = 0.05;

// The face while it looks.
export const SEARCH_FACE: Record<string, number> = {
  browDown: 0.3,
  squint: 0.25,
  press: 0.15,
};

export type Search = {
  gaze: Gaze;
  speed: Gaze;
  // The glances still to come, the current one first: where it looks, how
  // long the shift there takes to settle, and when on the clock it ends.
  glances: { target: Gaze; settle: number; until: number }[];
};

const between = ([low, high]: readonly [number, number], r: number) =>
  low + (high - low) * r;
const inside = (v: number, [low, high]: readonly [number, number]) =>
  Math.min(Math.max(v, low * 0.96), high * 0.96);

// A search starting at `time` from where the head looks now (`from`).
export function startSearch(
  from: Gaze,
  time: number,
  random: () => number = Math.random,
): Search {
  // On past it means further out the way the head was turned (y; at the
  // middle, either way).
  const out = from.y > 0.02 || (from.y > -0.02 && random() < 0.5) ? 1 : -1;
  const turns = [
    from.y + out * between(PAST, random()),
    from.y - out * between(ACROSS, random()),
    from.y - out * between(BACK, random()),
  ];
  let until = time;
  const glances = turns.map((y) => {
    const settle = between(SHIFT, random());
    until += 2 * settle + between(HOLD, random());
    return {
      target: {
        x: inside(from.x + (random() * 2 - 1) * TIP_BY, TIP),
        y: inside(y, TURN),
      },
      settle,
      until,
    };
  });
  return { gaze: { ...from }, speed: { x: 0, y: 0 }, glances };
}

// The search `seconds` later, at clock `time`.
export function stepSearch(
  search: Search,
  time: number,
  seconds: number,
): Search {
  const glances = search.glances.filter(({ until }) => until > time);
  const glance = glances[0];
  if (!glance) return { ...search, glances };
  const x = glide(
    { x: search.gaze.x, speed: search.speed.x },
    glance.target.x,
    seconds,
    glance.settle,
  );
  const y = glide(
    { x: search.gaze.y, speed: search.speed.y },
    glance.target.y,
    seconds,
    glance.settle,
  );
  return {
    gaze: { x: x.x, y: y.x },
    speed: { x: x.speed, y: y.speed },
    glances,
  };
}

// Whether it has given up: every glance made.
export const searchOver = (search: Search) => search.glances.length === 0;
