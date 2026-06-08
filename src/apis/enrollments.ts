import { API_ENDPOINTS } from './endpoints';
import type { EnrollmentRequest } from './requests/enrollment';
import type { EnrollmentResponse } from './responses/enrollment';
import { request } from './primitives';

// POST /api/enrollments 호출. 실패 시 request()가 서버 에러 JSON을 throw한다(primitives 참고).
export function postEnrollment(
  payload: EnrollmentRequest,
): Promise<EnrollmentResponse> {
  return request<EnrollmentResponse>(API_ENDPOINTS.enrollments, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
