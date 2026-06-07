import {
  useState,
  type ChangeEvent,
  type FocusEventHandler,
  type FocusEvent,
  type InputHTMLAttributes,
} from 'react';

interface NumericInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'value' | 'onChange' | 'onBlur' | 'inputMode' | 'min' | 'max'
  > {
  value: number;
  min?: number;
  max?: number;
  fallbackValue?: number;
  onValueChange: (value: number) => void;
  onBlur?: FocusEventHandler<HTMLInputElement>;
}

export function NumericInput({
  value,
  min,
  max,
  fallbackValue,
  onValueChange,
  onBlur,
  ...inputProps
}: NumericInputProps) {
  const [inputState, setInputState] = useState(() => ({
    propValue: value,
    inputValue: String(value),
  }));
  const inputValue =
    inputState.propValue === value ? inputState.inputValue : String(value);

  function setNextInputValue(nextInputValue: string) {
    setInputState({
      propValue: value,
      inputValue: nextInputValue,
    });
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextInputValue = normalizeNumericText(event.target.value);

    if (!nextInputValue) {
      setNextInputValue('');
      return;
    }

    const nextNumber = Number(nextInputValue);

    if (max !== undefined && nextNumber > max) {
      setNextInputValue(String(max));
      onValueChange(max);
      return;
    }

    setNextInputValue(nextInputValue);

    if (min === undefined || nextNumber >= min) {
      onValueChange(nextNumber);
    }
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    const parsedNumber = Number(inputValue);
    const nextNumber =
      inputValue && Number.isFinite(parsedNumber)
        ? parsedNumber
        : (fallbackValue ?? min ?? 0);
    const clampedNumber = clampNumber(nextNumber, min, max);

    setNextInputValue(String(clampedNumber));
    onValueChange(clampedNumber);
    onBlur?.(event);
  }

  return (
    <input
      {...inputProps}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}

function normalizeNumericText(value: string) {
  const digitsOnly = value.replace(/\D/g, '');

  if (!digitsOnly) {
    return '';
  }

  return digitsOnly.replace(/^0+(?=\d)/, '');
}

function clampNumber(value: number, min?: number, max?: number) {
  let nextValue = value;

  if (min !== undefined) {
    nextValue = Math.max(nextValue, min);
  }

  if (max !== undefined) {
    nextValue = Math.min(nextValue, max);
  }

  return nextValue;
}
