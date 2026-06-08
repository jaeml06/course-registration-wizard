import type {
  EnrollmentStep,
  FieldPath,
  ValidationErrors,
} from '../type/enrollmentForm';

// 검증 실패 시 "포커스를 옮길 첫 에러 필드"를 고르는 순수 로직.
// errors 객체는 키 순서가 보장되지 않으므로, 화면상 위→아래 순서를 코드로 강제한다.

// 정보 입력 단계의 고정 필드 순서(화면에 보이는 순서).
const APPLICANT_STEP_FIELD_ORDER: FieldPath[] = [
  'applicant.name',
  'applicant.email',
  'applicant.phone',
  'applicant.motivation',
  'group.organizationName',
  'group.headCount',
  'group.contactPerson',
];

// 현재 단계에서 에러가 난 필드 중 "화면상 가장 위"의 필드를 반환한다(없으면 null).
export function firstErrorFieldForStep(
  step: EnrollmentStep,
  errors: ValidationErrors,
): FieldPath | null {
  if (step === 'course') {
    return errors.selectedCourseId ? 'selectedCourseId' : null;
  }

  if (step === 'review') {
    return errors.agreedToTerms ? 'agreedToTerms' : null;
  }

  // 정보 단계: 고정 필드 뒤에 참가자 필드(동적 개수)를 정렬해 이어 붙인 순서로 찾는다.
  const orderedFields = [
    ...APPLICANT_STEP_FIELD_ORDER,
    ...sortedParticipantErrorFields(errors),
  ];

  return orderedFields.find((field) => errors[field]) ?? null;
}

// 참가자 필드(group.participants.N.name/email)만 골라 인덱스→name→email 순으로 정렬한다.
function sortedParticipantErrorFields(errors: ValidationErrors): FieldPath[] {
  return (Object.keys(errors) as FieldPath[])
    .filter((field): field is FieldPath =>
      /^group\.participants\.\d+\.(name|email)$/.test(field),
    )
    .sort((a, b) => {
      const [indexA, fieldA] = participantSortKey(a);
      const [indexB, fieldB] = participantSortKey(b);

      return indexA - indexB || fieldA - fieldB;
    });
}

// 정렬 키: [참가자 인덱스, 같은 참가자 내 name(0)/email(1) 순서]. 매칭 실패는 맨 뒤로.
function participantSortKey(field: FieldPath): [number, number] {
  const match = field.match(/^group\.participants\.(\d+)\.(name|email)$/);

  if (!match) {
    return [Number.MAX_SAFE_INTEGER, 0];
  }

  return [Number(match[1]), match[2] === 'name' ? 0 : 1];
}
