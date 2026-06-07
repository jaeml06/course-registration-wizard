import { http, HttpResponse } from 'msw';

import { COURSE_CATEGORIES, COURSES } from '../../constants/courses';
import type { CourseCategory } from '../../type/course';
import type { CourseListResponse } from '../../type/course';

export const courseHandlers = [
  http.get('*/api/courses', ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');

    if (category === 'error') {
      return HttpResponse.json(
        {
          code: 'COURSE_LIST_FAILED',
          message: '강의 목록을 불러오지 못했습니다.',
        },
        { status: 500 },
      );
    }

    const courses =
      category && COURSE_CATEGORIES.includes(category as CourseCategory)
        ? COURSES.filter((course) => course.category === category)
        : COURSES;

    const response: CourseListResponse = {
      courses,
      categories: COURSE_CATEGORIES,
    };

    return HttpResponse.json(response);
  }),
];
