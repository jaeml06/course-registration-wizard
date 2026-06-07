import type { ErrorResponse } from '../type/enrollment';
import type { FieldPath, ValidationErrors } from '../type/enrollmentForm';

interface MappedSubmissionError {
  message: string;
  fieldErrors: ValidationErrors;
}

const ALLOWED_FIELD_PREFIXES = [
  'selectedCourseId',
  'applicant.',
  'group.',
  'agreedToTerms',
];

function isErrorResponse(error: unknown): error is ErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as ErrorResponse).code === 'string'
  );
}

function normalizeDetails(
  details: Record<string, string> | undefined,
): ValidationErrors {
  if (!details) {
    return {};
  }

  return Object.entries(details).reduce<ValidationErrors>(
    (fieldErrors, [field, message]) => {
      const isAllowed = ALLOWED_FIELD_PREFIXES.some((prefix) =>
        field.startsWith(prefix),
      );

      if (isAllowed) {
        fieldErrors[field as FieldPath] = message;
      }

      return fieldErrors;
    },
    {},
  );
}

export function mapEnrollmentSubmissionError(
  error: unknown,
): MappedSubmissionError {
  if (!isErrorResponse(error)) {
    return {
      message: '신청 제출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      fieldErrors: {},
    };
  }

  if (error.code === 'COURSE_FULL') {
    return {
      message:
        '선택한 강의의 정원이 마감되었습니다. 다른 강의를 선택해 주세요.',
      fieldErrors: {
        selectedCourseId: '정원이 마감된 강의입니다.',
      },
    };
  }

  if (error.code === 'DUPLICATE_ENROLLMENT') {
    return {
      message: '이미 신청된 강의입니다. 신청 정보를 다시 확인해 주세요.',
      fieldErrors: {},
    };
  }

  if (error.code === 'INVALID_INPUT') {
    return {
      message: '입력값을 다시 확인해 주세요.',
      fieldErrors: normalizeDetails(error.details),
    };
  }

  return {
    message: '신청 제출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    fieldErrors: {},
  };
}
