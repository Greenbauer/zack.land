# Work with me

The consulting page, for small non-technical teams, laid out in the order a doubtful owner reads it (from a study of 13 comparable service pages and what small-business buyers check before hiring): what it does, a free first step (send one real example, see a draft before paying), who does the work, the two tasks, how it works, the price all in, owners' questions, about me, and a two-field form that mails a build request.

## Surfaces

- page: `app/(root)/work-with-me/page.tsx`
- source: `app/(root)/work-with-me/**`
- source: `components/MailForm.tsx`

## Reach

Work with me in the header (between Portfolio and Contact, and in the phone menu) opens `/work-with-me`; the header's title reads WORK WITH ME. The offer sits on the contact page's frosted-glass card (`components/EdgeCard.tsx`), sliding in the same way, so the head moves aside for it as it does for the contact form. Under the headline ("I build AI tools that take one repetitive task off a small team's plate") and the promise ("Done for you, checked by you before anything goes out, and kept running.") are, in order: a "Send me one real example" button that jumps to the form (`#ask`), with "Free. I'll show you a draft built from it before you pay anything."; who I am ("I'm Zack Greenbauer, a software engineer for 10+ years..."); Pick one task, two boxes, Same-day quotes and Stop retyping, each as Today and After (`TASKS` in `page.tsx`); How it works, four numbered steps (`STEPS`); Price, all in: "$3,500 setup" (half to start, half once the first real drafts are approved), "$500 a month" covering fixes, updates and the AI and hosting costs, cancel with 30 days' notice, and the first two setups free for a write-up the owner reads first; Questions owners ask, five that open to their answers (`QUESTIONS`; the data answer says the AI service works under business terms that don't let it train on the owner's data, without naming the provider); About me, with a link to the portfolio and a small line for software teams linking to Vibe Verifier on GitHub; then the form, under "Send me one real example": Your email and "What task do you want off your plate?". Send stays disabled until both are valid, then posts to `/api/email` with `kind: 'build'` and no name; the route mails it under the subject "Build Request - zack.land", names the sender by their email, and heads the answer "The task they want off their plate:". The reply replaces the button with "Thanks. I'll reply by email with where to send your example." or shows "An error has occurred". The footer on this page reads "Have a task your team does over and over?" and its Tell me about it link jumps to the form (`#ask`). The form is the contact form's (`components/MailForm.tsx`), so focus, errors, the blur behind it and reCAPTCHA work as there (contact.md).

Keep any new copy to the stated offer, and leave the line on current work general: it names no company. No invented examples, names or prices: a real before and after goes here once a free build allows it.

The card is taller and wider than a phone's window, so once scrolled into, none of the sky around it is on screen to read. It then takes the side of the settled sky (`aimUnseen` in `components/Background/glassTint.ts`, called from `Grading.tsx`), so its text turns dark over a light sky as other cards' does.

## Verify

Roles: none; the page is public.

1. From the home page, click Work with me in the header: `/work-with-me` opens, its link underlined, the title WORK WITH ME at the header's right, and the label on one line at 768px and up.
2. The card shows, in order, the headline, the promise, Send me one real example, who I am, Pick one task, How it works (four steps), Price all in, Questions owners ask (five, each opening to its answer) and About me; the Vibe Verifier link opens github.com/Greenbauer/vibe-verifier in a new tab.
3. Send is disabled; type an email and leave the question empty: still disabled; answer the question: enabled.
4. With the SMTP variables pointing at a sink, press it: "Thanks. I'll reply by email with where to send your example." replaces the button, and the sink's mail has the subject "Build Request - zack.land".
5. The footer reads "Have a task your team does over and over?"; Tell me about it brings the form into view.
6. At 375px wide the card runs edge to edge with the page's 2rem text margin, nothing scrolls sideways, and the form's button is reachable above the footer. Scrolled to the questions over a light sky, the text is dark.

- `e2e/work-with-me.e2e.ts::the header links to the page, which shows the offer and its price`
- `e2e/work-with-me.e2e.ts::sends a build request with the email and the answer, then says so`
- `e2e/work-with-me.e2e.ts::says so when the request fails, keeping the button`
- `e2e/work-with-me.e2e.ts::the footer speaks to each audience, and here jumps to the form`
- `app/api/email/route.test.ts::mails a build request with no name, labelled as one`
- `components/Background/glassTint.test.ts::put a card with no sky around it on screen on the settled side, and leave it before then`
- `app/api/email/route.test.ts::keeps a contact message labelled as a message`

## Gotchas

- The route reads `kind`: only `'build'` drops the name requirement; any other value, or none, is a contact message and still needs a name (`readSubmission` in `app/api/email/route.ts`).
- Both forms use reCAPTCHA's one action, `contact`, which `utils/recaptcha.ts` checks; a form with its own action would be refused.
- The card is taller than a laptop window, so the page scrolls; the footer stays at the bottom and content fades under it, as on other pages.
