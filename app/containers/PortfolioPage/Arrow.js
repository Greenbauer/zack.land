// Arrow animation

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

const Wrapper = styled.li`
  right: -85px;
  position: absolute;
  top: 0;
  display: flex;
  align-content: center;
  align-items: center;
  min-height: 100%;
  margin-top: -15px;
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
    background: #bbbbbb;
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

const Arrow = ({className="", ...props}) => (
  <Wrapper {...props}>
    <StyledArrow className={`first ${className}`} />
    <StyledArrow className={`second ${className}`} />
  </Wrapper>
)

Arrow.PropTypes = {
  className: PropTypes.string,
}

export default Arrow
