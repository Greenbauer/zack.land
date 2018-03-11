// Bootstrap Collapse for Header

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

// same as Menu wrapper at max-width: 767
const Wrapper = styled.div`
  width: auto !important;
  border-bottom: ${props => props.isScrolling ? 'none' : '1px solid #222222'};

  @media (max-width: 767px) {
    min-width: 100% !important;
    min-height: 100% !important;
    min-height: 100vh !important;
    margin-left: -15px;
    margin-top: 45px;
    padding-top: 30px;
    z-index: 99;
    position: absolute;
    background-color: #111111;
    border: none !important;
    display: ${props => props.isActive ? 'flex' : 'none'};
  }
`

const StyledCollapse = styled.div`
  width: auto;
  margin: 1rem;
  position: relative;

  @media (max-width: 767px) {
    width: 100%;
    height: 100%;
    right: auto;
    margin: 0;
    padding: 0;
  }
`

const Collapse = ({className="", ...props}) => (
  <Wrapper className={`collapse navbar-collapse ${className}`} {...props} >
    <StyledCollapse
      className={`inner ${className}`}
      {...props}
    />
  </Wrapper>
)

Collapse.propTypes = {
  className: PropTypes.string,
  isActive: PropTypes.bool.isRequired,
  isScrolling: PropTypes.bool.isRequired,
}

export default Collapse
