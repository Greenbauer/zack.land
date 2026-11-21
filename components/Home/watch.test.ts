import { describe, expect, it } from 'vitest';

import { LEAD_SECONDS, takesOver, watchDelay, watchWait } from './watch';

const story = [{ seconds: 8 }, { seconds: 10 }, { seconds: 6 }];

describe('Watch', () => {
  it('leaves the opening at once', () => {
    expect(watchWait(-1, story)).toBe(0);
  });

  it('turns after a chapter has had time to be read', () => {
    expect(watchWait(1, story)).toBe(LEAD_SECONDS + 10);
  });

  it('stops at the last chapter', () => {
    expect(watchWait(2, story)).toBeNull();
    expect(watchDelay(2, 100, 100, story)).toBeNull();
  });

  it('counts from when the chapter arrived, so pressed late it moves on soon', () => {
    const since = 100;
    expect(watchDelay(1, since, since - LEAD_SECONDS, story)).toBeCloseTo(
      watchWait(1, story)!,
    );
    expect(watchDelay(1, since, since + 60, story)).toBe(1);
    expect(watchDelay(-1, since, since, story)).toBe(0);
  });

  it('is stopped by input outside its own button only', () => {
    const inside = { closest: () => ({}) } as unknown as EventTarget;
    const outside = { closest: () => null } as unknown as EventTarget;
    expect(takesOver(inside)).toBe(false);
    expect(takesOver(outside)).toBe(true);
    expect(takesOver(null)).toBe(true);
  });
});
