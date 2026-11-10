import { afterEach, describe, expect, it, vi } from 'vitest';

type Header = { key: string; value: string };

// The config reads NODE_ENV when it loads, so each case loads it afresh.
async function headersFor(nodeEnv: string) {
  vi.stubEnv('NODE_ENV', nodeEnv);
  vi.resetModules();
  const { default: config } = await import('./next.config.js');
  const rules = await config.headers!();
  return { config, rules };
}

const value = (headers: Header[], key: string) =>
  headers.find((header) => header.key === key)?.value;

// "name source source; name source" as { name: [source, source] }.
const directives = (policy: string) =>
  Object.fromEntries(
    policy.split('; ').map((directive) => {
      const [name, ...sources] = directive.split(' ');
      return [name, sources];
    }),
  );

describe('next.config.js', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('sends the protective headers on every path', async () => {
    const { config, rules } = await headersFor('production');

    expect(rules).toHaveLength(1);
    expect(rules[0]!.source).toBe('/:path*');
    const headers = rules[0]!.headers;
    expect(value(headers, 'X-Content-Type-Options')).toBe('nosniff');
    // Not DENY: the QA explorer frames the site from its own origin.
    expect(value(headers, 'X-Frame-Options')).toBe('SAMEORIGIN');
    expect(value(headers, 'Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin',
    );
    expect(value(headers, 'Permissions-Policy')).toBe(
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    );
    expect(config.poweredByHeader).toBe(false);
  });

  it('reports on a content policy without enforcing it', async () => {
    const { rules } = await headersFor('production');
    const headers = rules[0]!.headers;

    expect(value(headers, 'Content-Security-Policy')).toBeUndefined();
    const policy = directives(
      value(headers, 'Content-Security-Policy-Report-Only')!,
    );
    expect(policy['default-src']).toEqual(["'self'"]);
    expect(policy['object-src']).toEqual(["'none'"]);
    expect(policy['base-uri']).toEqual(["'self'"]);
    expect(policy['form-action']).toEqual(["'self'"]);
    expect(policy['frame-ancestors']).toEqual(["'self'"]);
    // What the site really loads from elsewhere: reCAPTCHA and YouTube.
    expect(policy['script-src']).toEqual([
      "'self'",
      "'unsafe-inline'",
      'https://www.google.com/recaptcha/',
      'https://www.gstatic.com/recaptcha/',
      'https://www.youtube.com',
    ]);
    expect(policy['frame-src']).toEqual([
      'https://www.youtube.com',
      'https://www.google.com/recaptcha/',
      'https://recaptcha.google.com/recaptcha/',
    ]);
    expect(policy['connect-src']).toEqual([
      "'self'",
      'https://www.google.com/recaptcha/',
    ]);
    // The scene's test-draw worker is made from a blob.
    expect(policy['worker-src']).toEqual(["'self'", 'blob:']);
    // data: the lens images the glass builds into SVG filters.
    expect(policy['img-src']).toEqual(["'self'", 'data:']);
    expect(policy['style-src']).toEqual(["'self'", "'unsafe-inline'"]);
    expect(policy['font-src']).toEqual(["'self'"]);
    expect(policy['media-src']).toEqual(["'self'"]);
  });

  it('lets scripts be evaluated only under next dev, which needs it', async () => {
    const dev = await headersFor('development');
    const policy = directives(
      value(dev.rules[0]!.headers, 'Content-Security-Policy-Report-Only')!,
    );

    expect(policy['script-src']).toContain("'unsafe-eval'");
  });
});
