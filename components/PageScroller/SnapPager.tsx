'use client';

import { useEffect } from 'react';

import { PAGE_SCROLLER_ID } from './edgeFade';
import { GLIDE_EVENT, postPositions } from './pageGlide';
import {
  easeOutCubic,
  GLIDE_MS,
  keyDirection,
  nextPost,
  turnGate,
  wheelPager,
} from './paging';

// How far a finger must travel up or down the screen to turn a page, in
// pixels.
const SWIPE_PX = 40;

// Pages the scroller between its posts (paging.ts) on the wheel, a swipe,
// the keyboard and the scroll arrows (pageGlide.ts). A turn the same way
// waits for the last turn's next card to come most of the way in, a turn
// back goes at once (turnGate). Renders nothing.
export default function SnapPager() {
  useEffect(() => {
    const scroller = document.getElementById(PAGE_SCROLLER_ID);
    if (!scroller) return;
    const turn = wheelPager();
    // The first card is arriving as the page loads.
    const gate = turnGate({ playingFrom: performance.now() });
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let wait = 0;

    const positions = () => postPositions(scroller);

    const move = (direction: 1 | -1, quick: boolean) => {
      const at = positions();
      if (!at.length) return;
      // A quick turn back brings its card straight back (Post.tsx): the card
      // it turns away from never set off.
      scroller.style.setProperty('--turn-delay', quick ? '0s' : '');
      const to = at[nextPost(at, scroller.scrollTop, direction)]!;
      cancelAnimationFrame(frame);
      if (still.matches) {
        scroller.scrollTop = to;
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
        else scroller.style.scrollSnapType = '';
      };
      frame = requestAnimationFrame(step);
    };

    // A turn goes now, or waits for the last turn's next card to come in.
    // (A timer can fire a moment early, so it looks again until it may.)
    const play = () => {
      const next = gate.due(performance.now());
      if (next) move(next.direction, next.quick);
      else if (gate.waiting)
        wait = window.setTimeout(play, gate.freeAt - performance.now());
    };
    const glide = (direction: 1 | -1) => {
      const now = performance.now();
      const next = gate.ask(direction, now);
      clearTimeout(wait);
      if (next) move(next.direction, next.quick);
      else wait = window.setTimeout(play, gate.freeAt - now);
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

    // A swipe turns one page as the finger lifts, the browser's own scroll
    // held off meanwhile, unless what it began on can still scroll that way.
    let touch: { x: number; y: number; target: EventTarget | null } | null =
      null;
    const onTouchStart = (event: TouchEvent) => {
      const { clientX, clientY } = event.touches[0]!;
      touch =
        event.touches.length === 1
          ? { x: clientX, y: clientY, target: event.target }
          : null;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!touch) return;
      const { clientY } = event.touches[0]!;
      if (scrollsItself(touch.target, touch.y - clientY)) touch = null;
      else event.preventDefault();
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (!touch) return;
      const { clientX, clientY } = event.changedTouches[0]!;
      const dx = touch.x - clientX;
      const dy = touch.y - clientY;
      touch = null;
      if (Math.abs(dy) >= SWIPE_PX && Math.abs(dy) > Math.abs(dx))
        glide(dy > 0 ? 1 : -1);
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
    scroller.addEventListener('touchstart', onTouchStart, { passive: true });
    scroller.addEventListener('touchmove', onTouchMove, { passive: false });
    scroller.addEventListener('touchend', onTouchEnd);
    window.addEventListener('keydown', onKey);
    window.addEventListener(GLIDE_EVENT, onRequest);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(wait);
      scroller.style.scrollSnapType = '';
      scroller.style.removeProperty('--turn-delay');
      scroller.removeEventListener('wheel', onWheel);
      scroller.removeEventListener('touchstart', onTouchStart);
      scroller.removeEventListener('touchmove', onTouchMove);
      scroller.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(GLIDE_EVENT, onRequest);
    };
  }, []);

  return null;
}
