import type { ReactNode } from 'react';

import { FieldError } from './FieldError';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  helperText?: string;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  helperText,
  children,
}: FormFieldProps) {
  const errorId = `${htmlFor}-error`;
  const helperId = `${htmlFor}-helper`;

  return (
    <div className="grid self-start gap-2">
      <label className="text-sm font-semibold text-slate-900" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {helperText ? (
        <p id={helperId} className="text-sm text-slate-600">
          {helperText}
        </p>
      ) : null}
      <FieldError id={errorId} message={error} />
    </div>
  );
}
