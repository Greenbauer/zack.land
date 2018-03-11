// Section

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

const StyledSection = styled.div`
  position: relative;
  box-shadow: 0 0 20px #000000;
  margin-top: 40px;
  background-color: #171717;

  &.form {
    width: 460px;
    display: table;
    float: right;

    @media (max-width: 768px) {
      width: 100%;
    }
  }

  /*&.no-img {
    background-size: 180% 100%;
    background-image: linear-gradient(
      120deg,
      rgba(0, 5, 5, 0.5) 2%,
      rgba(0, 51, 128, 0.5) 25%,
      rgba(61, 225, 255, 0.5) 45%,
      rgba(255, 49, 175, 0.6)
    );
  }*/

  .scroll-item {
    position: absolute;
    top: -140px;
  }
`

const Section = ({className="", ...props}) => (
  <StyledSection className={`${className}`} {...props} />
)

Section.propTypes = {
  className: PropTypes.string,
}

export default Section
