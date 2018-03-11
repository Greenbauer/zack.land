// Bootstrap TextArea for FormGroup

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

const StyledTextArea = styled.textarea`
  outline: none;
  border-radius: 0;
  background-color: #0e0e0e;
  height: 180px;
  color: #777777;
  border-color: #1b1b1b !important;

  &:hover, &:focus {
    background-color: #0e0e0e !important;
    color: #777777;
    border-color: #1b1b1b !important;
  }

  &::placeholder {
    color: #2b2b2b;
  }
`

const TextArea = ({className, ...props}) => (
  <StyledTextArea className={`form-control ${className}`} {...props} />
)

TextArea.propTypes = {
  className: PropTypes.string,
}

export default TextArea
