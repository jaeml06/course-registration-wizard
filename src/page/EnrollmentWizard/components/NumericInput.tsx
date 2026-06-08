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

/**
 * 숫자 전용 입력. 부모는 number를 다루지만, 입력 중에는 빈 문자열처럼 "숫자가 아닌 중간 상태"가
 * 필요하다. 그래서 내부에 문자열(inputValue)을 따로 들고, 부모 value와는 다음처럼 동기화한다:
 *  - inputState.propValue가 현재 value와 같으면(=내가 마지막으로 반영한 값) 내부 문자열을 신뢰.
 *  - 다르면(부모가 밖에서 value를 바꿈) 부모 값을 문자열로 보여 준다.
 */
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
  // 표시값 결정(위 동기화 규칙). 외부에서 value가 바뀌면 내부 입력보다 그것을 우선한다.
  const inputValue =
    inputState.propValue === value ? inputState.inputValue : String(value);

  // 내부 문자열을 갱신하면서, 기준이 된 부모 value도 함께 기록해 둔다.
  function setNextInputValue(nextInputValue: string) {
    setInputState({
      propValue: value,
      inputValue: nextInputValue,
    });
  }

  // 타이핑 중: 숫자만 남기고, 상한은 즉시 막되 하한 미달은 막지 않는다
  // (예: 최소 2일 때 '1'을 거쳐 '12'를 입력할 수 있어야 하므로, 하한은 blur에서 보정).
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextInputValue = normalizeNumericText(event.target.value);

    // 전부 지운 경우: 빈 상태를 허용하되 부모에는 알리지 않는다(아직 유효한 숫자가 아님).
    if (!nextInputValue) {
      setNextInputValue('');
      return;
    }

    const nextNumber = Number(nextInputValue);

    // 상한 초과: 상한값으로 클램프해 표시하고 부모에 알린다.
    if (max !== undefined && nextNumber > max) {
      setNextInputValue(String(max));
      onValueChange(max);
      return;
    }

    setNextInputValue(nextInputValue);

    // 하한 이상일 때만 부모에 반영한다(하한 미달인 중간 입력은 표시만 하고 보류).
    if (min === undefined || nextNumber >= min) {
      onValueChange(nextNumber);
    }
  }

  // 포커스가 빠질 때 최종 확정: 비었거나 이상한 값이면 fallback으로 채우고 min/max로 클램프한다.
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

// 숫자가 아닌 문자를 모두 제거하고, 앞자리 0을 정리한다('007' → '7', '0' → '0').
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
