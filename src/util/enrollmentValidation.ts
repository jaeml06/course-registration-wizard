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
import { ENROLLMENT_MESSAGES } from './enrollmentMessages';

// 검증 규칙 모음(순수 함수). Zod 스키마로 필드별 규칙을 정의하고,
// 화면은 여기서 나온 한국어 메시지를 그대로 보여 주기만 한다.

// 한국 휴대폰 번호: 010/011/016/017/018/019 + (선택) 하이픈 + 3~4자리 + 4자리.
const KOREAN_PHONE_PATTERN = /^01[016789]-?\d{3,4}-?\d{4}$/;

const phoneSchema = z
  .string()
  .trim()
  .regex(
    KOREAN_PHONE_PATTERN,
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
    KOREAN_PHONE_PATTERN,
    '담당자 연락처는 010-1234-5678 형식으로 입력해 주세요.',
  );

// Zod 검증을 돌려 "통과면 null, 실패면 첫 에러 메시지"로 단순화한다.
// 화면은 한 필드당 메시지 하나만 보여 주므로 issues[0]만 쓴다.
function firstZodMessage(schema: z.ZodType, value: unknown): string | null {
  const result = schema.safeParse(value);

  if (result.success) {
    return null;
  }

  return result.error.issues[0]?.message ?? '입력값을 확인해 주세요.';
}

// 이메일 중복 비교는 대소문자/공백 차이를 무시해야 하므로 정규화한 뒤 비교한다.
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

// 필드 하나만 검증한다(blur 단위 검증과 단계 검증의 공통 빌딩블록).
// 단체 전용 필드는 개인 상태일 때 null을 돌려 "해당 없음" 처리한다.
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

// 동적 키(group.participants.N.name/email)를 정규식으로 풀어 해당 참가자를 검증한다.
// (단일 필드 검증이라 "이메일 중복"은 여기서 보지 않고 단계 검증에서 본다.)
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

// 1단계 검증: 강의를 골랐는지 → 그 강의가 실제 목록에 있는지 → 마감은 아닌지 순으로 본다.
export function validateCourseStep(
  state: EnrollmentFormState,
  courses: Course[],
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!state.selectedCourseId) {
    setError(errors, 'selectedCourseId', ENROLLMENT_MESSAGES.courseRequired);
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

// 2단계 검증: 공통(신청자) 필드를 모두 검사하고, 단체일 때만 단체 필드까지 추가로 검사한다.
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

// 단체 전용 검증. 단일 필드 검증으로는 못 잡는 "관계형 규칙"들을 여기서 처리한다:
// (1) 명단 개수==인원수, (2) 참가자↔신청자 이메일 중복, (3) 참가자끼리 이메일 중복,
// (4) 인원수가 강의 잔여 정원 초과.
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

  // (1) 명단 개수 == 인원수
  if (state.group.participants.length !== state.group.headCount) {
    setError(
      errors,
      'group.headCount',
      `참가자 명단은 신청 인원수 ${state.group.headCount}명과 같아야 합니다.`,
    );
  }

  // 참가자별 이름/이메일 형식 검사 + (2) 신청자 이메일과의 중복 검사.
  // 형식 자체가 틀렸으면(emailMessage 존재) 중복 검사는 건너뛴다.
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

  // (3) 참가자끼리 이메일 중복: 먼저 이메일별 등장 횟수를 센 뒤,
  //     2번 이상 등장한 이메일을 가진 참가자 모두에게 에러를 단다.
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

  // (4) 단체 인원수가 강의 잔여 정원을 초과하면 막는다.
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

// 3단계 검증: 약관 동의 여부만 본다.
export function validateReviewStep(
  state: EnrollmentFormState,
): ValidationErrors {
  if (state.agreedToTerms) {
    return {};
  }

  return {
    agreedToTerms: ENROLLMENT_MESSAGES.termsRequired,
  };
}

// 현재 단계에 맞는 검증 함수로 분기하는 진입점(Page가 단계 이동 직전에 호출).
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
