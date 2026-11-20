import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  SHOWN_EXPRESSIONS,
  SHOWN_SIDED,
} from '@/components/Background/shownExpressions';
import { SIDES } from '@/components/Background/sideMorphs';

import { CHAPTERS, dwellSeconds, LINE_SECONDS, shownLine } from './chapters';

// Every expression a chapter's beats may drive: those the page loads, and
// the halves of those it splits.
const drivable = new Set<string>([
  ...SHOWN_EXPRESSIONS,
  ...SHOWN_SIDED.flatMap((name) => SIDES.map((side) => `${name}${side}`)),
]);

describe("the home page's story", () => {
  it('runs from Texas Tech to what is next, Banner Eyewear the switch', () => {
    expect(CHAPTERS.map((chapter) => chapter.id)).toEqual([
      'texas-tech',
      'pipes',
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
      'vibe-verifier',
      'improv',
      'this-website',
      'next',
    ]);
    const lines = (id: string) =>
      CHAPTERS.find((chapter) => chapter.id === id)!.lines.join(' ');
    expect(lines('pipes')).toContain('I liked the bugs more.');
    expect(lines('banner-eyewear')).toContain('My first coding project');
    expect(lines('banner-eyewear')).toContain('decided to switch to software');
  });

  it("looks at each chapter's card as it arrives", () => {
    for (const { beats } of CHAPTERS) expect(beats[0]!.look).toBe('card');
  });

  it('has chapters with their own ids', () => {
    const ids = CHAPTERS.map((chapter) => chapter.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('says one to three short lines a chapter', () => {
    for (const { lines } of CHAPTERS) {
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.length).toBeLessThanOrEqual(3);
      for (const line of lines) expect(line.length).toBeLessThanOrEqual(80);
    }
  });

  it('drives only expressions the page loads', () => {
    for (const { beats } of CHAPTERS)
      for (const { face } of beats)
        for (const name of Object.keys(face)) expect(drivable).toContain(name);
  });

  it('times its beats in order, from the chapter start', () => {
    for (const { beats } of CHAPTERS) {
      expect(beats[0]!.at).toBe(0);
      const times = beats.map((beat) => beat.at);
      expect(times).toEqual([...times].sort((a, b) => a - b));
    }
  });

  it('shows only photos the site has', () => {
    for (const { photo } of CHAPTERS)
      if (photo)
        expect(existsSync(join(process.cwd(), 'public', photo.src))).toBe(true);
  });

  it('ends on Work with me', () => {
    expect(CHAPTERS.at(-1)!.link).toEqual({
      href: '/work-with-me',
      label: 'Work with me',
    });
  });

  it('never names the current employer or its business', () => {
    const text = JSON.stringify(CHAPTERS);
    for (const word of [/known/i, /netsuite/i, /freight/i, /\berp\b/i])
      expect(text).not.toMatch(word);
    // Today's chapter: only "a distribution company", with no numbers from
    // that job and nothing about the documents it handles.
    const today = CHAPTERS.find((chapter) => chapter.id === 'today')!;
    const said = [today.title, today.detail, ...today.lines].join(' ');
    expect(said).toContain('a distribution company');
    expect(said.replace('2024', '')).not.toMatch(/\d/);
    expect(said).not.toMatch(/document|invoice|purchase order|\bPOs?\b/i);
  });
});

describe('the lines over the head', () => {
  it('show one at a time, the last staying', () => {
    expect(shownLine(-0.1, 3)).toBe(-1);
    expect(shownLine(0, 3)).toBe(0);
    expect(shownLine(LINE_SECONDS, 3)).toBe(1);
    expect(shownLine(LINE_SECONDS * 10, 3)).toBe(2);
  });

  it('stay long enough to read every line', () => {
    expect(dwellSeconds({ lines: ['a', 'b'] })).toBeGreaterThan(
      2 * LINE_SECONDS,
    );
  });
});
