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
