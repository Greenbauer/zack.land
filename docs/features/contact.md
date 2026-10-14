# Contact form

The contact page and the route that mails each message: Name, Email and Message, an optional reCAPTCHA v3 check, and an SMTP send through nodemailer.

## Surfaces

- page: `app/(root)/contact/page.tsx`
- route: `app/api/email/route.ts`
- source: `app/(root)/contact/**`
- source: `app/api/email/**`
- source: `components/FormFields.tsx`
- source: `components/Button.tsx`
- source: `components/Spinner.tsx`
- source: `utils/request.ts`
- source: `utils/contact-fields.ts`
- source: `utils/recaptcha.ts`
- source: `utils/recaptcha-client.ts`
- source: `types/grecaptcha.d.ts`

## Reach

Contact in the header, or Contact me in the footer, opens `/contact`. Submit stays disabled until all three fields are valid, then posts to `/api/email`; the reply replaces Submit with "Your message has been sent" or shows "An error has occurred".

## Verify

Roles: none; the page is public. Mail: the QAE container points the five SMTP variables at a local sink that accepts every message and keeps none. On a laptop, point them at a sink too, or Submit sends real mail.

1. Open `/contact`: Name, Email and Message, Submit disabled, and the footer reads "Please fill out this form".
2. Type a name, a valid email and a message without leaving the message box: Submit enables. An address whose top-level domain is longer than four letters, such as `ada@example.online`, counts as valid: Submit enables and no "invalid" shows under Email.
3. Type `not-an-email` in Email and leave the field: "invalid" shows under it only once the field is left.
4. With the SMTP variables pointing at a sink, fill the three fields and press Submit: "Your message has been sent" replaces Submit.
5. With no SMTP variables set, fill the three fields and press Submit: "An error has occurred" shows and the server logs the missing variables.
6. Post to `/api/email` directly with the email `not-an-email`, or with no message: the route answers 400 and sends nothing.

- `cypress/e2e/contact-form.cy.ts::enables Submit once valid, without blurring the last field`
- `cypress/e2e/contact-form.cy.ts::shows a field error only after blur, not while typing`
- `app/api/email/route.test.ts::mails a valid submission`
- `app/api/email/route.test.ts::mails a submission from %s, whose top-level domain is over four letters`
- `app/api/email/route.test.ts::escapes markup typed into the name and message`
- `app/api/email/route.test.ts::rejects %s with a 400 and sends nothing`
- `app/api/email/route.test.ts::checks the SMTP server's certificate`
- `utils/recaptcha.test.ts::fails open (skips verification) when no secret is configured`
- `utils/recaptcha.test.ts::rejects a low score`
- `utils/recaptcha.test.ts::rejects an action mismatch`

## Gotchas

- `.github/workflows/tests.yml` runs `npm test` (the `route.test.ts` and `recaptcha.test.ts` cases above) on every pull request and every push to `master`. No workflow runs Cypress, so the two `contact-form.cy.ts` cases run only by hand.
- reCAPTCHA fails open: with no `RECAPTCHA_SECRET_KEY` every submission is accepted, and with no `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` the form sends no token. The public key is inlined at build, so setting it needs a redeploy (README).
- The route re-checks every field the browser checks (required, the email pattern, 100 characters for Name and Email, 1000 for Message) from the one set of rules in `utils/contact-fields.ts`; change a limit there, not in either caller. A value the browser lets through but the route refuses shows as "An error has occurred".
- Every typed value is HTML-escaped before it goes into the mail, and the sender's name travels as a nodemailer address object, so markup or a `<`/`,` in Name cannot add markup or an address.
- The SMTP transport checks the server's certificate. Production and preview send through Amazon SES (`email-smtp.us-east-1.amazonaws.com`), whose certificate is publicly trusted; a local SMTP host with a self-signed certificate now fails to send, so point local runs at a sink without STARTTLS, as the QAE container does.
- The footer's contact line reads "Ill will respond", missing its apostrophe (`components/Footer/index.tsx`).
