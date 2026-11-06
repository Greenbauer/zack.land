import { Side } from './sideMorphs';

// The passing looks the head makes on its own (ambient.ts runs them). Most
// are small, the things people do standing about waiting: the brows lifted
// slowly, one leading; now and then a brow flicked up quickly (one brow
// leading, the other following a beat later and less: a passing thought);
// the lips pressed together; the mouth pulled to one side; a sigh
// (the chest rising, then the lids drooping a little and the inner brows
// lifting as the breath goes out); a swallow (the lips pressed shut first,
// then the Adam's apple bobbing up and back down); a slow breath in through
// the nose, its wings flaring a little; a brief frown of
// concentration; the lower lip drawn in, as if to wet it; the jaw shifted a
// little to one side. (Earlier, one eye narrowed, the lips pursed and a half
// smile: nobody squints one eye or purses at nothing, and the head smiles
// anyway, facing the camera.) The mouth only moves subtly: it never opens on
// its own. No wide eyes: opening the lids round the still eyeballs reads as
// the eyes popping out.
//
// While it looks around on its own (wander.ts), now and then a look is a
// bolder, whole-face one instead (BOLD_LOOKS), as a person makes waiting with
// nobody watching: lips rolled and pushed to one side under raised brows (a
// "hmm"), the cheeks puffed and blown out, a "not bad" (corners down, lips
// pushed out, brows up), one brow cocked, the lower lip rolled in.

// Each look: the expressions (head.bin's morph targets, and the one-sided
// ones) it is made of, with the range each reaches at its height, for one
// side of the face (`side`) and the other (`other`).
type Range = readonly [number, number];
// A morph's range, and optionally how late it starts (a share of the look's
// time), so the brows move as a wave: one leads, the other follows.
type Part = Range | readonly [number, number, number];
export type Look = (_side: Side, _other: Side) => Record<string, Part>;

export const LOOKS: Record<string, Look> = {
  // Both brows lifted slowly, one leading and higher.
  browRaise: (side, other) => ({
    [`browsUp${side}`]: [0.35, 0.6],
    [`browsUp${other}`]: [0.25, 0.45, 0.08],
  }),
  // One brow up, the other following a beat later and less, its eye
  // squinting a little.
  browFlick: (side, other) => ({
    [`browsUp${side}`]: [0.45, 0.8],
    [`browsUp${other}`]: [0.15, 0.35, 0.15],
    [`squint${other}`]: [0.05, 0.15],
  }),
  // The lips pressed together, the mouth's corners drawn in a little.
  press: () => ({ press: [0.3, 0.5] }),
  // The mouth pulled to one side, its cheek bunching that eye a touch.
  aside: (side, other) => ({
    [`mouth${side}`]: [0.25, 0.4],
    [`squint${side}`]: [0.05, 0.1],
    [`squint${other}`]: [0.01, 0.03, 0.12],
  }),
  // A sigh: the breath in, then out, the lids drooping and the inner brows
  // lifting as it goes out.
  sigh: (side, other) => ({
    breathe: [0.5, 0.75],
    noseFlare: [0.15, 0.25],
    blink: [0.2, 0.3, 0.35],
    [`browsUp${side}`]: [0.1, 0.2, 0.3],
    [`browsUp${other}`]: [0.1, 0.2, 0.3],
  }),
  // A swallow: the lips pressed shut and the floor of the mouth firming
  // first, then the Adam's apple jumping up and dropping back, the lips
  // letting go with it.
  swallow: () => ({ press: [0.3, 0.45], swallow: [0.8, 1, 0.3] }),
  // A breath in through the nose, its wings flaring a little.
  flare: () => ({ noseFlare: [0.3, 0.5] }),
  // A brief frown of concentration, the eyes narrowing with it.
  furrow: (side, other) => ({
    browDown: [0.25, 0.4],
    [`squint${side}`]: [0.05, 0.12],
    [`squint${other}`]: [0.05, 0.12],
  }),
  // The lower lip drawn in under the upper a little, as if to wet it.
  lipIn: () => ({ lowerLipIn: [0.3, 0.45], press: [0.15, 0.25] }),
  // The jaw shifted a little to one side, the mouth going with it.
  jawShift: (side) => ({
    [`jaw${side}`]: [0.15, 0.3],
    [`mouth${side}`]: [0.1, 0.2],
  }),
};

// The bold looks, at full strength (each shape's own whole, or near it).
export const BOLD_LOOKS: Record<string, Look> = {
  // "Hmm": the lips pressed, rolled in and pushed hard to one side, the chin
  // bunched up under them, both brows high (that side's higher) and the
  // forehead creased.
  hmm: (side, other) => ({
    press: [0.7, 0.9],
    [`mouth${side}`]: [0.8, 1],
    lowerLipIn: [0.3, 0.5],
    pout: [0.25, 0.35],
    [`browsUp${side}`]: [0.85, 1],
    [`browsUp${other}`]: [0.65, 0.85, 0.1],
    browOuterUp: [0.6, 0.85],
    browInnerUp: [0.3, 0.45],
  }),
  // The cheeks puffed out with a held breath, then let go.
  puff: (side, other) => ({
    cheekPuff: [0.75, 1],
    [`browsUp${side}`]: [0.3, 0.5],
    [`browsUp${other}`]: [0.3, 0.5],
  }),
  // "Not bad": the mouth's corners down, the lips pushed out, brows up.
  notBad: (side, other) => ({
    frown: [0.7, 0.9],
    pout: [0.5, 0.65],
    [`browsUp${side}`]: [0.8, 1],
    [`browsUp${other}`]: [0.65, 0.85],
    browOuterUp: [0.4, 0.6],
  }),
  // One brow cocked high, the other eye narrowed, the mouth pulled toward
  // the raised brow's side.
  skeptic: (side, other) => ({
    [`browsUp${side}`]: [0.9, 1],
    [`squint${other}`]: [0.35, 0.5],
    [`mouth${side}`]: [0.45, 0.6],
    press: [0.35, 0.5],
  }),
  // The lower lip rolled in under the upper, pressed, the brows lifting.
  lipRoll: (side, other) => ({
    lowerLipIn: [0.85, 1],
    press: [0.4, 0.55],
    [`mouth${side}`]: [0.2, 0.35],
    [`browsUp${side}`]: [0.45, 0.6],
    [`browsUp${other}`]: [0.4, 0.55, 0.1],
    browInnerUp: [0.3, 0.45],
  }),
};

// The share of the looks, while it looks around on its own, that are bold:
// mixed in now and then among the small ones.
export const BOLD_CHANCE = 0.15;

// How often each look comes up against the others of its kind.
export const LOOK_WEIGHTS: Record<string, number> = {
  browRaise: 4,
  browFlick: 1,
  press: 2,
  aside: 2,
  sigh: 1,
  swallow: 2,
  flare: 2,
  furrow: 2,
  lipIn: 2,
  jawShift: 1,
  hmm: 2,
  puff: 1,
  notBad: 1,
  skeptic: 1,
  lipRoll: 1,
};

// How long one lasts, in seconds: FACE_LASTS, or a look's own (a brow flick
// is up and back down quickly; a sigh takes several). A swallow's throat
// moves for about a second (in healthy adults' swallows on video, the hyoid
// moves for 0.79 to 1.39 s on average across studies: Molfenter and Steele,
// "Temporal Variability in the Deglutition Literature", Dysphagia, 2012),
// after the lips have closed.
export const FACE_LASTS = [2.2, 3.4] as const;
export const LASTS: Record<string, readonly [number, number]> = {
  browRaise: [2.6, 3.6],
  browFlick: [1.2, 1.5],
  swallow: [1.6, 1.9],
  sigh: [3.4, 4.8],
  flare: [2.6, 3.4],
  hmm: [2.4, 3.4],
  puff: [1.6, 2.2],
  skeptic: [2, 2.8],
};

// How long a look takes to set in and to let go, in seconds: PACE, or a
// look's own. Measured on video, a spontaneous smile or brow raise takes
// about half a second to reach its height (0.6 s and 0.74 s on average:
// Schmidt et al., 2009), and lets go more slowly, half gone in about a
// third of a second and settling back to rest over about a second more. Most
// brow movements go at that measured pace or slower; the brow flick (like
// the greeting's brow flash) is quicker, up in about a fifth of a second.
// The sigh and the flare go with a breath, over a second. In a swallow the
// Adam's apple jumps up and drops back quickly: it lets go over half a
// second, not settling slowly as a held expression does.
export const PACE = { onset: 0.45, offset: 1.4 };
export const PACES: Record<string, { onset: number; offset: number }> = {
  browRaise: { onset: 0.75, offset: 1.6 },
  browFlick: { onset: 0.22, offset: 0.9 },
  furrow: { onset: 0.6, offset: 1.5 },
  flare: { onset: 0.9, offset: 1.4 },
  swallow: { onset: 0.3, offset: 0.45 },
  sigh: { onset: 1, offset: 2.2 },
  hmm: { onset: 0.5, offset: 1.6 },
  puff: { onset: 0.4, offset: 0.8 },
  skeptic: { onset: 0.4, offset: 1.4 },
};
export const paceOf = (name: string) => PACES[name] ?? PACE;
