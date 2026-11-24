'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import Button from '@/components/Button';
import FormFields, { Field } from '@/components/FormFields';
import { ContactFormData } from '@/utils/contact-fields';
import { getRecaptchaToken, loadRecaptcha } from '@/utils/recaptcha-client';
import { post } from '@/utils/request';

type MailFormProps = {
  // Each row's fields sit side by side (the contact form's name and email).
  rows: Field[][];
  submitLabel: string;
  sentText: string;
  // Added to what is posted to /api/email (the Work with me page's kind).
  extra?: Record<string, string>;
};

// A form that mails its fields through /api/email: the contact page's and the
// Work with me page's. Submit enables once every field is valid and becomes a
// status message once sent.
export default function MailForm({
  rows,
  submitLabel,
  sentText,
  extra = {},
}: MailFormProps) {
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
      // One reCAPTCHA action for every form: the route checks for it.
      const recaptchaToken = await getRecaptchaToken('contact');
      const res = await post('/api/email', {
        ...data,
        ...extra,
        recaptchaToken,
      });

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
      {rows.map((fields) => (
        <div className="flex flex-wrap gap-x-6" key={fields[0]!.name}>
          <FormFields
            fields={fields}
            register={register}
            errors={errors}
            touchedFields={touchedFields}
          />
        </div>
      ))}
      <div className="flex flex-col items-center">
        {!isSubmitSuccessful && (
          <Button
            type="submit"
            disabled={!isDirty || !isValid}
            showSpinner={isSubmitting}
          >
            {submitLabel}
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
              <small className="text-status-success">{sentText}</small>
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
