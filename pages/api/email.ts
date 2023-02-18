import type { NextApiRequest, NextApiResponse } from 'next';
import { createTransport } from 'nodemailer';

import { ContactFormData } from '../contact/form';

type Response = {
  message: string;
};

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  try {
    if (req.method === 'POST') {
      const { body } = req;
      const { name, email, subject, message }: ContactFormData = body;

      await transporter.sendMail({
        from: `zack land --> ${name} <${process.env.FROM_EMAIL}>`,
        to: process.env.TO_EMAIL,
        subject: subject,
        html: `
          <body>
            <small> From: <b>${name}</b> &lt;${email}&gt; </small>
            <br />
            <h2> Message: </h2>
            <p> ${message} </p>
          </body>
        `,
      });

      res.status(200).json({ message: 'Email sent successfully' });
    } else {
      res.status(405).json({ message: 'Not allowed' });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid request' });
  }
}
