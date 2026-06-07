import { buildCourse } from '../test/enrollmentFixtures';

import {
  canFitEnrollmentHeadCount,
  getRemainingSeats,
  isCourseFull,
  isLowCapacityCourse,
} from './courseCapacity';

describe('courseCapacity', () => {
  test('잔여 정원을 최대 정원에서 현재 신청 인원을 뺀 값으로 계산한다', () => {
    const course = buildCourse({ maxCapacity: 10, currentEnrollment: 8 });

    expect(getRemainingSeats(course)).toBe(2);
  });

  test('잔여 정원이 0명이면 정원 마감으로 판단한다', () => {
    const course = buildCourse({ maxCapacity: 10, currentEnrollment: 10 });

    expect(isCourseFull(course)).toBe(true);
  });

  test('잔여 정원이 1명에서 3명이면 잔여 정원이 적은 강의로 판단한다', () => {
    const course = buildCourse({ maxCapacity: 10, currentEnrollment: 8 });

    expect(isLowCapacityCourse(course)).toBe(true);
  });

  test('단체 신청 인원수가 잔여 정원보다 크면 수용할 수 없다고 판단한다', () => {
    const course = buildCourse({ maxCapacity: 10, currentEnrollment: 8 });

    expect(canFitEnrollmentHeadCount(course, 3)).toBe(false);
  });
});
