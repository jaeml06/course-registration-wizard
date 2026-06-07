import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import { COURSE_CATEGORIES, COURSES } from '../../constants/courses';
import { getCourses } from '../../apis/apis/courses';

import { useCoursesQuery } from './useCoursesQuery';

vi.mock('../../apis/apis/courses', () => ({
  getCourses: vi.fn(),
}));

const mockedGetCourses = vi.mocked(getCourses);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useCoursesQuery', () => {
  beforeEach(() => {
    mockedGetCourses.mockReset();
  });

  test("전체 카테고리는 ['courses', 'all'] query key로 getCourses()를 호출한다", async () => {
    mockedGetCourses.mockResolvedValue({
      courses: COURSES,
      categories: COURSE_CATEGORIES,
    });

    const { result } = renderHook(() => useCoursesQuery('all'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGetCourses).toHaveBeenCalledWith(undefined);
    expect(result.current.data?.courses).toHaveLength(COURSES.length);
  });

  test("특정 카테고리는 ['courses', category] query key로 getCourses(category)를 호출한다", async () => {
    mockedGetCourses.mockResolvedValue({
      courses: COURSES.filter((course) => course.category === 'development'),
      categories: COURSE_CATEGORIES,
    });

    const { result } = renderHook(() => useCoursesQuery('development'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGetCourses).toHaveBeenCalledWith('development');
    expect(result.current.data?.courses).toHaveLength(2);
  });

  test('refetch는 현재 query key의 강의 목록을 다시 조회한다', async () => {
    mockedGetCourses.mockResolvedValue({
      courses: COURSES.filter((course) => course.category === 'marketing'),
      categories: COURSE_CATEGORIES,
    });

    const { result } = renderHook(() => useCoursesQuery('marketing'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await result.current.refetch();

    expect(mockedGetCourses).toHaveBeenCalledTimes(2);
    expect(mockedGetCourses).toHaveBeenLastCalledWith('marketing');
  });
});
