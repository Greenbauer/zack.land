import React, { Children } from 'react'
import PropTypes from 'prop-types'
import { Button } from 'react-bootstrap'

import StyledButton from './StyledButton'

function ButtonType({ children, ...props }) {
  // if this is a submit button
  if (props.type === 'submit') {
    return <Button {...props}>{Children.toArray(children)}</Button>
  }

  // any other button type
  return (
    <a href={props.href} target={props.target}>
      {Children.toArray(children)}
    </a>
  )
}

function ButtonWrapper(props) {
  return (
    <StyledButton>
      <ButtonType {...props} />
    </StyledButton>
  )
}

ButtonType.propTypes = {
  children: PropTypes.node.isRequired,
  href: PropTypes.string,
  target: PropTypes.string,
  type: PropTypes.string,
}

export default ButtonWrapper
