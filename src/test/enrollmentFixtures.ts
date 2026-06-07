import type { Course } from '../type/course';
import type {
  ApplicantForm,
  EnrollmentFormState,
  GroupEnrollmentForm,
  ParticipantForm,
} from '../type/enrollmentForm';
import { COURSES } from '../constants/courses';

export function buildCourse(overrides: Partial<Course> = {}): Course {
  return {
    ...COURSES[0],
    ...overrides,
  };
}

export function buildApplicant(
  overrides: Partial<ApplicantForm> = {},
): ApplicantForm {
  return {
    name: '홍길동',
    email: 'student@example.com',
    phone: '010-1234-5678',
    motivation: '실무 프로젝트에 적용하고 싶습니다.',
    ...overrides,
  };
}

export function buildParticipant(
  overrides: Partial<ParticipantForm> = {},
): ParticipantForm {
  return {
    name: '참가자',
    email: 'participant@example.com',
    ...overrides,
  };
}

export function buildGroupForm(
  overrides: Partial<GroupEnrollmentForm> = {},
): GroupEnrollmentForm {
  return {
    organizationName: '코스 주식회사',
    headCount: 2,
    participants: [
      buildParticipant({ name: '김참가', email: 'member1@example.com' }),
      buildParticipant({ name: '이참가', email: 'member2@example.com' }),
    ],
    contactPerson: '010-2222-3333',
    ...overrides,
  };
}

export function buildPersonalDraft(
  overrides: Partial<EnrollmentFormState> = {},
): EnrollmentFormState {
  return {
    selectedCourseId: COURSES[0].id,
    type: 'personal',
    applicant: buildApplicant(),
    agreedToTerms: true,
    group: null,
    ...overrides,
  } as EnrollmentFormState;
}

export function buildGroupDraft(
  overrides: Partial<EnrollmentFormState> = {},
): EnrollmentFormState {
  return {
    selectedCourseId: COURSES[0].id,
    type: 'group',
    applicant: buildApplicant(),
    agreedToTerms: true,
    group: buildGroupForm(),
    ...overrides,
  } as EnrollmentFormState;
}
