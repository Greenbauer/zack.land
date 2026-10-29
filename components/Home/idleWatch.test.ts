import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { watchIdle } from './idleWatch';

describe('watching for a visitor to stop moving', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('turns idle once nothing has moved for the wait', () => {
    const page = new EventTarget();
    const seen: boolean[] = [];
    watchIdle(page, 10_000, (isIdle) => seen.push(isIdle));
    vi.advanceTimersByTime(9_999);
    expect(seen).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(seen).toEqual([true]);
  });

  it('waits again from every move, and stops being idle at one', () => {
    const page = new EventTarget();
    const seen: boolean[] = [];
    watchIdle(page, 10_000, (isIdle) => seen.push(isIdle));
    vi.advanceTimersByTime(6_000);
    page.dispatchEvent(new Event('pointermove'));
    vi.advanceTimersByTime(6_000);
    expect(seen).toEqual([]);
    vi.advanceTimersByTime(4_000);
    page.dispatchEvent(new Event('wheel'));
    expect(seen).toEqual([true, false]);
    vi.advanceTimersByTime(10_000);
    expect(seen).toEqual([true, false, true]);
  });

  it('stops watching when told to', () => {
    const page = new EventTarget();
    const seen: boolean[] = [];
    const stop = watchIdle(page, 10_000, (isIdle) => seen.push(isIdle));
    stop();
    vi.advanceTimersByTime(20_000);
    expect(seen).toEqual([]);
  });
});
