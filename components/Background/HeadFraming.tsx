'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { PerspectiveCamera } from 'three';

import { menuOpen } from './focusBlur';
import { BODY_TURN } from './headLook';
import { framedHead, HEAD_LIFT, headCentre, stepHead } from './headPlace';
import {
  IN_MOUTH,
  intro,
  introCamera,
  introHolds,
  introPlaces,
  onFacingHead,
} from './intro';
import {
  headLeft,
  headSeen,
  Seen,
  turnsOnLeaving,
  viewOnScreen,
} from './skyViews';

// How often the page is measured for the head's place, in milliseconds: soon
// enough after a change of page that the head sets off with it.
const MEASURE_MS = 100;

// Moves the camera so the head's middle sits where headCentre says, gliding
// there (glide, a damped spring) when the page or the window changes, and on
// a phone off the screen and back as a card (data-head-avoid="card") comes
// and goes. The page is measured ten times a
// second, not every frame: the left edge of whatever marked data-head-avoid
// is showing, where it rests. While none shows (a post's card between fades),
// the head stays where it is. On the page's first load the camera starts in
// the head's mouth and comes out to its place, the head's place on the page
// coming in with it (intro.ts): the place it would have with no card over it
// (`open`), beside what the page will show, until it has smiled; then, where
// a card does cover it, it glides off from there before the card comes in
// (intro.covered), and otherwise stays. Each time it goes off the window on the view it was in,
// the sky turns as for a new view. Renders nothing.
export default function HeadFraming() {
  const target = useRef<number | null>(null);
  const open = useRef<number | null>(null);
  // Where it goes once the page's cards show, measured where they rest
  // before they do (a post's card waits unseen until the page moves in).
  const resting = useRef<number | null>(null);
  // Whether the head has taken its first place on the page (stepHead): until
  // the scene is ready and that place is known, it takes it at once.
  const placed = useRef(false);
  // The head's place last frame, and the view it is in the window on, since
  // when (skyViews.ts headSeen).
  const last = useRef<number | null>(null);
  const seen = useRef<Seen>(null);
  // Where the camera comes from on the page's first load: the open mouth,
  // as far as the head is tipped up.
  const mouthAt = (tip: number) =>
    onFacingHead(IN_MOUTH, BODY_TURN, HEAD_LIFT, tip);

  useEffect(() => {
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    const measure = () => {
      // While the phone menu is open its pane covers the page (whose cards
      // hide), so the head comes back behind it: the pane's lenses then
      // have the head to show, on every page, as on the home page.
      const menu = menuOpen();
      // The view the head is in the window on, once it has taken that
      // view's own place in the window (`placed`: the intro's, or one
      // measured from the view's cards), for the sky's turn as it leaves
      // (skyViews.ts).
      const see = (placed: boolean) => {
        if (last.current !== null)
          seen.current = headSeen(
            seen.current,
            viewOnScreen(),
            performance.now(),
            last.current >= 0,
            menu,
            placed,
          );
      };
      const avoid = [
        ...document.querySelectorAll<HTMLElement>('[data-head-avoid]'),
      ];
      const rests = avoid
        .map((el) => {
          // Where it rests: less any slide it is part way through (a card
          // arriving slides in from the left, CSS translate).
          const box = el.getBoundingClientRect();
          const slide = parseFloat(getComputedStyle(el).translate) || 0;
          return {
            top: box.top,
            bottom: box.bottom,
            left: box.left - slide,
            card: el.dataset.headAvoid === 'card',
            above: el.dataset.headAvoid === 'above',
            offView: el.hasAttribute('data-off-view'),
            shown: el.checkVisibility({ visibilityProperty: true }),
          };
        })
        .filter((box) => box.bottom > 0 && box.top < innerHeight);
      const shown = rests.filter((box) => box.shown);
      // A card above the head (data-head-avoid="above", EdgeCard) leaves it
      // centred under it.
      const beside = menu ? [] : shown.filter((box) => !box.above);
      // The content's frame (app/(root)/layout.tsx), or the whole window.
      const frame = document
        .querySelector('[data-frame]')
        ?.getBoundingClientRect() ?? { left: 0, right: innerWidth };
      const place = (covered: boolean) =>
        headCentre(
          innerWidth,
          innerHeight,
          beside.length
            ? Math.min(...beside.map((box) => box.left))
            : undefined,
          covered,
          { left: frame.left, right: frame.right },
        );
      // Where the head comes out to and then rests, from what will show
      // beside it, shown yet or not (a post's card waits unseen until the
      // page moves in), and whether a card will cover it there.
      const aimed = introPlaces(menu ? [] : rests, (covered, freeRight) =>
        headCentre(innerWidth, innerHeight, freeRight, covered, {
          left: frame.left,
          right: frame.right,
        }),
      );
      open.current = aimed.open;
      resting.current = aimed.resting;
      intro.covered = aimed.covered;
      if (!menu && avoid.length && !shown.length) {
        see(intro.state.phase === 'flying');
        return;
      }
      target.current = place(beside.some((box) => box.card));
      // A place off the window (a card arriving over the head) starts no
      // count: the head is on its way off, a frame later, or seconds on a
      // starved runner. On the first load it is at the intro's place until
      // it has smiled.
      see(!menu && (target.current >= 0 || intro.state.phase === 'flying'));
      if (still.matches)
        Object.assign(framedHead, { x: target.current, speed: 0 });
    };
    measure();
    const timer = setInterval(measure, MEASURE_MS);
    return () => clearInterval(timer);
  }, []);

  useFrame(({ camera, clock, size }, delta) => {
    const known = introHolds(intro.state, clock.elapsedTime)
      ? open.current
      : (target.current ?? (intro.covered ? resting.current : null));
    const goal = known ?? size.width / 2;
    const ready = document.documentElement.hasAttribute('data-scene-ready');
    Object.assign(
      framedHead,
      stepHead(framedHead, goal, delta, ready && placed.current),
    );
    if (ready && known !== null) placed.current = true;
    // Off the window (headCentre's place for a covered head is left of it)
    // where it was in it on this view long enough: the sky turns.
    if (
      known !== null &&
      known < 0 &&
      last.current !== null &&
      last.current >= 0 &&
      turnsOnLeaving(seen.current, viewOnScreen(), performance.now())
    )
      headLeft();
    last.current = known;
    const { width, height } = size;
    const { position, share } = introCamera(
      intro.state,
      clock.elapsedTime,
      mouthAt,
    );
    // Its matrix too, which the 3D titles cast their rays from this frame
    // (titleLetters.tsx onPlane), not just at the render.
    camera.position.set(position[0]!, position[1]!, position[2]!);
    camera.updateMatrixWorld();
    (camera as PerspectiveCamera).setViewOffset(
      width,
      height,
      (width / 2 - framedHead.x) * share,
      0,
      width,
      height,
    );
  });

  return null;
}
