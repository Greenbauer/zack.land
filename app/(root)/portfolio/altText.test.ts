import { describe, expect, it } from 'vitest';

import miscellaneous from './miscellaneous/Contents';
import webApps from './web-apps/Contents';

// A screen reader reads each photo's alt text: one per photo, saying what it
// shows, not the post's name again (heard four times over on Smart Bed).
describe.each([
  ['Web Apps', webApps],
  ['Miscellaneous', miscellaneous],
])('the %s photos', (_, contents) => {
  const sources = contents.flatMap(({ name, mediaSources = [] }) =>
    mediaSources.map((source) => ({ name, ...source })),
  );

  it('each have their own alt text', () => {
    const alts = sources.map(({ alt }) => alt);
    expect(new Set(alts).size).toBe(alts.length);
  });

  it('say more than the post name', () => {
    for (const { name, alt } of sources) {
      expect(alt).not.toBe(name);
      expect(alt.split(' ').length).toBeGreaterThan(3);
    }
  });
});
