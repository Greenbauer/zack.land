// Bootstrap Input for FormGroup

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

const StyledInput = styled.input`
  outline: none;
  border-radius: 0;
  background-color: #0e0e0e;
  color: #777777;
  border-color: #1b1b1b !important;

  &:hover, &:focus {
    background-color: #0e0e0e !important;
    border-color: #1b1b1b !important;
    color: #777777;
  }

  &::placeholder {
    color: #2b2b2b;
  }
`

const Input = ({className, ...props}) => (
  <StyledInput className={`form-control ${className}`} {...props} />
)

Input.propTypes = {
  className: PropTypes.string,
}

export default Input
