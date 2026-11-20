import { describe, expect, it } from 'vitest';

import { dwellSeconds } from './chapters';
import { LEAD_SECONDS, takesOver, watchWait } from './watch';

const story = [{ lines: ['a'] }, { lines: ['b', 'c'] }, { lines: ['d'] }];

describe('Watch', () => {
  it('leaves the opening at once', () => {
    expect(watchWait(-1, story)).toBe(0);
  });

  it("turns after a chapter's lines", () => {
    expect(watchWait(1, story)).toBe(LEAD_SECONDS + dwellSeconds(story[1]!));
  });

  it('stops at the last chapter', () => {
    expect(watchWait(2, story)).toBeNull();
  });

  it("is stopped by input outside the story's controls only", () => {
    const inside = { closest: () => ({}) } as unknown as EventTarget;
    const outside = { closest: () => null } as unknown as EventTarget;
    expect(takesOver(inside)).toBe(false);
    expect(takesOver(outside)).toBe(true);
    expect(takesOver(null)).toBe(true);
  });
});
