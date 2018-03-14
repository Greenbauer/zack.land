// Card

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

const StyledCard = styled.div`
  position: relative;
  box-shadow: 0 0 20px #000000;
  border: none;
  border-radius: 0;
  background-color: #171717;
  margin: 0 25px;
  margin-bottom: 40px !important;

  @media (max-width: 768px) {
    margin: 0;
  }
`

const Card = ({className="", ...props}) => (
  <StyledCard className={`card ${className}`} {...props} />
)

Card.propTypes = {
  className: PropTypes.string,
}

export default Card
