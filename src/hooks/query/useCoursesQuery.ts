import { useQuery } from '@tanstack/react-query';

import { getCourses } from '../../apis/courses';
import type { CourseCategory } from '../../type/course';

export type CourseCategoryFilter = CourseCategory | 'all';

/**
 * 강의 목록 조회 훅(TanStack Query).
 * - queryKey에 카테고리를 포함해, 카테고리가 바뀌면 자동으로 다시 조회하고 결과를 캐싱한다.
 * - 'all'은 "필터 없음"이므로 API에는 category 파라미터를 보내지 않는다(undefined로 변환).
 * - retry: false — 조회 실패 시 자동 재시도 대신, 화면이 직접 "다시 불러오기" 버튼을 제공한다.
 */
export function useCoursesQuery(selectedCategory: CourseCategoryFilter) {
  return useQuery({
    queryKey: ['courses', selectedCategory],
    queryFn: () =>
      getCourses(selectedCategory === 'all' ? undefined : selectedCategory),
    retry: false,
  });
}
