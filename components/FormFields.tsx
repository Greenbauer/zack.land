import { FieldErrors, UseFormRegister } from 'react-hook-form';

import {
  EMAIL_PATTERN,
  INPUT_MAX_LENGTH,
  TEXTAREA_MAX_LENGTH,
} from '@/utils/contact-fields';

export type Field = {
  label: string;
  name: string;
  type: 'text' | 'email' | 'textarea';
  // The browser's autofill hint (`autocomplete`), for a field it can fill.
  autoComplete?: string;
  isRequired: boolean;
};

type FormFieldsProps = {
  fields: Field[];
  register: UseFormRegister<any>;
  errors: FieldErrors;
  touchedFields: Partial<Record<string, boolean>>;
};

// Each field's label names it (`htmlFor`, its id), and its error, shown once
// the field has been left, is tied to it (`aria-describedby`) and marks it
// invalid. A field of only spaces counts as empty, as the server reads it
// (app/api/email/route.ts trims before it checks).
export default function FormFields({
  fields,
  register,
  errors,
  touchedFields,
}: FormFieldsProps) {
  return (
    <>
      {fields.map((field) => {
        const { name, label, type, autoComplete, isRequired } = field;
        const id = `contact-${name}`;
        const errorId = `${id}-error`;
        const error = touchedFields[name] ? errors[name]?.type : undefined;
        const message =
          error === 'pattern'
            ? 'invalid'
            : error === 'required' || error === 'validate'
              ? 'required'
              : undefined;
        const rules = {
          required: isRequired,
          validate: (value: string) => !isRequired || value.trim().length > 0,
          maxLength:
            type === 'textarea' ? TEXTAREA_MAX_LENGTH : INPUT_MAX_LENGTH,
          pattern: type === 'email' ? EMAIL_PATTERN : undefined,
        };
        const shared = {
          id,
          'aria-required': isRequired,
          'aria-invalid': !!message,
          'aria-describedby': message ? errorId : undefined,
          ...register(name, rules),
        };

        return (
          <div className="flex flex-1 flex-col" key={name}>
            <label htmlFor={id} className="mb-2">
              {label}
            </label>
            {type === 'textarea' ? (
              <textarea rows={6} {...shared} />
            ) : (
              <input
                type={type}
                autoComplete={autoComplete}
                {...shared}
                size={10}
              />
            )}
            <div className="flex h-6 w-full justify-end text-right">
              <small id={errorId} className="py-1 text-status-error">
                {message}
              </small>
            </div>
          </div>
        );
      })}
    </>
  );
}
