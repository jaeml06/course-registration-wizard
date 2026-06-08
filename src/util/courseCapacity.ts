import type { Course } from '../type/course';

// 정원 계산 모음. 모든 판단의 기준은 "잔여 정원" 하나이며 나머지는 그 위에서 파생된다.

// 잔여 정원 = 최대 정원 - 현재 신청 인원. 음수가 나오지 않도록 0으로 막는다.
export function getRemainingSeats(course: Course): number {
  return Math.max(0, course.maxCapacity - course.currentEnrollment);
}

// 마감 여부: 잔여가 0 이하.
export function isCourseFull(course: Course): boolean {
  return getRemainingSeats(course) <= 0;
}

// "잔여 정원이 적음" 배지 표시 기준: 1~3석 남았을 때.
export function isLowCapacityCourse(course: Course): boolean {
  const remainingSeats = getRemainingSeats(course);

  return remainingSeats > 0 && remainingSeats <= 3;
}

// 단체 인원수가 잔여 정원 안에 들어가는지(단체 신청 단계 검증에서 사용).
export function canFitEnrollmentHeadCount(
  course: Course,
  headCount: number,
): boolean {
  return getRemainingSeats(course) >= headCount;
}
