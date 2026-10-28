// Whether a card's glass runs on past the window's edge: only when that edge
// is nearer the card than the glass's soft outer edge reaches (glass.ts's
// FEATHER_TO), which would otherwise cut it off square. Farther from the edge
// (a window wider than the content's frame) the card ends with its own
// rounded, feathered edge. Kept apart from glass.ts so the page can ask
// without loading three.js.
export const GLASS_REACH_PX = 160;
export const bleedsPast = (gap: number) => gap < GLASS_REACH_PX;
