// Anything a visitor does that counts as moving: the pointer, the wheel, a
// key, a touch, or a scroll anywhere on the page.
const MOVES = [
  'pointermove',
  'pointerdown',
  'wheel',
  'keydown',
  'touchstart',
  'scroll',
];

// Calls `onIdle(true)` once nothing has moved on `target` for `ms`
// milliseconds, and `onIdle(false)` at the next move, then waits again.
// Returns a function that stops watching.
export function watchIdle(
  target: EventTarget,
  ms: number,
  onIdle: (_isIdle: boolean) => void,
) {
  let timer: ReturnType<typeof setTimeout>;
  let isIdle = false;
  const wait = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      isIdle = true;
      onIdle(true);
    }, ms);
  };
  const moved = () => {
    if (isIdle) {
      isIdle = false;
      onIdle(false);
    }
    wait();
  };
  for (const type of MOVES)
    target.addEventListener(type, moved, { capture: true, passive: true });
  wait();
  return () => {
    clearTimeout(timer);
    for (const type of MOVES)
      target.removeEventListener(type, moved, { capture: true });
  };
}
