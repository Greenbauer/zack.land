import { Content } from '@/types';

const posts: Content[] = [
  {
    name: 'Smart Bed',
    description: (
      <p>
        I like building things you can touch, too. This king-size smart bed is
        plywood with walnut veneer, and its base is hidden, so it seems to float
        off the wall it mounts to. It breaks down into ten pieces, each light
        enough for one person to carry, so moving day is not a crisis. Its
        brains are on their fifth circuit board, which I designed myself. The
        first four taught me a lot. Load cells tell it when someone is in bed
        and on which side, and it sets its LED strips by the time of day and
        whether you&rsquo;re asleep. Buttons by the built-in nightstands work
        the lights too, for when you want to be in charge. It even has its own
        API, tied into my home automation, so the bed can talk to the rest of
        the house. How well does it sleep? No idea. I don&rsquo;t lie down. I
        don&rsquo;t even have a back.
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
        This flat-pack parametric lounge chair is CNC-cut pieces of high-grade
        veneer-core plywood that slot together into one strong, good-looking
        shape, finished in a polished varnish. I designed its curve with math,
        so it&rsquo;s comfortable on purpose, not by luck, and assembled every
        piece myself. I&rsquo;d sit in it, but I&rsquo;m just a head.
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
        For&nbsp;
        <a href="https://www.perfsealers.com" target="_blank" rel="noreferrer">
          Perf Sealers
        </a>
        , I designed, programmed and built a robot that sorts plastic balls by
        buoyancy: whether each will float, sink or hover in a given fluid. It
        weighs every ball to a fraction of a gram, works out where it belongs,
        and moves on to the next about every 3 seconds. It takes balls of
        different sizes, from 0.625&rdquo; to 1.25&rdquo; across. An Arduino
        Mega runs one central motor that turns 45 degrees at a time. I drew it
        up in SolidWorks and AutoCAD, and the body is laser-cut acrylic and
        3D-printed ABS plastic. Six months after I built it, it had sorted
        thousands of balls and was still going strong. Most patient coworker
        I&rsquo;ve ever had.
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
        A simple one: a wall mount that holds a shofar, a ram&rsquo;s-horn
        trumpet, upright. It&rsquo;s matte black laser-cut acrylic, and fitting
        it around the shofar&rsquo;s twisting shape was a fun challenge. I tried
        to blow it. No lungs.
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
