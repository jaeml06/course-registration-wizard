import { setupServer } from 'msw/node';

import { COURSE_CATEGORIES, COURSES } from '../../constants/courses';

import { courseHandlers } from './courses';

const server = setupServer(...courseHandlers);

describe('courseHandlers', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test('카테고리 없이 조회하면 전체 강의와 카테고리를 반환한다', async () => {
    const response = await fetch('http://localhost/api/courses');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.courses).toHaveLength(COURSES.length);
    expect(body.categories).toEqual(COURSE_CATEGORIES);
  });

  test('카테고리로 강의 목록을 필터링한다', async () => {
    const response = await fetch(
      'http://localhost/api/courses?category=development',
    );
    const body = await response.json();

    expect(body.courses).toHaveLength(2);
    expect(
      body.courses.every(
        (course: { category: string }) => course.category === 'development',
      ),
    ).toBe(true);
  });

  test('강의가 없는 카테고리는 빈 목록을 반환한다', async () => {
    const response = await fetch(
      'http://localhost/api/courses?category=business',
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.courses).toEqual([]);
  });

  test('실패 시나리오는 조회 실패 응답을 반환한다', async () => {
    const response = await fetch('http://localhost/api/courses?category=error');
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      code: 'COURSE_LIST_FAILED',
      message: '강의 목록을 불러오지 못했습니다.',
    });
  });
});
