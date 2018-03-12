// head rotation for background

let cnt = 0
let cntReset = 300
let cntStop = false
let lookRandom = {x: 0, y: 0}

const random = (min, max) => {
  return Math.floor(Math.random() * (max - min)) + min
}

// rotation limit
const limit = (dir, min, max) => {
  switch(true) {
    case (dir > max):
      return dir = max
      break
    case (dir < min):
      return dir = min
      break
    default:
      return dir
  }
}

const headRotation = (rotation, mouse) => {

  // set look position
  let look = {
    x: mouse.x,
    y: mouse.y
  }

  let speed = 0.05

  // if mouse has moved
  if (mouse.start) {
    cnt = 0
    mouse.start = false
    cntStop = false

  // if mouse has not moved
  } else {
    // look at the random spot when the counter has finished
    if (cntStop) {
      look = {
        x: lookRandom.x,
        y: lookRandom.y
      }

      speed = 0.01
    }

    // sets timer for auto rotation
    cnt++

    if (cnt > cntReset) {
      cnt = 0
      cntReset = random(300, 800)
      cntStop = true

      // sets a random spot to look at
      lookRandom = {
        x: random(1200, -2000),
        y: random(520, -600)
      }
    }
  }

  // set rotation limit
  look = {
    x: limit(look.x * 0.001, -0.5, 0.3),
    y: limit(look.y * 0.001, -0.15, 0.13)
  }

  // rotate
  rotation.x +=  speed * ( look.y - rotation.x )
  rotation.y +=  speed * ( look.x - rotation.y )
}

export default headRotation
