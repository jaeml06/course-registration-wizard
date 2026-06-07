import { http, HttpResponse } from 'msw';

import type {
  EnrollmentRequest,
  EnrollmentResponse,
  ErrorResponse,
} from '../../type/enrollment';

function buildInvalidInputDetails(request: EnrollmentRequest) {
  const details: Record<string, string> = {};

  if (!request.applicant.name.trim()) {
    details['applicant.name'] = '이름을 입력해 주세요.';
  }

  if (!request.applicant.email.trim()) {
    details['applicant.email'] = '이메일을 입력해 주세요.';
  } else if (!request.applicant.email.includes('@')) {
    details['applicant.email'] = '이메일 형식으로 입력해 주세요.';
  }

  if (!request.applicant.phone.trim()) {
    details['applicant.phone'] = '전화번호를 입력해 주세요.';
  }

  return details;
}

export const enrollmentHandlers = [
  http.post('*/api/enrollments', async ({ request }) => {
    const body = (await request.json()) as EnrollmentRequest;
    const invalidDetails = buildInvalidInputDetails(body);

    if (Object.keys(invalidDetails).length > 0) {
      const error: ErrorResponse = {
        code: 'INVALID_INPUT',
        message: '입력값을 확인해 주세요.',
        details: invalidDetails,
      };

      return HttpResponse.json(error, { status: 400 });
    }

    if (body.courseId === 'course-product-design') {
      const error: ErrorResponse = {
        code: 'COURSE_FULL',
        message: '선택한 강의의 정원이 마감되었습니다.',
      };

      return HttpResponse.json(error, { status: 409 });
    }

    if (body.applicant.email === 'duplicate@example.com') {
      const error: ErrorResponse = {
        code: 'DUPLICATE_ENROLLMENT',
        message: '이미 신청된 강의입니다.',
      };

      return HttpResponse.json(error, { status: 409 });
    }

    const response: EnrollmentResponse = {
      enrollmentId: `ENR-${Date.now()}`,
      status: 'confirmed',
      enrolledAt: new Date().toISOString(),
    };

    return HttpResponse.json(response, { status: 201 });
  }),
];
