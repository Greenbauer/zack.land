'use client';

import { Field } from '@/components/FormFields';
import MailForm from '@/components/MailForm';

// Two fields: the reply address and the task they want handled, which says
// whether it is a fit. Posted as a build request (`kind`), which the route mails
// without a name and under its own subject (app/api/email/route.ts).
const ROWS: Field[][] = [
  [
    {
      label: 'Your email',
      name: 'email',
      type: 'email',
      autoComplete: 'email',
      isRequired: true,
    },
  ],
  [
    {
      label: 'What does your team do over and over?',
      name: 'message',
      type: 'textarea',
      isRequired: true,
    },
  ],
];

const BUILD = { kind: 'build' };

export default function BuildForm() {
  return (
    <MailForm
      rows={ROWS}
      submitLabel="Send"
      sentText="Thanks. I'll reply by email with where to send your example."
      extra={BUILD}
    />
  );
}
