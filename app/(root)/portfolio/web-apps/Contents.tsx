import { Content } from '@/types';

const Contents: Content[] = [
  {
    name: 'This web site',
    description: (
      <p>
        The web site you are currently viewing, is for me to showcase my skills,
        experiment, and to master modern web design. I plan on adding many more
        features to it and will build more useful applications to showcase.
        Enjoy!
      </p>
    ),
    technology:
      'AWS, Serverless, Next.js, Node.js, React, Tailwind CSS, three.js',
    repositoryUrl: 'https://github.com/Greenbauer/zack.land',
  },
  {
    name: 'Banner Eyewear',
    description: (
      <p>
        I developed Banner Eyewear so people could create and purchase 3D
        printed sunglasses. The create page has a user interface rendering a
        realistic 3D representation of the real product. Just type some text and
        see that text fit the sides of the sunglasses in 3D. You can also change
        the font, ear tip icons, and colors.{' '}
        <a href="http://www.shapeways.com" target="_blank" rel="noreferrer">
          Shapeways
        </a>
        , one of the world’s largest 3D printing companies, had Banner Eyewear
        featured on their website. Today, the WordPress e-commerce site is no
        longer active. You can still experience the create page however, which
        lives as a lambda function on AWS.
      </p>
    ),
    technology: 'AWS, Serverless, jQuery, PHP, three.js, WordPress',
    siteUrl: 'https://banner-eyewear.zack.land',
    mediaSources: [
      {
        key: '/web-apps/glasses-computer.jpg',
        alt: 'Banner Eyewear',
        type: 'img',
      },
      {
        key: '/web-apps/create-your-own-square.gif',
        alt: 'Banner Eyewear',
        type: 'img',
      },
      {
        key: '/web-apps/selfie-ig.jpg',
        alt: 'Banner Eyewear',
        type: 'img',
      },
    ],
  },
  {
    name: 'Passero',
    description: (
      <p>
        <a href="http://www.travelpassero.com" target="_blank" rel="noreferrer">
          Passero
        </a>{' '}
        is a travel planning technology startup, with an app to help people plan
        for a trip with family and friends. I was a full time founding engineer
        for a little over a year, responsible for building new full stack
        features. I even helped design the logo during a rebranding. Currently,
        I continue to help part time.
      </p>
    ),
    technology:
      'AWS, Serverless, DynamoDB, Node.js, React, Ant Design, Styled Components',
    siteUrl: 'http://app.travelpassero.com',
    mediaSources: [
      {
        key: '/web-apps/passero-app.jpg',
        alt: 'Passero',
        type: 'img',
      },
    ],
  },
  {
    name: 'Perf Sealers',
    description: (
      <p>
        <a href="http://www.perfsealers.com" target="_blank" rel="noreferrer">
          Perf Sealers
        </a>{' '}
        is an oil and gas company that sells dissolvable ball sealers. I help
        with many projects, including building and maintaining their website.
      </p>
    ),
    technology: 'jQuery, MySQL, PHP, WordPress',
    siteUrl: 'http://www.perfsealers.com',
    mediaSources: [
      {
        key: '/web-apps/balls-in-fluid.jpg',
        alt: 'Perf Sealers',
        type: 'img',
      },
    ],
  },
];

export default Contents;
