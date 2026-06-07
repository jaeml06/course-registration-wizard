import { http, HttpResponse } from 'msw';

import { COURSE_CATEGORIES, COURSES } from '../../constants/courses';
import type { ErrorResponse } from '../../type/enrollment';
import { server } from '../../mocks/server';

import { getCourses } from './courses';

describe('getCourses', () => {
  test('카테고리 없이 전체 강의 목록을 조회한다', async () => {
    await expect(getCourses()).resolves.toEqual({
      courses: COURSES,
      categories: COURSE_CATEGORIES,
    });
  });

  test('카테고리 query로 강의 목록을 조회한다', async () => {
    const response = await getCourses('development');

    expect(response.courses).toHaveLength(2);
    expect(
      response.courses.every((course) => course.category === 'development'),
    ).toBe(true);
  });

  test('빈 강의 목록 응답을 그대로 반환한다', async () => {
    await expect(getCourses('business')).resolves.toEqual({
      courses: [],
      categories: COURSE_CATEGORIES,
    });
  });

  test('JSON 실패 응답은 원형을 보존해 throw한다', async () => {
    const error: ErrorResponse = {
      code: 'COURSE_LIST_FAILED',
      message: '강의 목록을 불러오지 못했습니다.',
    };
    server.use(
      http.get('*/api/courses', () =>
        HttpResponse.json(error, { status: 500 }),
      ),
    );

    await expect(getCourses()).rejects.toEqual(error);
  });

  test('JSON이 아닌 실패 응답은 일반 Error로 throw한다', async () => {
    server.use(
      http.get(
        '*/api/courses',
        () => new HttpResponse('server error', { status: 500 }),
      ),
    );

    await expect(getCourses()).rejects.toBeInstanceOf(Error);
  });
});
