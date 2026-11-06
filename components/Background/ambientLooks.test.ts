import { describe, expect, it } from 'vitest';

import {
  BOLD_LOOKS,
  FACE_LASTS,
  LASTS,
  LOOK_WEIGHTS,
  LOOKS,
  paceOf,
} from './ambientLooks';

const ALL = { ...LOOKS, ...BOLD_LOOKS };

describe('the passing looks', () => {
  it('brings up the brow flick most often, the sigh seldom', () => {
    for (const name of Object.keys(LOOKS))
      if (name !== 'browFlick')
        expect(LOOK_WEIGHTS.browFlick!).toBeGreaterThan(LOOK_WEIGHTS[name]!);
    expect(LOOK_WEIGHTS.sigh).toBeLessThan(LOOK_WEIGHTS.press!);
    for (const name of Object.keys(ALL))
      expect(LOOK_WEIGHTS[name], name).toBeGreaterThan(0);
  });

  it('sets in as fast as real faces do, and lets go a little more slowly', () => {
    // A brow flash is quick; the rest reach their height in about half a
    // second, as measured spontaneous smiles and brow raises do.
    expect(paceOf('browFlick').onset).toBeLessThanOrEqual(0.25);
    for (const name of Object.keys(ALL)) {
      if (name === 'sigh') continue;
      const { onset, offset } = paceOf(name);
      expect(onset, name).toBeGreaterThanOrEqual(0.2);
      expect(onset, name).toBeLessThanOrEqual(0.6);
      // A puff lets the air out at once; the rest let go no faster than
      // they came.
      if (name !== 'puff') expect(offset, name).toBeGreaterThanOrEqual(onset);
    }
  });

  it('lasts long enough to set in, hold and let go', () => {
    for (const name of Object.keys(ALL)) {
      const { onset, offset } = paceOf(name);
      const [shortest] = LASTS[name] ?? FACE_LASTS;
      expect(shortest, name).toBeGreaterThan(onset + offset);
    }
  });

  it('flares the nose only subtly, alone or breathing in for a sigh', () => {
    expect(LOOKS.flare!('Left', 'Right').noseFlare![1]).toBeLessThanOrEqual(
      0.5,
    );
    const sigh = LOOKS.sigh!('Left', 'Right');
    // With the breath in, not after it.
    expect(sigh.noseFlare![2]).toBeUndefined();
    expect(sigh.noseFlare![1]).toBeLessThan(0.3);
  });

  it('sighs: the breath first, then the lids droop and the brows lift', () => {
    const sigh = LOOKS.sigh!('Left', 'Right');
    expect(sigh.breathe![2]).toBeUndefined();
    for (const morph of ['blink', 'browsUpLeft', 'browsUpRight'])
      expect(sigh[morph]![2]).toBeGreaterThan(0.25);
    // The lids only droop: well short of a blink.
    expect(sigh.blink![1]).toBeLessThan(0.4);
    // And it takes its time.
    expect(LASTS.sigh![0]).toBeGreaterThanOrEqual(3);
  });

  it('keeps the small ones small and the mouth closed', () => {
    for (const [name, look] of Object.entries(LOOKS))
      for (const [morph, part] of Object.entries(look('Left', 'Right'))) {
        // Only the swallow and the breath reach far: the rest stay faint.
        if (
          !['swallow', 'breathe', 'browsUpLeft', 'browsUpRight'].includes(morph)
        )
          expect(part[1], `${name} ${morph}`).toBeLessThanOrEqual(0.5);
        expect(['gasp', 'jawOpen', 'mouthO', 'sneer']).not.toContain(morph);
      }
    // The jaw slides only a little, toward the side the mouth goes.
    const shift = LOOKS.jawShift!('Left', 'Right');
    expect(shift.jawLeft![1]).toBeLessThanOrEqual(0.3);
    expect(shift.mouthLeft).toBeDefined();
  });
});
