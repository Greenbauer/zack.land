import { afterEach, describe, expect, it, vi } from 'vitest';

type Header = { key: string; value: string };

// The config reads NODE_ENV and VERCEL_ENV when it loads, so each case loads
// it afresh with the environment it names.
async function load(env: { NODE_ENV: string; VERCEL_ENV?: string }) {
  vi.stubEnv('NODE_ENV', env.NODE_ENV);
  vi.stubEnv('VERCEL_ENV', env.VERCEL_ENV ?? '');
  vi.resetModules();
  const { default: config } = await import('./next.config.js');
  const rules = await config.headers!();
  return { config, headers: rules[0]!.headers as Header[], rules };
}

const LIVE = { NODE_ENV: 'production', VERCEL_ENV: 'production' };

// "directive source source; directive source" as { directive: [sources] }.
function policyOf(headers: Header[]) {
  const policy = headers.find(
    ({ key }) => key === 'Content-Security-Policy',
  )!.value;
  return Object.fromEntries(
    policy.split('; ').map((directive) => {
      const [name, ...sources] = directive.split(' ');
      return [name!, sources];
    }),
  );
}

describe('next.config.js', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('sends the protective headers on every path', async () => {
    const { config, headers, rules } = await load(LIVE);

    expect(rules).toHaveLength(1);
    expect(rules[0]!.source).toBe('/:path*');
    expect(headers.map(({ key }) => key)).toEqual([
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Content-Security-Policy',
    ]);
    expect(headers.slice(0, 4)).toEqual([
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

  it('enforces a content policy that allows only what the live site loads', async () => {
    const { headers } = await load(LIVE);

    // Enforced: a report-only policy with nowhere to report does nothing in
    // Safari, and its console warning fails Playwright's WebKit runs.
    expect(headers.some(({ key }) => key.endsWith('Report-Only'))).toBe(false);
    expect(policyOf(headers)).toEqual({
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'",
        'https://www.google.com/recaptcha/',
        'https://www.gstatic.com/recaptcha/',
        'www.youtube.com',
      ],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:'],
      'font-src': ["'self'"],
      'media-src': ["'self'"],
      'connect-src': ["'self'", 'https://www.google.com/recaptcha/'],
      'worker-src': ["'self'", 'blob:'],
      'frame-src': [
        'www.youtube.com',
        'https://www.google.com/recaptcha/',
        'https://recaptcha.google.com/recaptcha/',
      ],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'self'"],
    });
  });

  it('lets scripts be evaluated only under next dev', async () => {
    const dev = policyOf((await load({ NODE_ENV: 'development' })).headers);
    const live = policyOf((await load(LIVE)).headers);

    expect(dev['script-src']).toContain("'unsafe-eval'");
    expect(dev['script-src']).toContain('https://va.vercel-scripts.com');
    expect(live['script-src']).not.toContain("'unsafe-eval'");
  });

  it("allows Vercel's toolbar on preview deployments only", async () => {
    const preview = policyOf(
      (await load({ NODE_ENV: 'production', VERCEL_ENV: 'preview' })).headers,
    );
    const live = policyOf((await load(LIVE)).headers);

    expect(preview['script-src']).toContain('https://vercel.live');
    expect(preview['connect-src']).toContain('wss://ws-us3.pusher.com');
    expect(preview['frame-src']).toContain('https://vercel.live');
    expect(Object.values(live).flat().join(' ')).not.toMatch(/vercel/);
  });
});
