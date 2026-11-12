import motion from '@/theme/motion.json';

// How the page moves out as the site goes to another page (PageLeave.tsx),
// in milliseconds: every card showing leaves as a post's card does when the
// portfolio turns (motion.json's cardMs.leave), the home page's title a
// little sooner, and the site goes once the image tiles have melted out
// (MediaMelt.tsx: at most GO_WAIT_S of a wait, then the melt at its slowest
// pace, about 1.03 seconds in all; leaveTo.test.ts keeps it so).
export const CARD_MS = motion.cardMs.leave;
export const TITLE_MS = 600;
export const TILES_MS = 1100;

// Where a click on a link should take the site once the page has moved out
// (PageLeave.tsx), or null to let it go at once: a plain left click on a link
// to another page of this site, in this tab.
export function slideAwayTo(
  click: {
    button: number;
    metaKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
  },
  link: { href: string; target: string },
  here: string,
): string | null {
  if (click.button !== 0) return null;
  if (click.metaKey || click.ctrlKey || click.shiftKey || click.altKey)
    return null;
  if (link.target && link.target !== '_self') return null;
  const url = new URL(link.href, here);
  const from = new URL(here);
  if (url.origin !== from.origin || url.pathname === from.pathname) return null;
  return url.pathname + url.search + url.hash;
}
