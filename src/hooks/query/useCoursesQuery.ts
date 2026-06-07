import { useQuery } from '@tanstack/react-query';

import { getCourses } from '../../apis/apis/courses';
import type { CourseCategory } from '../../type/course';

export type CourseCategoryFilter = CourseCategory | 'all';

export function useCoursesQuery(selectedCategory: CourseCategoryFilter) {
  return useQuery({
    queryKey: ['courses', selectedCategory],
    queryFn: () =>
      getCourses(selectedCategory === 'all' ? undefined : selectedCategory),
    retry: false,
  });
}
