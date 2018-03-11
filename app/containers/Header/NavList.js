// Bootstrap NavList for Header

import PropTypes from 'prop-types'
import styled from 'styled-components'
import React from 'react'

const StyledNavList = styled.ul`
  position: relative;
`

const NavList = ({className="", ...props}) => (
  <StyledNavList
    className={`navbar-nav ml-auto ${className}`}
    {...props}
  />
)

NavList.PropTypes = {
  className: PropTypes.string,
}

export default NavList
