// Bootstrap Container

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

const StyledContainer = styled.div`
  min-height: 100%;
  width: 1440px;
  position: relative;

  @media (max-width: 1850px) {
    width: 1140px;

    .col-xl-4 {
      flex: 0 0 33%;
      max-width: 33%;
    }
  }
  @media (max-width: 1350px) {
    width: 900px;

    .col-lg-6 {
      flex: 0 0 50%;
      max-width: 50%;
    }
  }
  @media (max-width: 991px) {
    width: 760px;
  }
  @media (max-width: 767px) {
    width: 100%;
    .col-xl-4, .col-lg-6  {
      flex: 0 0 100%;
      max-width: 100%;
    }
  }
  @media (max-width: 576px) {

  }
`

const Container = ({className="", ...props}) => (
  <StyledContainer className={`container ${className}`} {...props} />
)

Container.propTypes = {
  className: PropTypes.string,
}

export default Container
