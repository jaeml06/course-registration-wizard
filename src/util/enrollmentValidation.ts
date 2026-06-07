import { z } from 'zod';

import type { Course } from '../type/course';
import type {
  EnrollmentFormState,
  EnrollmentStep,
  FieldPath,
  ValidationErrors,
} from '../type/enrollmentForm';

import {
  canFitEnrollmentHeadCount,
  getRemainingSeats,
  isCourseFull,
} from './courseCapacity';

const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^01[016789]-?\d{3,4}-?\d{4}$/,
    '전화번호는 010-1234-5678 형식으로 입력해 주세요.',
  );

const applicantNameSchema = z
  .string()
  .trim()
  .min(2, '이름은 2자 이상 입력해 주세요.')
  .max(20, '이름은 20자 이하로 입력해 주세요.');

const emailSchema = z.string().trim().email('이메일 형식으로 입력해 주세요.');

const motivationSchema = z
  .string()
  .max(300, '수강 동기는 300자 이하로 입력해 주세요.');

const participantEmailSchema = z
  .string()
  .trim()
  .email('참가자 이메일 형식으로 입력해 주세요.');

const contactPersonSchema = z
  .string()
  .trim()
  .regex(
    /^01[016789]-?\d{3,4}-?\d{4}$/,
    '담당자 연락처는 010-1234-5678 형식으로 입력해 주세요.',
  );

function firstZodMessage(schema: z.ZodType, value: unknown): string | null {
  const result = schema.safeParse(value);

  if (result.success) {
    return null;
  }

  return result.error.issues[0]?.message ?? '입력값을 확인해 주세요.';
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function findSelectedCourse(
  state: EnrollmentFormState,
  courses: Course[],
): Course | undefined {
  return courses.find((course) => course.id === state.selectedCourseId);
}

function setError(errors: ValidationErrors, field: FieldPath, message: string) {
  errors[field] = message;
}

export function validateField(
  field: FieldPath,
  state: EnrollmentFormState,
): string | null {
  switch (field) {
    case 'applicant.name':
      return firstZodMessage(applicantNameSchema, state.applicant.name);
    case 'applicant.email':
      return firstZodMessage(emailSchema, state.applicant.email);
    case 'applicant.phone':
      return firstZodMessage(phoneSchema, state.applicant.phone);
    case 'applicant.motivation':
      return firstZodMessage(motivationSchema, state.applicant.motivation);
    case 'group.organizationName':
      if (state.type !== 'group') {
        return null;
      }
      return state.group.organizationName.trim()
        ? null
        : '단체명을 입력해 주세요.';
    case 'group.headCount':
      if (state.type !== 'group') {
        return null;
      }
      if (state.group.headCount < 2) {
        return '신청 인원수는 2명 이상이어야 합니다.';
      }
      if (state.group.headCount > 10) {
        return '신청 인원수는 10명 이하이어야 합니다.';
      }
      return null;
    case 'group.contactPerson':
      if (state.type !== 'group') {
        return null;
      }
      return firstZodMessage(contactPersonSchema, state.group.contactPerson);
    case 'selectedCourseId':
    case 'type':
    case 'agreedToTerms':
      return null;
    default:
      return validateParticipantField(field, state);
  }
}

function validateParticipantField(
  field: FieldPath,
  state: EnrollmentFormState,
): string | null {
  if (state.type !== 'group') {
    return null;
  }

  const match = field.match(/^group\.participants\.(\d+)\.(name|email)$/);

  if (!match) {
    return null;
  }

  const index = Number(match[1]);
  const key = match[2] as 'name' | 'email';
  const participant = state.group.participants[index];

  if (!participant) {
    return null;
  }

  if (key === 'name') {
    return participant.name.trim() ? null : '참가자 이름을 입력해 주세요.';
  }

  return firstZodMessage(participantEmailSchema, participant.email);
}

export function validateCourseStep(
  state: EnrollmentFormState,
  courses: Course[],
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!state.selectedCourseId) {
    setError(errors, 'selectedCourseId', '수강할 강의를 선택해 주세요.');
    return errors;
  }

  const selectedCourse = findSelectedCourse(state, courses);

  if (!selectedCourse) {
    setError(errors, 'selectedCourseId', '선택한 강의를 찾을 수 없습니다.');
    return errors;
  }

  if (isCourseFull(selectedCourse)) {
    setError(
      errors,
      'selectedCourseId',
      '정원이 마감된 강의는 선택할 수 없습니다.',
    );
  }

  return errors;
}

export function validateApplicantStep(
  state: EnrollmentFormState,
  courses: Course[],
): ValidationErrors {
  const errors: ValidationErrors = {};
  const fields: FieldPath[] = [
    'applicant.name',
    'applicant.email',
    'applicant.phone',
    'applicant.motivation',
  ];

  fields.forEach((field) => {
    const message = validateField(field, state);

    if (message) {
      setError(errors, field, message);
    }
  });

  if (state.type === 'group') {
    validateGroupFields(state, courses, errors);
  }

  return errors;
}

function validateGroupFields(
  state: Extract<EnrollmentFormState, { type: 'group' }>,
  courses: Course[],
  errors: ValidationErrors,
) {
  const groupFields: FieldPath[] = [
    'group.organizationName',
    'group.headCount',
    'group.contactPerson',
  ];

  groupFields.forEach((field) => {
    const message = validateField(field, state);

    if (message) {
      setError(errors, field, message);
    }
  });

  if (state.group.participants.length !== state.group.headCount) {
    setError(
      errors,
      'group.headCount',
      `참가자 명단은 신청 인원수 ${state.group.headCount}명과 같아야 합니다.`,
    );
  }

  state.group.participants.forEach((participant, index) => {
    const nameField = `group.participants.${index}.name` as FieldPath;
    const emailField = `group.participants.${index}.email` as FieldPath;
    const nameMessage = validateField(nameField, state);
    const emailMessage = validateField(emailField, state);

    if (nameMessage) {
      setError(errors, nameField, nameMessage);
    }

    if (emailMessage) {
      setError(errors, emailField, emailMessage);
    }

    if (
      !emailMessage &&
      normalizeEmail(participant.email) ===
        normalizeEmail(state.applicant.email)
    ) {
      setError(
        errors,
        emailField,
        '신청자 이메일과 참가자 이메일은 같을 수 없습니다.',
      );
    }
  });

  const emailCounts = state.group.participants.reduce<Record<string, number>>(
    (counts, participant) => {
      const email = normalizeEmail(participant.email);

      if (!email) {
        return counts;
      }

      counts[email] = (counts[email] ?? 0) + 1;
      return counts;
    },
    {},
  );

  state.group.participants.forEach((participant, index) => {
    const email = normalizeEmail(participant.email);
    const emailField = `group.participants.${index}.email` as FieldPath;

    if (email && emailCounts[email] > 1) {
      setError(errors, emailField, '참가자 이메일은 서로 중복될 수 없습니다.');
    }
  });

  const selectedCourse = findSelectedCourse(state, courses);

  if (
    selectedCourse &&
    !canFitEnrollmentHeadCount(selectedCourse, state.group.headCount)
  ) {
    setError(
      errors,
      'group.headCount',
      `선택한 강의의 잔여 정원은 ${getRemainingSeats(selectedCourse)}명입니다.`,
    );
  }
}

export function validateReviewStep(
  state: EnrollmentFormState,
): ValidationErrors {
  if (state.agreedToTerms) {
    return {};
  }

  return {
    agreedToTerms: '이용약관에 동의해야 제출할 수 있습니다.',
  };
}

export function validateCurrentStep(
  step: EnrollmentStep,
  state: EnrollmentFormState,
  courses: Course[],
): ValidationErrors {
  if (step === 'course') {
    return validateCourseStep(state, courses);
  }

  if (step === 'applicant') {
    return validateApplicantStep(state, courses);
  }

  return validateReviewStep(state);
}
