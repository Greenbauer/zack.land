import { Search, searchOver, startSearch, stepSearch } from './headSearch';
import {
  Greeting,
  greetingOn,
  idle,
  idleStart,
  stepGreeting,
} from './idleGreeting';
import { Gaze, shownGaze, startWander, stepWander, Wander } from './wander';

// What the head (MyHead.tsx) does when nobody is using the page, each time
// they stop: once the idle clock runs out, the greeting (idleGreeting.ts),
// then looking around on its own (wander.ts). Before the greeting, and as
// soon as the pointer goes out of the window, it looks for the pointer it
// lost (headSearch.ts), once each time it is left alone, then holds the look
// it gave up on. Any use of the page starts it all over.

export type LeftAlone = {
  greeting: Greeting;
  wandering: Wander | null;
  search: Search | null;
  searched: boolean;
  gaveUp: Gaze | null;
  // When the idle clock started, and how long it runs (seconds).
  idleSince: number;
  idleFor: number;
};

// Where the head looks while left alone: facing the camera for the
// greeting, its own look around, or a look it holds (searching, or given
// up). None while it still follows the pointer.
export type Own =
  { kind: 'greeting' } | { kind: 'wander' | 'hold'; gaze: Gaze } | null;

// Someone used the page at `time`: the head follows the pointer again, and
// the idle clock starts over, to run `idleFor` seconds.
export const usedAt = (time: number, idleFor: number): LeftAlone => ({
  greeting: idle,
  wandering: null,
  search: null,
  searched: false,
  gaveUp: null,
  idleSince: time,
  idleFor,
});

// The clock as of a frame at `time` (idleStart): while the face can't be
// seen (`seen`) it starts over, and a greeting under way stops.
export const watched = (
  state: LeftAlone,
  frame: { time: number; lastFrame: number; seen: boolean },
): LeftAlone => ({
  ...state,
  idleSince: idleStart(state.idleSince, frame),
  greeting: !frame.seen && greetingOn(state.greeting) ? idle : state.greeting,
});

type Frame = {
  time: number;
  seconds: number;
  // Where the head looks now (radians), and whether its face has eased back
  // to no expression (faceNeutral; asked only while it greets).
  look: Gaze;
  neutral: () => boolean;
};

// One frame, `seconds` after the last, at clock `time`, with `pointer`
// (useMousePosition) read and cleared: a move or other use starts it over
// (`idleFor` picks the next wait); the pointer gone out of the window is
// kept until a frame left alone has seen it, so leaving on the same frame as
// the last move still sets off the search.
export function stepPage(
  state: LeftAlone,
  pointer: { moved: boolean; left: boolean },
  frame: Frame,
  idleFor: () => number,
  random: () => number = Math.random,
): { state: LeftAlone; own: Own } {
  if (pointer.moved) {
    pointer.moved = false;
    return { state: usedAt(frame.time, idleFor()), own: null };
  }
  const left = pointer.left;
  pointer.left = false;
  return stepLeftAlone(state, { ...frame, left }, random);
}

function stepLeftAlone(
  state: LeftAlone,
  { time, seconds, look, neutral, left }: Frame & { left: boolean },
  random: () => number,
): { state: LeftAlone; own: Own } {
  if (greetingOn(state.greeting)) {
    const greeting = stepGreeting(state.greeting, {
      turn: look,
      neutral: neutral(),
      time,
    });
    const wandering =
      greeting.phase === 'done' ? startWander(look, time, random) : null;
    return {
      state: { ...state, greeting, wandering },
      own: { kind: 'greeting' },
    };
  }
  if (state.wandering) {
    // Looking around on its own: the wander's gaze is already smooth, so
    // the head takes it as it is.
    const wandering = stepWander(state.wandering, time, seconds, random);
    return {
      state: { ...state, wandering },
      own: { kind: 'wander', gaze: shownGaze(wandering, time) },
    };
  }
  const due =
    time - state.idleSince > state.idleFor && state.greeting.phase === 'idle';
  let { search, searched, gaveUp } = state;
  if (!searched && (left || due)) {
    search = startSearch(look, time, random);
    searched = true;
  }
  if (search) {
    search = stepSearch(search, time, seconds);
    gaveUp = search.gaze;
    if (searchOver(search)) search = null;
    else
      return {
        state: { ...state, search, searched, gaveUp },
        own: { kind: 'hold', gaze: gaveUp },
      };
  }
  const greeting: Greeting = due ? { phase: 'facing' } : state.greeting;
  return {
    state: { ...state, search, searched, gaveUp, greeting },
    own: gaveUp ? { kind: 'hold', gaze: gaveUp } : null,
  };
}
