'use client';

import { Field } from '@/components/FormFields';
import MailForm from '@/components/MailForm';

// Name and email side by side, then the message under them.
const ROWS: Field[][] = [
  [
    {
      label: 'Name',
      name: 'name',
      type: 'text',
      autoComplete: 'name',
      isRequired: true,
    },
    {
      label: 'Email',
      name: 'email',
      type: 'email',
      autoComplete: 'email',
      isRequired: true,
    },
  ],
  [{ label: 'Message', name: 'message', type: 'textarea', isRequired: true }],
];

export default function Form() {
  return (
    <MailForm
      rows={ROWS}
      submitLabel="Submit"
      sentText="Your message has been sent"
    />
  );
}
