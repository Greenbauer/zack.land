// Validation for ContactPage
// Validates the redux-form contact

import { SubmissionError } from 'redux-form'

const validate = values => {
  // IMPORTANT: values is an Immutable.Map here!
  const errors = {}

  if (!values.get('name')) {
    errors.name = 'Required'

  } else if (values.get('name').length < 2) {
    errors.name = 'Enter your name'
  }

  if (!values.get('email')) {
    errors.email = 'Required'

  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.get('email'))) {
    errors.email = 'Invalid email'
  }

  if (!values.get('subject')) {
    errors.subject = 'Required'

  } else if (values.get('subject').length < 2) {
    errors.subject = 'Enter your subject'
  }

  if (!values.get('message')) {
    errors.message = 'Required'

  } else if (values.get('message').length < 2) {
    errors.message = 'Enter your message'
  }

  return errors
}

export default validate
