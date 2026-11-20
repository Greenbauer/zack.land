# Work with me

The consulting page: who it is for (software teams already using AI coding agents), one fixed-price starter, the first two builds free in exchange for a public write-up, a line on current work, and a two-field form that mails a build request.

## Surfaces

- page: `app/(root)/work-with-me/page.tsx`
- source: `app/(root)/work-with-me/**`
- source: `components/MailForm.tsx`

## Reach

Work with me in the header (between Portfolio and Contact, and in the phone menu) opens `/work-with-me`; the header's title reads WORK WITH ME. The offer sits on the contact page's frosted-glass card (`components/EdgeCard.tsx`), sliding in the same way, so the head moves aside for it as it does for the contact form. Under the headline are the starter (Agent-ready repo, $7,500 fixed, two weeks, four lines of what is done), "The first two are free", "Where I'm at" with a link to Vibe Verifier on GitHub, then the form: Your email and "What do you want your agents to do?". "Ask about a build" stays disabled until both are valid, then posts to `/api/email` with `kind: 'build'` and no name; the route mails it under the subject "Build Request - zack.land", names the sender by their email, and heads the answer "What they want their agents to do:". The reply replaces the button with "Sent. I'll reply by email." or shows "An error has occurred". The form is the contact form's (`components/MailForm.tsx`), so focus, errors, the blur behind it and reCAPTCHA work as there (contact.md).

The page sells nothing in ERP, freight or import documents, and names neither Zack's employer nor its numbers: his offer letter bars work that competes with it. Keep any new copy to that.

## Verify

Roles: none; the page is public.

1. From the home page, click Work with me in the header: `/work-with-me` opens, its link underlined, the title WORK WITH ME at the header's right, and the label on one line at 768px and up.
2. The card shows the headline, "$7,500 fixed", the four lines, "The first two are free" and "Where I'm at"; the Vibe Verifier link opens github.com/Greenbauer/vibe-verifier in a new tab.
3. "Ask about a build" is disabled; type an email and leave the question empty: still disabled; answer the question: enabled.
4. With the SMTP variables pointing at a sink, press it: "Sent. I'll reply by email." replaces the button, and the sink's mail has the subject "Build Request - zack.land".
5. At 375px wide the card runs edge to edge with the page's 2rem text margin, nothing scrolls sideways, and the form's button is reachable above the footer.

- `e2e/work-with-me.e2e.ts::the header links to the page, which shows the offer and its price`
- `e2e/work-with-me.e2e.ts::sends a build request with the email and the answer, then says so`
- `e2e/work-with-me.e2e.ts::says so when the request fails, keeping the button`
- `app/api/email/route.test.ts::mails a build request with no name, labelled as one`
- `app/api/email/route.test.ts::keeps a contact message labelled as a message`

## Gotchas

- The route reads `kind`: only `'build'` drops the name requirement; any other value, or none, is a contact message and still needs a name (`readSubmission` in `app/api/email/route.ts`).
- Both forms use reCAPTCHA's one action, `contact`, which `utils/recaptcha.ts` checks; a form with its own action would be refused.
- The card is taller than a laptop window, so the page scrolls; the footer stays at the bottom and content fades under it, as on other pages.
