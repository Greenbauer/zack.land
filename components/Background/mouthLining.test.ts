import { describe, expect, it } from 'vitest';

import { meshes } from './headFixture';
import { lineMouth, LINING, liningOf } from './mouthLining';

describe('the mouth lining', () => {
  it('is the lips’ look on the open edge, fading to black LINING in', () => {
    // A triangle's rim (points 0, 1, 2) is the open edge; point 4 sits just
    // inside it (1.7 units from point 0), point 3 well inside.
    const lining = liningOf(
      [0, 0, 0, 20, 0, 0, 0, 20, 0, 7, 7, -6, 1, 1, -1],
      [0, 1, 4, 1, 2, 3, 2, 0, 4, 4, 1, 3, 3, 2, 4],
    );
    expect([lining[0], lining[1], lining[2]]).toEqual([1, 1, 1]);
    expect(lining[4]).toBeGreaterThan(0);
    expect(lining[4]).toBeLessThan(1);
    expect(lining[3]).toBe(0);
  });

  it('turns in from the real head’s lip edge and goes black inside', () => {
    const mouth = meshes.get('mouth')!;
    const lining = liningOf(mouth.positions, mouth.indices);
    const shares = [...lining];
    // The lip edge shows the lips' look; most of the mouth is black.
    expect(Math.max(...shares)).toBe(1);
    expect(shares.filter((s) => s === 0).length).toBeGreaterThan(
      shares.length / 2,
    );
    // Every share fades with depth: none past LINING from the edge is lit.
    const z = (i: number) => mouth.positions[i * 3 + 2]!;
    const front = Math.max(...shares.map((_, i) => z(i)));
    shares.forEach((s, i) => {
      if (front - z(i) > LINING + 8) expect(s).toBe(0);
    });
  });

  it('dims the lit colour by the lining in the shader', () => {
    const shader = {
      vertexShader: '#include <common>\n#include <begin_vertex>',
      fragmentShader: '#include <common>\n#include <opaque_fragment>',
      uniforms: {},
    } as unknown as Parameters<typeof lineMouth>[0];
    lineMouth(shader);
    expect(shader.vertexShader).toContain('vLining = lining;');
    expect(shader.fragmentShader).toContain('outgoingLight *= vLining;');
  });
});
