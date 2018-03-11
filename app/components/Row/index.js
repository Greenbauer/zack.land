// Bootstrap Row

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

const StyledRow = styled.div`
  position: relative;

  &.cover {
    height: 100%;
    align-content: center;
    align-items: center; /* needed for chrome */
  }

  &.gutters {
    margin-right: -20px;
    margin-left: -20px;

   .col, &.gutters > [class*="col-"] {
     padding-left: 20px;
     padding-right: 20px;
   }
  }
`

const Row = ({className="", ...props}) => (
  <StyledRow className={`row no-gutters ${className}`} {...props} />
)

Row.propTypes = {
  className: PropTypes.string,
}

export default Row
