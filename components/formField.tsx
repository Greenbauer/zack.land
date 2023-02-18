import { Form as BSForm } from 'react-bootstrap';
import { FieldErrors, UseFormRegister } from 'react-hook-form';

export type FieldType = {
  label: string;
  name: string;
  type: string;
  isRequired: boolean;
};

type FormFieldType = {
  field: FieldType;
  register: UseFormRegister<any>;
  errors: FieldErrors;
};

export default function FormField({ field, register, errors }: FormFieldType) {
  const { name, label, type, isRequired } = field;

  const validation = (type: string) => {
    if (type === 'email') {
      return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
    }

    return undefined;
  };

  return (
    <>
      <BSForm.Label>{label}</BSForm.Label>
      {type === 'textarea' ? (
        <BSForm.Control
          as="textarea"
          rows={8}
          {...register(name, { required: isRequired, maxLength: 1000 })}
        />
      ) : (
        <BSForm.Control
          {...register(name, {
            required: isRequired,
            pattern: validation(type),
            maxLength: 100,
          })}
        />
      )}
      <small>
        {errors[name]?.type === 'required' && 'required'}
        {errors[name]?.type === 'pattern' && 'invalid'}
      </small>
    </>
  );
}
