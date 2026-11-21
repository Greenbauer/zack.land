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

// How long from `now` until Watch turns the page on story index `index`,
// whose lines started at `since` (seconds): what is left of its wait, so
// Play pressed on a chapter already read moves on soon (at least a second
// on), not after its whole wait again. Null on the last chapter.
export function watchDelay(
  index: number,
  since: number,
  now: number,
  chapters: readonly Pick<Chapter, 'lines'>[] = CHAPTERS,
): number | null {
  const wait = watchWait(index, chapters);
  if (wait === null || index < 0) return wait;
  return Math.max(1, since - LEAD_SECONDS + wait - now);
}

// Whether an input someone made stops Watch: anything outside the story's
// own controls (data-watch), which start, pause and step it themselves.
export const takesOver = (target: EventTarget | null) =>
  !(target as Partial<Element> | null)?.closest?.('[data-watch]');
