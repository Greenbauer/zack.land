# Contact form

The contact page and the route that mails each message: Name, Email and Message, an optional reCAPTCHA v3 check, and an SMTP send through nodemailer.

## Surfaces

- page: `app/(root)/contact/page.tsx`
- route: `app/api/email/route.ts`
- source: `components/EdgeCard.tsx`
- source: `components/edgeBleed.ts`
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

Contact in the header, or Contact me in the footer, opens `/contact`. The form sits on a frosted-glass card whose glass runs flat past the window's right side when that side is near (closer than the glass's 160px soft edge reaches: `components/edgeBleed.ts`; farther off, as on a window wider than the content's 1536px frame, the card ends with its own rounded edge), and on a phone past both sides, so it meets the edge square and only fades out at its top and bottom (`components/EdgeCard.tsx`). As the page opens it slides in from wholly off the window's left side to its place over 1.4 seconds, slowing to a stop, its glass whole all the way, while the form on it fades in over the last half second, once the card has all but stopped (`animate-card-in` and `animate-content-in` in `tailwind.config.js`; with reduced motion it just shows). Going to another page, it slides on off the window's right side, its form fading, before the next page arrives (`components/PageLeave.tsx`; see home.md). Submit stays disabled until all three fields are valid, then posts to `/api/email`; the reply replaces Submit with "Your message has been sent" or shows "An error has occurred". The messages are in the card's text colour (`status` in `tailwind.config.js`), their words telling an error from success, at 4.5:1 or better over the glass. While any field has focus, the 3D scene behind the form softly blurs (over 0.3 seconds) while the form, the header, its page title and the footer stay sharp: the blur is drawn in the scene itself, with the 3D titles drawn over it (`components/Background/focusBlur.ts`, `Grading.tsx`), and the form opts in with `data-focus-blur`.

## Verify

Roles: none; the page is public. Mail: the QAE container points the five SMTP variables at a local sink that accepts every message and keeps none. On a laptop, point them at a sink too, or Submit sends real mail.

1. Open `/contact`: Name, Email and Message, Submit disabled, and the footer reads "Please fill out this form".
2. Type a name, a valid email and a message without leaving the message box: Submit enables. An address whose top-level domain is longer than four letters, such as `ada@example.online`, counts as valid: Submit enables and no "invalid" shows under Email.
3. Type `not-an-email` in Email and leave the field: "invalid" shows under it only once the field is left.
4. Click into any field: the head and sky behind the form blur, while the form, the header links, CONTACT ME and the footer stay sharp; click outside the form and the blur clears.
5. With the SMTP variables pointing at a sink, fill the three fields and press Submit: "Your message has been sent" replaces Submit.
6. With no SMTP variables set, fill the three fields and press Submit: "An error has occurred" shows and the server logs the missing variables.
7. Post to `/api/email` directly with the email `not-an-email`, or with no message: the route answers 400 and sends nothing.

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

- `.github/workflows/tests.yml` runs `npm test` (the `route.test.ts` and `recaptcha.test.ts` cases above) on every pull request and every push to `master`. No workflow runs `contact-form.cy.ts` (the workflow's only Cypress run is the portfolio's `more-less.cy.ts`), so its two cases run only by hand.
- reCAPTCHA fails open: with no `RECAPTCHA_SECRET_KEY` every submission is accepted, and with no `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` the form sends no token. The public key is inlined at build, so setting it needs a redeploy (README).
- The route re-checks every field the browser checks (required, the email pattern, 100 characters for Name and Email, 1000 for Message) from the one set of rules in `utils/contact-fields.ts`; change a limit there, not in either caller. A value the browser lets through but the route refuses shows as "An error has occurred".
- Every typed value is HTML-escaped before it goes into the mail, and the sender's name travels as a nodemailer address object, so markup or a `<`/`,` in Name cannot add markup or an address.
- The SMTP transport checks the server's certificate. Production and preview send through Amazon SES (`email-smtp.us-east-1.amazonaws.com`), whose certificate is publicly trusted; a local SMTP host with a self-signed certificate now fails to send, so point local runs at a sink without STARTTLS, as the QAE container does.
