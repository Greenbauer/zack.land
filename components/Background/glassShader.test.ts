import { describe, expect, it } from 'vitest';

import { compositeShader } from './glassShader';

describe('the glass shader’s two looks', () => {
  const frost = compositeShader('frost', 0.4);
  const tint = compositeShader('tint', 0.4);

  it('each carry only their own functions', () => {
    for (const name of ['inField(', 'lens(', 'tBlur, bent'])
      expect([frost.includes(name), tint.includes(name)]).toEqual([
        true,
        false,
      ]);
    for (const name of ['skyAround(', 'cardTint('])
      expect([frost.includes(name), tint.includes(name)]).toEqual([
        false,
        true,
      ]);
  });

  it('end main() once, after the cards are found', () => {
    for (const shader of [frost, tint]) {
      expect(shader.match(/void main\(\)/g)).toHaveLength(1);
      expect(shader.indexOf('gl_FragColor')).toBeGreaterThan(
        shader.indexOf('for (int i = 0; i < '),
      );
      expect(shader.trimEnd().endsWith('}')).toBe(true);
    }
  });

  it('tints only the phone menu’s glass, and bends less behind a field', () => {
    expect(tint).toContain('if (uDeep[i] < 0.5) continue;');
    expect(frost).not.toContain('uDeep[i] < 0.5');
    expect(frost).toContain('mix(1.0, 0.40, field)');
  });
});
