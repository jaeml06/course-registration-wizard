import { API_ENDPOINTS } from '../endpoints';
import type { EnrollmentRequest } from '../requests/enrollment';
import type { EnrollmentResponse } from '../responses/enrollment';
import { request } from '../primitives';

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
