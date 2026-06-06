import { http, HttpResponse } from 'msw';

import { API_ENDPOINTS } from '../../apis/endpoints';
import type { EnrollmentResponse } from '../../type/enrollment';

export const enrollmentHandlers = [
  http.post(API_ENDPOINTS.enrollments, () => {
    const response: EnrollmentResponse = {
      enrollmentId: 'ENR-SMOKE-001',
      status: 'confirmed',
      enrolledAt: new Date().toISOString(),
    };

    return HttpResponse.json(response, { status: 201 });
  }),
];
