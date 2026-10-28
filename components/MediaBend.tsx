'use client';

import { useEffect } from 'react';

import { Box, MediaBender, shownPart } from './mediaBender';
import {
  addMark,
  inkLeft,
  inkReaches,
  leavesTrail,
  Mark,
  pathShows,
} from './pointerInk';

// The page's images and videos bend where the pointer's trail passes over
// them (mediaBender.ts), as the 3D scene behind shows through glass lenses
// (Background/pointerTrail.ts). Each picture the trail reaches gets a canvas
// laid over it, inside its own box (so the box's rounded corners, the
// page's fades and a playing video's blur fall on it too, and what sits over
// the picture, such as a play button, stays over it), drawing the bent
// picture only where the ink is; it hides again once the trail has gone.
// Only pictures from this site can be read back to draw: another site's,
// such as a YouTube embed, stays as it is.

// Marks the canvas laid over a picture.
const OVERLAY = 'data-media-bend';

type Picture = HTMLImageElement | HTMLVideoElement;

const ready = (media: Picture) =>
  media instanceof HTMLImageElement
    ? media.complete && media.naturalWidth > 0
    : media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;

const fromThisSite = (media: Picture) =>
  new URL(media.currentSrc, location.href).origin === location.origin;

const naturalSize = (media: Picture) =>
  media instanceof HTMLImageElement
    ? { width: media.naturalWidth, height: media.naturalHeight }
    : { width: media.videoWidth, height: media.videoHeight };

// The canvas over `media`, made the first time the trail reaches it, filling
// the box `media` sits in; none if that box is not positioned to hold it.
function overlayFor(media: Picture) {
  const next = media.nextElementSibling;
  if (next instanceof HTMLCanvasElement && next.hasAttribute(OVERLAY))
    return next;
  const box = media.parentElement;
  if (!box || getComputedStyle(box).position === 'static') return null;
  const overlay = document.createElement('canvas');
  overlay.setAttribute(OVERLAY, '');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.className = 'pointer-events-none absolute inset-0 size-full';
  media.after(overlay);
  return overlay;
}

export default function MediaBend() {
  useEffect(() => {
    let path: Mark[] = [];
    let pointer = { x: 0, y: 0 };
    let frame = 0;
    let bender: MediaBender | null = null;
    let drawn = new Set<HTMLCanvasElement>();
    const now = () => performance.now() / 1000;

    // Draws `media` bent into its overlay, in the CSS pixels of the box it
    // sits in (a tile's slight tilt is left out).
    const bend = (media: Picture, overlay: HTMLCanvasElement, t: number) => {
      const box = media.parentElement!;
      const around = box.getBoundingClientRect();
      const scale = box.clientWidth / (around.width || 1);
      const local = ({ x, y }: { x: number; y: number }) => ({
        x: (x - around.left) * scale,
        y: (y - around.top) * scale,
      });
      const dpr = Math.min(devicePixelRatio, 2);
      const width = Math.round(box.clientWidth * dpr);
      const height = Math.round(box.clientHeight * dpr);
      if (overlay.width !== width || overlay.height !== height)
        Object.assign(overlay, { width, height });
      const rect = media.getBoundingClientRect();
      const at = local({ x: rect.left, y: rect.top });
      const place: Box = {
        ...at,
        width: rect.width * scale,
        height: rect.height * scale,
      };
      bender ??= new MediaBender();
      bender.draw(
        overlay,
        media,
        place,
        shownPart(place, naturalSize(media), getComputedStyle(media).objectFit),
        path.map((mark) => ({
          ...mark,
          ...local(mark),
          left: inkLeft(t - mark.t),
        })),
        local(pointer),
        dpr,
      );
    };

    const step = () => {
      const t = now();
      const touched = new Set<HTMLCanvasElement>();
      for (const media of document.querySelectorAll<Picture>('img, video')) {
        if (!ready(media) || !fromThisSite(media)) continue;
        if (!inkReaches(path, media.getBoundingClientRect(), t)) continue;
        const overlay = overlayFor(media);
        if (!overlay) continue;
        bend(media, overlay, t);
        overlay.style.display = '';
        touched.add(overlay);
      }
      for (const overlay of drawn)
        if (!touched.has(overlay)) overlay.style.display = 'none';
      drawn = touched;
      frame = pathShows(path, t) ? requestAnimationFrame(step) : 0;
    };

    const move = (event: PointerEvent) => {
      if (!leavesTrail(event)) return;
      pointer = { x: event.clientX, y: event.clientY };
      path = addMark(path, pointer.x, pointer.y, now());
      frame ||= requestAnimationFrame(step);
    };
    addEventListener('pointermove', move, { passive: true });
    return () => {
      removeEventListener('pointermove', move);
      cancelAnimationFrame(frame);
      for (const overlay of document.querySelectorAll(`[${OVERLAY}]`))
        overlay.remove();
    };
  }, []);

  return null;
}
