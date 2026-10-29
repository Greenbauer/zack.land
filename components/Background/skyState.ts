// Whether the sky has come to rest at its view's home (Sky.tsx writes it each
// frame; skyViews.ts), and whether that home is one of the light skies
// (LIGHT_SKIES) rather than the dark ones. While it rests, text over the sky
// (useSkyColours) and the glass cards (glassTint.ts) take that sky's side,
// light or dark, as its station was measured to read: the pointer turning the
// sky about its home, or the head turning under the text, never switches
// them, and a side they took while the sky glided in is not kept past it.
// They follow what they read again as the sky glides to another view's home.
// Not at rest until the scene has drawn the sky for a moment. Kept apart from
// Sky.tsx so the page can read it without loading three.js.
export const skyState = { settled: false, light: false };
