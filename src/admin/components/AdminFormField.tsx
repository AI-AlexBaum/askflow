import React from 'react';

export interface AdminFormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
}

export default function AdminFormField({
  label,
  required,
  error,
  children,
  htmlFor,
}: AdminFormFieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm text-slate-500 font-medium mb-2"
      >
        {label}
        {required && (
          <span
            className="ml-0.5"
            style={{ color: 'var(--color-brand-accent, #f97316)' }}
          >
            {' '}*
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-500 font-normal mt-1.5">{error}</p>
      )}
    </div>
  );
}
