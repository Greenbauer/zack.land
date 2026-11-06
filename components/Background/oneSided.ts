import { Side } from './sideMorphs';

// Expressions made on one side of the face (or body): each is a mix of the
// head's expressions split into halves (sideMorphs.ts), mostly on its own
// side, sometimes with a touch of something on the other. A wink is not half
// a blink: the cheek rises into the closing eye, the brow comes down to meet
// it and the mouth's corner lifts on that side. Each maps an expression to
// its strength on the named side (`side`) and on the other (`other`).
export const ONE_SIDED: Record<
  string,
  { side: Record<string, number>; other?: Record<string, number> }
> = {
  wink: {
    // The mouth stays closed, pulled up and back on the winking side.
    side: {
      // Its own shut eye, the cheek bunched under it (a blink with a
      // squint over it would turn the lids past each other at the corner).
      blinkTight: 1,
      browDown: 0.5,
      smile: 0.45,
      press: 0.6,
      dimple: 0.4,
    },
  },
  smirk: { side: { smile: 0.9, dimple: 0.6, squint: 0.15, press: 0.8 } },
  // One brow up, the other drawn down a little against it.
  browRaise: {
    side: { browsUp: 0.6, browOuterUp: 1 },
    other: { browDown: 0.6 },
  },
  sneer: { side: { sneer: 1 } },
  shrug: { side: { shrug: 1 } },
};

// A one-sided expression's strengths, by the split expressions' names
// (`smileLeft`), on `side` (the head's own).
export function oneSided(name: string, side: Side): Record<string, number> {
  const { side: own, other = {} } = ONE_SIDED[name]!;
  const across: Side = side === 'Left' ? 'Right' : 'Left';
  return Object.fromEntries([
    ...Object.entries(own).map(([base, w]) => [`${base}${side}`, w]),
    ...Object.entries(other).map(([base, w]) => [`${base}${across}`, w]),
  ]);
}
