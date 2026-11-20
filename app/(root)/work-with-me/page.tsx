import { Metadata } from 'next';

import EdgeCard from '@/components/EdgeCard';

import BuildForm from './BuildForm';

export const metadata: Metadata = {
  title: 'Work With Me',
  description:
    'I help software teams get real work out of AI coding agents: one repository made agent-ready in two weeks, for a fixed price.',
};

// The consulting offer: who it is for, the one fixed-price starter, the
// first two builds free for a write-up, current work, and a two-field ask
// that mails through /api/email (docs/features/work-with-me.md).
export default function WorkWithMe() {
  return (
    <div className="relative flex size-full justify-end">
      {/* The contact page's card: its glass runs out past the window's
          right side (and a phone's left), and it slides in from the left as
          what is on it fades in. */}
      <EdgeCard className="motion-safe:animate-card-in md:max-w-2xl">
        <article className="flex flex-col gap-4 pb-6 motion-safe:animate-content-in [&_h3]:mt-4">
          <h2>I help software teams get real work out of AI coding agents</h2>
          <p>
            Your team already has Claude Code, Cursor or Codex. I set up one
            repository so every pull request an agent writes is tested and
            checked before a person reviews it.
          </p>

          <h3>Agent-ready repo</h3>
          <p>
            <span className="text-h3">$7,500 fixed</span>
            <br />
            Done in two weeks.
          </p>
          <ul className="list-disc space-y-1 pl-6 font-sans text-lg leading-7 text-[color:var(--card-ink)]">
            <li>Written rules so the agents know how your repository works.</li>
            <li>
              Tests and checks that run on every pull request an agent opens.
            </li>
            <li>
              A check that opens each change in a real browser and tests it
              against what it was meant to do.
            </li>
            <li>A handover so your team can keep it running without me.</li>
          </ul>
          <p>Bigger work is quoted after the first two weeks.</p>

          <h3>The first two are free</h3>
          <p>
            The first two teams get the build free. In return, I publish a
            write-up of what changed, with your team named.
          </p>

          <h3>Where I&apos;m at</h3>
          <p>
            Right now I lead AI agent work at a distribution company. The checks
            I use are public:{' '}
            <a
              href="https://github.com/Greenbauer/vibe-verifier"
              target="_blank"
              rel="noreferrer"
            >
              Vibe Verifier on GitHub
            </a>
            .
          </p>

          <div className="mt-4">
            <BuildForm />
          </div>
        </article>
      </EdgeCard>
    </div>
  );
}
