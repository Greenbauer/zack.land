// What a post's card shows of More and its technology (Post.tsx).

// On a phone a card with images shows a few lines of its text and keeps its
// technology behind More (`isClamped`). When those lines already hold its
// whole description, only the technology is left behind More, so the card
// shows it, on a line of its own above its links, and no More. Its links
// (Visit Site, View Code) end the card at its bottom right: in the row of a
// clamped card, which lays them out at its right, and in the column of an
// open or whole one, each set to its right (`linkClass`).
export function phoneParts(isClamped: boolean, isDescriptionCut: boolean) {
  if (!isClamped)
    return { technologyClass: '', isMore: false, linkClass: 'max-md:self-end' };
  return isDescriptionCut
    ? { technologyClass: 'hidden md:block', isMore: true, linkClass: '' }
    : { technologyClass: 'max-md:basis-full', isMore: false, linkClass: '' };
}

// Whether a card shows More (or Less): when its text is cut short or it is
// open, never when it is laid open because its post is too short for it
// (useCardFloor), as there is nothing to close.
export function showsMore(
  isExpanded: boolean,
  isTooShort: boolean,
  isCut: boolean,
) {
  return !isTooShort && (isExpanded || isCut);
}
