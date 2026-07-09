"use client";

import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

interface PhoneNumberInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  required?: boolean;
  placeholder?: string;
  id?: string;
}

export default function PhoneNumberInput<T extends FieldValues>({
  control,
  name,
  label,
  required,
  placeholder = "Enter phone number",
  id,
}: PhoneNumberInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={required ? { required: `${label || 'Phone number'} is required` } : undefined}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <div className="xui-form-box" {...(error ? { 'xui-error': 'true' } : {})}>
          {label && <label htmlFor={id}>{label}{required ? ' *' : ''}</label>}
          <PhoneInput
            id={id}
            international
            defaultCountry="NG"
            placeholder={placeholder}
            value={value || ''}
            onChange={(val) => onChange(val || '')}
          />
          {error && <span className="message">{error.message}</span>}
        </div>
      )}
    />
  );
}
