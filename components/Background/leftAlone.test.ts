import { describe, expect, it } from 'vitest';

import { greetingOn, SMILE_SECONDS, SURPRISE_SECONDS } from './idleGreeting';
import { LeftAlone, stepPage, usedAt, watched } from './leftAlone';
import { seeded } from './seeded';

const WAIT = 12;
const STEP = 1 / 30;

// The head's frames from `from` to `to` seconds with nobody using the page
// (the pointer gone out of the window at `leftAt`), the head turning
// straight to wherever it is told to look and its face at rest: what it
// does at each, as a run of phases.
function leaveAlone(
  start: LeftAlone,
  from: number,
  to: number,
  { leftAt = Infinity, seed = 1 } = {},
) {
  const random = seeded(seed);
  const pointer = { moved: false, left: false };
  let state = start;
  let look = { x: 0, y: 0.2 };
  const phases: { time: number; phase: string }[] = [];
  for (let time = from; time < to; time += STEP) {
    if (time >= leftAt && time - STEP < leftAt) pointer.left = true;
    const step = stepPage(
      state,
      pointer,
      { time, seconds: STEP, look, neutral: () => true },
      () => WAIT,
      random,
    );
    state = step.state;
    if (step.own?.kind === 'greeting') look = { x: 0, y: 0 };
    else if (step.own) look = step.own.gaze;
    const phase = state.wandering
      ? 'wander'
      : greetingOn(state.greeting)
        ? state.greeting.phase
        : state.search
          ? 'searching'
          : step.own
            ? 'hold'
            : 'following';
    if (phases.at(-1)?.phase !== phase) phases.push({ time, phase });
  }
  return { state, phases };
}

const names = (phases: { phase: string }[]) => phases.map((p) => p.phase);
// The idle routine: it looks for the pointer, faces the camera, is
// surprised, smiles, then looks around on its own.
const ROUTINE = ['searching', 'facing', 'surprised', 'smiling', 'wander'];

describe('the head left alone', () => {
  it('follows the pointer, then once the wait is up searches, greets and looks around', () => {
    const { phases } = leaveAlone(usedAt(0, WAIT), 0, 30);
    expect(names(phases)).toEqual(['following', ...ROUTINE]);
    const at = (phase: string) => phases.find((p) => p.phase === phase)!.time;
    expect(at('searching')).toBeCloseTo(WAIT, 0);
    expect(at('smiling') - at('surprised')).toBeCloseTo(SURPRISE_SECONDS, 0);
    expect(at('wander') - at('smiling')).toBeCloseTo(SMILE_SECONDS, 0);
  });

  it('runs the whole routine again every time it is left alone again', () => {
    let state = usedAt(0, WAIT);
    let time = 0;
    for (const round of [1, 2, 3]) {
      const run = leaveAlone(state, time, time + 30, { seed: round });
      expect(names(run.phases), `round ${round}`).toEqual([
        'following',
        ...ROUTINE,
      ]);
      time += 30;
      // Someone moves the pointer: it follows it again.
      const pointer = { moved: true, left: false };
      const step = stepPage(
        run.state,
        pointer,
        { time, seconds: STEP, look: { x: 0, y: 0 }, neutral: () => true },
        () => WAIT,
      );
      expect(step.own).toBeNull();
      expect(pointer.moved).toBe(false);
      state = step.state;
    }
  });

  it('searches as soon as the pointer goes out of the window, then holds that look until it greets', () => {
    const { phases } = leaveAlone(usedAt(0, WAIT), 0, 30, { leftAt: 2 });
    expect(names(phases)).toEqual([
      'following',
      'searching',
      'hold',
      'facing',
      'surprised',
      'smiling',
      'wander',
    ]);
    expect(phases[1]!.time).toBeCloseTo(2, 1);
    // Searched once: when the wait is up it greets without searching again.
    expect(phases[3]!.time).toBeCloseTo(WAIT, 0);
  });

  it('still searches when the pointer leaves on the same frame as its last move', () => {
    const pointer = { moved: true, left: true };
    const frame = (time: number) => ({
      time,
      seconds: STEP,
      look: { x: 0, y: 0.2 },
      neutral: () => true,
    });
    const first = stepPage(usedAt(0, WAIT), pointer, frame(1), () => WAIT);
    expect(first.own).toBeNull();
    expect(pointer).toEqual({ moved: false, left: true });
    const next = stepPage(first.state, pointer, frame(1 + STEP), () => WAIT);
    expect(next.state.search).not.toBeNull();
    expect(next.own?.kind).toBe('hold');
    expect(pointer.left).toBe(false);
  });

  it('stops a greeting under way, and starts its clock over, while the face cannot be seen', () => {
    const greeting = {
      ...usedAt(0, WAIT),
      greeting: { phase: 'facing' } as const,
    };
    const hidden = watched(greeting, {
      time: 20,
      lastFrame: 20 - STEP,
      seen: false,
    });
    expect(hidden.greeting.phase).toBe('idle');
    expect(hidden.idleSince).toBe(20);
  });
});
