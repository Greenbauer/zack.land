// Server-side Google reCAPTCHA v3 verification for the contact form.
//
// If RECAPTCHA_SECRET_KEY is unset the check is skipped (fail-open), so the
// form keeps working in environments where reCAPTCHA isn't configured yet.
// Once the secret is set, a submission must (a) carry a token, (b) be a genuine
// success, (c) match the expected action, and (d) clear the score threshold.

const SITEVERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const EXPECTED_ACTION = 'contact';
const MIN_SCORE = 0.5;

export type RecaptchaVerdict = {
  ok: boolean;
  score?: number;
  reason?: string;
};

type SiteverifyResponse = {
  success?: boolean;
  score?: number;
  action?: string;
  'error-codes'?: string[];
};

export async function verifyRecaptcha(
  token: string | undefined,
): Promise<RecaptchaVerdict> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  // Not configured -> don't block submissions.
  if (!secret) return { ok: true, reason: 'disabled' };
  if (!token) return { ok: false, reason: 'missing-token' };

  let data: SiteverifyResponse;
  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });
    data = (await res.json()) as SiteverifyResponse;
  } catch {
    return { ok: false, reason: 'verify-request-failed' };
  }

  if (!data.success) {
    return { ok: false, reason: data['error-codes']?.join(',') || 'verify-failed' };
  }
  if (data.action && data.action !== EXPECTED_ACTION) {
    return { ok: false, score: data.score, reason: 'action-mismatch' };
  }
  if (typeof data.score === 'number' && data.score < MIN_SCORE) {
    return { ok: false, score: data.score, reason: 'low-score' };
  }

  return { ok: true, score: data.score };
}
