// Whether the sky's side is settled (Sky.tsx writes it each frame; skyViews.ts),
// and whether the view's home is one of the light skies (LIGHT_SKIES) rather
// than the dark ones. Once settled, text over the sky (useSkyColours) and the
// glass cards (glassTint.ts) take that sky's side, light or dark, as its
// station was measured to read: the pointer turning the sky about its home, or
// the head turning under the text, never switches them, and on a move to
// another view they turn over as the sky sets off, not after it lands.
// Not settled until the scene has drawn the sky for a moment. Kept apart from
// Sky.tsx so the page can read it without loading three.js.
export const skyState = { settled: false, light: false };
