// A

import PropTypes from 'prop-types'
import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

const StyledA = styled.span`
  padding: 0 0 0.3% 0;
  border-bottom: 1px solid rgba(255, 49, 175, 0.7); /* pink */

  &:hover {
    border-color: rgba(255, 210, 101, 0.7); /* yellow */
  }
  &:active {
    border-color: #222222;
  }
  &:focus {
    border-color: rgba(255, 49, 175, 0.7); /* pink */
  }

`

const A = ({href="#", className="", ...props}) => (
  <Link to={href} >
    &nbsp;
    <StyledA className={`${className}`} {...props} />
    &nbsp;
  </Link>

)

A.propTypes = {
  className: PropTypes.string,
  href: PropTypes.string,
}

export default A
