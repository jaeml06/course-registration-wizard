import type { FieldPath } from '../../../type/enrollmentForm';
import { fieldPathToElementId } from '../../../util/fieldElementId';

import { FormField } from './FormField';
import { textControlClassName } from './textControlClassName';

interface TextFieldProps {
  // 검증/포커스와 연결되는 내부 식별자. id는 여기서 자동 파생된다(SSOT).
  field: FieldPath;
  label: string;
  value: string;
  error?: string;
  helperText?: string;
  type?: 'text' | 'email';
  // true면 input 대신 textarea로 렌더(수강 동기 등 긴 입력).
  multiline?: boolean;
  rows?: number;
  onChange: (value: string) => void;
  onBlur: (field: FieldPath) => void;
}

/**
 * 라벨·입력·도움말·에러를 한 묶음으로 그리는 공용 텍스트 입력.
 * 기존에 ApplicantInfoStep/GroupFields가 반복하던 input 보일러플레이트
 * (id, aria-invalid, aria-describedby, onChange, onBlur, 에러 스타일)를 한곳에 모았다.
 */
export function TextField({
  field,
  label,
  value,
  error,
  helperText,
  type = 'text',
  multiline = false,
  rows = 4,
  onChange,
  onBlur,
}: TextFieldProps) {
  const id = fieldPathToElementId(field);
  const hasError = Boolean(error);
  const describedBy = hasError ? `${id}-error` : undefined;
  const className = textControlClassName(hasError, multiline);

  return (
    <FormField label={label} htmlFor={id} error={error} helperText={helperText}>
      {multiline ? (
        <textarea
          id={id}
          className={className}
          value={value}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          rows={rows}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => onBlur(field)}
        />
      ) : (
        <input
          id={id}
          type={type}
          className={className}
          value={value}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => onBlur(field)}
        />
      )}
    </FormField>
  );
}
