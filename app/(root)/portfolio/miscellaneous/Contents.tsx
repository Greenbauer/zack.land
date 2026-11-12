import { Content } from '@/types';

const posts: Content[] = [
  {
    name: 'Smart Bed',
    description: (
      <p>
        I designed and fabricated this king-size smart bed. It is mostly made
        from plywood with walnut veneer added on. I went with a modern floating
        design, where the bed has a hidden base and is mounted to the wall. This
        bed was designed with modularity in mind: it breaks down into ten
        pieces, each light enough for one person to carry. It uses load cells to
        detect when a person is in the bed and on which side. Depending on the
        time of day, and if a person is sleeping, it will set several LED strips
        to a certain color. The LED strips can also be controlled with embedded
        buttons next to the built-in nightstands. This smart bed also has an API
        that is integrated with my home automation system to control other
        automations throughout the house.
      </p>
    ),
    technology:
      'Cinema 4D, Raspberry Pi, Robotics Engineering, Software Engineering, Woodworking',
    repositoryUrl: 'https://github.com/Greenbauer/smart_bed',
    mediaSources: [
      {
        key: '/miscellaneous/bed-1.jpg',
        alt: 'The walnut smart bed floating off the floor, its LED strips glowing white',
        type: 'img',
        width: 700,
        height: 700,
      },
      {
        key: '/miscellaneous/bed-2.jpg',
        alt: 'The smart bed at night, its LED strips glowing red underneath',
        type: 'img',
        width: 700,
        height: 700,
      },
      {
        key: '/miscellaneous/bed-3.jpg',
        alt: "The smart bed's pieces laid out on the floor before assembly",
        type: 'img',
        width: 700,
        height: 700,
      },
      {
        key: '/miscellaneous/bed-4.jpg',
        alt: "Inside the smart bed's base: circuit boards and wiring between plywood ribs",
        type: 'img',
        width: 1440,
        height: 1440,
      },
    ],
  },
  {
    name: 'Parametric Lounge Chair',
    description: (
      <p>
        I designed and fabricated this flat-pack parametric lounge chair. It is
        sculpted from CNC-cut pieces of plywood, which interlock to form a
        strong and aesthetically pleasing shape. The high grade veneer core
        plywood is then finished with a polished varnish. In addition, it’s
        mathematically designed to be very comfortable.
      </p>
    ),
    technology:
      'Architecture, Cinema 4D, CNC, Illustrator, Laser Cutting, Woodworking',
    mediaSources: [
      {
        key: '/miscellaneous/parametric-chair-1.jpg',
        alt: 'The parametric lounge chair from the front, with white cushions and a fur throw',
        type: 'img',
        width: 700,
        height: 700,
      },
      {
        key: '/miscellaneous/parametric-chair-2.jpg',
        alt: 'The lounge chair from the side, showing its interlocking plywood ribs',
        type: 'img',
        width: 700,
        height: 700,
      },
    ],
  },
  {
    name: 'Buoyancy Sorting Robot',
    description: (
      <p>
        This is a robot which I designed, programmed, and fabricated for&nbsp;
        <a href="https://www.perfsealers.com" target="_blank" rel="noreferrer">
          Perf Sealers
        </a>
        . This machine sorts plastic balls by buoyancy. It weighs each ball,
        then works out whether it will float, sink, or stay neutral in a
        specified fluid. It weighs one ball about every 3 seconds and is
        accurate to a fraction of a gram. It can handle different ball sizes as
        well, from 0.625” to 1.25” in diameter. An Arduino Mega controls a
        central motor which rotates every 45 degrees. Fabrication materials
        mostly include laser-cut acrylic and 3D-printed ABS plastic. Six months
        after it was built, it has sorted thousands of balls and is working
        beautifully.
      </p>
    ),
    technology:
      '3D Printing, Arduino, AutoCAD, Laser Cutting, Mechanical Engineering, Robotics Engineering, SolidWorks',
    mediaSources: [
      {
        key: 'CnYKbnzrn4k',
        alt: 'Buoyancy Sorting Robot video',
        type: 'YouTube',
      },
      {
        key: '/miscellaneous/gears.mp4',
        alt: "The sorting robot's clear acrylic gears turning, driven by a servo",
        type: 'video',
        width: 600,
        height: 600,
      },
      {
        key: '/miscellaneous/ballSortB.jpg',
        alt: "The sorting robot's Arduino and wiring on a clear acrylic base",
        type: 'img',
        width: 960,
        height: 960,
      },
    ],
  },
  {
    name: 'Shofar Mount',
    description: (
      <p>
        This is a very simple custom mount to hold a shofar upright on the wall.
        It’s made from matte black laser-cut acrylic. It was a fun challenge
        figuring out how to design around the complex geometry of the shofar.
      </p>
    ),
    technology: 'Cinema 4D, Illustrator, Laser Cutting, Photogrammetry',
    mediaSources: [
      {
        key: '/miscellaneous/shofarA.jpg',
        alt: 'A shofar held upright on a wall by the black acrylic mount',
        type: 'img',
        width: 960,
        height: 1285,
      },
      {
        key: '/miscellaneous/shofarB.jpg',
        alt: 'The mounted shofar from another angle',
        type: 'img',
        width: 960,
        height: 1285,
      },
      {
        key: '/miscellaneous/shofarC.jpg',
        alt: 'The black laser-cut acrylic mount on its own',
        type: 'img',
        width: 960,
        height: 1285,
      },
      {
        key: '/miscellaneous/shofarD.jpg',
        alt: 'A 3D model of the shofar on its mount, in Cinema 4D',
        type: 'img',
        width: 960,
        height: 1285,
      },
    ],
  },
];

export default posts;
