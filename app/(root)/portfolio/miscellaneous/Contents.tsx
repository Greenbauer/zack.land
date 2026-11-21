import { Content } from '@/types';

const posts: Content[] = [
  {
    name: 'Smart Bed',
    description: (
      <p>
        I like building things you can touch, too, not just software. I designed
        and built this king-size smart bed myself, mostly from plywood with
        walnut veneer added on. I went with a modern floating design: its base
        is hidden and it mounts to the wall. I made it modular, too: it breaks
        down into ten pieces, each light enough for just one person to carry. It
        uses load cells to tell when someone is in bed, and on which side
        they&rsquo;re lying. Depending on the time of day, and whether
        you&rsquo;re asleep, it sets several LED strips to a certain color, and
        buttons built in next to the nightstands control the LED strips by hand
        too. It also has its own API, which ties into my home automation system
        to run other automations throughout the rest of the house.
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
        I designed and built this flat-pack parametric lounge chair. I sculpted
        it from CNC-cut pieces of high-grade veneer-core plywood that interlock
        into one strong, good-looking shape, then finished the whole thing in a
        polished varnish. Its curve is worked out mathematically to be very
        comfortable. I&rsquo;d sit in it, but I&rsquo;m just a head.
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
        , I designed, programmed and built a custom robot that sorts plastic
        balls by buoyancy. It weighs each ball, then works out whether it will
        float, sink or stay neutral in a given fluid. It weighs one ball about
        every 3 seconds or so, accurate to a fraction of a gram, and it can
        handle different ball sizes as well, from 0.625&rdquo; to 1.25&rdquo;
        across. An Arduino Mega controls a single central motor that turns 45
        degrees at a time, and I built it mostly from laser-cut acrylic and
        3D-printed ABS plastic. Six months after I built it, it had already
        sorted thousands of balls and was still working beautifully, day in and
        day out.
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
