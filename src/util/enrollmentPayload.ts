import type {
  Applicant,
  EnrollmentRequest,
  GroupEnrollmentRequest,
  PersonalEnrollmentRequest,
} from '../type/enrollment';
import type { EnrollmentFormState } from '../type/enrollmentForm';

// 폼 상태 → API 요청 형태로 변환하는 순수 함수.
// 공통 처리: 모든 텍스트를 trim하고, 선택 항목(수강 동기)은 비어 있으면 아예 키를 넣지 않는다.

function createApplicantPayload(
  applicant: EnrollmentFormState['applicant'],
): Applicant {
  const payload: Applicant = {
    name: applicant.name.trim(),
    email: applicant.email.trim(),
    phone: applicant.phone.trim(),
  };

  // 수강 동기는 선택 입력이라, 값이 있을 때만 payload에 포함한다(빈 문자열 전송 방지).
  const motivation = applicant.motivation.trim();

  if (motivation) {
    payload.motivation = motivation;
  }

  return payload;
}

/**
 * 제출 payload를 만든다. 약관 미동의면 null을 반환해 "제출 불가"를 타입으로 표현한다.
 * 핵심: 개인 신청 payload에는 group을 절대 넣지 않고, 단체 신청에만 group을 포함한다
 * (요구사항의 조건부 필드 정책). discriminated union 덕에 분기별로 타입이 정확히 맞는다.
 */
export function createEnrollmentPayload(
  state: EnrollmentFormState,
): EnrollmentRequest | null {
  if (!state.agreedToTerms) {
    return null;
  }

  const base = {
    courseId: state.selectedCourseId,
    applicant: createApplicantPayload(state.applicant),
    agreedToTerms: state.agreedToTerms,
  };

  if (state.type === 'personal') {
    const payload: PersonalEnrollmentRequest = {
      ...base,
      type: 'personal',
    };

    return payload;
  }

  const payload: GroupEnrollmentRequest = {
    ...base,
    type: 'group',
    group: {
      organizationName: state.group.organizationName.trim(),
      headCount: state.group.headCount,
      participants: state.group.participants.map((participant) => ({
        name: participant.name.trim(),
        email: participant.email.trim(),
      })),
      contactPerson: state.group.contactPerson.trim(),
    },
  };

  return payload;
}
