// Small

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

const StyledSmall = styled.small`
  font-family: 'Roboto', sans-serif;
  font-weight: 400;
  letter-spacing: 0.07em;
  font-size: 16px;
  color: #777777;
`

const Small = ({className="", ...props}) => (
  <StyledSmall className={`form-text text-muted ${className}`} {...props} />
)

Small.propTypes = {
  className: PropTypes.string,
}

export default Small
