interface FieldErrorProps {
  id?: string;
  message?: string;
}

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
