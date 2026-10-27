import { Fragment } from 'react';
import { FieldErrors, UseFormRegister } from 'react-hook-form';

import {
  EMAIL_PATTERN,
  INPUT_MAX_LENGTH,
  TEXTAREA_MAX_LENGTH,
} from '@/utils/contact-fields';

export type Field = {
  label: string;
  name: string;
  type: string;
  isRequired: boolean;
};

type Validation = (_: string) => RegExp | undefined;

type FormFieldsProps = {
  fields: Field[];
  register: UseFormRegister<any>;
  errors: FieldErrors;
  touchedFields: Partial<Record<string, boolean>>;
};

export default function FormFields({
  fields,
  register,
  errors,
  touchedFields,
}: FormFieldsProps) {
  const validation: Validation = (type: string) => {
    if (type === 'email') {
      return EMAIL_PATTERN;
    }

    return undefined;
  };

  return (
    <>
      {fields.map((field) => {
        const { name, label, type, isRequired } = field;

        return (
          <div className="flex flex-1 flex-col" key={name}>
            <label htmlFor={name} className="mb-2">
              {label}
            </label>
            {type === 'textarea' ? (
              <textarea
                rows={6}
                {...register(name, {
                  required: isRequired,
                  maxLength: TEXTAREA_MAX_LENGTH,
                })}
              />
            ) : (
              <input
                {...register(name, {
                  required: isRequired,
                  pattern: validation(type),
                  maxLength: INPUT_MAX_LENGTH,
                })}
                size={10}
              />
            )}
            <div className="flex h-6 w-full justify-end text-right">
              <small className="py-1 text-status-error">
                {touchedFields[name] &&
                  errors[name]?.type === 'required' &&
                  'required'}
                {touchedFields[name] &&
                  errors[name]?.type === 'pattern' &&
                  'invalid'}
              </small>
            </div>
          </div>
        );
      })}
    </>
  );
}
