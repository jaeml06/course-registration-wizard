import type { ReactNode } from 'react';

import { FieldError } from './FieldError';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  helperText?: string;
  children: ReactNode;
}

// 라벨 + 입력(children) + 도움말 + 에러를 한 묶음으로 그리는 공용 래퍼.
// 입력 요소 자체는 호출부가 children으로 넘기고, 여기서 일관된 레이아웃과 에러 표시를 담당한다.
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
    <div className="grid min-w-0 self-start gap-2">
      <label
        className="min-w-0 break-words text-sm font-semibold text-slate-900"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
      {helperText ? (
        <p id={helperId} className="min-w-0 break-words text-sm text-slate-600">
          {helperText}
        </p>
      ) : null}
      <FieldError id={errorId} message={error} />
    </div>
  );
}
