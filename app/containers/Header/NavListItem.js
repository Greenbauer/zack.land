// Bootstrap NavListItem for Header

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

const StyledNavListItem = styled.li`
  .nav-link {
    text-transform: uppercase;
    color: #999999 !important;
    padding: 7px 25px !important;
    cursor: pointer;
    transition-delay: 0s, 0.2s;
    transition: background 0.2s, color 0.3s;


    &.active, &:active,
    &:hover, &:focus {
      padding: 7px 25px !important;
      background-color: transparent;
      color: #dddddd !important;
      border: none;
    }
  }


  .nav-link {
    display: block;
    position: relative;

    @media (max-width: 767px) {
      text-align: center;
      font-size: 1.5rem;
      border-top: 1px solid #222222;
      padding: 20px 40px;

      &:last-child {
        border-bottom: 1px solid #222222;
      }

      &.active, &:active,
      &:hover, &:focus {
        padding: 7px 25px !important;
        background-color: transparent;
        color: #dddddd !important;
        border: none;
      }
    }
  }
`

const NavListItem = ({className="",  ...props}) => (
  <StyledNavListItem
    className={`nav-item ${className}`}
    {...props}
  />
)

NavListItem.PropTypes = {
  className: PropTypes.string,
}

export default NavListItem
