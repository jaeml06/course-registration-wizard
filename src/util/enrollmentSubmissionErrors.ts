import type { ErrorResponse } from '../type/enrollment';
import type { FieldPath, ValidationErrors } from '../type/enrollmentForm';

interface MappedSubmissionError {
  message: string;
  fieldErrors: ValidationErrors;
}

// 서버가 details에 임의의 필드명을 보낼 수 있으므로, 우리가 아는 필드만 받아들이기 위한 화이트리스트.
// (모르는 키를 그대로 errors에 넣으면 화면 어디에도 못 붙는 미아 에러가 된다.)
const ALLOWED_FIELD_PREFIXES = [
  'selectedCourseId',
  'applicant.',
  'group.',
  'agreedToTerms',
];

// 던져진 값이 서버의 ErrorResponse 모양인지 좁힌다(타입 가드).
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

/**
 * 제출 중 던져진 에러를 사용자용 메시지 + 필드 에러로 변환한다.
 * 서버 에러코드별로 안내 방향이 달라(요구사항 표) 코드별로 분기한다.
 *  - 알 수 없는 에러(네트워크 등): 일반 메시지.
 *  - COURSE_FULL: 강의 재선택 유도(강의 필드에 에러).
 *  - DUPLICATE_ENROLLMENT: 재확인 유도.
 *  - INVALID_INPUT: details를 필드별 에러로 매핑.
 */
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
