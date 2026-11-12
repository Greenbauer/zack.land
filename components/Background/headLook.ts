// Where the head looks, shared by the head (MyHead.tsx), the sky (Sky.tsx)
// and the 3D title (TitleName.tsx).
//
// A look target is in look units: the pointer's offset from where the head
// looks out from (lookOrigin across, halfway down the window), at
// LOOK_PER_PX look units to a CSS pixel. The head turns a thousandth of a
// radian for each look unit (lookToRadians), within its turning range.

export type Point = { x: number; y: number };

// Look units to a CSS pixel of the pointer's offset.
export const LOOK_PER_PX = 0.5;

// The look target for the pointer at `pointer`, looking out from `origin`
// (both CSS pixels).
export const lookAt = (pointer: Point, origin: Point): Point => ({
  x: (pointer.x - origin.x) * LOOK_PER_PX,
  y: (pointer.y - origin.y) * LOOK_PER_PX,
});

// Where on the screen (CSS pixels) a look target points, from `origin`.
export const lookOnScreen = (target: Point, origin: Point): Point => ({
  x: target.x / LOOK_PER_PX + origin.x,
  y: target.y / LOOK_PER_PX + origin.y,
});

// A look target's units as the head's turn, in radians, and back.
export const lookToRadians = (units: number) => units * 0.001;
export const radiansToLook = (radians: number) => radians * 1000;

// A gaze in radians (x tips, y turns) as a look target (x across, y down).
export const gazeTarget = (gaze: Point): Point => ({
  x: radiansToLook(gaze.y),
  y: radiansToLook(gaze.x),
});

// Where the head is heading this frame, as a look target, and how fast it
// eases there. The sky follows it too. Set by the head each frame.
export const heading = { target: { x: 0, y: 0 }, speed: 0.05 };

// The shoulders stay still, turned this far (radians) in toward the middle of
// the page; the head and neck do all the turning, so where the head looks is
// unchanged and the neck twists between it and the shoulders.
export const BODY_TURN = 0.25;

// The look (x tips, y turns, radians) split into the body's fixed turn and
// the head's turn on the neck relative to it.
export const splitLook = (look: Point) => ({
  body: { x: 0, y: BODY_TURN },
  head: { x: look.x, y: look.y - BODY_TURN },
});
