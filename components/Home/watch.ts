import { Chapter, CHAPTERS, dwellSeconds } from './chapters';

// Watch: the story plays on its own, a page turn after each chapter's lines
// (Story.tsx), until its last chapter or until someone takes over.

// Seconds after a chapter arrives that its first line and its beats start:
// the card is still sliding in (Post.tsx CARD).
export const LEAD_SECONDS = 0.9;

// How long Watch waits on story index `index` (-1 is the opening, with the
// name) before it turns the page, or null on the last chapter: there it
// stops.
export function watchWait(
  index: number,
  chapters: readonly Pick<Chapter, 'lines'>[] = CHAPTERS,
): number | null {
  if (index >= chapters.length - 1) return null;
  if (index < 0) return 0;
  return LEAD_SECONDS + dwellSeconds(chapters[index]!);
}

// Whether an input someone made stops Watch: anything outside the story's
// own controls (data-watch), which start, pause and step it themselves.
export const takesOver = (target: EventTarget | null) =>
  !(target as Partial<Element> | null)?.closest?.('[data-watch]');
