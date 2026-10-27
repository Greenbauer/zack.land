import { describe, expect, it } from 'vitest';

import { EASE_RATE, easeToward } from './faceExpression';
import {
  FACING_CLOSE,
  GREETING_EASE_RATE,
  greetingExpressions,
  idle,
  SMILE_SECONDS,
  stepGreeting,
  SURPRISE_SECONDS,
} from './idleGreeting';

const facing = { x: 0, y: 0 };
const away = { x: 0.1, y: -0.4 };

describe('the head greeting before it wanders', () => {
  it('stays idle until started', () => {
    expect(stepGreeting(idle, { turn: away, neutral: true, time: 5 })).toBe(
      idle,
    );
  });

  it('looks surprised as soon as it faces the camera with a neutral face', () => {
    const start = { phase: 'facing' } as const;
    const arriving = { x: 0, y: FACING_CLOSE * 0.9 };
    expect(stepGreeting(start, { turn: away, neutral: true, time: 1 })).toBe(
      start,
    );
    // Not while any other expression (the faint smile) is still on the face.
    expect(
      stepGreeting(start, { turn: arriving, neutral: false, time: 2 }),
    ).toBe(start);
    expect(
      stepGreeting(start, { turn: arriving, neutral: true, time: 2 }),
    ).toEqual({ phase: 'surprised', since: 2 });
    // As it arrives, not after the turn's slow last settling.
    expect(FACING_CLOSE).toBeGreaterThanOrEqual(0.08);
  });

  it('holds the surprise for its time, then is done', () => {
    const surprised = { phase: 'surprised', since: 10 } as const;
    expect(
      stepGreeting(surprised, {
        turn: facing,
        neutral: false,
        time: 10 + SURPRISE_SECONDS - 0.1,
      }),
    ).toBe(surprised);
    expect(
      stepGreeting(surprised, {
        turn: facing,
        neutral: false,
        time: 10 + SURPRISE_SECONDS,
      }),
    ).toEqual({ phase: 'smiling', since: 10 + SURPRISE_SECONDS });
    expect(SURPRISE_SECONDS).toBe(4);
  });

  it('holds the smile for its time, then is done', () => {
    const smiling = { phase: 'smiling', since: 20 } as const;
    expect(
      stepGreeting(smiling, {
        turn: facing,
        neutral: false,
        time: 20 + SMILE_SECONDS - 0.1,
      }),
    ).toBe(smiling);
    expect(
      stepGreeting(smiling, {
        turn: facing,
        neutral: false,
        time: 20 + SMILE_SECONDS,
      }),
    ).toEqual({ phase: 'done' });
  });

  it('shows the gasp while surprised and the smile while smiling', () => {
    expect(greetingExpressions({ phase: 'facing' })).toEqual({
      gasp: 0,
      smile: 0,
    });
    expect(greetingExpressions({ phase: 'surprised', since: 0 })).toEqual({
      gasp: 1,
      smile: 0,
    });
    expect(greetingExpressions({ phase: 'smiling', since: 0 })).toEqual({
      gasp: 0,
      smile: 1,
    });
  });

  it('eases into the gasp and then the smile quickly', () => {
    // From no expression to 90% of the gasp, and from the gasp to 90% of the
    // smile (the gasp fading as fast), within a fifth of a second.
    expect(easeToward(0, 1, 0.2, GREETING_EASE_RATE)).toBeGreaterThan(0.9);
    expect(easeToward(1, 0, 0.2, GREETING_EASE_RATE)).toBeLessThan(0.1);
    // Faster than the face's reactions to the pointer.
    expect(GREETING_EASE_RATE).toBeGreaterThan(EASE_RATE * 2);
  });
});
