import { API_ENDPOINTS } from '../endpoints';
import type { CourseListResponse } from '../responses/course';
import { request } from '../primitives';
import type { CourseCategory } from '../../type/course';

export function getCourses(
  category?: CourseCategory,
): Promise<CourseListResponse> {
  const searchParams = new URLSearchParams();

  if (category) {
    searchParams.set('category', category);
  }

  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `${API_ENDPOINTS.courses}?${queryString}`
    : API_ENDPOINTS.courses;

  return request<CourseListResponse>(endpoint);
}
