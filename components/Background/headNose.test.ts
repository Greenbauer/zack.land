import { describe, expect, it } from 'vitest';

import { expressions, meshes, skin } from './headFixture';

// The nose in head.bin's expressions: its bridge and tip are bone and
// cartilage, so only the nose's own muscles move them much, and a flare
// moves the wings of the nose, not the lip under them (scripts/head/faceRig.mjs
// onNose, faceShapes.mjs noseFlare). Distances in head.bin units (about
// 1.7 mm each).

// Each expression's move of every skin point at full strength.
const moves = (name: string) => {
  const { indices, moves: sparse } =
    meshes.get('skin')!.morphs[expressions.indexOf(name)]!;
  const d = skin.vertices.map(() => 0);
  indices.forEach((v, k) => {
    d[v] = Math.hypot(sparse[k * 3]!, sparse[k * 3 + 1]!, sparse[k * 3 + 2]!);
  });
  return d;
};
// The most any point within `where` moves.
const most = (name: string, where: (_p: number[]) => boolean) => {
  const d = moves(name);
  return Math.max(
    0,
    ...skin.vertices.flatMap((p, i) => (where(p) ? [d[i]!] : [])),
  );
};

// The bridge and tip, below the root and above the nostrils (under the
// tip, the skin between the nostrils joins the upper lip and goes with it).
const bridgeAndTip = ([x, y, z]: number[]) =>
  Math.abs(x!) < 6 && y! < -9 && y! > -21 && z! > 46;
// The wings of the nose, round each nostril.
const wings = ([x, y, z]: number[]) =>
  Math.abs(x!) > 6 && Math.abs(x!) < 10.5 && y! < -20 && y! > -28 && z! > 39;
// The upper lip just under the nostrils.
const underNostrils = ([x, y, z]: number[]) =>
  Math.abs(x!) < 9 && y! < -30 && y! > -35 && z! > 40;

describe("the head's nose", () => {
  it('stays put as the brows move or the eyes squint', () => {
    for (const name of [
      'browsUp',
      'browInnerUp',
      'browOuterUp',
      'browDown',
      'squint',
      'worried',
    ])
      expect(most(name, bridgeAndTip), name).toBeLessThan(0.2);
    // Not even its wings follow a brow up.
    expect(most('browsUp', wings)).toBeLessThan(0.1);
  });

  it('keeps its tip nearly still as the lips move', () => {
    // Pushed out or pressed, the lips leave it; pulled hard to one side or
    // puffed they take it a little (at full strength, under 2 mm).
    for (const name of ['pout', 'press', 'frown', 'lowerLipIn'])
      expect(most(name, bridgeAndTip), name).toBeLessThan(0.4);
    for (const name of ['mouthLeft', 'mouthRight', 'cheekPuff'])
      expect(most(name, bridgeAndTip), name).toBeLessThan(1.1);
  });

  it('flares its wings, not the lip under them', () => {
    const wing = most('noseFlare', wings);
    expect(wing).toBeGreaterThan(1);
    expect(most('noseFlare', underNostrils)).toBeLessThan(wing / 3);
    expect(most('noseFlare', bridgeAndTip)).toBeLessThan(wing);
  });
});
