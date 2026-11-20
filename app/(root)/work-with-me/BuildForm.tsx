'use client';

import { Field } from '@/components/FormFields';
import MailForm from '@/components/MailForm';

// Two fields: the reply address and the one question that says whether the
// team is a fit. Posted as a build request (`kind`), which the route mails
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
      label: 'What do you want your agents to do?',
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
      submitLabel="Ask about a build"
      sentText="Sent. I'll reply by email."
      extra={BUILD}
    />
  );
}
