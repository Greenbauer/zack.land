import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import miscellaneous from '@/app/(root)/portfolio/miscellaneous/Contents';
import webApps from '@/app/(root)/portfolio/web-apps/Contents';
import {
  SHOWN_EXPRESSIONS,
  SHOWN_SIDED,
} from '@/components/Background/shownExpressions';
import { SIDES } from '@/components/Background/sideMorphs';
import { layOut } from '@/components/PostCollage';

import { Chapter, CHAPTERS } from './chapters';

// Every expression a chapter's beats may drive: those the page loads, and
// the halves of those it splits.
const drivable = new Set<string>([
  ...SHOWN_EXPRESSIONS,
  ...SHOWN_SIDED.flatMap((name) => SIDES.map((side) => `${name}${side}`)),
]);
const chapter = (id: string) => CHAPTERS.find((c) => c.id === id)!;
const text = ({ content }: Chapter) =>
  `${content.name} ${renderToStaticMarkup(content.description!)}`
    .replace(/<[^>]+>/g, '')
    .replace(/&rsquo;/g, '’')
    .replace(/&#x27;/g, "'");

describe("the home page's story", () => {
  it('runs from Texas Tech to what is next, Banner Eyewear the switch', () => {
    expect(CHAPTERS.map((c) => c.id)).toEqual([
      'texas-tech',
      'pipe-engineer',
      'banner-eyewear',
      'freelance',
      'smart-bed',
      'lounge-chair',
      'sorting-robot',
      'shofar-mount',
      'usaa',
      'travel-startup',
      'gulp',
      'today',
      'improv',
      'this-website',
      'whats-next',
    ]);
    expect(text(chapter('pipe-engineer'))).toContain(
      '10 to 15 in every release.',
    );
    expect(text(chapter('banner-eyewear'))).toContain(
      'my first coding project, and it’s the reason I switched to software',
    );
  });

  it('shows the portfolio’s own posts, exactly as the portfolio does', () => {
    const portfolio = new Set([...webApps, ...miscellaneous]);
    for (const id of [
      'banner-eyewear',
      'smart-bed',
      'lounge-chair',
      'sorting-robot',
      'shofar-mount',
      'travel-startup',
      'this-website',
    ])
      expect(portfolio.has(chapter(id).content)).toBe(true);
  });

  it('gives every chapter pictures the site has, or the head to tell it', () => {
    for (const c of CHAPTERS) {
      // A chapter with no picture of its own is told by the head: a prop
      // (This website's post has none on the portfolio either), or for USAA
      // the head alone, its faces.
      if (!c.content.mediaSources?.length) {
        if (c.id !== 'usaa') expect(c.prop, c.id).toBeTruthy();
        continue;
      }
      for (const { key, type } of c.content.mediaSources) {
        if (type === 'YouTube') continue;
        expect(existsSync(join(process.cwd(), 'public', key)), key).toBe(true);
        if (type === 'video')
          expect(
            existsSync(
              join(process.cwd(), 'public', key.replace(/\.mp4$/, '.jpg')),
            ),
          ).toBe(true);
      }
    }
  });

  it('drives only expressions the page loads, in order, looking at the card first', () => {
    for (const { beats } of CHAPTERS) {
      expect(beats[0]).toMatchObject({ at: 0, look: 'card' });
      const times = beats.map((beat) => beat.at);
      expect(times).toEqual([...times].sort((a, b) => a - b));
      for (const { face } of beats)
        for (const name of Object.keys(face)) expect(drivable).toContain(name);
    }
  });

  it('brings its props where the storyboard has them', () => {
    expect(
      Object.fromEntries(
        CHAPTERS.filter((c) => c.prop).map((c) => [c.id, c.prop]),
      ),
    ).toEqual({
      'texas-tech': 'tortillas',
      'banner-eyewear': 'sunglasses',
      'smart-bed': 'sleepmask',
      'this-website': 'wireframe',
      'whats-next': 'phone',
    });
  });

  it('never crops a story loop narrower than its own shape, whatever the room', () => {
    // An illustration has text to its edges (the pipe's bug reports): cut to
    // a taller shape, a medium window lost them.
    for (const { id, content } of CHAPTERS) {
      const loops = (content.mediaSources ?? []).filter(
        (m) => m.type === 'video' && m.key.startsWith('/story/'),
      );
      if (!loops.length) continue;
      for (let width = 300; width <= 1400; width += 50)
        for (let height = 150; height <= 900; height += 50) {
          const { sources, tiles } = layOut(
            content.mediaSources!,
            width,
            height,
          );
          sources.forEach((source, k) => {
            if (!loops.includes(source) || loops.indexOf(source) > 0) return;
            const tile = tiles[k]!;
            expect(
              tile.width / tile.height,
              `${id} at ${width} by ${height}`,
            ).toBeGreaterThan((source.width! / source.height!) * 0.97);
          });
        }
    }
  });

  it('ends on Work with me', () => {
    expect(CHAPTERS.at(-1)!.content.action).toEqual({
      href: '/work-with-me',
      label: 'Work with me',
    });
  });

  it('never names the current employer or its business', () => {
    const all = CHAPTERS.map(text).join(' ');
    for (const word of [/known/i, /netsuite/i, /freight/i, /\berp\b/i])
      expect(all).not.toMatch(word);
    const today = text(chapter('today'));
    expect(today).toContain('a distribution company');
    expect(today).not.toMatch(/\d/);
    expect(today).not.toMatch(/document|invoice|purchase order|\bPOs?\b/i);
  });
});
