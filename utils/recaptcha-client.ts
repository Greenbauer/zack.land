// Client-side helper: fetch a reCAPTCHA v3 token for a given action.
//
// Returns undefined when reCAPTCHA isn't configured (no public site key) or the
// script hasn't loaded. Off the live site a server with no secret then skips
// the check, so the contact form still works; a server with a secret, and the
// live site either way, refuses the submission.

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
