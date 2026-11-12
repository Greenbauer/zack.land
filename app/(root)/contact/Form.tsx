'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import Button from '@/components/Button';
import FormFields, { Field } from '@/components/FormFields';
import { ContactFormData } from '@/utils/contact-fields';
import { getRecaptchaToken, loadRecaptcha } from '@/utils/recaptcha-client';
import { post } from '@/utils/request';

// Name and email side by side, then the message under them.
const NAME_AND_EMAIL: Field[] = [
  {
    label: 'Name',
    name: 'name',
    type: 'text',
    autoComplete: 'name',
    isRequired: true,
  },
  {
    label: 'Email',
    name: 'email',
    type: 'email',
    autoComplete: 'email',
    isRequired: true,
  },
];

const MESSAGE: Field[] = [
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
      touchedFields,
      isDirty,
      isValid,
      isSubmitting,
      isSubmitted,
      isSubmitSuccessful,
    },
    // onChange keeps isValid live so Submit enables as soon as the form is
    // valid — without waiting for the last field to blur. Error text is still
    // gated on touchedFields (see FormFields), so it only shows after blur.
  } = useForm<ContactFormData>({ mode: 'onChange' });

  const status = useRef<HTMLDivElement>(null);

  const handleOnSubmit = async (data: ContactFormData) => {
    try {
      const recaptchaToken = await getRecaptchaToken('contact');
      const res = await post('/api/email', { ...data, recaptchaToken });

      if (!res) throw new Error();
    } catch (error) {
      setError('root', { type: 'sending' });
    }

    // 'root' errors will mark the form as invalid,
    // so this will reevaluate the form to see if validity is still true.
    trigger();
  };

  // Once sent, Submit goes: focus moves to the message that says so, rather
  // than dropping to the page.
  useEffect(() => {
    if (isSubmitSuccessful) status.current?.focus();
  }, [isSubmitSuccessful]);

  // While any field has focus, the scene behind the form blurs
  // (components/Background/focusBlur.ts); the form itself stays sharp. The
  // first focus loads reCAPTCHA, which the submit needs.
  return (
    <form
      data-focus-blur
      noValidate
      className="-mt-2 flex gap-1 md:gap-3"
      onFocus={() => void loadRecaptcha()}
      onSubmit={(event) => {
        // Pressed again while sending (the button stays in place, only
        // marked disabled, so focus stays on it): not submitted again, which
        // would end that second submission as a success at once.
        if (isSubmitting) event.preventDefault();
        else handleSubmit(handleOnSubmit)(event);
      }}
    >
      <div className="flex flex-wrap gap-x-6">
        <FormFields
          fields={NAME_AND_EMAIL}
          register={register}
          errors={errors}
          touchedFields={touchedFields}
        />
      </div>
      <FormFields
        fields={MESSAGE}
        register={register}
        errors={errors}
        touchedFields={touchedFields}
      />
      <div className="flex flex-col items-center">
        {!isSubmitSuccessful && (
          <Button
            type="submit"
            disabled={!isDirty || !isValid}
            showSpinner={isSubmitting}
          >
            Submit
          </Button>
        )}
        {/* Always in the page, so a screen reader announces what lands in
            it: sending, then sent or the error. It takes the old gap under
            the button only while it shows a result, so empty it moves
            nothing. */}
        <div
          ref={status}
          role="status"
          tabIndex={-1}
          className="flex w-full justify-center text-center outline-none [button+&:has(small)]:mt-3"
        >
          {isSubmitting && (
            <span className="sr-only">Sending your message</span>
          )}
          {isSubmitted &&
            (isSubmitSuccessful ? (
              <small className="text-status-success">
                Your message has been sent
              </small>
            ) : (
              <small className="text-status-error">
                An error has occurred{' '}
              </small>
            ))}
        </div>
      </div>
    </form>
  );
}
