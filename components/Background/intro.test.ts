import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AWAY_HEIGHTS, headCentre } from './headPlace';
import {
  CAMERA_HOME,
  COVERED_PAGE_IN,
  endIntro,
  IN_MOUTH,
  intro,
  INTRO_SECONDS,
  INTRO_TIP,
  introCamera,
  introFace,
  introHolds,
  introPlaces,
  introTip,
  MOUTH_SHUT,
  onFacingHead,
  PAGE_IN_SECONDS,
  pulledOut,
  RELEASE_SECONDS,
  SMILE_IN,
  startIntro,
  stepIntro,
  SURPRISED,
  TIP_BACK,
} from './intro';
import { BODY_TURN, HEAD_LIFT } from './MyHead';

const mouthAt = (tip: number) =>
  onFacingHead(IN_MOUTH, BODY_TURN, HEAD_LIFT, tip);
const mouth = mouthAt(INTRO_TIP);
const flying = { phase: 'flying', since: 0 } as const;

describe('onFacingHead', () => {
  it('only raises a point while nothing is turned', () => {
    expect(onFacingHead([3, -40, 30], 0, HEAD_LIFT)).toEqual([3, -35, 30]);
  });

  it('turns the head back on its neck as far as the body turns, so it faces the camera', () => {
    const level = onFacingHead(IN_MOUTH, BODY_TURN, HEAD_LIFT);
    const lips = onFacingHead([0, -44, 42], BODY_TURN, HEAD_LIFT);
    // A line straight out of the mouth stays straight along the camera's
    // view: the same across and up, only nearer.
    expect(lips[0]).toBeCloseTo(level[0], 6);
    expect(lips[1]).toBeCloseTo(level[1], 6);
    expect(lips[2] - level[2]).toBeCloseTo(6, 6);
  });

  it('tipped up, turns the open mouth to face the camera flat', () => {
    // The gasp's lips on the midline (head.bin units): the opening faces
    // about 30 degrees down when level.
    const upper = [0, -36.2, 42.7] as const;
    const lower = [0, -52.4, 33.1] as const;
    const facing = (tip: number) => {
      const [u, l] = [upper, lower].map((p) =>
        onFacingHead(p, BODY_TURN, HEAD_LIFT, tip),
      );
      return Math.atan2(u![2] - l![2], u![1] - l![1]);
    };
    expect(Math.abs(facing(0))).toBeGreaterThan(0.45);
    expect(Math.abs(facing(INTRO_TIP))).toBeLessThan(0.1);
  });

  it('levels the head out as the camera comes to rest', () => {
    expect(introTip({ phase: 'loading' }, 0)).toBe(INTRO_TIP);
    expect(introTip(flying, TIP_BACK[0])).toBe(INTRO_TIP);
    expect(TIP_BACK[1]).toBeLessThanOrEqual(INTRO_SECONDS);
    expect(introTip(flying, TIP_BACK[1])).toBeCloseTo(0, 9);
  });
});

describe('pulledOut', () => {
  const length = 214;

  it('goes from the mouth to the camera’s place, only ever outward', () => {
    expect(pulledOut(0, length)).toBe(0);
    expect(pulledOut(INTRO_SECONDS, length)).toBeCloseTo(1, 9);
    const shares = Array.from({ length: 29 }, (_, k) =>
      pulledOut((k / 28) * INTRO_SECONDS, length),
    );
    expect(shares.every((s, k) => k === 0 || s > shares[k - 1]!)).toBe(true);
  });

  it('stays still before it starts and after it ends', () => {
    expect(pulledOut(-1, length)).toBe(0);
    expect(pulledOut(INTRO_SECONDS + 5, length)).toBeCloseTo(1, 9);
  });
});

describe('introCamera', () => {
  it('waits in the mouth while loading and rests at its place once done', () => {
    expect(introCamera({ phase: 'loading' }, 99, mouthAt)).toEqual({
      position: [...mouth],
      share: 0,
    });
    const done = introCamera({ phase: 'done' }, 0, mouthAt);
    expect(done.share).toBeCloseTo(1, 9);
    // And rests there while the head smiles, before the intro ends.
    expect(
      introCamera(flying, RELEASE_SECONDS - 0.5, mouthAt).share,
    ).toBeCloseTo(1, 9);
    done.position.forEach((v, k) => expect(v).toBeCloseTo(CAMERA_HOME[k]!, 6));
  });

  it('creeps out through the lips, slower at the start than the end', () => {
    const at = (seconds: number) => introCamera(flying, seconds, mouthAt).share;
    // The same time at either end: the first covers far less of the way.
    expect(at(0.8)).toBeLessThan(1 - at(INTRO_SECONDS - 0.8));
    expect(at(1)).toBeLessThan(0.01);
  });

  it('is past the lips before the mouth starts to close', () => {
    // The upper lip of the open mouth, in head.bin units (z 42.7).
    const lips = onFacingHead([0, -36, 42.7], BODY_TURN, HEAD_LIFT, INTRO_TIP);
    const { position } = introCamera(flying, MOUTH_SHUT[0], mouthAt);
    expect(position[2]!).toBeGreaterThan(lips[2]);
  });
});

describe('introFace and introHolds', () => {
  it('holds the head facing the camera, surprised, while loading', () => {
    expect(introFace({ phase: 'loading' }, 0)).toEqual({
      ...SURPRISED,
      smile: 0,
    });
    expect(introHolds({ phase: 'loading' }, 0)).toBe(true);
  });

  it('lets go of the surprise once the camera is out, then smiles before letting the head go', () => {
    expect(introFace(flying, MOUTH_SHUT[0])).toEqual({
      ...SURPRISED,
      smile: 0,
    });
    const half = introFace(flying, (MOUTH_SHUT[0] + MOUTH_SHUT[1]) / 2);
    expect(half.gasp).toBeCloseTo(0.5, 9);
    expect(half.browsUp).toBeCloseTo(0.5, 9);
    expect(introFace(flying, MOUTH_SHUT[1]).gasp).toBe(0);
    // Smiling whole by the time the camera rests, and held facing it.
    expect(SMILE_IN[1]).toBeLessThanOrEqual(INTRO_SECONDS);
    expect(introFace(flying, INTRO_SECONDS)).toMatchObject({
      gasp: 0,
      browsUp: 0,
      smile: 1,
    });
    expect(introHolds(flying, RELEASE_SECONDS - 0.01)).toBe(true);
    expect(introHolds(flying, RELEASE_SECONDS)).toBe(false);
    expect(introHolds({ phase: 'done' }, 0)).toBe(false);
  });

  it('keeps the whole face in view, mouth open, before letting go', () => {
    // A head's height back from the face (about 90 units): the whole face in
    // the frame.
    const { position } = introCamera(flying, MOUTH_SHUT[0], mouthAt);
    const now = mouthAt(introTip(flying, MOUTH_SHUT[0]));
    expect(position[2]! - now[2]).toBeGreaterThan(90);
  });
});

describe('introPlaces', () => {
  const card = { left: 54, card: true, above: false, offView: false };
  const centre =
    (width: number, height: number) => (covered: boolean, freeRight?: number) =>
      headCentre(width, height, freeRight, covered);

  it('sends the head off once it has smiled where the card in view will cover it', () => {
    expect(introPlaces([{ ...card, left: -240 }], centre(390, 844))).toEqual({
      open: 195,
      resting: -AWAY_HEIGHTS * 844,
      covered: true,
    });
  });

  it('keeps it where it comes out to when the card in view sits above it, whatever the posts out of view would do', () => {
    // A tall window's post whose card sits over the head's crown, the next
    // posts' cards (hidden, below) beside it.
    const offView = { ...card, offView: true };
    expect(
      introPlaces(
        [{ ...card, above: true, card: false }, offView, offView],
        centre(1146, 1260),
      ),
    ).toEqual({ open: 573, resting: 573, covered: false });
  });

  it('brings it out beside a card that leaves it room, where it then stays', () => {
    const places = introPlaces([{ ...card, left: 552 }], centre(1440, 900));
    expect(places).toEqual({ open: 276, resting: 276, covered: false });
  });
});

describe('startIntro, stepIntro and endIntro', () => {
  let marks: Map<string, string>;
  beforeEach(() => {
    marks = new Map();
    intro.state = { phase: 'loading' };
    intro.covered = false;
    vi.stubGlobal('document', {
      documentElement: {
        setAttribute: (name: string, value: string) => marks.set(name, value),
      },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('fades the dark screen and flies, moving the page in part way out', () => {
    startIntro(0, true);
    // "fly": the dark screen waits a little longer as the camera comes out.
    expect(marks).toEqual(new Map([['data-intro', 'fly']]));
    expect(intro.state).toEqual({ phase: 'flying', since: 0 });
    stepIntro(PAGE_IN_SECONDS - 0.01);
    expect(marks.has('data-page-in')).toBe(false);
    stepIntro(PAGE_IN_SECONDS);
    expect(marks.has('data-page-in')).toBe(true);
    stepIntro(RELEASE_SECONDS - 0.01);
    expect(intro.state.phase).toBe('flying');
    stepIntro(RELEASE_SECONDS);
    expect(intro.state).toEqual({ phase: 'done' });
  });

  it('where a card covers the head, moves the page in only once the head has smiled and glided off', () => {
    intro.covered = true;
    startIntro(0, true);
    stepIntro(PAGE_IN_SECONDS);
    stepIntro(RELEASE_SECONDS);
    expect(marks.has('data-page-in')).toBe(false);
    expect(introHolds(intro.state, RELEASE_SECONDS)).toBe(false);
    stepIntro(COVERED_PAGE_IN);
    expect(marks.has('data-page-in')).toBe(true);
    expect(intro.state).toEqual({ phase: 'done' });
  });

  it('only fades the dark screen without motion, and moves the page in', () => {
    startIntro(0, false);
    expect([...marks.keys()]).toEqual(['data-intro', 'data-page-in']);
    expect(marks.get('data-intro')).toBe('');
    expect(intro.state).toEqual({ phase: 'done' });
  });

  it('lifts the dark screen when the scene never draws, and starts no flight after', () => {
    endIntro();
    expect([...marks.keys()]).toEqual(['data-intro', 'data-page-in']);
    startIntro(0, true);
    expect(intro.state).toEqual({ phase: 'done' });
  });

  it('leaves a flight under way to finish', () => {
    startIntro(0, true);
    endIntro();
    expect(intro.state).toEqual({ phase: 'flying', since: 0 });
  });
});
