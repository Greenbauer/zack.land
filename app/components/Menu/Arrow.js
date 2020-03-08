import React from 'react'
import styled from 'styled-components'

import { md, lightestColor } from 'global-styles'

const Wrapper = styled.div`
  right: -85px;
  position: absolute;
  top: 0;
  display: flex;
  align-content: center;
  align-items: center;
  min-height: 100%;
  margin-top: -15px;

  @media (${md}) {
    display: none;
  }
`

const StyledArrow = styled.div`
  opacity: 0;
  position: absolute;
  left: 0;
  top: 50%;
  transform-origin: 50% 0;
  transform: translate3d(50%, 0, 0);

  &.first {
    animation: arrow-movement 2.5s ease-in-out infinite;
  }
  &.second {
    animation: arrow-movement 2.5s 1.25s ease-in-out infinite;
  }

  &:before,
  &:after {
    background: ${lightestColor};
    content: '';
    display: block;
    height: 30px;
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
  }

  &:before {
    transform: rotate(35deg) translateY(-40%);
    transform-origin: top;
  }

  &:after {
    transform: rotate(-35deg) translateY(40%);
    transform-origin: bottom;
  }

  @keyframes arrow-movement {
    0% {
      opacity: 0;
    }
    70% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      left: -40px;
    }
  }
`

function Arrow(props) {
  return (
    <Wrapper {...props}>
      <StyledArrow className="first" />
      <StyledArrow className="second" />
    </Wrapper>
  )
}

export default Arrow
