import { Content } from '@/types';

const Contents: Content[] = [
  {
    name: 'Smart Bed',
    desc: (
      <p>
        I designed and fabricated this king sized smart bed. It is mostly made
        from plywood with walnut veneer added on. I went with a modern floating
        design, where the bed has a hidden base and is mounted to the wall. This
        bed was designed with modularity in mind, where it can break down into
        ten pieces, where each piece can easily be carried by one person. It
        uses load cells to detect when a person is in the bed and on which side.
        Depending on the time of day, and if a person is sleeping, it will set
        several LED strips to a certain color. The LED strips can also be
        controlled with embedded buttons next to the built in night stands. This
        smart bed also has an API that is integrated with my home automation
        system to control other automations throughout the house.
      </p>
    ),
    tech: 'Cinema 4D, Raspberry Pi, Robotics Engineering, Software Engineering, Woodworking',
    repoUrl: 'https://github.com/Greenbauer/smart_bed',
    src: [
      {
        key: '/miscellaneous/bed-1.jpg',
        alt: 'Smart Bed',
        type: 'img',
      },
      {
        key: '/miscellaneous/bed-2.jpg',
        alt: 'Smart Bed',
        type: 'img',
      },
      {
        key: '/miscellaneous/bed-3.jpg',
        alt: 'Smart Bed',
        type: 'img',
      },
      {
        key: '/miscellaneous/bed-4.jpg',
        alt: 'Smart Bed',
        type: 'img',
      },
    ],
  },
  {
    name: 'Parametric Lounge Chair',
    desc: (
      <p>
        I designed and fabricated this flat packed parametric lounge chair. It
        is sculpted from CNC cut pieces of plywood, which interlock to form a
        strong and aesthetically pleasing shape. The high grade veneer core
        plywood is then finished with a polished varnish. In addition, it’s
        mathematically designed to be very comfortable.
      </p>
    ),
    tech: 'Architecture, Cinema 4D, CNC, Illustrator, Laser Cutting, Woodworking',
    src: [
      {
        key: '/miscellaneous/parametric-chair-1.jpg',
        alt: 'Parametric Lounge Chair',
        type: 'img',
      },
      {
        key: '/miscellaneous/parametric-chair-2.jpg',
        alt: 'Parametric Lounge Chair',
        type: 'img',
      },
    ],
  },
  {
    name: 'Buoyancy Sorting Robot',
    desc: (
      <p>
        This is a robot which I designed, programmed, and fabricated for&nbsp;
        <a href="http://www.perfsealers.com" target="_blank" rel="noreferrer">
          Perf Sealers
        </a>
        . This machine sorts plastic balls by buoyancy. It weighs each ball.
        Then determines if it will float, sink, or be neutral in a specified
        fluid. It weighs 1 ball about every 3 seconds and is accurate within a
        percentage of a gram. It is capable of handling different ball sizes as
        well, ranging from 0.625” to 1.25” diameter. An Arduino Mega controls a
        central motor which rotates every 45 degrees. Fabrication materials
        mostly include laser cut acrylic and 3D printed ABS plastic. Six months
        from build completion, it has sorted thousands of balls and is working
        beautifuly.
      </p>
    ),
    tech: '3D Printing, Arduino, AutoCAD, Laser Cutting, Mechanical Engineering, Robotics Engineering, SolidWorks',
    src: [
      {
        key: 'CnYKbnzrn4k',
        alt: 'Buoyancy Robot',
        type: 'YouTube',
      },
      {
        key: '/miscellaneous/gears.gif',
        alt: 'Buoyancy Robot',
        type: 'img',
      },
      {
        key: '/miscellaneous/ballSortB.jpg',
        alt: 'Buoyancy Sorting Robot',
        type: 'img',
      },
    ],
  },
  {
    name: 'Night Shift Lens',
    desc: (
      <p>
        As it’s known, orange tinted light at night is good for our circadian
        rhythm. I wanted my projector to have this feature, so I made this
        little robot. Every evening an Arduino rotates a servo, which moves an
        orange lens filter in front of a projector lens. Then, early the
        morning, it rotates back. The casing is 3D printed, painted and sanded
        to create a sleek black look. It’s also adjustable and will fit most
        projector setups.
      </p>
    ),
    tech: '3D Printing, Arduino, AutoCAD, Mechanical Engineering, Robotics Engineering, SolidWorks',
    repoUrl: 'https://github.com/Greenbauer/night-shift-lens',
    src: [
      {
        key: '/miscellaneous/night-lens.gif',
        alt: 'Night Shift Lens',
        type: 'img',
      },
    ],
  },
  {
    name: 'Shofar Mount',
    desc: (
      <p>
        This is a very simple custom mount to hold a Shofar upright on the wall.
        It’s made from matte black laser cut acrylic. It was a fun challenge
        figuring out how to design around the complex geometry of the shofar.
      </p>
    ),
    tech: 'Cinema 4D, Illustrator, Laser Cutting, Photogrammetry',
    src: [
      {
        key: '/miscellaneous/shofarA.jpg',
        alt: 'Shofar Mount',
        type: 'img',
      },
      {
        key: '/miscellaneous/shofarB.jpg',
        alt: 'Shofar Mount',
        type: 'img',
      },
      {
        key: '/miscellaneous/shofarC.jpg',
        alt: 'Shofar Mount',
        type: 'img',
      },
      {
        key: '/miscellaneous/shofarD.jpg',
        alt: 'Shofar Mount',
        type: 'img',
      },
    ],
  },
];

export default Contents;
