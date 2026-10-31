'use client';

import { useEffect, useRef } from 'react';

import { shownPart } from './mediaBender';
import { MediaMelter, restingBox, stepMelt } from './mediaMelter';
import { Turn, TURN_EVENT } from './PageScroller/pageGlide';

// A post's image tiles melt in and out of the window's right side
// (mediaMelter.ts) on one canvas over the page, behind the cards. While a
// tile melts it is drawn here, at the place it rests, so it never moves with
// the page as the page glides; the tile itself waits hidden until it is whole
// (.collage[data-whole], styles/globals.css), and the canvas hides whenever
// nothing is melting, so it never lies over a tile at rest. A tile starts on
// its way out as a turn begins, not when its post leaves the window's middle:
// by then the page has moved it, and tiles coming in wait until every tile
// going out has gone. A video melts as its thumbnail, an animated GIF as its
// first frame. Where the melt can't run (data-melts unset on <html>: reduced
// motion, or no real GPU) the tiles slide instead.

// How long a tile waits for its picture before it just shows.
const LOAD_LIMIT_S = 3;

// YouTube's largest thumbnail every video has: 4:3, the video between black
// bars. Its middle is the video.
const thumbnailSrc = (id: string) =>
  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const THUMBNAIL_SHOWS: [number, number, number, number] = [0, 0.125, 1, 0.75];

type Piece = {
  tile: HTMLElement;
  picture: HTMLImageElement;
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
const thumbnails = new Map<string, HTMLImageElement>();
let wake: (() => void) | null = null;

function thumbnail(id: string) {
  let image = thumbnails.get(id);
  if (!image) {
    image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = thumbnailSrc(id);
    thumbnails.set(id, image);
  }
  return image;
}

const pictureOf = (tile: HTMLElement) =>
  tile.dataset.video
    ? thumbnail(tile.dataset.video)
    : tile.querySelector('img');

const seconds = () => performance.now() / 1000;
const waitOf = (tile: HTMLElement) =>
  parseFloat(tile.style.getPropertyValue('--wait')) || 0;

// Sends `box`'s tiles in (`direction` 1) or out (-1), after each tile's own
// --wait, from wherever they are.
export function melt(box: HTMLElement, direction: 1 | -1) {
  if (!wake) return;
  const run = runs.get(box);
  if (run) {
    if (run.direction === direction) return;
    run.direction = direction;
    run.began = seconds();
    for (const piece of run.pieces) piece.wait = waitOf(piece.tile);
    return;
  }
  if (box.hasAttribute('data-whole') === direction > 0) return;
  const tiles = box.querySelectorAll<HTMLElement>('.collage-tile');
  const pieces = [...tiles].flatMap((tile, k) => {
    const picture = pictureOf(tile);
    return picture
      ? [
          {
            tile,
            picture,
            melt: direction > 0 ? 0 : 1,
            wait: waitOf(tile),
            seed: k * 3.1 + box.offsetTop * 0.01,
          },
        ]
      : [];
  });
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

function drawPiece(
  melter: MediaMelter,
  { box }: Run,
  piece: Piece,
  dpr: number,
) {
  const post = box.closest('[data-post]');
  if (!post) return;
  const { tile, picture } = piece;
  const rest = restingBox(
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
  const shown = tile.dataset.video
    ? THUMBNAIL_SHOWS
    : shownPart(
        rest,
        { width: picture.naturalWidth, height: picture.naturalHeight },
        'cover',
      );
  melter.draw(picture, rest, shown, radiiOf(tile), piece.melt, piece.seed, dpr);
}

// Moves a run on by `step` seconds and draws it; whether it has finished.
function advance(melter: MediaMelter, run: Run, step: number, dpr: number) {
  const { box, direction, began } = run;
  const elapsed = seconds() - began;
  const end = direction > 0 ? 1 : 0;
  const isGone = !box.offsetWidth;
  if (direction < 0) box.removeAttribute('data-whole');
  for (const piece of run.pieces) {
    const isReady = piece.picture.complete && piece.picture.naturalWidth > 0;
    if (isGone || (!isReady && elapsed > LOAD_LIMIT_S)) piece.melt = end;
    else if (isReady && elapsed >= piece.wait)
      piece.melt = stepMelt(piece.melt, direction, step);
    if (isReady && piece.melt > 0 && !isGone)
      drawPiece(melter, run, piece, dpr);
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
      melter.begin(canvas.clientWidth, canvas.clientHeight, dpr);
      const isLeaving = [...runs.values()].some((run) => run.direction < 0);
      for (const run of runs.values()) {
        const waits = held || (isLeaving && run.direction > 0);
        if (waits) run.began = now;
        const isDone =
          !run.box.isConnected ||
          advance(melter, run, waits ? 0 : now - last, dpr);
        if (!isDone) continue;
        runs.delete(run.box);
        if (run.direction > 0) run.box.toggleAttribute('data-whole', true);
      }
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
