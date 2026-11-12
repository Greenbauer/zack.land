import { Euler } from 'three';
import { describe, expect, it, vi } from 'vitest';

// Sky's frame, run outside React: its hooks hold their first value, its
// effect runs at once, and useFrame hands over the frame it is given.
type Frame = (
  _state: {
    clock: { elapsedTime: number };
    scene: { backgroundRotation: Euler; environmentRotation: Euler };
    size: { width: number; height: number };
  },
  _delta: number,
) => void;
const frames: Frame[] = [];
vi.mock('react', async (original) => ({
  ...(await original<typeof import('react')>()),
  useRef: (value: unknown) => ({ current: value }),
  useEffect: (effect: () => void) => effect(),
}));
vi.mock('@react-three/fiber', () => ({
  useFrame: (frame: Frame) => frames.push(frame),
}));
const station = { home: { x: 0.2, y: -0.3 }, reach: { x: 0.1, y: 0.4 } };
vi.mock('./skyViews', () => ({
  currentView: () => '/',
  LIGHT_SKIES: [],
  stationFor: () => station,
  VIEW_BOUND: 'view-bound',
  viewBoundOff: () => {},
}));
vi.stubGlobal('addEventListener', () => {});
vi.stubGlobal('setInterval', () => 0);
vi.stubGlobal('dispatchEvent', () => {});
vi.stubGlobal('matchMedia', () => ({ matches: false }));
vi.stubGlobal('document', { documentElement: { toggleAttribute: () => {} } });

const { heading } = await import('./headLook');
const { default: Sky } = await import('./Sky');

describe('the sky on its first frames', () => {
  it('follows the head from its first frame, as on every frame after', () => {
    Sky();
    const scene = {
      backgroundRotation: new Euler(),
      environmentRotation: new Euler(),
    };
    const size = { width: 1200, height: 800 };
    const turns: number[] = [];
    // The head sets a new look target each frame, here the same one (it
    // faces the camera through the intro).
    for (let frame = 1; frame <= 3; frame++) {
      heading.target = { x: 0, y: 0 };
      frames[0]!({ clock: { elapsedTime: frame / 60 }, scene, size }, 1 / 60);
      turns.push(scene.backgroundRotation.y);
    }
    // That look is left of the sky's middle, so the sky turns left from its
    // home, a share each frame, from the first.
    const steps = turns.map((turn, k) => (k ? turns[k - 1]! : -0.3) - turn);
    expect(steps[0]).toBeGreaterThan(0);
    expect(steps[1]! / steps[0]!).toBeCloseTo(1 - heading.speed);
    expect(steps[2]! / steps[1]!).toBeCloseTo(1 - heading.speed);
  });
});
