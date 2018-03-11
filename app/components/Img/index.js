// Img

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

const StyledImg = styled.img`
  height: auto;
  width: 100%;

  &.bg-white {
    background-color: #ffffff;
  }
`

function Img(props) {
  return (
    <StyledImg
      className={props.className}
      src={props.src}
      alt={props.alt}
    />
  )
}

// We require the use of src and alt, only enforced by react in dev mode
Img.propTypes = {
  src: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]).isRequired,
  alt: PropTypes.string,
  className: PropTypes.string,
}

export default Img
