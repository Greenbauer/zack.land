import { useForm } from 'react-hook-form';
import { Col, Form as BSForm, Row } from 'react-bootstrap'
import Button from '@/components/button'
import { post } from '@/utils/request';
import FormField, { FieldType } from '@/components/formField';

export type ContactFormData = {
  name: string
  email: string
  subject: string
  message: string
};

const fields: FieldType[] = [
  {
    label: 'Name',
    name: 'name',
    type: 'input',
    isRequired: true,
  },
  {
    label: 'Email',
    name: 'email',
    type: 'email',
    isRequired: true,
  },
  {
    label: 'Subject',
    name: 'subject',
    type: 'input',
    isRequired: true,
  },
  {
    label: 'Message',
    name: 'message',
    type: 'textarea',
    isRequired: true,
  },
]

export default function Form() {
  const {
    register,
    handleSubmit,
    setError,
    trigger,
    formState: {
      errors,
      isDirty,
      isValid,
      isSubmitting,
      isSubmitted,
      isSubmitSuccessful,
    },
  } = useForm<ContactFormData>({ mode: 'onBlur' })

  const handleOnSubmit = async (data: ContactFormData) => {
    try {
      const res = await post('/api/email', data)
      if (!res) throw new Error();

    } catch (error) {
      setError('root', { type: 'sending' })
      console.error(error)
    }

    // 'root' errors will mark the form as invalid, 
    // so this will reevaluate the form to see if that is still true. 
    trigger()
  }

  return (
    <Row>
      <Col sm={12}>
        <BSForm onSubmit={handleSubmit(handleOnSubmit)}>
          <BSForm.Group>
            {fields.map(field => (
              <FormField
                key={field.name}
                field={field}
                register={register}
                errors={errors}
              />
            ))}
          </BSForm.Group>
          <div className="text-center">
            <Button
              type="submit"
              disabled={
                !isDirty ||
                !isValid ||
                isSubmitting ||
                isSubmitSuccessful
              }
            >
              Submit
            </Button>
            {isSubmitted && (
              <div className="alert">
                {isSubmitSuccessful
                  ? 'Your message has been sent'
                  : 'An error has occured'
                }
              </div>
            )}
          </div>
        </BSForm>
      </Col>
    </Row>
  )
}
