// Client-side helpers for reCAPTCHA v3 on the contact form.
//
// Its script (about 350 KB) loads only once the form is used: loadRecaptcha,
// called as a field takes focus. getRecaptchaToken waits for it, so a submit
// still carries a token.
//
// Without a token (no public site key, or the script would not load), off the
// live site a server with no secret skips the check, so the contact form
// still works; a server with a secret, and the live site either way, refuses
// the submission.

// The longest a submit waits for the script, in milliseconds.
export const LOAD_AT_MOST_MS = 10_000;

const siteKey = () => process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

let loading: Promise<boolean> | undefined;

// Adds reCAPTCHA's script to the page, once; true once it has loaded. A
// failed load is not kept, so the next call tries again.
export function loadRecaptcha(): Promise<boolean> {
  const key = siteKey();
  if (!key || typeof window === 'undefined') return Promise.resolve(false);
  loading ??= new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${key}`;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      script.remove();
      loading = undefined;
      resolve(false);
    };
    document.head.append(script);
  });
  return loading;
}

// A token for `action`, once the script has loaded (at most LOAD_AT_MOST_MS).
export async function getRecaptchaToken(
  action: string,
): Promise<string | undefined> {
  const key = siteKey();
  const loaded = await Promise.race([
    loadRecaptcha(),
    new Promise<false>((resolve) =>
      setTimeout(() => resolve(false), LOAD_AT_MOST_MS),
    ),
  ]);
  if (!key || !loaded || !window.grecaptcha) return undefined;

  const { grecaptcha } = window;
  await new Promise<void>((resolve) => grecaptcha.ready(() => resolve()));
  return grecaptcha.execute(key, { action });
}
