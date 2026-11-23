import { Metadata } from 'next';
import Link from 'next/link';

import EdgeCard from '@/components/EdgeCard';

import BuildForm from './BuildForm';
import OfferVideo from './OfferVideo';

export const metadata: Metadata = {
  title: 'Work With Me',
  description:
    'I build AI tools that handle the repetitive work for small teams: same-day quotes, or no more retyping. Done for you, checked by you, and kept running.',
};

// The two starters, each as the owner's day today and after.
const TASKS = [
  {
    name: 'Same-day quotes',
    today: 'Site-walk notes sit until someone has time to type up the quote.',
    after:
      'Send the notes or a voice memo. A drafted quote, priced from your own price list, comes back for you to check and send.',
  },
  {
    name: 'Stop retyping',
    today:
      'The same customer details get typed into the calendar, the estimate and the invoice.',
    after:
      'Details from forms, PDFs and emails get entered once. Anything unclear waits for you.',
  },
];

const STEPS: [string, string][] = [
  [
    'Send one real example.',
    'A quote you wrote, or a form your team retypes. Free.',
  ],
  ['See a draft built from it', 'within 3 working days.'],
  [
    "If it's useful, I set it up in two weeks.",
    'You approve every draft before it goes out.',
  ],
  [
    'I keep it running.',
    'Fixes, updates when your prices or forms change, and a short call each month.',
  ],
];

const QUESTIONS: [string, string][] = [
  [
    'Do I have to change my software?',
    "No. It works with what you already use, where that software allows it. If it can't connect, I'll tell you before you pay.",
  ],
  [
    'What if it gets something wrong?',
    "Nothing goes to a customer without your OK. Anything it isn't sure about is flagged for you to check.",
  ],
  [
    "Who sees my customers' details?",
    "Only you and me. The AI service I use works under business terms that don't let it train on your data.",
  ],
  [
    "What if you're unavailable?",
    'You own the setup and its written notes, so another developer can pick it up.',
  ],
  [
    'Will my team actually use it?',
    'It slots into the steps they already do, and I walk them through it in one short session.',
  ],
];

// Text in a list, or in a question's answer, takes the card's ink and font,
// as the card's paragraphs do (styles/globals.css colours only p, label and
// small on a glass card).
const INK = 'font-sans text-lg leading-7 text-[color:var(--card-ink)]';

// The consulting offer, for small non-technical teams, ordered as a doubtful
// owner reads it: what it does, a 40-second silent video of it, a free first
// step, who I am, the two tasks, how it works, the price all in, their
// questions, about me, and the form (docs/features/work-with-me.md).
export default function WorkWithMe() {
  return (
    <div className="relative flex size-full justify-end">
      {/* The contact page's card: its glass runs out past the window's
          right side (and a phone's left), and it slides in from the left as
          what is on it fades in. */}
      <EdgeCard className="motion-safe:animate-card-in">
        <article className="flex flex-col gap-4 pb-6 motion-safe:animate-content-in [&_h3]:mt-6">
          <h2>
            I build AI tools that handle the repetitive work for small teams
          </h2>
          <p>
            Done for you, checked by you before anything goes out, and kept
            running.
          </p>
          <OfferVideo />
          <p>
            <a
              href="#ask"
              className="inline-block rounded-md bg-[color:var(--card-ink)] px-5 py-3 font-sans uppercase tracking-wider !text-[color:var(--card-field)] !no-underline"
            >
              Get a free draft
            </a>
            <br />
            <small>
              Tell me what your team does over and over. If I can help,
              I&apos;ll ask for one real example, like a quote you wrote or a
              form you retype, and show you a draft built from it within 3
              working days, before you pay anything.
            </small>
          </p>
          <p>
            I&apos;m Zack Greenbauer, a software engineer for 10+ years. Right
            now I lead AI agent work at a distribution company. You deal with
            me, start to finish.
          </p>

          <h3>Pick one task</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {TASKS.map(({ name, today, after }) => (
              <div
                key={name}
                className="rounded-lg border border-[color:color-mix(in_srgb,var(--card-ink)_25%,transparent)] p-4"
              >
                <h4 className="!text-[color:var(--card-ink)]">{name}</h4>
                <p className="mt-2">
                  <small className="block uppercase tracking-wider">
                    Today
                  </small>
                  {today}
                </p>
                <p>
                  <small className="block uppercase tracking-wider">
                    After
                  </small>
                  {after}
                </p>
              </div>
            ))}
          </div>

          <h3>How it works</h3>
          <ol className={`list-decimal space-y-2 pl-6 ${INK}`}>
            {STEPS.map(([lead, rest]) => (
              <li key={lead}>
                <b className="font-normal">{lead}</b> {rest}
              </li>
            ))}
          </ol>

          <h3>Price, all in</h3>
          <p>
            <span className="text-h3">$3,500 setup</span>
            <br />
            Half to start, half once you&apos;ve approved its first real drafts.
          </p>
          <p>
            <span className="text-h3">$500 a month</span>
          </p>
          <ul className={`list-disc space-y-1 pl-6 ${INK}`}>
            <li>
              Covers fixes, updates and the AI and hosting costs. No other
              bills.
            </li>
            <li>
              Cancel anytime with 30 days&apos; notice. You keep your price
              list, templates and every quote.
            </li>
          </ul>
          <p>
            <b className="font-normal">The first two are free.</b> The first two
            businesses get the setup free. In return I publish a short write-up
            of what changed, with your business named, and you read it before it
            goes up.
          </p>

          <h3>Questions owners ask</h3>
          <div>
            {QUESTIONS.map(([question, answer]) => (
              <details
                key={question}
                className={`border-t border-[color:color-mix(in_srgb,var(--card-ink)_20%,transparent)] py-3 last:border-b ${INK}`}
              >
                <summary className="cursor-pointer">{question}</summary>
                <p className="mt-2">{answer}</p>
              </details>
            ))}
          </div>

          <h3>About me</h3>
          <p>
            I&apos;ve spent 10+ years building the apps customers use and the
            internal tools teams run on.{' '}
            <Link href="/portfolio">See my work</Link>.
          </p>
          <p>
            <small>
              Run a software team? I help there too, and the checks I use are
              public:{' '}
              <a
                href="https://github.com/Greenbauer/vibe-verifier"
                target="_blank"
                rel="noreferrer"
              >
                Vibe Verifier on GitHub
              </a>
              .
            </small>
          </p>

          <h3 id="ask" className="scroll-mt-32">
            Get a free draft
          </h3>
          <BuildForm />
        </article>
      </EdgeCard>
    </div>
  );
}
