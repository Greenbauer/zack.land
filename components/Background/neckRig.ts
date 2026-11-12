// The neck rig's numbers, in head.bin units: read by the page's shader
// (headTurn.ts, which explains each) and by the build scripts that shape the
// neck for it (scripts/head/napeLine.mjs, neckCords.mjs, throatFill.mjs,
// rig.mjs). It imports nothing, so Node can load it from a script.

// Where the skull sits on the spine: behind the jaw, level with the earlobes.
export const SKULL_PIVOT = [0, -28, -22] as const;
// The base of the neck on its axis, where it meets the shoulders.
export const NECK_BASE_POINT = [0, -120, -45.6] as const;
// The share of a nod down taken at the skull's joint, and the heights it
// fades in over.
export const TUCK = 0.6;
export const SKULL_TUCK = [-95, -52] as const;
// The back of the neck that the skull's share leaves out: depths (z) and
// heights (y) it fades in over.
export const NAPE_BACK = [5, -50] as const;
export const NAPE_HEIGHT = [-50, -28] as const;
// The body's share of each turn and nod, taken about CHEST_PIVOT.
export const BODY_SHARE = { turn: 0.1, nod: 0.15 };
export const CHEST_PIVOT = [0, -230, -45] as const;
// The turn and nod (radians) at which each of the neck's shapes is at full
// strength (neckPose.ts): the shapes were built against renders turned 45
// degrees and nodded 30, the far turn's against a photo of a neck turned 80.
export const FULL_TURN = 0.79;
export const FAR_TURN = 1.55;
export const FULL_NOD = 0.52;
