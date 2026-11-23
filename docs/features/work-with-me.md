# Work with me

The consulting page, for small non-technical teams, laid out in the order a doubtful owner reads it (from a study of 13 comparable service pages and what small-business buyers check before hiring): what it does, a 40-second silent video of it, a free first step (tell me the task, send one real example, see a draft before paying), who does the work, the two tasks, how it works, the price all in, owners' questions, about me, and a two-field form that mails a build request.

## Surfaces

- page: `app/(root)/work-with-me/page.tsx`
- source: `app/(root)/work-with-me/**`
- source: `components/MailForm.tsx`
- source: `public/work-with-me/**`

## Reach

Work with me in the header (between Portfolio and Contact, and in the phone menu) opens `/work-with-me`; the header's title reads WORK WITH ME. The offer sits on the contact page's frosted-glass card (`components/EdgeCard.tsx`), sliding in the same way, so the head moves aside for it as it does for the contact form. Under the headline ("I build AI tools that handle the repetitive work for small teams") and the promise ("Done for you, checked by you before anything goes out, and kept running.") are, in order: the video (`OfferVideo.tsx`, below); a "Get a free draft" button that jumps to the form (`#ask`), with "Tell me what your team does over and over. If I can help, I'll ask for one real example, like a quote you wrote or a form you retype, and show you a draft built from it within 3 working days, before you pay anything."; who I am ("I'm Zack Greenbauer, a software engineer for 10+ years..."); Pick one task, two boxes, Same-day quotes and Stop retyping, each as Today and After (`TASKS` in `page.tsx`); How it works, four numbered steps (`STEPS`); Price, all in: "$3,500 setup" (half to start, half once the first real drafts are approved), "$500 a month" covering fixes, updates and the AI and hosting costs, cancel with 30 days' notice, and the first two setups free for a write-up the owner reads first; Questions owners ask, five that open to their answers (`QUESTIONS`; the data answer says the AI service works under business terms that don't let it train on the owner's data, without naming the provider); About me, with a link to the portfolio and a small line for software teams linking to Vibe Verifier on GitHub; then the form, under "Get a free draft": Your email and "What does your team do over and over?". Send stays disabled until both are valid, then posts to `/api/email` with `kind: 'build'` and no name; the route mails it under the subject "Build Request - zack.land", names the sender by their email, and heads the answer "What their team does over and over:". The reply replaces the button with "Thanks. I'll reply by email with where to send your example." or shows "An error has occurred". The footer on this page reads "Have a task your team does over and over?" and its Tell me about it link jumps to the form (`#ask`). The form is the contact form's (`components/MailForm.tsx`), so focus, errors, the blur behind it and reCAPTCHA work as there (contact.md).

The video (`public/work-with-me/offer.mp4`, 40 seconds, 1.9 MB, no audio track; its poster `offer.jpg` is its last frame) tells the offer with no sound, so every word is on screen: notes written on the job and typed again into a quote, a calendar and an invoice ("Typed 3 times"); "I build AI tools that do that typing for you"; a voice memo coming back as a draft quote; an emailed form filling all three at once; a draft quote whose unclear line waits for the owner to type its price before "Approve and send"; then "Typed once." and "Tell me what your team does over and over. I'll build you a free draft ↓" with "Zack Greenbauer · www.zack.land". It plays once, muted, when half of it is in view, and its one button pauses, plays, or plays it again after it ends; with reduced motion it waits for that button, showing the poster. A screen-reader text (`#offer-video-story`) tells the same story in words. It is at most 36rem wide, so on a laptop the button under it shows without scrolling. Its app screens show sample data (a sample client, sample HVAC quote lines and prices), labeled "Sample data" on screen whenever they show: Zack approved labeled sample data for this video only (2026-11-23); the page's own copy stays real. Footage: Pexels clips 8293501, 34214297, 8256630 and 5043939 (Pexels licence, free for commercial use, no attribution needed); the font files are the site's own.

Keep any new copy to the stated offer, and leave the line on current work general: it names no company. No invented examples, names or prices: a real before and after goes here once a free build allows it.

The card is taller and wider than a phone's window, so once scrolled into, none of the sky around it is on screen to read. It then takes the side of the settled sky (`aimUnseen` in `components/Background/glassTint.ts`, called from `Grading.tsx`), so its text turns dark over a light sky as other cards' does. The rule holds for any glass card with no sky around it on screen, a portfolio post's card scrolled out of view too, which then waits on the settled side as a new card does (`place`).

## Verify

Roles: none; the page is public.

1. From the home page, click Work with me in the header: `/work-with-me` opens, its link underlined, the title WORK WITH ME at the header's right, and the label on one line at 768px and up.
2. The card shows, in order, the headline, the promise, the video, Get a free draft, who I am, Pick one task, How it works (four steps), Price all in, Questions owners ask (five, each opening to its answer) and About me; the Vibe Verifier link opens github.com/Greenbauer/vibe-verifier in a new tab.
3. Send is disabled; type an email and leave the question empty: still disabled; answer the question: enabled.
4. With the SMTP variables pointing at a sink, press it: "Thanks. I'll reply by email with where to send your example." replaces the button, and the sink's mail has the subject "Build Request - zack.land".
5. Scrolled into view, the video plays once with no sound; its button pauses it, and at the end plays it again from the start. With reduced motion it waits for the button. At 1440x900 the Get a free draft button shows under it without scrolling.
6. The footer reads "Have a task your team does over and over?"; Tell me about it brings the form into view.
7. At 375px wide the card runs edge to edge with the page's 2rem text margin, nothing scrolls sideways, and the form's button is reachable above the footer. Scrolled to the questions over a light sky, the text is dark.

- `e2e/work-with-me.e2e.ts::the header links to the page, which shows the offer and its price`
- `e2e/work-with-me.e2e.ts::sends a build request with the email and the answer, then says so`
- `e2e/work-with-me.e2e.ts::says so when the request fails, keeping the button`
- `e2e/work-with-me.e2e.ts::the footer speaks to each audience, and here jumps to the form`
- `e2e/work-with-me.e2e.ts::the video plays once, muted, when it comes into view, and its button pauses and replays it`
- `e2e/work-with-me.e2e.ts::with reduced motion the video waits for its button`
- `e2e/work-with-me.e2e.ts::the button under the video shows without scrolling`
- `app/api/email/route.test.ts::mails a build request with no name, labelled as one`
- `components/Background/glassTint.test.ts::put a card with no sky around it on screen on the settled side, and leave it before then`
- `app/api/email/route.test.ts::keeps a contact message labelled as a message`

## Gotchas

- The route reads `kind`: only `'build'` drops the name requirement; any other value, or none, is a contact message and still needs a name (`readSubmission` in `app/api/email/route.ts`).
- Both forms use reCAPTCHA's one action, `contact`, which `utils/recaptcha.ts` checks; a form with its own action would be refused.
- The card is taller than a laptop window, so the page scrolls; the footer stays at the bottom and content fades under it, as on other pages.
