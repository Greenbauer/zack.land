'use client';

import { useEffect } from 'react';

import { PAGE_SCROLLER_ID } from './edgeFade';
import { GLIDE_EVENT, postPositions } from './pageGlide';
import {
  easeOutCubic,
  GLIDE_MS,
  keyDirection,
  nextPost,
  wheelPager,
} from './paging';

// Pages the scroller between its posts (paging.ts) on the wheel, the
// keyboard and the scroll arrows (pageGlide.ts). A phone's swipe keeps the
// browser's own snapping, which already moves a post at a time. Renders
// nothing.
export default function SnapPager() {
  useEffect(() => {
    const scroller = document.getElementById(PAGE_SCROLLER_ID);
    if (!scroller) return;
    const turn = wheelPager();
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;

    const positions = () => postPositions(scroller);

    // Where a glide under way is headed, so a quick push adds a post to it
    // rather than to wherever the glide has got to.
    let headedTo: number | null = null;

    const glide = (direction: 1 | -1) => {
      const at = positions();
      if (!at.length) return;
      const to = at[nextPost(at, headedTo ?? scroller.scrollTop, direction)]!;
      headedTo = to;
      cancelAnimationFrame(frame);
      if (still.matches) {
        scroller.scrollTop = to;
        headedTo = null;
        return;
      }
      // The browser's snapping would pull each step back, so it is off
      // until the glide lands (on a post, where it agrees).
      scroller.style.scrollSnapType = 'none';
      const from = scroller.scrollTop;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - start) / GLIDE_MS, 1);
        scroller.scrollTop = from + (to - from) * easeOutCubic(t);
        if (t < 1) frame = requestAnimationFrame(step);
        else {
          scroller.style.scrollSnapType = '';
          headedTo = null;
        }
      };
      frame = requestAnimationFrame(step);
    };

    // Whether something inside a post (its text, opened on a phone) can
    // still scroll that way itself, so the wheel should scroll it instead.
    const scrollsItself = (target: EventTarget | null, deltaY: number) => {
      for (
        let node = target instanceof Element ? target : null;
        node && node !== scroller;
        node = node.parentElement
      ) {
        const { overflowY } = getComputedStyle(node);
        if (overflowY !== 'auto' && overflowY !== 'scroll') continue;
        if (
          deltaY > 0 &&
          node.scrollTop + node.clientHeight < node.scrollHeight
        )
          return true;
        if (deltaY < 0 && node.scrollTop > 0) return true;
      }
      return false;
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY))
        return;
      if (scrollsItself(event.target, event.deltaY)) return;
      event.preventDefault();
      const direction = turn(event.deltaY, event.timeStamp);
      if (direction) glide(direction);
    };

    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable]')) return;
      const direction = keyDirection(event.key, event.shiftKey);
      if (!direction) return;
      event.preventDefault();
      glide(direction);
    };

    const onRequest = (event: Event) =>
      glide((event as CustomEvent<1 | -1>).detail);

    scroller.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener(GLIDE_EVENT, onRequest);
    return () => {
      cancelAnimationFrame(frame);
      scroller.style.scrollSnapType = '';
      scroller.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(GLIDE_EVENT, onRequest);
    };
  }, []);

  return null;
}
