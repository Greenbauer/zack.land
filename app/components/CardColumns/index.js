// CardColumns

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

const StyledCardColumns = styled.div`
  column-count: 3;
  padding: 0 15px;
  margin: 0 25px 0 -25px;
  width: 100%;

  @media (max-width: 1350px) {
    column-count: 2;
  }
  @media (max-width: 767px) {
    column-count: 1;
    margin: 0;
  }
`

const CardColumns = ({className="", ...props}) => (
  <StyledCardColumns className={`card-columns ${className}`} {...props} />
)

CardColumns.propTypes = {
  className: PropTypes.string,
}

export default CardColumns
