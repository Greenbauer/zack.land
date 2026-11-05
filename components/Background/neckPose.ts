// The neck's own shapes (scripts/head/bodyShapes.mjs), driven by how the head
// is turned (headTurn.ts, uHeadTurn): turning to one side, the far neck
// muscle stands out as a cord; nodding down, the soft tissue under the chin
// bunches; tipped back, the throat stretches and the nape folds. Without
// them the shader alone twisted and bent the neck as one stiff piece.

// The turn and nod (radians) at which each shape is at full strength: the
// shapes were built against renders turned 45 degrees and nodded 30. Past
// FULL_TURN the far turn's shapes take over, full at FAR_TURN, as far as the
// head turns (wander.ts TURN): the neck's share of it is 80 degrees, about as
// far as a neck turns, built against a photo of one turned that far.
export const FULL_TURN = 0.79;
export const FAR_TURN = 1.55;
export const FULL_NOD = 0.52;

const share = (angle: number, full: number) =>
  Math.min(Math.max(angle / full, 0), 1);

// `x` the nod (positive tips the head down), `y` the turn (positive toward
// the head's own left).
export const neckExpressions = ({ x, y }: { x: number; y: number }) => ({
  neckTurnLeft: share(y, FULL_TURN),
  neckTurnRight: share(-y, FULL_TURN),
  neckTurnLeftFar: share(y - FULL_TURN, FAR_TURN - FULL_TURN),
  neckTurnRightFar: share(-y - FULL_TURN, FAR_TURN - FULL_TURN),
  neckDown: share(x, FULL_NOD),
  neckUp: share(-x, FULL_NOD),
});
