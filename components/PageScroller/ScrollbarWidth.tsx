'use client';

import { useEffect } from 'react';

import { PAGE_SCROLLER_ID } from './edgeFade';

// Keeps --scrollbar-width on the page's scroller: how wide its scrollbar is
// (none where it floats over the page, or while nothing scrolls), so its
// fade leaves the scrollbar whole (edgeFade.ts). Renders nothing.
export default function ScrollbarWidth() {
  useEffect(() => {
    const scroller = document.getElementById(PAGE_SCROLLER_ID);
    if (!scroller) return;
    const measure = () =>
      scroller.style.setProperty(
        '--scrollbar-width',
        `${scroller.offsetWidth - scroller.clientWidth}px`,
      );
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(scroller);
    if (scroller.firstElementChild) resize.observe(scroller.firstElementChild);
    return () => resize.disconnect();
  }, []);

  return null;
}
