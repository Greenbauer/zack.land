import { createTransport } from 'nodemailer';

import { ContactFormData } from '../../(root)/contact/Form';

// nodemailer needs the Node.js runtime (not Edge).
export const runtime = 'nodejs';

const transporter = createTransport({
  host: process.env.EMAIL_HOST,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // allows emails to be sent from local server
  },
});

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

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

  const { name, email, message }: ContactFormData = await request.json();

  try {
    const info = await transporter.sendMail({
      from: `zack.land --> ${name} <${process.env.FROM_EMAIL}>`,
      to: `zack.land <${process.env.TO_EMAIL}>`,
      replyTo: `${name} <${email}>`,
      subject: 'New Message - zack.land',
      html: `
      <html>
        <body>
          <small> From: <b>${name}</b> &lt;${email}&gt; </small>
          <br />
          <h2> Message: </h2>
          <p> ${message} </p>
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
