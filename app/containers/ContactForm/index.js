import PropTypes from 'prop-types'
import React from 'react'
import { Field, reduxForm } from 'redux-form'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { createStructuredSelector } from 'reselect'
import { Col, Form, Row } from 'react-bootstrap'

import injectReducer from 'utils/injectReducer'
import injectSaga from 'utils/injectSaga'

import Button from 'components/Button'
import FormInput from 'components/FormInput'

import {
  emailSending,
  emailSendingError,
  emailSendingSuccess,
} from './selectors'
import { sendEmail } from './actions'
import reducer from './reducer'
import saga from './saga'
import validate from './validate'

function ContactForm(props) {
  const submitForm = data => props.onSubmitForm(data)

  const fields = [
    {
      label: 'Name',
      name: 'name',
      type: 'input',
    },
    {
      label: 'Email',
      name: 'email',
      type: 'email',
    },
    {
      label: 'Subject',
      name: 'subject',
      type: 'input',
    },
    {
      label: 'Message',
      name: 'message',
      type: 'textarea',
    },
  ]

  return (
    <Row>
      <Col sm={12}>
        <Form onSubmit={props.handleSubmit(data => submitForm(data))}>
          <Form.Group>
            {fields.map(field => (
              <Field
                key={field.name}
                label={field.label}
                name={field.name}
                type={field.type}
                component={FormInput}
              />
            ))}
          </Form.Group>
          <div className="text-center">
            <Button
              type="submit"
              disabled={
                props.pristine ||
                props.submitting ||
                props.invalid ||
                props.sendingSuccess
              }
            >
              Submit
            </Button>

            <div className="alert">
              {props.sendingSuccess &&
                props.anyTouched === true &&
                'Your message has been sent'}
              {props.sendingError && 'An error has occured'}
            </div>
          </div>
        </Form>
      </Col>
    </Row>
  )
}

ContactForm.propTypes = {
  anyTouched: PropTypes.bool,
  invalid: PropTypes.bool,
  handleSubmit: PropTypes.func,
  onSubmitForm: PropTypes.func,
  pristine: PropTypes.bool,
  submitting: PropTypes.bool,
  sendingError: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  sendingSuccess: PropTypes.bool,
}

function mapDispatchToProps(dispatch) {
  return {
    onSubmitForm: data => {
      dispatch(sendEmail(data))
    },
  }
}

const mapStateToProps = createStructuredSelector({
  sending: emailSending(),
  sendingError: emailSendingError(),
  sendingSuccess: emailSendingSuccess(),
})

const withForm = reduxForm({ form: 'contactForm', validate })

const withReducer = injectReducer({ key: 'contact', reducer })

const withSaga = injectSaga({ key: 'email', saga })

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
)

export default compose(
  withForm,
  withReducer,
  withSaga,
  withConnect,
)(ContactForm)
