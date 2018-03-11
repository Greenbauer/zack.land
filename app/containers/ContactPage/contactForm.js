// ContactForm for ContactPage

import PropTypes from 'prop-types'
import React from 'react'
import { Field, reduxForm } from 'redux-form/immutable'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { createStructuredSelector } from 'reselect'

import injectReducer from 'utils/injectReducer'
import injectSaga from 'utils/injectSaga'

import Alert from 'components/Alert'
import Button from 'components/Button'
import Form from 'components/Form'
import FormGroup from 'components/FormGroup'

import {
  makeEmailLoading,
  makeEmailError,
  makeEmailSuccess,
  makeEmailName,
  makeEmailEmail,
  makeEmailSubject,
  makeEmailMessage,
} from './selectors'
import { postRepos, changeEmailData } from './actions'
import reducer from './reducer'
import saga from './saga'
import validate from './validate'

export class ContactForm extends React.Component {
  render() {
    const { loading, error, success } = this.props
    const { handleSubmit, pristine, submitting, invalid } = this.props

    return (
      <Form
        onSubmit={ this.props.handleSubmit((data) => {
          this.props.onSubmitForm(data)
        }) }
      >
        <Field
          name="name"
          type="text"
          component={FormGroup}
          label="Name"
          onChange={ evt => { this.props.onFormChange(evt.target) } }
        />
        <Field
          name="email"
          type="email"
          component={FormGroup}
          label="Email"
          onChange={ evt => { this.props.onFormChange(evt.target) } }
        />
        <Field
          name="subject"
          type="text"
          component={FormGroup}
          label="Subject"
          onChange={ evt => { this.props.onFormChange(evt.target) } }
        />
        <Field
          name="message"
          type="textarea"
          component={FormGroup}
          label="Message"
          onChange={ evt => { this.props.onFormChange(evt.target) } }
        />
        <div>
          <Button
            type="submit"
            disabled={pristine || submitting || invalid || success}
          >
            Submit
          </Button>
          <Alert>
            { this.props.success && this.props.anyTouched === true ? 'Your message has been sent' : ''}
            { this.props.error ? 'An error has occured' : ''}
          </Alert>
        </div>
      </Form>
    )
  }
}

ContactForm.propTypes = {
  error: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  handleSubmit: PropTypes.func,
  invalid: PropTypes.bool,
  loading: PropTypes.bool,
  onFormChange: PropTypes.func,
  onSubmitForm: PropTypes.func,
  pristine: PropTypes.bool,
  submitting: PropTypes.bool,
  success: PropTypes.bool,
}

export function mapDispatchToProps(dispatch) {

  return {
    onFormChange: target => {
      dispatch(changeEmailData(target.name, target.value))
    },
    onSubmitForm: evt => {
      if (evt !== undefined && evt.preventDefault) {
        evt.preventDefault()
      }
      // send email
      dispatch(postRepos(evt))
    },
  }
}

const mapStateToProps = createStructuredSelector({
  loading: makeEmailLoading(),
  error: makeEmailError(),
  success: makeEmailSuccess(),
  name: makeEmailName(),
  email: makeEmailEmail(),
  subject: makeEmailSubject(),
  message: makeEmailMessage(),
})

const withForm = reduxForm({ form: 'contactForm', validate })

const withReducer = injectReducer({ key: 'contact', reducer })

const withSaga = injectSaga({ key: 'email', saga })

const withConnect = connect(mapStateToProps, mapDispatchToProps)

export default compose(
  withForm,
  withReducer,
  withSaga,
  withConnect,
)(ContactForm)
