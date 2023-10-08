'use client';

import { useForm } from 'react-hook-form';

import Button from '@/components/Button';
import FormFields, { Field } from '@/components/FormFields';
import { post } from '@/utils/request';

export type ContactFormData = {
  name: string;
  email: string;
  message: string;
};

const fields1: Field[] = [
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
];

const fields2: Field[] = [
  {
    label: 'Message',
    name: 'message',
    type: 'textarea',
    isRequired: true,
  },
];

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
  } = useForm<ContactFormData>({ mode: 'onBlur' });

  const handleOnSubmit = async (data: ContactFormData) => {
    try {
      const res = await post('/api/email', data);

      if (!res) throw new Error();
    } catch (error) {
      setError('root', { type: 'sending' });
    }

    // 'root' errors will mark the form as invalid,
    // so this will reevaluate the form to see if validity is still true.
    trigger();
  };

  return (
    <form
      className="-mt-2 flex gap-1 md:gap-3"
      onSubmit={handleSubmit(handleOnSubmit)}
    >
      <div className="flex flex-wrap gap-x-6">
        <FormFields fields={fields1} register={register} errors={errors} />
      </div>
      <FormFields fields={fields2} register={register} errors={errors} />
      <div className="flex flex-col items-center gap-3">
        {!isSubmitSuccessful && (
          <Button
            type="submit"
            disabled={!isDirty || !isValid}
            showSpinner={isSubmitting}
          >
            Submit
          </Button>
        )}
        {isSubmitted && (
          <div className="flex w-full justify-center text-center">
            {isSubmitSuccessful ? (
              <small className="text-cyan">Your message has been sent</small>
            ) : (
              <small className="text-yellow">An error has occurred </small>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
