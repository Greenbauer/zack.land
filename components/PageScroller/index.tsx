import { ReactNode } from 'react';

import { edgeFadeCss, PAGE_SCROLLER_ID } from './edgeFade';
import ScrollbarWidth from './ScrollbarWidth';

// The page scrolls in this fixed, full-window box rather than the window, so
// its fade under the header and the footer (edgeFade.ts) stays put without
// any script running as it scrolls. It snaps to whatever marks itself a snap
// point (the portfolio's posts); pages without any scroll freely. It never
// scrolls sideways: a phone's post cards run their glass past its sides.
export default function PageScroller({ children }: { children: ReactNode }) {
  return (
    <div
      id={PAGE_SCROLLER_ID}
      className="fixed inset-0 z-0 snap-y snap-mandatory overflow-y-auto overflow-x-hidden"
    >
      <style>{edgeFadeCss(`#${PAGE_SCROLLER_ID}`)}</style>
      <ScrollbarWidth />
      {/* Clipped to its own box, which ends where the scrollbar begins: the
          cards' glass and the photo glass beside them run past the window's
          right side, and would cover the scrollbar. */}
      <div className="flex min-h-full w-full justify-center pb-[var(--page-bottom)] [clip-path:inset(0)]">
        {children}
      </div>
    </div>
  );
}
