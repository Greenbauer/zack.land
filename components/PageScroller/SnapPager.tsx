'use client';

import { useEffect } from 'react';

import { viewBound } from '../Background/skyViews';
import { PAGE_SCROLLER_ID } from './edgeFade';
import { GLIDE_EVENT, postSpans } from './pageGlide';
import {
  easeOutCubic,
  GLIDE_MS,
  keptPlace,
  keyDirection,
  landing,
  placeIn,
  postAt,
  throughPost,
  turnGate,
  turnIndex,
  wheelPager,
} from './paging';

// How far a finger must travel up or down the screen to turn a page, in
// pixels.
const SWIPE_PX = 40;
// How long the wheel must rest after scrolling through a post before it may
// turn the page, in milliseconds, so a trackpad's coast reaching the post's
// end doesn't turn it too.
const THROUGH_REST_MS = 180;
// How much of the window a key or a scroll arrow scrolls through a post.
const THROUGH_STEP = 0.8;

// Pages the scroller between its posts (paging.ts) on the wheel, a swipe,
// the keyboard and the scroll arrows (pageGlide.ts). A push the same way
// while the last turn's next card is still coming in is let go, a turn back
// goes at once (turnGate). A post that More has opened taller than the
// page (Post.tsx) is scrolled through first, and turns only at its end
// (throughPost), except by a scroll arrow on a post laid open for a short
// window. Renders nothing.
export default function SnapPager() {
  useEffect(() => {
    const scroller = document.getElementById(PAGE_SCROLLER_ID);
    if (!scroller) return;
    const turn = wheelPager();
    // The first card is arriving as the page loads.
    const gate = turnGate({ playingFrom: performance.now() });
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    // When the wheel last scrolled through a post.
    let throughAt = -Infinity;

    const spans = () => postSpans(scroller);

    // The post the page is on and how far down it, kept as the page scrolls
    // (but not while a glide runs, which looks up its landing every frame).
    // When the posts change height under it (the footer's text coming or
    // going at the last post changes --post-height, a window resized or
    // turned, a post opened by More closing above it) the page is put back
    // there (keptPlace). Chrome snaps back onto a post by itself; Safari on
    // an iPhone does not, and left the page part way between posts, a post's images
    // over its card, which is fixed at the bottom of the window. A scroll
    // the browser makes as the posts change (holding the page inside its
    // new length) is not one to remember: the place is taken only while the
    // posts are the heights it was last kept at (`heights`).
    let isGliding = false;
    const heights = () =>
      [...scroller.querySelectorAll<HTMLElement>('[data-post]')]
        .map((post) => post.offsetHeight)
        .join();
    let place = { index: 0, offset: 0, heights: '' };
    const take = () => {
      const at = spans();
      const index = postAt(at, scroller.scrollTop);
      place = {
        index,
        offset: placeIn(at[index] ?? [0, 0], scroller.scrollTop),
        heights: heights(),
      };
    };
    const remember = () => {
      if (!isGliding && heights() === place.heights) take();
    };
    const keep = () => {
      const span = spans()[place.index];
      if (isGliding || !span) return;
      const to = keptPlace(span, place.offset);
      if (Math.abs(to - scroller.scrollTop) > 0.5) scroller.scrollTop = to;
      place.heights = heights();
    };
    take();
    const resize = new ResizeObserver(keep);
    scroller
      .querySelectorAll('[data-post]')
      .forEach((post) => resize.observe(post));
    // The browser's snapping would pull the page back to a post's top, so it
    // is off while the page is on a post taller than the page.
    const fitSnap = () => {
      const at = spans();
      const [start, end] = at[postAt(at, scroller.scrollTop)] ?? [0, 0];
      scroller.style.scrollSnapType = end > start ? 'none' : '';
    };

    // Moves the page to `to`, looked up again each frame, in a short glide:
    // where the page is going can move under it (a post opened by More that
    // closes as the page comes back to it, useMoreMotion; a post whose height
    // is still settling as More opens it), and the glide follows it there
    // rather than run on to where it was. With reduced motion it goes at
    // once.
    const land = () => {
      isGliding = false;
      take();
      fitSnap();
      scroller.removeAttribute('data-turning');
    };
    const slide = (to: () => number) => {
      cancelAnimationFrame(frame);
      // The browser's snapping would pull the page back (each step of a
      // glide, or a jump part way through a tall post to its top), so it is
      // off until the page lands, then as fits there (fitSnap).
      scroller.style.scrollSnapType = 'none';
      if (still.matches) {
        scroller.scrollTop = to();
        land();
        return;
      }
      isGliding = true;
      // The way still to go, kept relative to where it lands, so if that
      // moves the glide moves with it.
      const from = scroller.scrollTop;
      const way = to() - from;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - start) / GLIDE_MS, 1);
        scroller.scrollTop = to() - way * (1 - easeOutCubic(t));
        if (t < 1) frame = requestAnimationFrame(step);
        else land();
      };
      frame = requestAnimationFrame(step);
    };

    const move = (direction: 1 | -1, quick: boolean) => {
      const at = spans();
      if (!at.length) return;
      // A quick turn back brings its card straight back (Post.tsx): the card
      // it turns away from never set off.
      scroller.style.setProperty('--turn-delay', quick ? '0s' : '');
      const from = scroller.scrollTop;
      const next = turnIndex(at, from, direction);
      if (next !== null) {
        // The sky sets off now, and the card leaving keeps its side until the
        // page lands, by when it is hidden as it goes (glassTint.ts).
        scroller.toggleAttribute('data-turning', true);
        viewBound(`${location.pathname}#${next}`);
      }
      slide(() => {
        const span = next === null ? undefined : spans()[next];
        return span ? landing(span, direction) : from;
      });
    };

    // A turn goes now, or not at all while the last turn's next card is
    // still coming in (turnGate).
    const glide = (direction: 1 | -1, pressed = false) => {
      const next = gate.ask(direction, performance.now(), pressed);
      if (next) move(next.direction, next.quick);
    };

    // A key or a scroll arrow (`pressed`) scrolls most of a window through a
    // tall post, or else turns the page. A scroll arrow on a post laid open
    // because its window is too short for its card (data-laid-open,
    // Post.tsx) turns the page at once: there the keys, the wheel and a
    // finger scroll through it.
    const isOnLaidOpen = () => {
      const posts = scroller.querySelectorAll('[data-post]');
      return !!posts[postAt(spans(), scroller.scrollTop)]?.hasAttribute(
        'data-laid-open',
      );
    };
    const step = (direction: 1 | -1, pressed = false) => {
      if (pressed && isOnLaidOpen()) return glide(direction, pressed);
      const to = throughPost(
        spans(),
        scroller.scrollTop,
        direction,
        scroller.clientHeight * THROUGH_STEP,
      );
      if (to === null) return glide(direction, pressed);
      // As far down the post the page is on as it goes, no further than the
      // post's end as it is then (keptPlace): a post still settling as More
      // opens it is taller for a moment, and a scroll set off for its old
      // end ran on past it, and left the page between posts.
      const at = spans();
      const index = postAt(at, scroller.scrollTop);
      const offset = to - (at[index]?.[0] ?? 0);
      slide(() => {
        const span = spans()[index];
        return span ? keptPlace(span, offset) : to;
      });
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY))
        return;
      event.preventDefault();
      if (!event.deltaY) return;
      const to = throughPost(
        spans(),
        scroller.scrollTop,
        event.deltaY > 0 ? 1 : -1,
        Math.abs(event.deltaY),
      );
      if (to !== null) {
        fitSnap();
        scroller.scrollTop = to;
        throughAt = event.timeStamp;
        return;
      }
      // At the post's end: what is left of that scroll is spent here.
      if (event.timeStamp - throughAt < THROUGH_REST_MS) {
        throughAt = event.timeStamp;
        return;
      }
      const direction = turn(event.deltaY, event.timeStamp);
      if (direction) glide(direction);
    };

    // A swipe turns one page as the finger lifts, the browser's own scroll
    // held off meanwhile. On a post taller than the page the finger drags the
    // page through it instead, no further than its end, and that swipe turns
    // nothing.
    let touch: {
      x: number;
      y: number;
      lastY: number;
      through: boolean;
    } | null = null;
    const onTouchStart = (event: TouchEvent) => {
      const { clientX, clientY } = event.touches[0]!;
      touch =
        event.touches.length === 1
          ? { x: clientX, y: clientY, lastY: clientY, through: false }
          : null;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!touch) return;
      event.preventDefault();
      const { clientY } = event.touches[0]!;
      const dy = touch.lastY - clientY;
      touch.lastY = clientY;
      if (!dy) return;
      const to = throughPost(
        spans(),
        scroller.scrollTop,
        dy > 0 ? 1 : -1,
        Math.abs(dy),
      );
      if (to === null) return;
      fitSnap();
      scroller.scrollTop = to;
      touch.through = true;
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (!touch) return;
      const { clientX, clientY } = event.changedTouches[0]!;
      const dx = touch.x - clientX;
      const dy = touch.y - clientY;
      const { through } = touch;
      touch = null;
      if (through) return;
      if (Math.abs(dy) >= SWIPE_PX && Math.abs(dy) > Math.abs(dx))
        glide(dy > 0 ? 1 : -1);
    };

    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable]')) return;
      const direction = keyDirection(event.key, event.shiftKey);
      if (!direction) return;
      event.preventDefault();
      step(direction);
    };

    const onRequest = (event: Event) =>
      step((event as CustomEvent<1 | -1>).detail, true);

    scroller.addEventListener('scroll', remember, { passive: true });
    scroller.addEventListener('wheel', onWheel, { passive: false });
    scroller.addEventListener('touchstart', onTouchStart, { passive: true });
    scroller.addEventListener('touchmove', onTouchMove, { passive: false });
    scroller.addEventListener('touchend', onTouchEnd);
    window.addEventListener('keydown', onKey);
    window.addEventListener(GLIDE_EVENT, onRequest);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      scroller.removeEventListener('scroll', remember);
      scroller.style.scrollSnapType = '';
      scroller.style.removeProperty('--turn-delay');
      scroller.removeAttribute('data-turning');
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
