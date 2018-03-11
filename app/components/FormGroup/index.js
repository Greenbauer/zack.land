// FormGroup

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import Input from './Input'
import Small from 'components/Small'
import TextArea from './TextArea'

const FormGroup = ({
    input,
    label,
    type,
    meta: {touched, error},
    className,
    ...props,
  }) => (
    <div className={`form-group ${className}`}>
      <label>{label}</label>
      <div> { type == 'textarea' ?
        <TextArea {...input} /> :
        <Input
          {...input}
          type={type}
          placeholder={label}
        />
      }
      <Small> {touched && error} </Small>
      </div>
    </div>
  )

FormGroup.propTypes = {
  className: PropTypes.string,
  input: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  meta: PropTypes.object,
  type: PropTypes.string.isRequired
}

export default FormGroup
