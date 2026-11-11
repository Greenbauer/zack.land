import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type FakeScript = {
  src: string;
  async: boolean;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  remove: () => void;
};

// A page with no reCAPTCHA yet: scripts added to its <head> are kept, and
// loading one defines grecaptcha, as Google's does.
function fakePage() {
  const added: FakeScript[] = [];
  const execute = vi.fn(async () => 'token');
  const page = {
    added,
    execute,
    load(script = added.at(-1)!) {
      (globalThis.window as { grecaptcha?: unknown }).grecaptcha = {
        ready: (callback: () => void) => callback(),
        execute,
      };
      script.onload?.();
    },
  };
  vi.stubGlobal('window', {});
  vi.stubGlobal('document', {
    createElement: () => ({
      src: '',
      async: false,
      onload: null,
      onerror: null,
      remove: vi.fn(),
    }),
    head: { append: (script: FakeScript) => added.push(script) },
  });
  return page;
}

// The module keeps whether its script is loading, so each test gets its own.
const client = () => import('./recaptcha-client');

describe('reCAPTCHA on the contact form', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_RECAPTCHA_SITE_KEY', 'site-key');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('adds no script until the form is used', async () => {
    const page = fakePage();
    await client();
    expect(page.added).toHaveLength(0);
  });

  it('adds its script once, however often a field takes focus', async () => {
    const page = fakePage();
    const { loadRecaptcha } = await client();
    void loadRecaptcha();
    void loadRecaptcha();
    expect(page.added).toHaveLength(1);
    expect(page.added[0]!.src).toBe(
      'https://www.google.com/recaptcha/api.js?render=site-key',
    );
    expect(page.added[0]!.async).toBe(true);
  });

  it('gives a submit a token once the script has loaded', async () => {
    const page = fakePage();
    const { getRecaptchaToken } = await client();
    const token = getRecaptchaToken('contact');
    page.load();
    await expect(token).resolves.toBe('token');
    expect(page.execute).toHaveBeenCalledWith('site-key', {
      action: 'contact',
    });
  });

  it('loads the script for a submit that came before any focus', async () => {
    const page = fakePage();
    const { getRecaptchaToken } = await client();
    const token = getRecaptchaToken('contact');
    expect(page.added).toHaveLength(1);
    page.load();
    await expect(token).resolves.toBe('token');
  });

  it('tries again after the script failed to load', async () => {
    const page = fakePage();
    const { getRecaptchaToken, loadRecaptcha } = await client();
    const first = loadRecaptcha();
    page.added[0]!.onerror?.();
    await expect(first).resolves.toBe(false);
    const token = getRecaptchaToken('contact');
    expect(page.added).toHaveLength(2);
    page.load();
    await expect(token).resolves.toBe('token');
  });

  it('sends no token, rather than waiting on, a script that never loads', async () => {
    vi.useFakeTimers();
    fakePage();
    const { getRecaptchaToken, LOAD_AT_MOST_MS } = await client();
    const token = getRecaptchaToken('contact');
    await vi.advanceTimersByTimeAsync(LOAD_AT_MOST_MS);
    await expect(token).resolves.toBeUndefined();
  });

  it('adds nothing without a site key', async () => {
    vi.stubEnv('NEXT_PUBLIC_RECAPTCHA_SITE_KEY', '');
    const page = fakePage();
    const { getRecaptchaToken } = await client();
    await expect(getRecaptchaToken('contact')).resolves.toBeUndefined();
    expect(page.added).toHaveLength(0);
  });
});
