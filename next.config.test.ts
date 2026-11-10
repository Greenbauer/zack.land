import { describe, expect, it } from 'vitest';

import config from './next.config.js';

describe('next.config.js', () => {
  it('sends the protective headers on every path', async () => {
    const rules = await config.headers!();

    expect(rules).toHaveLength(1);
    expect(rules[0]!.source).toBe('/:path*');
    expect(rules[0]!.headers).toEqual([
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // Not DENY: the QA explorer frames the site from its own origin.
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
      },
    ]);
    expect(config.poweredByHeader).toBe(false);
  });
});
