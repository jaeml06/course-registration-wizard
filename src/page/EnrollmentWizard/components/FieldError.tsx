interface FieldErrorProps {
  id?: string;
  message?: string;
}

// 에러 메시지 한 줄을 빨갛게 표시한다. 메시지가 없으면 아무것도 그리지 않는다.
// id는 입력의 aria-describedby와 연결돼 스크린리더가 에러를 함께 읽도록 돕는다.
export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p
      id={id}
      className="mt-2 min-w-0 break-words text-sm font-medium text-red-700"
    >
      {message}
    </p>
  );
}
