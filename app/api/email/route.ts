import { createTransport } from 'nodemailer';

import { ContactFormData } from '../../(root)/contact/Form';

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

export async function POST(request: Request): Promise<Response> {
  const { name, email, message }: ContactFormData = await request.json();

  await transporter.sendMail({
    from: `zack.land --> ${name} <${process.env.FROM_EMAIL}>`,
    to: `zack.land <${process.env.TO_EMAIL}>`,
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

  return new Response(JSON.stringify({ message: 'Email sent successfully' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
