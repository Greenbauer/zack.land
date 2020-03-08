import React from 'react'

import BannerEyewearA from './images/glasses computer.jpg'
import BannerEyewearB from './images/create-your-own-square.gif'
import BannerEyewearC from './images/selfie-ig.jpg'
import PerfSealersA from './images/balls-in-fluid.jpg'

export default [
  {
    name: 'Banner Eyewear',
    desc: (
      <p>
        Banner Eyewear was developed so people could create and purchase 3D
        printed sunglasses. The create page has an advanced user interface,
        where text is warped and extruded, rendering a realistic 3D
        representation of the real product. Just type text and see that text
        warped to fit the temples. You can also change the font, ear tip icons,
        and colors.&nbsp;
        <a href="http://www.shapeways.com" target="_blank">
          Shapeways
        </a>
        , one of the world’s largest 3D printing companies, has Banner Eyewear
        featured on their website.
      </p>
    ),
    tech: 'jQuery, MySQL, PHP, three.js, webGL, WordPress, WooCommerce',
    url: '/banner-eyewear',
    src: [
      {
        name: BannerEyewearA,
        alt: 'Banner Eyewear',
        type: 'img',
      },
      {
        name: BannerEyewearB,
        alt: 'Banner Eyewear',
        type: 'img',
      },
      {
        name: BannerEyewearC,
        alt: 'Banner Eyewear',
        type: 'img',
      },
    ],
  },
  {
    name: 'perfsealers.com',
    desc: (
      <p>
        <a href="http://www.perfsealers.com" target="_blank">
          Perf Sealers
        </a>
        &nbsp; is an oil and gas company that sells dissolvable ball sealers. I
        help with many projects, including building and maintaining their
        website.
      </p>
    ),
    tech: 'jQuery, MySQL, PHP, WordPress',
    url: 'http://www.perfsealers.com',
    src: [
      {
        name: PerfSealersA,
        alt: 'Perf Sealers',
        type: 'img',
      },
    ],
  },
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
    tech:
      'AWS, Express, Node.js, MongoDB, React, Redux, Styled Components, three.js',
    repo: 'https://github.com/Greenbauer/zack-land',
  },
]
