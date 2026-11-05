import { describe, expect, it } from 'vitest';

import { LOOKS } from './ambient';
import { pointerExpressions } from './faceExpression';
import { expressions } from './headFixture';
import { WORRIED } from './headMood';
import { tapExpressions } from './headTaps';
import { greetingExpressions } from './idleGreeting';
import { neckExpressions } from './neckPose';
import { SHOWN_EXPRESSIONS, SHOWN_SIDED } from './shownExpressions';
import { SIDES } from './sideMorphs';

// The expression a name drives: itself, when head.bin has it whole (the
// mouth pulled left or right), or the one it is a half of (sideMorphs.ts).
const whole = (name: string) =>
  (SHOWN_EXPRESSIONS as readonly string[]).includes(name)
    ? name
    : SIDES.reduce((n, side) => n.replace(new RegExp(`${side}$`), ''), name);

describe('the expressions the page loads', () => {
  it('are all in head.bin', () => {
    for (const name of SHOWN_EXPRESSIONS) expect(expressions).toContain(name);
  });

  it('include every expression the page drives', () => {
    const asked = new Set<string>([
      'smile',
      ...Object.keys(
        pointerExpressions(
          { x: 0, y: 0 },
          { x: 0, y: 0 },
          { width: 1, height: 1 },
        ),
      ),
      ...Object.keys(WORRIED),
      ...Object.keys(tapExpressions({ phase: 'smiling', since: 0 })),
      ...[1, 2, 3].flatMap((count) =>
        Object.keys(
          tapExpressions({
            phase: 'reacting',
            count: count as 1 | 2 | 3,
            since: 0,
          }),
        ),
      ),
      ...Object.keys(greetingExpressions({ phase: 'idle' })),
      ...Object.keys(neckExpressions({ x: 0, y: 0 })),
      ...Object.values(LOOKS).flatMap((look) =>
        Object.keys(look('Left', 'Right')).map(whole),
      ),
    ]);
    for (const name of asked) expect(SHOWN_EXPRESSIONS).toContain(name);
  });

  it('split into halves those the page drives one-sided', () => {
    for (const look of Object.values(LOOKS))
      for (const name of Object.keys(look('Left', 'Right'))) {
        const base = whole(name);
        if (base !== name) expect(SHOWN_SIDED).toContain(base);
      }
    for (const name of SHOWN_SIDED) expect(SHOWN_EXPRESSIONS).toContain(name);
  });
});
