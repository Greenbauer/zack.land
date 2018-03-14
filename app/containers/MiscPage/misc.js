import React from 'react'
import { Link } from 'react-router-dom'

import ParaChairA from './images/glamor-side.jpg'
import shofarA from './images/shofarA.jpg'
import shofarB from './images/shofarB.jpg'
import shofarC from './images/shofarC.jpg'
import shofarD from './images/shofarD.jpg'
import ballSortA from './images/gears.gif'
import ballSortB from './images/ballSortB.jpg'
import nightLensA from './images/night-lens.gif'

const Data = {
  misc: [
    {
      id: 4,
      name: "Parametric Lounge Chair",
      desc: (
        <p>
          I designed and fabricated this flat packed parametric lounge chair.
          It is sculpted from CNC cut pieces of plywood, which interlock to form a strong and aesthetically pleasing shape.
          The high grade veneer core plywood is then finished with a polished varnish.
          In addition, it’s mathematically designed to be very comfortable.
          And, trust me when I say, that it’s like nothing you have ever seen before.
          More images will be posted soon.
        </p>
      ),
      tech: "Architecture, Cinema 4D, CNC, Illustrator, Laser Cutting, Woodworking",
      src: [
        {
        name: ParaChairA,
        alt: "Parametric Lounge Chair",
        type: "img"
        }
      ]
    },
    {
      id: 3,
      name: "Buoyancy Sorting Robot",
      desc: (
        <p>
          This is a robot which I designed, programmed, and fabricated for <a href={'http://www.perfsealers.com'}>Perf Sealers</a>.
          This machine sorts plastic balls by buoyancy.
          It weighs each ball. Then determines if it will float, sink, or be neutral in a specified fluid.
          It weighs 1 ball about every 3 seconds and is accurate within a percentage of a gram.
          It is capable of handling different ball sizes as well, ranging from 0.625” to 1.25” diameter.
          An Arduino Mega controls a central motor which rotates every 45 degrees.
          Fabrication materials mostly include laser cut acrylic and 3D printed ABS plastic.
          Six months from build completion, it has sorted thousands of balls and is working beautifuly.
        </p>
      ),
      tech: "3D Printing, Arduino, AutoCAD, Laser Cutting, Mechanical Engineering, Robotics Engineering, SolidWorks",
      src: [
        {
          name: "CnYKbnzrn4k",
          alt: "Buoyancy Robot",
          type: "YouTube"
        },
        {
          name: ballSortA,
          alt: "Buoyancy Robot",
          type: "img"
        },
        {
          name: ballSortB,
          alt: "Buoyancy Sorting Robot",
          type: "img"
        }
      ]
    },
    {
      id: 2,
      name: "Night Shift Lens",
      desc: (
        <p>
          As it’s known, orange tinted light at night is good for our circadian rhythm.
          I wanted my projector to have this feature, so I made this little robot.
          Every evening an Arduino rotates a servo, which moves an orange lens filter in front of a projector lens.
          Then, early the morning, it rotates back.
          The casing is 3D printed, painted and sanded to create a sleek black look.
          It’s also adjustable and will fit most projector setups.
        </p>
      ),
      tech: "3D Printing, Arduino, AutoCAD, Mechanical Engineering, Robotics Engineering, SolidWorks",
      repo: "https://github.com/Greenbauer/night-shift-lens",
      src: [
        {
          name: nightLensA,
          alt: "Night Shift Lens",
          type: "img"
        }
      ]
    },
    {
      id: 1,
      name: "Shofar Mount",
      desc: (
        <p>
          This is a very simple custom mount to hold a Shofar upright on the wall.
          It’s made from matte black laser cut acrylic.
          It was a fun challenge figuring out how to fit my design with the complex geometry of the shofar.
        </p>
      ),
      tech: "Cinema 4D, Illustrator, Laser Cutting, Photogrammetry",
      src: [
        {
          name: shofarA,
          alt: "Shofar Mount",
          type: "img"
        },
        {
          name: shofarB,
          alt: "Shofar Mount",
          type: "img"
        },
        {
          name: shofarC,
          alt: "Shofar Mount",
          type: "img"
        },
        {
          name: shofarD,
          alt: "Shofar Mount",
          type: "img"
        }
      ]
    }
  ]
}

export default Data
