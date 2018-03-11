// Menu

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import Wrapper from './Wrapper'

const StyledMenu = styled.ul`
  display: block;
  border-right: 1px solid #222;
  margin: 0 50px 0 0;
  max-width: none;
  padding: 0;

  /* work around, because 'position: fixed;' with bootsrap 4 ignores parent styles */
  position: absolute;
  right: 66.67%; /* must be same as all other cols in row */

  @media (max-width: 767px) {
    max-width: none;
    position: relative;
    right: auto;
    margin: 0;
    padding: 0;
    border: none;
  }
`

const Menu = ({className="", ...props}) => (
  <Wrapper className={`${className}`}>
    <StyledMenu className={`${className}`} {...props} />
  </Wrapper>
)

Menu.propTypes = {
  className: PropTypes.string,
}

export default Menu
