// Field rules shared by the contact form's fields (components/FormFields.tsx)
// and the route that mails them (app/api/email/route.ts), so the server
// accepts exactly what the browser lets through.

// What the contact form sends (with a reCAPTCHA token, app/api/email/route.ts).
export type ContactFormData = {
  name: string;
  email: string;
  message: string;
};

// What the Work with me page's form sends (app/(root)/work-with-me): no
// name, and `kind` so the route labels the mail as a build request.
export type BuildRequestData = Pick<ContactFormData, 'email' | 'message'> & {
  kind: 'build';
};

export const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
export const INPUT_MAX_LENGTH = 100;
export const TEXTAREA_MAX_LENGTH = 1000;
