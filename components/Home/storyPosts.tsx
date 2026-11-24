import { Content, MediaSource } from '@/types';

// The home page's chapters that are not portfolio posts (chapters.tsx puts
// them in order with the portfolio's own): Zack's way from mechanical
// engineering to AI agents, told in his voice. Each shows silent loops, as
// the portfolio's videos are, each one's first frame its poster
// (components/videoPoster.ts): animated illustrations (public/story/,
// recorded by scripts/story/render.mjs from scripts/story/), or for Gulp the
// real site he built, scrolling. Improv shows photos instead. Texas Tech and
// What's Next have none, and are told on the head itself (their props,
// chapters.ts).
//
// The facts are from Zack's resume. His current employer is not named, and
// nothing here gives numbers from that job.

const loop = (
  name: string,
  alt: string,
  width = 1280,
  height = 720,
): MediaSource => ({
  key: `/story/${name}.mp4`,
  alt,
  type: 'video',
  width,
  height,
});

export const TEXAS_TECH: Content = {
  name: 'Texas Tech',
  description: (
    <p>
      Hi, I&rsquo;m Zack. Well, the head part. I went to Texas Tech from 2007 to
      2011 for mechanical engineering, with a minor in math. I&rsquo;m still a
      Red Raiders fan, and yes, I threw my share of tortillas at kickoff. They
      banned that in 2025. Not my fault. Probably. My senior project was a pulse
      jet engine. It was very loud.
    </p>
  ),
  technology: 'Mechanical Engineering, Mathematics',
};

export const PIPE_ENGINEER: Content = {
  name: 'Pipe Engineer',
  description: (
    <p>
      Then I spent four years in Houston making sure huge industrial pipes could
      take the heat and the pressure without bursting. I also tested the
      stress-analysis software we used, and I kept finding bugs in it: 10 to 15
      in every release.
    </p>
  ),
  technology: 'Pipe Stress Analysis, ASME Standards, TRIFLEX',
  mediaSources: [
    loop(
      'pipe-engineer',
      'A pipe in stress-analysis software, coloured by its stress, as bug reports pop up over it',
    ),
  ],
};

export const FREELANCE: Content = {
  name: 'Freelance Web Developer',
  description: (
    <p>
      So I started building websites on the side, from 2015 to 2018: online
      shops on Shopify, Magento and WooCommerce, built for phones first, plus
      React apps and APIs on AWS. Together my clients&rsquo; shops sold over
      $250K a year. Their money, sadly, not mine.
    </p>
  ),
  technology: 'Shopify, Magento, WooCommerce, React, Redux, AWS',
  mediaSources: [
    loop(
      'freelance',
      'A shop page drawn as wireframes, on a desktop and a phone, as a cursor reworks it',
    ),
  ],
};

export const USAA: Content = {
  name: 'USAA',
  description: (
    <p>
      Then I joined USAA, from 2018 to 2022, first as a software engineer and
      then as a senior (the job, not the age). The best thing I built there was
      a release tool that took thousands of hours of repetitive work off
      people&rsquo;s plates. Still my favorite kind of work. After that I built
      lending apps in React, led the front end of the work that let people sign
      in once across apps, and mentored five engineers.
    </p>
  ),
  technology:
    'React, Redux, Jest, React Testing Library, AngularJS, ServiceNow',
};

export const GULP: Content = {
  name: 'Gulp',
  description: (
    <p>
      Meanwhile, from 2023 to 2024, I was one of the first engineers at Gulp, a
      personalized-vitamin shop. I built and launched it with Next.js,
      TypeScript, Stripe and Auth0, and 2,000 people signed up in its first
      three months. Gulp.
    </p>
  ),
  technology: 'Next.js, TypeScript, Stripe, Auth0',
  mediaSources: [
    loop('gulp-site', "Gulp's home page, scrolling, on a desktop"),
    loop('gulp-phone', "Gulp's home page, scrolling, on a phone", 432, 842),
  ],
};

export const TODAY: Content = {
  name: 'Leading AI Agents',
  description: (
    <p>
      Today I lead AI agent work at a distribution company. Agents write code
      fast, but not always right, so on the side I built Vibe Verifier, an
      open-source checker. Trust, but verify. Mostly verify.
    </p>
  ),
  technology: 'Claude Code, Codex, TypeScript, GitHub Actions, CI/CD, Evals',
  repositoryUrl: 'https://github.com/Greenbauer/vibe-verifier',
  mediaSources: [
    loop(
      'vibe-verifier',
      "Vibe Verifier's checks on this website's own pull request, each passing",
    ),
  ],
};

export const IMPROV: Content = {
  name: 'House Party Improv',
  description: (
    <p>
      In the evenings I&rsquo;m a cast member of House Party Improv in San
      Antonio. Improv taught me to listen, say &ldquo;yes, and&rdquo; and keep
      going when nothing goes to plan. Which might explain this face.
    </p>
  ),
  // The theater's own logo and Zack's cast photo, from its site.
  mediaSources: [
    {
      key: '/story/improv-cast.jpg',
      alt: 'Zack in a mariachi hat and suit, his House Party Improv cast photo',
      type: 'img',
      width: 1280,
      height: 1600,
    },
    {
      key: '/story/improv-logo.jpg',
      alt: 'The House Party Improv logo: a house over San Antonio',
      type: 'img',
      width: 800,
      height: 800,
    },
  ],
};

export const WHATS_NEXT: Content = {
  name: "What's Next",
  description: (
    <p>
      What&rsquo;s next? I build AI tools that handle the repetitive work for
      small teams, and I help software teams get real work out of AI coding
      agents. Let&rsquo;s talk. I&rsquo;ll bring the head.
    </p>
  ),
  action: { href: '/work-with-me', label: 'Work with me' },
};
