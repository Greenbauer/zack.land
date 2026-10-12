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
- source: `utils/recaptcha.ts`
- source: `utils/recaptcha-client.ts`
- source: `types/grecaptcha.d.ts`

## Reach

Contact in the header, or Contact me in the footer, opens `/contact`. Submit stays disabled until all three fields are valid, then posts to `/api/email`; the reply replaces Submit with "Your message has been sent" or shows "An error has occurred".

## Verify

Roles: none; the page is public. Mail: the QAE container points the five SMTP variables at a local sink that accepts every message and keeps none. On a laptop, point them at a sink too, or Submit sends real mail.

1. Open `/contact`: Name, Email and Message, Submit disabled, and the footer reads "Please fill out this form".
2. Type a name, a valid email and a message without leaving the message box: Submit enables.
3. Type `not-an-email` in Email and leave the field: "invalid" shows under it only once the field is left.
4. With the SMTP variables pointing at a sink, fill the three fields and press Submit: "Your message has been sent" replaces Submit.
5. With no SMTP variables set, fill the three fields and press Submit: "An error has occurred" shows and the server logs the missing variables.

- `cypress/e2e/contact-form.cy.ts::enables Submit once valid, without blurring the last field`
- `cypress/e2e/contact-form.cy.ts::shows a field error only after blur, not while typing`
- `utils/recaptcha.test.ts::fails open (skips verification) when no secret is configured`
- `utils/recaptcha.test.ts::rejects a low score`
- `utils/recaptcha.test.ts::rejects an action mismatch`

## Gotchas

- No workflow runs `npm test` or Cypress, so these tests run only by hand.
- reCAPTCHA fails open: with no `RECAPTCHA_SECRET_KEY` every submission is accepted, and with no `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` the form sends no token. The public key is inlined at build, so setting it needs a redeploy (README).
- `/api/email` writes the sender's name, email and message into the mail's HTML without escaping, so markup typed into the form arrives as markup.
- The SMTP transport sets `tls.rejectUnauthorized: false` in every environment, production included, so the server's certificate is never checked.
- The route validates nothing itself: required fields and the email pattern are checked only in the browser.
- The footer's contact line reads "Ill will respond", missing its apostrophe (`components/Footer/index.tsx`).
