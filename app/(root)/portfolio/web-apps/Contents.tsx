import { Content } from '@/types';

const posts: Content[] = [
  {
    name: 'This website',
    coded: 'vibe',
    description: (
      <p>
        And then there&rsquo;s this website, the one you&rsquo;re on. I built it
        to show what I can make and to try new ideas, writing it with AI coding
        agents. Wait. That&rsquo;s me. I built this head too, and every face it
        makes.
      </p>
    ),
    technology:
      'AWS, Serverless, Next.js, Node.js, React, Tailwind CSS, three.js',
    repositoryUrl: 'https://github.com/Greenbauer/zack.land',
  },
  {
    name: 'Banner Eyewear',
    coded: 'hand',
    description: (
      <p>
        Banner Eyewear was my first coding project, and the one that made me
        switch to software. I built it so people could design and buy their own
        3D-printed sunglasses: type some text and watch it wrap around the arms
        of a realistic 3D pair, then pick the font, the ear tip icons and the
        colors.{' '}
        <a href="https://www.shapeways.com" target="_blank" rel="noreferrer">
          Shapeways
        </a>
        , one of the world&rsquo;s largest 3D printing companies, featured it on
        its website. The WordPress shop has closed, but the designer still lives
        on as a static site on AWS, so you can still make a pair.
      </p>
    ),
    technology: 'AWS, Serverless, jQuery, PHP, three.js, WordPress',
    siteUrl: 'https://banner-eyewear.zack.land',
    mediaSources: [
      {
        key: '/web-apps/glasses-computer.jpg',
        alt: "A hand holding Banner sunglasses in front of a laptop showing the same pair on Banner Eyewear's create page",
        type: 'img',
        width: 960,
        height: 540,
        main: true,
      },
      {
        key: '/web-apps/create-your-own-square.mp4',
        alt: "Banner Eyewear's create page turning a 3D pair of sunglasses with ENTER TEXT along the arm",
        type: 'video',
        width: 428,
        height: 428,
      },
      {
        key: '/web-apps/selfie-ig.jpg',
        alt: 'A woman wearing Banner sunglasses with custom lettering along the arm',
        type: 'img',
        width: 569,
        height: 569,
      },
    ],
  },
  {
    name: 'Passero',
    description: (
      <p>
        <a
          href="https://www.travelpassero.com"
          target="_blank"
          rel="noreferrer"
        >
          Passero
        </a>{' '}
        is a travel planning technology startup, with an app to help people plan
        for a trip with family and friends. I was a full-time founding engineer
        for a little over a year, responsible for building new full-stack
        features. I even helped design the logo during a rebranding. I still
        help part-time.
      </p>
    ),
    technology:
      'AWS, Serverless, DynamoDB, Node.js, React, Ant Design, Styled Components',
    siteUrl: 'https://app.travelpassero.com',
    mediaSources: [
      {
        key: '/web-apps/passero-app.jpg',
        alt: "The trip planner's idea cards for snorkeling in Mauritius, a mountain in Peru and surfing in Cape Town",
        type: 'img',
        width: 2048,
        height: 1205,
      },
    ],
  },
  {
    name: 'Perf Sealers',
    description: (
      <p>
        <a href="https://www.perfsealers.com" target="_blank" rel="noreferrer">
          Perf Sealers
        </a>{' '}
        is an oil and gas company that sells dissolvable ball sealers. I help
        with many projects, including building and maintaining their website.
      </p>
    ),
    technology: 'jQuery, MySQL, PHP, WordPress',
    siteUrl: 'https://www.perfsealers.com',
    mediaSources: [
      {
        key: '/web-apps/balls-in-fluid.jpg',
        alt: 'Green ball sealers sinking among bubbles through a dark fluid',
        type: 'img',
        width: 960,
        height: 768,
      },
    ],
  },
];

export default posts;
