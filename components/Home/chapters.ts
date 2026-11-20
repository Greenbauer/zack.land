import type { Beat } from '@/components/Background/storyCue';

// The home page's story: Zack's way from mechanical engineering to software
// and AI agents, told by the 3D head in his voice, one chapter per page turn
// (Story.tsx). Each chapter's lines show one at a time over the head
// (Bubble.tsx), LINE_SECONDS apart; its card names it (ChapterCard.tsx); its
// beats are what the head does meanwhile (components/Background/storyCue.ts),
// using only the expressions the page loads (shownExpressions.ts, checked by
// chapters.test.ts).
//
// The facts come from Zack's resume and his LinkedIn profile. His current
// employer is not named, and nothing here gives numbers from that job.

export type Chapter = {
  id: string;
  // The part of the story it belongs to, over its title.
  part: string;
  title: string;
  // A short line under the title: where, what, when.
  detail?: string;
  lines: string[];
  photo?: { src: string; alt: string };
  // The chapter's one action, on its card.
  link?: { href: string; label: string };
  beats: Beat[];
};

// Seconds between one line and the next.
export const LINE_SECONDS = 2.8;

// How long Watch stays on a chapter: long enough to read every line, and a
// little more for the last.
export const dwellSeconds = (chapter: Pick<Chapter, 'lines'>) =>
  chapter.lines.length * LINE_SECONDS + 1.8;

// Which of a chapter's lines shows `into` seconds after its lines start:
// one at a time, LINE_SECONDS apart, the last staying; none before the
// first (Bubble.tsx).
export const shownLine = (into: number, count: number) =>
  into < 0 ? -1 : Math.min(count - 1, Math.floor(into / LINE_SECONDS));

// The beat at the second line, and so on.
const line = (n: number) => n * LINE_SECONDS;

export const CHAPTERS: Chapter[] = [
  {
    id: 'texas-tech',
    part: 'Where I started',
    title: 'Texas Tech',
    detail: 'B.S. Mechanical Engineering, 2007 to 2011',
    lines: [
      'I studied mechanical engineering. My senior project: a pulse jet engine.',
      'For a model plane. The engine was very loud.',
    ],
    beats: [
      { at: 0, face: { smile: 0.4, browsUp: 0.2 }, look: 'card' },
      { at: line(1) - 0.2, face: { squint: 1, browDown: 0.7, frown: 0.4 } },
      { at: line(1) + 0.5, face: { gasp: 0.6, browsUp: 1 }, look: 'camera' },
      { at: line(1) + 1.6, face: { smile: 0.8 } },
    ],
  },
  {
    id: 'pipes',
    part: 'Where I started',
    title: 'Pipe engineer',
    detail: 'Stress analysis in Houston, 2013 to 2017',
    lines: [
      'Then I checked that big industrial pipes could take the heat and pressure.',
      'I kept finding bugs in our engineering software. I liked the bugs more.',
    ],
    beats: [
      { at: 0, face: { browDown: 0.4, press: 0.3 }, look: 'card' },
      { at: line(1), face: { browsUp: 0.9, smile: 0.3 } },
      {
        at: line(1) + 1.4,
        face: { smile: 0.85, browsUp: 0.3 },
        look: 'camera',
      },
    ],
  },
  {
    id: 'banner-eyewear',
    part: 'The switch',
    title: 'Banner Eyewear',
    detail: 'Sunglasses you design online, then 3D print',
    lines: [
      'My first coding project: sunglasses you design online, then 3D print.',
      'Shapeways, a big 3D-printing company, featured the sunglasses.',
      "That's when I decided to switch to software.",
    ],
    photo: {
      src: '/web-apps/glasses-computer.jpg',
      alt: 'A hand holding Banner sunglasses in front of the designer on a laptop',
    },
    link: { href: 'https://banner-eyewear.zack.land', label: 'Design a pair' },
    beats: [
      { at: 0, face: { smile: 0.4 }, look: 'card' },
      { at: line(1), face: { smile: 0.9, browsUpRight: 0.8 } },
      { at: line(2), face: { smile: 0.5, browInnerUp: 0.3 }, look: 'camera' },
    ],
  },
  {
    id: 'freelance',
    part: 'The switch',
    title: 'Freelance web developer',
    detail: 'Online shops for clients, 2015 to 2018',
    lines: [
      'So I built online shops for clients on the side.',
      'Together they sold $250K+ a year.',
    ],
    beats: [
      { at: 0, face: { smile: 0.5 }, look: 'card' },
      { at: line(1), face: { smile: 0.8, browsUp: 0.5 }, look: 'camera' },
    ],
  },
  {
    id: 'smart-bed',
    part: 'Things I built',
    title: 'Smart Bed',
    detail: 'Plywood and walnut, with weight sensors and lights',
    lines: [
      'I built my own bed.',
      'Sensors in it tell which side you sleep on.',
    ],
    photo: { src: '/miscellaneous/bed-1.jpg', alt: 'The smart bed' },
    beats: [
      { at: 0, face: { smile: 0.3 }, look: 'card' },
      { at: line(1), face: { blink: 0.6, smile: 0.3 } },
    ],
  },
  {
    id: 'lounge-chair',
    part: 'Things I built',
    title: 'Parametric Lounge Chair',
    detail: 'Designed with math, cut from plywood',
    lines: [
      'A flat-pack chair, shaped with math to be comfy.',
      "I'd sit in it, but I'm just a head.",
    ],
    photo: {
      src: '/miscellaneous/parametric-chair-1.jpg',
      alt: 'The parametric lounge chair',
    },
    beats: [
      { at: 0, face: { smile: 0.5 }, look: 'card' },
      { at: line(1), face: { smile: 0.8, squint: 0.3 }, look: 'camera' },
    ],
  },
  {
    id: 'sorting-robot',
    part: 'Things I built',
    title: 'Buoyancy Sorting Robot',
    detail: 'Built for a client, Perf Sealers',
    lines: [
      'A robot that sorts balls by whether they float, sink or neither.',
      'It weighs one ball about every 3 seconds.',
    ],
    photo: {
      src: '/miscellaneous/ballSortB.jpg',
      alt: 'The buoyancy sorting robot',
    },
    beats: [
      { at: 0, face: { browsUp: 0.5, smile: 0.3 }, look: 'card' },
      { at: line(1), face: { smile: 0.6 } },
    ],
  },
  {
    id: 'shofar-mount',
    part: 'Things I built',
    title: 'Shofar Mount',
    detail: 'Laser-cut acrylic',
    lines: [
      "A wall mount for a shofar, a ram's-horn trumpet.",
      'I tried to blow it. No lungs.',
    ],
    photo: {
      src: '/miscellaneous/shofarA.jpg',
      alt: 'The shofar on its mount',
    },
    beats: [
      { at: 0, face: { smile: 0.3 }, look: 'card' },
      { at: line(1) - 0.4, face: { pout: 1, cheekPuff: 1, browsUp: 0.6 } },
      {
        at: line(1) + 0.9,
        face: { frown: 0.6, browDown: 0.3 },
        look: 'camera',
      },
    ],
  },
  {
    id: 'usaa',
    part: 'A big company',
    title: 'USAA',
    detail: 'Financial services. Engineer, then senior, 2018 to 2022',
    lines: [
      'At USAA I built personal-loan apps and coached five engineers.',
      'And a tool for managing software releases that saved thousands of hours.',
    ],
    beats: [
      { at: 0, face: { press: 0.3 }, look: 'card' },
      { at: line(1), face: { smile: 0.8, browsUp: 0.4 }, look: 'camera' },
    ],
  },
  {
    id: 'travel-startup',
    part: 'Startups',
    title: 'A travel startup',
    detail: 'A trip planner for families and friends, 2022 to 2024',
    lines: [
      'Then startups. At a trip-planning startup, I was one of the first engineers.',
      'They sent me to Spain for its launch at an industry event.',
    ],
    beats: [
      { at: 0, face: { smile: 0.5 }, look: 'card' },
      { at: line(1), face: { smile: 0.9, browsUp: 0.5 }, look: 'up' },
    ],
  },
  {
    id: 'gulp',
    part: 'Startups',
    title: 'Gulp',
    detail: 'Personalized vitamins. One of the first engineers, 2023 to 2024',
    lines: [
      'At Gulp, I helped launch personalized vitamins.',
      '2,000 people signed up in three months.',
      'Gulp.',
    ],
    beats: [
      { at: 0, face: { smile: 0.4 }, look: 'card' },
      { at: line(1), face: { browsUp: 0.9, smile: 0.5 }, look: 'camera' },
      { at: line(2) - 0.3, face: { browsUp: 0.9, cheekPuff: 0.3 } },
      { at: line(2) + 0.2, face: { browsUp: 0.9, swallow: 1 } },
      { at: line(2) + 1.2, face: { smile: 0.7 } },
    ],
  },
  {
    id: 'today',
    part: 'Now',
    title: 'Leading AI coding work',
    detail: 'At a distribution company, 2024 to now',
    lines: [
      'Today I lead AI agent work at a distribution company.',
      'I direct AI agents: programs that write much of our code.',
    ],
    beats: [
      { at: 0, face: { smile: 0.4 }, look: 'card' },
      { at: line(1), face: { smile: 0.6, browsUp: 0.3 }, look: 'camera' },
    ],
  },
  {
    id: 'vibe-verifier',
    part: 'Now',
    title: 'Vibe Verifier',
    detail: 'A side project that checks code AI writes before it goes live',
    lines: [
      "Agents are fast. They're not always right.",
      'So I built Vibe Verifier to check their work.',
    ],
    link: {
      href: 'https://github.com/Greenbauer/vibe-verifier',
      label: 'See it on GitHub',
    },
    beats: [
      {
        at: 0,
        face: { squint: 0.5, browsUpLeft: 0.6, browDown: 0.2 },
        look: 'card',
      },
      { at: line(1), face: { smile: 0.6 }, look: 'camera' },
    ],
  },
  {
    id: 'improv',
    part: 'Also',
    title: 'House Party Improv',
    detail: 'Cast member, San Antonio',
    lines: [
      'In the evenings I do improv comedy.',
      'Which might explain this face.',
    ],
    beats: [
      { at: 0, face: { smile: 0.6 }, look: 'card' },
      { at: line(1), face: { gasp: 0.6, browsUp: 1 }, look: 'camera' },
      { at: line(1) + 0.5, face: { pout: 0.9, browsUp: 0.5 } },
      { at: line(1) + 1, face: { frown: 0.5, browDown: 0.5 } },
      { at: line(1) + 1.5, face: { smile: 0.4, browsUpRight: 0.9 } },
      { at: line(1) + 2, face: { smile: 1, browsUp: 0.3 } },
    ],
  },
  {
    id: 'this-website',
    part: 'The head itself',
    title: 'This website',
    detail: 'Built with three.js and AI agents',
    lines: [
      'And this website?',
      "Wait. That's me.",
      'I built this head, and every face it makes.',
    ],
    link: {
      href: 'https://github.com/Greenbauer/zack.land',
      label: 'See it on GitHub',
    },
    beats: [
      { at: 0, face: { browsUp: 0.3 }, look: 'card' },
      { at: line(1), face: { gasp: 0.7, browsUp: 1 }, look: 'camera' },
      { at: line(2), face: { smile: 1 } },
    ],
  },
  {
    id: 'next',
    part: 'Next',
    title: "What's next",
    lines: [
      "What's next?",
      'I help software teams get real work out of AI coding agents.',
      "Let's work together.",
    ],
    link: { href: '/work-with-me', label: 'Work with me' },
    beats: [
      { at: 0, face: { smile: 0.3 }, look: 'card' },
      { at: 1.2, face: { browsUp: 0.5 }, look: 'up' },
      { at: line(1), face: { smile: 0.7 }, look: 'camera' },
      { at: line(2), face: { smile: 0.9, blinkLeft: 1 } },
      { at: line(2) + 0.6, face: { smile: 0.9 } },
    ],
  },
];
