import { createTransport } from 'nodemailer';

import {
  EMAIL_PATTERN,
  INPUT_MAX_LENGTH,
  TEXTAREA_MAX_LENGTH,
} from '@/utils/contact-fields';
import { verifyRecaptcha } from '@/utils/recaptcha';

import type { ContactFormData } from '../../(root)/contact/Form';

// nodemailer needs the Node.js runtime (not Edge).
export const runtime = 'nodejs';

const transporter = createTransport({
  host: process.env.EMAIL_HOST,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const isText = (value: unknown, maxLength: number): value is string =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  value.length <= maxLength;

// The browser checks these fields too (components/FormFields.tsx), but the
// route is public, so it re-checks them before anything is mailed.
async function readSubmission(
  request: Request,
): Promise<(ContactFormData & { recaptchaToken?: string }) | undefined> {
  const body: unknown = await request.json().catch(() => undefined);
  if (typeof body !== 'object' || body === null) return undefined;

  const { name, email, message, recaptchaToken } = body as Record<
    string,
    unknown
  >;
  if (
    !isText(name, INPUT_MAX_LENGTH) ||
    !isText(email, INPUT_MAX_LENGTH) ||
    !EMAIL_PATTERN.test(email) ||
    !isText(message, TEXTAREA_MAX_LENGTH)
  ) {
    return undefined;
  }

  return {
    name,
    email,
    message,
    recaptchaToken:
      typeof recaptchaToken === 'string' ? recaptchaToken : undefined,
  };
}

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

// Every visitor-typed value goes into the mail's HTML through this.
const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char] ?? char);

export async function POST(request: Request): Promise<Response> {
  // Surface any missing mail config (logged, never returned to the client).
  const missing = (
    [
      'EMAIL_HOST',
      'EMAIL_USER',
      'EMAIL_PASS',
      'FROM_EMAIL',
      'TO_EMAIL',
    ] as const
  ).filter((key) => !process.env[key]);
  if (missing.length) {
    console.error('[contact] missing env vars:', missing.join(', '));
    return json({ error: 'Email is not configured' }, 500);
  }

  const submission = await readSubmission(request);
  if (!submission) {
    return json(
      { error: 'Name, a valid email and a message are required' },
      400,
    );
  }
  const { name, email, message, recaptchaToken } = submission;

  // Spam gate — no-op until RECAPTCHA_SECRET_KEY is configured (see utils/recaptcha).
  const verdict = await verifyRecaptcha(recaptchaToken);
  if (!verdict.ok) {
    console.warn(
      '[contact] reCAPTCHA blocked submission:',
      verdict.reason,
      verdict.score,
    );
    return json({ error: 'reCAPTCHA verification failed' }, 400);
  }

  try {
    const info = await transporter.sendMail({
      // Address objects, not strings: nodemailer then encodes the name
      // itself, so a name holding "<" or "," cannot add an address.
      from: {
        name: `zack.land --> ${name}`,
        address: process.env.FROM_EMAIL as string,
      },
      to: `zack.land <${process.env.TO_EMAIL}>`,
      replyTo: { name, address: email },
      subject: 'New Message - zack.land',
      html: `
      <html>
        <body>
          <small> From: <b>${escapeHtml(name)}</b> &lt;${escapeHtml(email)}&gt; </small>
          <br />
          <h2> Message: </h2>
          <p> ${escapeHtml(message)} </p>
        </body>
      </html>
    `,
    });

    // These fields tell us exactly what the SMTP server did with the message —
    // the difference between "accepted & delivered" and "accepted but bounced".
    console.log('[contact] sendMail result:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    if (info.rejected?.length) {
      return json(
        { error: 'Recipient rejected', rejected: info.rejected },
        502,
      );
    }

    return json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('[contact] sendMail failed:', error);
    return json({ error: 'Failed to send email' }, 500);
  }
}
