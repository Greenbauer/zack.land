import { describe, expect, it } from 'vitest';

import {
  BLINK,
  Blink,
  blinkAmount,
  GAP,
  SHIFT,
  startBlink,
  stepBlink,
} from './blink';
import { seeded } from './seeded';

// Ten minutes of blinking at `fps`, the gaze still, and when each began.
function run(fps = 60, seconds = 600, random = seeded(5)) {
  let blink = startBlink(0, random);
  const starts: number[] = [];
  const shut: number[] = [];
  for (let k = 1; k <= fps * seconds; k++) {
    const next = stepBlink(blink, k / fps, 0, random);
    if (next.start !== blink.start) starts.push(next.start);
    blink = next;
    shut.push(blinkAmount(blink, k / fps));
  }
  return { starts, shut };
}

describe('the head blinking', () => {
  const { starts, shut } = run();

  it('blinks sparingly, at irregular gaps', () => {
    // 2 to 4 a minute, far under a person's 17 at rest.
    expect(starts.length).toBeGreaterThan(10 * 2);
    expect(starts.length).toBeLessThan(10 * 4);
    const gaps = starts.slice(1).map((t, k) => t - starts[k]!);
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(GAP.least);
    expect(Math.max(...gaps)).toBeLessThanOrEqual(
      GAP.most + 3 * (BLINK.close + BLINK.hold + BLINK.open),
    );
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeGreaterThan(3);
  });

  it('shuts the lids fully and briefly, closing faster than it opens', () => {
    expect(Math.max(...shut)).toBe(1);
    // Shut, or nearly, well under a tenth of the time.
    expect(shut.filter((s) => s > 0.5).length / shut.length).toBeLessThan(0.05);
    expect(BLINK.close).toBeLessThan(BLINK.open);
    const blink: Blink = {
      start: 0,
      double: false,
      next: 10,
      shifting: false,
    };
    expect(blinkAmount(blink, BLINK.close / 2)).toBeCloseTo(0.5);
    expect(blinkAmount(blink, BLINK.close + BLINK.hold / 2)).toBe(1);
    expect(blinkAmount(blink, 1)).toBe(0);
  });

  it('now and then blinks twice in a row', () => {
    const twice = { start: 0, double: true, next: 10, shifting: false };
    const after = BLINK.close + BLINK.hold + BLINK.open;
    expect(blinkAmount(twice, after + 0.05 + BLINK.close + 0.01)).toBe(1);
  });

  it('blinks with a quick shift of the gaze now and then, once a shift', () => {
    let blinked = 0;
    for (let trial = 0; trial < 200; trial++) {
      // (The generator's first few numbers from nearby seeds are alike.)
      const random = seeded(trial * 7919 + 11);
      for (let skip = 0; skip < 5; skip++) random();
      // Well into a gap since the last blink, the gaze sets off quickly and
      // keeps moving for half a second.
      let blink: Blink = {
        start: -5,
        double: false,
        next: 100,
        shifting: false,
      };
      let starts = 0;
      for (let k = 0; k < 30; k++) {
        const next = stepBlink(blink, k / 60, SHIFT.speed * 2, random);
        if (next.start !== blink.start) starts++;
        blink = next;
      }
      expect(starts).toBeLessThanOrEqual(1);
      blinked += starts;
    }
    expect(blinked / 200).toBeGreaterThan(SHIFT.chance - 0.15);
    expect(blinked / 200).toBeLessThan(SHIFT.chance + 0.15);
  });

  it('blinks the same at any frame rate', () => {
    const slow = run(30, 600, seeded(5)).starts.length;
    const fast = run(120, 600, seeded(5)).starts.length;
    expect(Math.abs(slow - fast) / fast).toBeLessThan(0.2);
  });
});
