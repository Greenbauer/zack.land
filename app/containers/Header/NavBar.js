// Bootstrap NavBar for Header

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

const StyledNavBar = styled.div`
  padding: 0;
  background: ${props => props.isScrolling ? '#171717' : 'transparent'};
  box-shadow: ${props => props.isScrolling ? '0 0 20px #000000' : 'none'};

  .h2 {
    width: 3vw;
  }

  .container {
    padding-left: 15px;
    padding-right: 15px;
  }

  .nav-link {
    background-color: ${props => props.isScrolling ? '#171717' : '#111111'};
  }
`

const NavBar = ({className="", ...props}) => (
  <StyledNavBar
    className={`navbar navbar-toggleable-sm fixed-top ${className}`}
   {...props}
  />
)

NavBar.PropTypes = {
  className: PropTypes.string,
  isScrolling: PropTypes.bool
}

export default NavBar
