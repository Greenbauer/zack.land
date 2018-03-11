// Button

import PropTypes from 'prop-types'
import React, { Children } from 'react'
import styled from 'styled-components'

import StyledButton from './StyledButton'
import Wrapper from './Wrapper'

const buttonType = props => {

  // if this is a submit button
  if (props.type == 'submit') {
    return (
      <button
        className={`btn ${props.className ? props.className : ''}`}
        {...props}
      >
        {Children.toArray(props.children)}
      </button>
    )

    // any other button type
  } else {
    return (
      <a
        href={props.href ? props.href : '/'}
        target={props.target ? props.target : ''}
        onClick={props.onClick ? props.onClick : ''}
        {...props}
      >
        {Children.toArray(props.children)}
      </a>
    )
  }
}

const Button = ({className="", ...props}) => (
  <Wrapper className={`${className}`}>
    <StyledButton>
      {buttonType(props)}
    </StyledButton>
  </Wrapper>
)

Button.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  handleRoute: PropTypes.func,
  href: PropTypes.string,
  onClick: PropTypes.func,
  target: PropTypes.string,
}

export default Button
