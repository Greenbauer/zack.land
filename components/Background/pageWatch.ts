import { formFocused, menuOpen } from './focusBlur';
import { framedHead } from './headPlace';
import { faceSeen } from './idleGreeting';

// What the head (MyHead.tsx) reads from the page around it.

// How long the page has to be left alone (no pointer move, scroll, press or
// key: useMousePosition), with the face in view (faceInView), before the
// head greets and then looks around on its own, in seconds: somewhere in
// this range, picked afresh each time.
const IDLE_SECONDS = [10, 15] as const;
export const idleWait = () =>
  IDLE_SECONDS[0] + Math.random() * (IDLE_SECONDS[1] - IDLE_SECONDS[0]);

// Whether the face can be seen clearly (faceSeen): the page in front of the
// person, the face in the frame (headPlace.ts) and nothing blurring or
// covering it: a focused contact field or a playing video (focusBlur.ts),
// the open Portfolio dropdown, or the phone menu's pane.
export const faceInView = () =>
  faceSeen({
    visible: document.visibilityState === 'visible',
    headX: framedHead.x,
    covered:
      formFocused() ||
      menuOpen() ||
      !!document.querySelector('[data-nav-dropdown][aria-expanded="true"]'),
  });

// A tap on any of these is meant for the page, not the head.
export const PAGE_TARGETS =
  'a, button, input, textarea, select, label, section, header, footer, [data-glass]';
