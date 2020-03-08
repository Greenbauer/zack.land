import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { md, lightestColor } from 'global-styles'

const StyledHamburger = styled.div`
  width: 25px;
  height: 25px;
  position: relative;
  transform: rotate(0deg);
  transition: 0.5s ease-in-out;
  cursor: pointer;
  display: none;
  margin-top: 15px;
  z-index: 9999;

  @media (${md}) {
    display: inline-block;
  }

  span {
    display: block;
    position: absolute;
    height: 1px;
    width: 100%;
    background: ${lightestColor};
    border-radius: 9px;
    opacity: 1;
    left: 0;
    transform: rotate(0deg);
    transition: 0.25s ease-in-out;
  }

  span:nth-child(1) {
    top: ${props => (props.isActive ? '9' : '0')}px;
    ${props => props.isActive && 'transform: rotate(135deg)'};
  }

  span:nth-child(2) {
    top: 9px;
    opacity: ${props => (props.isActive ? '0' : '1')};
    ${props => props.isActive && 'left: -25px'};
  }

  span:nth-child(3) {
    top: 18px;
    top: ${props => (props.isActive ? '9' : '18')}px;
    ${props => props.isActive && 'transform: rotate(-135deg)'};
  }
`

const Hamburger = props => (
  <StyledHamburger className="hamburger" {...props}>
    <span />
    <span />
    <span />
  </StyledHamburger>
)

Hamburger.propTypes = {
  isActive: PropTypes.bool.isRequired,
}

export default Hamburger
