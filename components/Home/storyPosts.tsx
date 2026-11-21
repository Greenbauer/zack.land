import { Content, MediaSource } from '@/types';

// The home page's chapters that are not portfolio posts (chapters.tsx puts
// them in order with the portfolio's own): Zack's way from mechanical
// engineering to AI agents, told in his voice. Each shows an animated
// illustration (public/story/, made by scripts/story/render.mjs), a silent
// loop as the portfolio's videos are, with its first frame as its poster.
//
// The facts are from Zack's resume. His current employer is not named, and
// nothing here gives numbers from that job.

const loop = (name: string, alt: string): MediaSource => ({
  key: `/story/${name}.mp4`,
  alt,
  type: 'video',
  width: 1280,
  height: 720,
});

export const TEXAS_TECH: Content = {
  name: 'Texas Tech',
  description: (
    <p>
      I started out as a mechanical engineer. I studied mechanical engineering
      at Texas Tech, with a minor in math, from 2007 to 2011. For my senior
      project I designed and tested a pulse jet engine for a model plane. It was
      very loud.
    </p>
  ),
  technology: 'Mechanical Engineering, Mathematics',
  mediaSources: [
    loop(
      'texas-tech',
      'A model plane with a pulse jet engine, which goes bang',
    ),
  ],
};

export const PIPE_ENGINEER: Content = {
  name: 'Pipe Engineer',
  description: (
    <p>
      Then I spent four years in Houston making sure big industrial pipes could
      take the heat and the pressure, to ASME standards. I also tested the
      stress-analysis software we used, and I kept finding bugs in it: 10 to 15
      in every release. I liked the bugs more than the pipes.
    </p>
  ),
  technology: 'Pipe Stress Analysis, ASME Standards, TRIFLEX',
  mediaSources: [
    loop(
      'pipe-engineer',
      'A pipe under stress, then bugs crawling over the software',
    ),
  ],
};

export const FREELANCE: Content = {
  name: 'Freelance Web Developer',
  description: (
    <p>
      So I started building websites on the side, from 2015 to 2018: Shopify,
      Magento and WooCommerce shops for clients, designed mobile first, plus
      React apps and APIs on AWS. Together those shops sold more than $250K a
      year.
    </p>
  ),
  technology: 'Shopify, Magento, WooCommerce, React, Redux, AWS',
  mediaSources: [
    loop('freelance', 'An online shop whose yearly sales count up past $250K'),
  ],
};

export const USAA: Content = {
  name: 'USAA',
  description: (
    <p>
      Then I joined USAA, from 2018 to 2022, first as a software engineer and
      then as a senior. I built a release-management tool that saved thousands
      of hours of repetitive work, then consumer-lending apps in React. I led
      the front end of tricky integrations like single sign-on, and I mentored
      five engineers.
    </p>
  ),
  technology:
    'React, Redux, Jest, React Testing Library, AngularJS, ServiceNow',
  mediaSources: [
    loop('usaa', 'Build, test and release, with five engineers beside them'),
  ],
};

export const GULP: Content = {
  name: 'Gulp',
  description: (
    <p>
      At the same time, from 2023 to 2024, I was one of the first engineers at
      Gulp, a personalized-vitamin shop. I built and launched it with Next.js,
      TypeScript, Stripe and Auth0, and 2,000 people signed up in its first
      three months. Gulp.
    </p>
  ),
  technology: 'Next.js, TypeScript, Stripe, Auth0',
  mediaSources: [loop('gulp', 'A vitamin bottle as signups count up to 2,000')],
};

export const TODAY: Content = {
  name: 'Leading AI Coding Work',
  description: (
    <p>
      Today I lead AI agent work at a distribution company. I direct AI coding
      agents, programs that write much of our code, and I build the tests,
      reviews and checks that keep their work honest.
    </p>
  ),
  technology: 'Claude Code, Codex, TypeScript, CI/CD',
  mediaSources: [loop('today', 'Small agent heads typing lines of code')],
};

export const VIBE_VERIFIER: Content = {
  name: 'Vibe Verifier',
  description: (
    <p>
      Agents are fast, but they&rsquo;re not always right. So on the side I
      built Vibe Verifier, a tool with evals and CI guardrails that checks the
      pull requests AI agents write before a person reviews them.
    </p>
  ),
  technology: 'GitHub Actions, CI/CD, Evals',
  repositoryUrl: 'https://github.com/Greenbauer/vibe-verifier',
  mediaSources: [
    loop('vibe-verifier', 'A list of pull requests, each checked or flagged'),
  ],
};

export const IMPROV: Content = {
  name: 'House Party Improv',
  description: (
    <p>
      In the evenings I&rsquo;m a cast member of House Party Improv in San
      Antonio: listening, teamwork and working together under pressure. Which
      might explain this face.
    </p>
  ),
  mediaSources: [
    loop('improv', 'An improv stage under a spotlight: "Yes, and…"'),
  ],
};

export const WHATS_NEXT: Content = {
  name: "What's Next",
  description: (
    <p>
      What&rsquo;s next? I help software teams get real work out of AI coding
      agents. Let&rsquo;s work together.
    </p>
  ),
  action: { href: '/work-with-me', label: 'Work with me' },
  mediaSources: [
    loop(
      'whats-next',
      "A team's pull request, written by an agent, checked and merged",
    ),
  ],
};
