import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { verifyRecaptcha } from './recaptcha';

const ORIGINAL_SECRET = process.env.RECAPTCHA_SECRET_KEY;

function mockSiteverify(payload: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ json: async () => payload }) as unknown as Response),
  );
}

describe('verifyRecaptcha', () => {
  beforeEach(() => {
    process.env.RECAPTCHA_SECRET_KEY = 'test-secret';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    process.env.RECAPTCHA_SECRET_KEY = ORIGINAL_SECRET;
  });

  it('fails open (skips verification) when no secret is configured', async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const verdict = await verifyRecaptcha('any-token');

    expect(verdict).toEqual({ ok: true, reason: 'disabled' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects when the token is missing', async () => {
    expect(await verifyRecaptcha(undefined)).toEqual({
      ok: false,
      reason: 'missing-token',
    });
  });

  it('accepts a successful, high-score, correct-action response', async () => {
    mockSiteverify({ success: true, score: 0.9, action: 'contact' });
    expect(await verifyRecaptcha('token')).toEqual({ ok: true, score: 0.9 });
  });

  it('rejects a low score', async () => {
    mockSiteverify({ success: true, score: 0.2, action: 'contact' });
    expect(await verifyRecaptcha('token')).toMatchObject({
      ok: false,
      reason: 'low-score',
      score: 0.2,
    });
  });

  it('rejects an action mismatch', async () => {
    mockSiteverify({ success: true, score: 0.9, action: 'login' });
    expect(await verifyRecaptcha('token')).toMatchObject({
      ok: false,
      reason: 'action-mismatch',
    });
  });

  it('rejects when Google reports failure', async () => {
    mockSiteverify({ success: false, 'error-codes': ['timeout-or-duplicate'] });
    expect(await verifyRecaptcha('token')).toEqual({
      ok: false,
      reason: 'timeout-or-duplicate',
    });
  });

  it('rejects when the verify request throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network');
      }),
    );
    expect(await verifyRecaptcha('token')).toEqual({
      ok: false,
      reason: 'verify-request-failed',
    });
  });
});
