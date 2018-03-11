// MenuItem

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

const StyledMenuItem = styled.li`
  padding: 20px 40px 20px 0;
  text-align: right;
  display: block;
  position: relative;
  word-wrap: break-word;

  @media (max-width: 767px) {
    text-align: center;
    font-size: 1.5rem;
    border-top: 1px solid #222222;
    padding: 20px 40px;

    &:last-child {
      border-bottom: 1px solid #222222;
    }
  }

  a {
    color: #cccccc;

    &:hover {
      color: rgba(255, 49, 175, 0.7);
    }
  }

  &.active a {
    color: rgba(255, 210, 101, 0.7);
  }
`

const MenuItem = ({className="", ...props}) => (
  <StyledMenuItem className={` ${className}`} {...props} />
)

MenuItem.propTypes = {
  className: PropTypes.string,
}

export default MenuItem
