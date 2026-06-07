import type { ErrorResponse } from '../type/enrollment';

import { mapEnrollmentSubmissionError } from './enrollmentSubmissionErrors';

describe('enrollmentSubmissionErrors', () => {
  test('COURSE_FULL 오류는 강의 선택 수정을 안내한다', () => {
    const error: ErrorResponse = {
      code: 'COURSE_FULL',
      message: 'full',
    };

    expect(mapEnrollmentSubmissionError(error)).toEqual({
      message:
        '선택한 강의의 정원이 마감되었습니다. 다른 강의를 선택해 주세요.',
      fieldErrors: {
        selectedCourseId: '정원이 마감된 강의입니다.',
      },
    });
  });

  test('DUPLICATE_ENROLLMENT 오류는 이미 신청된 강의임을 안내한다', () => {
    const error: ErrorResponse = {
      code: 'DUPLICATE_ENROLLMENT',
      message: 'duplicate',
    };

    expect(mapEnrollmentSubmissionError(error).message).toBe(
      '이미 신청된 강의입니다. 신청 정보를 다시 확인해 주세요.',
    );
  });

  test('INVALID_INPUT details를 필드별 오류로 매핑한다', () => {
    const error: ErrorResponse = {
      code: 'INVALID_INPUT',
      message: 'invalid',
      details: {
        'applicant.email': '이메일을 다시 확인해 주세요.',
        unknown: 'unknown',
      },
    };

    expect(mapEnrollmentSubmissionError(error)).toEqual({
      message: '입력값을 다시 확인해 주세요.',
      fieldErrors: {
        'applicant.email': '이메일을 다시 확인해 주세요.',
      },
    });
  });

  test('알 수 없는 오류는 재시도 가능한 일반 메시지로 매핑한다', () => {
    expect(mapEnrollmentSubmissionError(new Error('network')).message).toBe(
      '신청 제출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    );
  });
});
