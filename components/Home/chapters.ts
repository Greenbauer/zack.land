import miscellaneous from '@/app/(root)/portfolio/miscellaneous/Contents';
import webApps from '@/app/(root)/portfolio/web-apps/Contents';
import type { Beat, StoryProp } from '@/components/Background/storyCue';
import { FLIES, THROWS } from '@/components/Background/tortillaFlight';
import { Content } from '@/types';

import {
  FREELANCE,
  GULP,
  IMPROV,
  PIPE_ENGINEER,
  TEXAS_TECH,
  TODAY,
  USAA,
  WHATS_NEXT,
} from './storyPosts';

// The home page's story: Zack's way from mechanical engineering to software
// and AI agents, one chapter per page turn (Story.tsx). Each chapter is a
// post, shown exactly as the portfolio shows its posts (components/Post.tsx):
// the portfolio's own where it has one, else one of storyPosts.tsx. While it
// shows, the 3D head plays its beats (a face, and for a moment a look at the
// card, the camera or up) and any prop it brings (components/Background/
// storyCue.ts), using only the expressions the page loads (checked by
// chapters.test.ts).

export type Chapter = {
  id: string;
  content: Content;
  beats: Beat[];
  prop?: StoryProp;
  // How long Watch stays on it, to read its card (watch.ts).
  seconds: number;
};

const [thisWebsite, bannerEyewear, tripPlanner] = webApps;
const [smartBed, loungeChair, sortingRobot, shofarMount] = miscellaneous;

// Texas Tech's tortillas: it winces as each hits it, then laughs it off.
const FLINCHES: Beat[] = THROWS.slice(0, 12).flatMap(({ at }): Beat[] => [
  {
    at: at + FLIES,
    face: { squint: 1, press: 0.8, browDown: 0.7 },
    look: 'card',
  },
  { at: at + FLIES + 0.9, face: { smile: 0.8, squint: 0.3 }, look: 'card' },
]);

export const CHAPTERS: Chapter[] = [
  {
    id: 'texas-tech',
    content: TEXAS_TECH,
    prop: 'tortillas',
    seconds: 11,
    beats: [
      { at: 0, face: { smile: 0.4, browsUp: 0.2 }, look: 'card' },
      // The cap lands.
      { at: 0.2, face: { browsUp: 0.9, smile: 0.3 }, look: 'up' },
      { at: 1.4, face: { smile: 0.9, browsUp: 0.3 }, look: 'camera' },
      { at: 4, face: { smile: 0.7, squint: 0.3 }, look: 'card' },
      ...FLINCHES,
    ],
  },
  {
    id: 'pipe-engineer',
    content: PIPE_ENGINEER,
    seconds: 10,
    beats: [
      { at: 0, face: { browDown: 0.4, press: 0.3 }, look: 'card' },
      { at: 3.5, face: { browsUp: 0.9, smile: 0.3 } },
      { at: 5, face: { smile: 0.85, browsUp: 0.3 }, look: 'camera' },
    ],
  },
  {
    id: 'banner-eyewear',
    content: bannerEyewear!,
    prop: 'sunglasses',
    seconds: 12,
    beats: [
      { at: 0, face: { smile: 0.4 }, look: 'card' },
      { at: 0.6, face: { smile: 0.9, browsUpRight: 0.8 }, look: 'camera' },
      { at: 6, face: { smile: 0.6, browInnerUp: 0.3 } },
    ],
  },
  {
    id: 'freelance',
    content: FREELANCE,
    seconds: 9,
    beats: [
      { at: 0, face: { smile: 0.5 }, look: 'card' },
      { at: 3, face: { smile: 0.8, browsUp: 0.5 }, look: 'camera' },
    ],
  },
  {
    id: 'smart-bed',
    content: smartBed!,
    // A sleep mask slides down over its eyes, and it shuts them under it and
    // smiles, settling in to sleep.
    prop: 'sleepmask',
    seconds: 12,
    beats: [
      { at: 0, face: { smile: 0.3 }, look: 'card' },
      { at: 0.4, face: { blink: 1, smile: 0.4 } },
      { at: 5, face: { blink: 1, smile: 0.6 } },
    ],
  },
  {
    id: 'lounge-chair',
    content: loungeChair!,
    seconds: 9,
    beats: [
      { at: 0, face: { smile: 0.5 }, look: 'card' },
      { at: 4, face: { smile: 0.8, squint: 0.3 }, look: 'camera' },
    ],
  },
  {
    id: 'sorting-robot',
    content: sortingRobot!,
    seconds: 12,
    beats: [
      { at: 0, face: { browsUp: 0.5, smile: 0.3 }, look: 'card' },
      { at: 4, face: { smile: 0.6 } },
    ],
  },
  {
    id: 'shofar-mount',
    content: shofarMount!,
    seconds: 9,
    beats: [
      { at: 0, face: { smile: 0.3 }, look: 'card' },
      { at: 3.5, face: { pout: 1, cheekPuff: 1, browsUp: 0.6 } },
      { at: 5, face: { frown: 0.6, browDown: 0.3 }, look: 'camera' },
    ],
  },
  {
    id: 'usaa',
    content: USAA,
    seconds: 11,
    beats: [
      { at: 0, face: { press: 0.3 }, look: 'card' },
      { at: 4, face: { smile: 0.8, browsUp: 0.4 }, look: 'camera' },
    ],
  },
  {
    // The trip-planning startup: the portfolio's post.
    id: 'travel-startup',
    content: tripPlanner!,
    prop: 'plane',
    seconds: 10,
    beats: [
      { at: 0, face: { smile: 0.5 }, look: 'card' },
      { at: 2, face: { smile: 0.9, browsUp: 0.5 } },
    ],
  },
  {
    id: 'gulp',
    content: GULP,
    seconds: 10,
    beats: [
      { at: 0, face: { smile: 0.4 }, look: 'card' },
      { at: 4, face: { browsUp: 0.9, cheekPuff: 0.3 }, look: 'camera' },
      { at: 4.5, face: { browsUp: 0.9, swallow: 1 } },
      { at: 5.5, face: { smile: 0.7 } },
    ],
  },
  {
    // Today's AI agent work, and the tool he built for it (its picture,
    // Vibe Verifier's run on this site).
    id: 'today',
    content: TODAY,
    seconds: 12,
    beats: [
      { at: 0, face: { smile: 0.4 }, look: 'card' },
      {
        at: 4,
        face: { squint: 0.5, browsUpLeft: 0.6, browDown: 0.2 },
        look: 'card',
      },
      { at: 7, face: { smile: 0.9, browsUp: 0.4 }, look: 'camera' },
    ],
  },
  {
    id: 'improv',
    content: IMPROV,
    seconds: 9,
    beats: [
      { at: 0, face: { smile: 0.6 }, look: 'card' },
      { at: 3, face: { gasp: 0.6, browsUp: 1 }, look: 'camera' },
      { at: 3.5, face: { pout: 0.9, browsUp: 0.5 } },
      { at: 4, face: { frown: 0.5, browDown: 0.5 } },
      { at: 4.5, face: { smile: 0.4, browsUpRight: 0.9 } },
      { at: 5, face: { smile: 1, browsUp: 0.3 } },
    ],
  },
  {
    id: 'this-website',
    content: thisWebsite!,
    prop: 'wireframe',
    seconds: 10,
    beats: [
      { at: 0, face: { browsUp: 0.3 }, look: 'card' },
      { at: 0.4, face: { gasp: 0.7, browsUp: 1 }, look: 'camera' },
      { at: 3, face: { smile: 1 } },
      // "I built this head too": a wink.
      { at: 5, face: { smile: 0.9, blinkLeft: 1 }, look: 'camera' },
      { at: 5.5, face: { smile: 0.9 } },
    ],
  },
  {
    id: 'whats-next',
    content: WHATS_NEXT,
    prop: 'phone',
    seconds: 8,
    beats: [
      // The head slides off and the phone slides in to call (PhoneCall.tsx).
      { at: 0, face: { smile: 0.6 }, look: 'card' },
    ],
  },
];
