const validate = values => {
  const errors = {}

  // name
  if (!values.name) errors.name = 'Required'
  else if (values.name.length < 2) errors.name = 'Enter your name'

  // email
  if (!values.email) errors.email = 'Required'
  else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email))
    errors.email = 'Invalid email'

  // subject
  if (!values.subject) errors.subject = 'Required'
  else if (values.subject.length < 2) errors.subject = 'Enter your subject'

  // message
  if (!values.message) errors.message = 'Required'
  else if (values.message.length < 2) errors.message = 'Enter your message'

  return errors
}

export default validate
