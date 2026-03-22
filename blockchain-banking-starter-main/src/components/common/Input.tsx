/*
 * Input.tsx
 * A simple reusable input component with label support.
 */

import React from 'react';

interface InputProps {
  label?: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

function Input({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false
}: InputProps) {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span style={{ color: 'red' }}>*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="form-input"
      />
    </div>
  );
}

export default Input;
