import type { FieldPath } from '../type/enrollmentForm';

// 내부 필드 식별자(FieldPath) ↔ 실제 DOM id 변환을 한 곳에 모은 단일 진실 공급원(SSOT).
// 포커스 이동(document.getElementById)과 각 입력 컴포넌트의 id 부여가 모두 이 함수를 거쳐야
// 양쪽 id가 어긋나 포커스가 조용히 깨지는 일을 막을 수 있다.

// 정적으로 일대일 매핑되는 필드들. 동적인 참가자 필드는 아래 정규식으로 따로 처리한다.
const STATIC_FIELD_ELEMENT_IDS: Partial<Record<FieldPath, string>> = {
  selectedCourseId: 'course-step-title',
  agreedToTerms: 'agreed-to-terms',
  'applicant.name': 'applicant-name',
  'applicant.email': 'applicant-email',
  'applicant.phone': 'applicant-phone',
  'applicant.motivation': 'applicant-motivation',
  'group.organizationName': 'group-organization-name',
  'group.headCount': 'group-head-count',
  'group.contactPerson': 'group-contact-person',
};

export function fieldPathToElementId(field: FieldPath): string {
  const staticId = STATIC_FIELD_ELEMENT_IDS[field];

  if (staticId) {
    return staticId;
  }

  const participantMatch = field.match(
    /^group\.participants\.(\d+)\.(name|email)$/,
  );

  if (participantMatch) {
    return `group-participant-${participantMatch[1]}-${participantMatch[2]}`;
  }

  return field;
}

// 참가자 필드 id 전용 헬퍼. 컴포넌트가 인덱스/키만 넘기면 위 규칙으로 일관된 id를 받는다.
export function participantFieldElementId(
  index: number,
  key: 'name' | 'email',
): string {
  return fieldPathToElementId(
    `group.participants.${index}.${key}` as FieldPath,
  );
}
