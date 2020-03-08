import PropTypes from 'prop-types'
import React from 'react'
import { Form } from 'react-bootstrap'

function FormGroup(props) {
  const { touched, error } = props.meta

  return (
    <>
      <Form.Label>{props.label}</Form.Label>
      <div>
        {props.type === 'textarea' ? (
          <Form.Control as="textarea" rows={8} {...props.input} />
        ) : (
          <Form.Control
            {...props.input}
            type={props.type}
            placeholder={props.label}
          />
        )}
        <small>{touched && error}</small>
      </div>
    </>
  )
}

FormGroup.propTypes = {
  className: PropTypes.string,
  input: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  meta: PropTypes.object,
  type: PropTypes.string.isRequired,
}

export default FormGroup
