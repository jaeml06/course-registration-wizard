import type { Course } from '../type/course';

export function getRemainingSeats(course: Course): number {
  return Math.max(0, course.maxCapacity - course.currentEnrollment);
}

export function isCourseFull(course: Course): boolean {
  return getRemainingSeats(course) <= 0;
}

export function isLowCapacityCourse(course: Course): boolean {
  const remainingSeats = getRemainingSeats(course);

  return remainingSeats > 0 && remainingSeats <= 3;
}

export function canFitEnrollmentHeadCount(
  course: Course,
  headCount: number,
): boolean {
  return getRemainingSeats(course) >= headCount;
}
