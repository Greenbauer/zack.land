// The expressions the page's face makes (MyHead.tsx). head.bin carries many
// more (scripts/head/expressions.mjs: blinks, speech shapes, a shrug and the
// rest), but each the page loads is a full copy of the skin's moves and
// normals on the GPU, so it reads only these. Name one here before driving
// it: shownExpressions.test.ts checks every expression the page asks for is
// listed.
export const SHOWN_EXPRESSIONS = [
  'smile',
  'gasp',
  'pout',
  'browsUp',
  'squint',
  'worried',
  'blink',
  'press',
  'mouthLeft',
  'mouthRight',
  'breathe',
  'swallow',
  'noseFlare',
  'browInnerUp',
  'browOuterUp',
  'lowerLipIn',
  'frown',
  'cheekPuff',
  'browDown',
  'jawLeft',
  'jawRight',
  'neckTurnLeft',
  'neckTurnRight',
  'neckTurnLeftFar',
  'neckTurnRightFar',
  'neckUp',
  'neckDown',
] as const;

// The expressions the page splits into left and right halves (sideMorphs.ts),
// each a further pair of copies on the GPU: only those it drives one-sided.
export const SHOWN_SIDED = ['browsUp', 'squint'] as const;
