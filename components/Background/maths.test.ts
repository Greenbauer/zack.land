import { describe, expect, it } from 'vitest';

import { clamp, everyFrames, smoothstep } from './maths';

describe('clamp', () => {
  it('keeps a value inside its range as it is', () => {
    expect(clamp(0.3, 0, 1)).toBe(0.3);
  });

  it('holds a value outside its range at the nearer end', () => {
    expect(clamp(-2, -1, 1)).toBe(-1);
    expect(clamp(5, -1, 1)).toBe(1);
  });
});

describe('smoothstep', () => {
  it('is 0 at or before its low end and 1 at or after its high end', () => {
    expect(smoothstep(2, 4, 1)).toBe(0);
    expect(smoothstep(2, 4, 2)).toBe(0);
    expect(smoothstep(2, 4, 4)).toBe(1);
    expect(smoothstep(2, 4, 9)).toBe(1);
  });

  it('is a half midway, and eases in and out around it', () => {
    expect(smoothstep(2, 4, 3)).toBe(0.5);
    // A quarter of the way: 0.25² (3 - 0.5), less than a straight line.
    expect(smoothstep(2, 4, 2.5)).toBeCloseTo(0.15625);
    expect(smoothstep(2, 4, 3.5)).toBeCloseTo(0.84375);
  });

  it('runs downhill when its ends are reversed, as GLSL’s does', () => {
    expect(smoothstep(4, 2, 2)).toBe(1);
    expect(smoothstep(4, 2, 4)).toBe(0);
  });
});

describe('everyFrames', () => {
  it('is true on every nth call, from the nth', () => {
    const due = everyFrames(3);
    expect(Array.from({ length: 7 }, due)).toEqual([
      false,
      false,
      true,
      false,
      false,
      true,
      false,
    ]);
  });

  it('keeps its own count apart from any other', () => {
    const a = everyFrames(2);
    const b = everyFrames(2);
    a();
    expect(b()).toBe(false);
    expect(a()).toBe(true);
  });
});
