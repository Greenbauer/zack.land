import { Content } from '@/types';

const Contents: Content[] = [
  {
    name: 'This web site',
    desc: (
      <p>
        The web site you are currently viewing, is for me to showcase my skills,
        experiment, and to master modern web design. I plan on adding many more
        features to it and will build more useful applications to showcase.
        Enjoy!
      </p>
    ),
    tech: 'AWS, Serverless, Next.js, Node.js, React, Sass, three.js',
    repoUrl: 'https://github.com/Greenbauer/zack.land',
  },
  {
    name: 'Banner Eyewear',
    desc: (
      <p>
        I developed Banner Eyewear so people could create and purchase 3D
        printed sunglasses. The create page has a user interface rendering a
        realistic 3D representation of the real product. Just type some text and
        see that text fit the sides of the sunglasses in 3D. You can also change
        the font, ear tip icons, and colors.&nbsp;
        <a href="http://www.shapeways.com" target="_blank" rel="noreferrer">
          Shapeways
        </a>
        , one of the world’s largest 3D printing companies, had Banner Eyewear
        featured on their website. Today, the WordPress e-commerce site is no
        longer active. You can still experience the create page however, which
        lives as a lambda function on AWS.
      </p>
    ),
    tech: 'AWS, Serverless, jQuery, PHP, three.js, WordPress',
    siteUrl: 'https://banner-eyewear.zack.land',
    src: [
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
    name: 'Perf Sealers',
    desc: (
      <p>
        <a href="http://www.perfsealers.com" target="_blank" rel="noreferrer">
          Perf Sealers
        </a>
        &nbsp;is an oil and gas company that sells dissolvable ball sealers. I
        help with many projects, including building and maintaining their
        website.
      </p>
    ),
    tech: 'jQuery, MySQL, PHP, WordPress',
    siteUrl: 'http://www.perfsealers.com',
    src: [
      {
        key: '/web-apps/balls-in-fluid.jpg',
        alt: 'Perf Sealers',
        type: 'img',
      },
    ],
  },
];

export default Contents;
