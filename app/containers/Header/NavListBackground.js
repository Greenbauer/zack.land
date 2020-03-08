import styled from 'styled-components'
import React, { useState, useEffect } from 'react'

import {
  darkBlueColor,
  cyanColor,
  pinkColor,
  yellowColor,
  darkestColor,
} from 'global-styles'

const StyledNavListBackground = styled.div.attrs(props => ({
  style: {
    backgroundPositionX: `${props.mouse.x}%`,
  },
}))`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: -1;

  background: ${darkestColor}
    linear-gradient(
      60deg,
      ${yellowColor} 5%,
      ${pinkColor},
      ${cyanColor} 30%,
      ${darkBlueColor} 40%,
      ${darkestColor} 50%,
      ${darkBlueColor} 60%,
      ${cyanColor} 70%,
      ${pinkColor} 85%,
      ${yellowColor} 95%
    );
  background-size: auto auto;
  background-size: 300% 100%;
  transition: transform 0.8s, color 0.3s, background-position-x 0.7s;
  transition-delay: 0s, 0.2s, 0s;
`

function NavListBackground(props) {
  const [isMouse, setIsMouse] = useState(true)
  const [mouse, setMouse] = useState({ x: 100, y: 100 })

  useEffect(() => {
    document.getElementById('navbar').addEventListener('touchstart', () => {
      handleTouchStart()
    })
    document.getElementById('navbar').addEventListener('mousemove', e => {
      handleMouseMove(e)
    })

    return () => {
      document
        .getElementById('navbar')
        .removeEventListener('touchstart', () => {
          handleTouchStart()
        })
      document.getElementById('navbar').removeEventListener('mousemove', e => {
        handleMouseMove(e)
      })
    }
  }, [])

  // need to detect touch device because ios will override a click with a mousemove
  const handleTouchStart = () => setIsMouse(false)

  const handleMouseMove = e => {
    if (isMouse) {
      setMouse({
        x: 0.08 * (e.clientX + mouse.x) + 70,
        y: e.clientY,
      })
    }
  }

  return <StyledNavListBackground mouse={mouse} {...props} />
}

export default NavListBackground
