// Client-side helper: fetch a reCAPTCHA v3 token for a given action.
//
// Returns undefined when reCAPTCHA isn't configured (no public site key) or the
// script hasn't loaded — in which case the server falls back to skipping the
// check, so the contact form still works.

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export async function getRecaptchaToken(
  action: string,
): Promise<string | undefined> {
  if (!SITE_KEY || typeof window === 'undefined' || !window.grecaptcha) {
    return undefined;
  }

  const { grecaptcha } = window;
  await new Promise<void>((resolve) => grecaptcha.ready(() => resolve()));
  return grecaptcha.execute(SITE_KEY, { action });
}
