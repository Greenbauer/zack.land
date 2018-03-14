// CardBody

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

const StyledCardBody = styled.div`
  padding: 40px 40px 35px 40px;
`

const CardBody = ({className="", ...props}) => (
  <StyledCardBody className={`card-body ${className}`} {...props} />
)

CardBody.propTypes = {
  className: PropTypes.string,
}

export default CardBody
