'use client';

import { useEffect, useRef } from 'react';

import { Box, naturalSize, Picture, ready, shownPart } from './mediaBender';
import {
  MediaMelter,
  restingBox,
  stepMelt,
  stirOf,
  streakLine,
} from './mediaMelter';
import { Turn, TURN_EVENT } from './PageScroller/pageGlide';

// A post's image tiles melt in and out of the window's right side
// (mediaMelter.ts) on one canvas over the page, behind the cards. While a
// tile melts it is drawn here, at the place it rests, so it never moves with
// the page as the page glides; the tile itself shows only while it is at rest
// (.collage-tile[data-rest], styles/globals.css), each on its own, and the
// canvas hides whenever nothing is melting, so it never lies over a tile at
// rest. A tile starts on
// its way out as a turn begins, not when its post leaves the window's middle:
// by then the page has moved it. Tiles coming in set off with them, and the
// two mix as one liquid on the way (mediaMelter.ts). Where the melt can't run (data-melts unset on <html>: reduced
// motion, or no real GPU) the tiles slide instead.

// Each tile melts at its own pace, on top of its own wait and its own bands,
// so each reads as its own: coming, up to this much either side of the rest;
// going, only faster, so no tile is left behind.
const PACE_SPREAD = 0.15;
const paceOf = (direction: 1 | -1) =>
  direction > 0
    ? 1 + (Math.random() * 2 - 1) * PACE_SPREAD
    : 1.05 + Math.random() * 2 * PACE_SPREAD;
// The longest a tile waits to set off, in seconds: coming, enough for each to
// arrive on its own; going, hardly at all, as it turns to liquid at once.
const COME_WAIT_S = 0.35;
const GO_WAIT_S = 0.08;
// How long a tile waits for its picture before it just shows.
const LOAD_LIMIT_S = 3;

type Piece = {
  tile: HTMLElement;
  picture: Picture;
  rest: Box | null;
  pace: number;
  radii: [number, number, number, number];
  melt: number;
  wait: number;
  seed: number;
};
type Run = {
  box: HTMLElement;
  direction: 1 | -1;
  began: number;
  pieces: Piece[];
};

const runs = new Map<HTMLElement, Run>();
let wake: (() => void) | null = null;

const seconds = () => performance.now() / 1000;
const waitFor = (direction: 1 | -1) =>
  Math.random() * (direction > 0 ? COME_WAIT_S : GO_WAIT_S);

// Sends `box`'s tiles in (`direction` 1) or out (-1), each after its own wait,
// from wherever they are. A post drops its tiles while its images are hidden
// and makes new ones when they show, so a run on tiles since dropped gives way
// to the new, and whether the box is at rest is read from its tiles.
export function melt(box: HTMLElement, direction: 1 | -1) {
  if (!wake) return;
  const run = runs.get(box);
  const tiles = [...box.querySelectorAll<HTMLElement>('.collage-tile')];
  if (run && (direction < 0 || run.pieces.every((p) => p.tile.isConnected))) {
    if (run.direction === direction) return;
    run.direction = direction;
    run.began = seconds();
    for (const piece of run.pieces) piece.wait = waitFor(direction);
    return;
  }
  const isAtRest =
    tiles.length > 0 && tiles.every((tile) => tile.hasAttribute('data-rest'));
  if (!run && isAtRest === direction > 0) return;
  const pieces = tiles.flatMap((tile, k) => {
    if (direction > 0) tile.removeAttribute('data-rest');
    const picture = tile.querySelector<Picture>('img, video');
    return picture
      ? [
          {
            tile,
            picture,
            rest: null,
            radii: radiiOf(tile),
            melt: direction > 0 ? 0 : 1,
            pace: paceOf(direction),
            wait: waitFor(direction),
            seed: k * 3.1 + Math.random() * 50,
          },
        ]
      : [];
  });
  if (direction > 0) box.removeAttribute('data-whole');
  if (!pieces.length) return;
  runs.set(box, { box, direction, began: seconds(), pieces });
  wake();
}

const isHeld = () =>
  !!document.querySelector('[data-scene]') &&
  !document.documentElement.hasAttribute('data-page-in');

const radiiOf = (tile: HTMLElement) => {
  const style = getComputedStyle(tile);
  return [
    style.borderTopLeftRadius,
    style.borderTopRightRadius,
    style.borderBottomRightRadius,
    style.borderBottomLeftRadius,
  ].map(parseFloat) as [number, number, number, number];
};

// Where `piece` rests, from its box and post as they are now.
function restOf({ box }: Run, { tile }: Piece) {
  const post = box.closest('[data-post]');
  if (!post) return null;
  return restingBox(
    box.getBoundingClientRect(),
    post.getBoundingClientRect(),
    parseFloat(getComputedStyle(post).scrollMarginTop) || 0,
    {
      x: tile.offsetLeft,
      y: tile.offsetTop,
      width: tile.offsetWidth,
      height: tile.offsetHeight,
    },
  );
}

// How much of the runs going in `direction` has melted, 0 to 1, or 0 with none.
function share(direction: 1 | -1) {
  const pieces = [...runs.values()]
    .filter((run) => run.direction === direction)
    .flatMap((run) => run.pieces);
  if (!pieces.length) return 0;
  return pieces.reduce((sum, piece) => sum + piece.melt, 0) / pieces.length;
}

// Moves a run on by `step` seconds and draws it; whether it has finished. A
// box that hides mid-melt (an opening post drops its images) finishes where it
// last was; one hidden with nowhere known to melt from has nothing to draw.
function advance(melter: MediaMelter, run: Run, step: number, dpr: number) {
  const { box, direction, began } = run;
  const elapsed = seconds() - began;
  const end = direction > 0 ? 1 : 0;
  const isHidden = !box.offsetWidth;
  if (direction < 0) box.removeAttribute('data-whole');
  for (const piece of run.pieces) {
    const { picture, radii, rest } = piece;
    const canDraw = ready(picture) && !!rest;
    if (!rest && isHidden && direction < 0) piece.melt = end;
    else if (!canDraw && elapsed > LOAD_LIMIT_S) piece.melt = end;
    else if (canDraw && elapsed >= piece.wait)
      piece.melt = stepMelt(piece.melt, direction, step * piece.pace);
    // Going, it leaves the page at once, so the page's glide can't carry it
    // while it waits its turn.
    const isAtRest = direction > 0 && piece.melt === 1;
    piece.tile.toggleAttribute('data-rest', isAtRest);
    if (canDraw && piece.melt > 0 && !isAtRest)
      melter.draw(
        picture,
        rest,
        shownPart(rest, naturalSize(picture), 'cover'),
        radii,
        piece.melt,
        piece.seed,
        dpr,
      );
  }
  return run.pieces.every((piece) => piece.melt === end);
}

export default function MediaMelt() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches)
      return;
    const melter = MediaMelter.on(canvas);
    if (!melter) return;
    const root = document.documentElement;
    root.toggleAttribute('data-melts', true);
    let frame = 0;
    let last = 0;
    const step = () => {
      const now = seconds();
      const held = isHeld();
      const dpr = Math.min(devicePixelRatio, 2);
      for (const run of runs.values())
        for (const piece of run.pieces)
          if (run.box.offsetWidth && piece.tile.isConnected)
            piece.rest = restOf(run, piece);
      melter.begin(
        canvas.clientWidth,
        canvas.clientHeight,
        dpr,
        now,
        streakLine(
          [...runs.values()].flatMap((run) =>
            run.pieces.flatMap((piece) => piece.rest ?? []),
          ),
        ),
      );
      const leaving = share(-1);
      for (const run of runs.values()) {
        if (held) run.began = now;
        melter.drawTo(run.direction > 0);
        const isDone =
          !run.box.isConnected ||
          advance(melter, run, held ? 0 : now - last, dpr);
        if (!isDone) continue;
        runs.delete(run.box);
        if (run.direction > 0) run.box.toggleAttribute('data-whole', true);
      }
      const coming = share(1);
      melter.finish(stirOf(leaving, coming), coming, now, dpr);
      last = now;
      frame = runs.size ? requestAnimationFrame(step) : 0;
      canvas.hidden = !frame;
    };
    wake = () => {
      if (frame) return;
      canvas.hidden = false;
      last = seconds();
      frame = requestAnimationFrame(step);
    };
    const turn = (event: Event) => {
      const { to } = (event as CustomEvent<Turn>).detail;
      const boxes = document.querySelectorAll<HTMLElement>(
        '[data-post] .collage',
      );
      for (const box of boxes) {
        const post = box.closest('[data-post]')!;
        if (post === document.querySelectorAll('[data-post]')[to]) melt(box, 1);
        else melt(box, -1);
      }
    };
    addEventListener(TURN_EVENT, turn);
    return () => {
      removeEventListener(TURN_EVENT, turn);
      cancelAnimationFrame(frame);
      wake = null;
      runs.clear();
      root.toggleAttribute('data-melts', false);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      hidden
      className="pointer-events-none fixed inset-0 z-10 size-full"
    />
  );
}
