import { Metadata } from 'next';

import EdgeCard from '@/components/EdgeCard';

import BuildForm from './BuildForm';

export const metadata: Metadata = {
  title: 'Work With Me',
  description:
    "I build AI tools that take one repetitive task off a small team's plate: same-day quotes, or no more retyping. Done for you and checked by a person.",
};

// The two starters, in the order the page shows them. Each is a fixed setup
// fee and a monthly fee to keep it running (docs/features/work-with-me.md).
const STARTERS = [
  {
    name: 'Same-day quotes',
    pitch:
      'Send a recording or notes from the site walk. A drafted quote comes back for you to check and send.',
    points: [
      'Built around your prices and the way you write quotes now.',
      'Every draft waits for your OK before a customer sees it.',
      'When your prices change, I update it.',
    ],
  },
  {
    name: 'Stop retyping the same information',
    pitch:
      'Details from forms, PDFs and emails get entered into your software once, instead of typed into the calendar, the estimate and the invoice.',
    points: [
      "Anything it isn't sure about waits for you to check.",
      'Connects to the software you already use, where that software allows it.',
    ],
  },
];

// The consulting offer, for small non-technical teams: two starters, the
// first two setups free for a write-up, current work, and a two-field ask
// that mails through /api/email.
export default function WorkWithMe() {
  return (
    <div className="relative flex size-full justify-end">
      {/* The contact page's card: its glass runs out past the window's
          right side (and a phone's left), and it slides in from the left as
          what is on it fades in. */}
      <EdgeCard className="motion-safe:animate-card-in md:max-w-2xl">
        <article className="flex flex-col gap-4 pb-6 motion-safe:animate-content-in [&_h3]:mt-4">
          <h2>
            I build AI tools that take one repetitive task off a small
            team&apos;s plate
          </h2>
          <p>
            Done for you, checked by a person, and kept running. You approve
            everything before it goes out.
          </p>

          {STARTERS.map(({ name, pitch, points }) => (
            <div key={name} className="contents">
              <h3>{name}</h3>
              <p>{pitch}</p>
              <p>
                <span className="text-h3">$3,500 setup</span>
                <br />
                Then $500 a month to keep it running. Ready in two weeks.
              </p>
              <ul className="list-disc space-y-1 pl-6 font-sans text-lg leading-7 text-[color:var(--card-ink)]">
                {points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          ))}

          <h3>The first two are free</h3>
          <p>
            The first two businesses get the setup free. In return, I publish a
            short write-up of what changed, with your business named.
          </p>

          <h3>Where I&apos;m at</h3>
          <p>Right now I lead AI agent work at a distribution company.</p>
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

          <div className="mt-4">
            <BuildForm />
          </div>
        </article>
      </EdgeCard>
    </div>
  );
}
