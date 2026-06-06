import { http, HttpResponse } from 'msw';

import { API_ENDPOINTS } from '../../apis/endpoints';
import type { CourseListResponse } from '../../type/course';

const EMPTY_COURSE_LIST_RESPONSE: CourseListResponse = {
  courses: [],
  categories: ['development', 'design', 'marketing', 'business'],
};

export const courseHandlers = [
  http.get(API_ENDPOINTS.courses, () => {
    return HttpResponse.json(EMPTY_COURSE_LIST_RESPONSE);
  }),
];
