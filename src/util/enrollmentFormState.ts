import type {
  ApplicantForm,
  EnrollmentFormState,
  EnrollmentType,
  GroupEnrollmentForm,
} from '../type/enrollmentForm';

type ApplicantField = keyof ApplicantForm;
type GroupField = Exclude<keyof GroupEnrollmentForm, 'participants'>;

interface SwitchEnrollmentTypeOptions {
  confirmedReset?: boolean;
}

// 이 파일은 폼 상태를 다루는 "순수 함수" 모음이다.
// 모두 (현재 상태) → (새 상태)를 반환하며 React를 전혀 모른다 → 화면 없이 단위 테스트 가능.

const EMPTY_PARTICIPANT = { name: '', email: '' };
const MAX_GROUP_HEAD_COUNT = 10;

export function createInitialApplicantForm(): ApplicantForm {
  return {
    name: '',
    email: '',
    phone: '',
    motivation: '',
  };
}

export function createInitialGroupForm(): GroupEnrollmentForm {
  return {
    organizationName: '',
    headCount: 2,
    participants: [{ ...EMPTY_PARTICIPANT }, { ...EMPTY_PARTICIPANT }],
    contactPerson: '',
  };
}

export function createInitialEnrollmentFormState(): EnrollmentFormState {
  return {
    selectedCourseId: '',
    type: 'personal',
    applicant: createInitialApplicantForm(),
    agreedToTerms: false,
    group: null,
  };
}

// 단체 폼에 "버리면 아까운" 실제 입력이 있는지 판단한다.
// 단체→개인 전환 시 확인창을 띄울지 결정하는 데 쓰인다(headCount는 항상 기본값이 있어 제외).
export function hasMeaningfulGroupData(
  group: GroupEnrollmentForm | null,
): boolean {
  if (!group) {
    return false;
  }

  return (
    group.organizationName.trim().length > 0 ||
    group.contactPerson.trim().length > 0 ||
    group.participants.some(
      (participant) =>
        participant.name.trim().length > 0 ||
        participant.email.trim().length > 0,
    )
  );
}

// 신청서 전체에 의미 있는 입력이 하나라도 있는지 판단한다.
// 임시저장 여부(빈 폼이면 저장 안 함)와 이탈 방지(빈 폼이면 경고 안 함)의 공통 기준.
export function hasMeaningfulEnrollmentData(
  state: EnrollmentFormState,
): boolean {
  const hasApplicantInput = Object.values(state.applicant).some(
    (value) => value.trim().length > 0,
  );

  return (
    state.selectedCourseId.trim().length > 0 ||
    hasApplicantInput ||
    (state.type === 'group' && hasMeaningfulGroupData(state.group)) ||
    state.agreedToTerms
  );
}

/**
 * 개인/단체 유형 전환의 핵심 규칙(요구사항의 조건부 필드 정책을 그대로 구현).
 *  - 같은 유형이면 그대로 반환.
 *  - 개인→단체: 단체 기본 폼을 새로 만든다.
 *  - 단체→개인: 입력된 단체 데이터가 있는데 confirmedReset이 false면 변경을 거부(원상 유지).
 *               동의했거나 버릴 데이터가 없으면 group을 null로 비우고 개인으로 전환.
 */
export function switchEnrollmentType(
  state: EnrollmentFormState,
  nextType: EnrollmentType,
  options: SwitchEnrollmentTypeOptions = {},
): EnrollmentFormState {
  if (state.type === nextType) {
    return state;
  }

  if (nextType === 'group') {
    return {
      ...state,
      type: 'group',
      group: createInitialGroupForm(),
    };
  }

  // 단체→개인인데 버릴 데이터가 있고 아직 동의를 못 받았다면 전환하지 않는다.
  if (state.type === 'group' && hasMeaningfulGroupData(state.group)) {
    if (!options.confirmedReset) {
      return state;
    }
  }

  return {
    ...state,
    type: 'personal',
    group: null,
  };
}

export function updateApplicantField(
  state: EnrollmentFormState,
  field: ApplicantField,
  value: string,
): EnrollmentFormState {
  return {
    ...state,
    applicant: {
      ...state.applicant,
      [field]: value,
    },
  };
}

// 단체 필드 갱신. 개인 상태에서 호출되면 무시한다(타입 가드).
export function updateGroupField(
  state: EnrollmentFormState,
  field: GroupField,
  value: string | number,
): EnrollmentFormState {
  if (state.type !== 'group') {
    return state;
  }

  // 인원수(headCount)는 단순 대입이 아니라 참가자 명단 길이와 동기화해야 한다.
  if (field === 'headCount') {
    return {
      ...state,
      group: syncParticipantsToHeadCount(state.group, Number(value)),
    };
  }

  return {
    ...state,
    group: {
      ...state.group,
      [field]: value,
    },
  };
}

export function updateParticipantField(
  state: EnrollmentFormState,
  index: number,
  field: 'name' | 'email',
  value: string,
): EnrollmentFormState {
  if (state.type !== 'group') {
    return state;
  }

  return {
    ...state,
    group: {
      ...state.group,
      participants: state.group.participants.map((participant, currentIndex) =>
        currentIndex === index
          ? { ...participant, [field]: value }
          : participant,
      ),
    },
  };
}

export function updateSelectedCourse(
  state: EnrollmentFormState,
  selectedCourseId: string,
): EnrollmentFormState {
  return {
    ...state,
    selectedCourseId,
  };
}

export function updateTermsAgreement(
  state: EnrollmentFormState,
  agreedToTerms: boolean,
): EnrollmentFormState {
  return {
    ...state,
    agreedToTerms,
  };
}

/**
 * 인원수 변경에 맞춰 참가자 명단 길이를 맞춘다(요구사항: 명단 개수 == 인원수).
 *  - 줄이면 뒤쪽 참가자가 잘려 나가고, 늘리면 빈 참가자가 채워진다.
 *  - 기존 입력은 인덱스 기준으로 보존한다(앞쪽 참가자 데이터 유지).
 *  - 상한(10)만 여기서 강제하고, 하한 등 검증 메시지는 enrollmentValidation이 담당한다.
 */
export function syncParticipantsToHeadCount(
  group: GroupEnrollmentForm,
  headCount: number,
): GroupEnrollmentForm {
  const normalizedHeadCount = Number.isFinite(headCount)
    ? Math.min(headCount, MAX_GROUP_HEAD_COUNT)
    : 2;
  const participants = Array.from(
    { length: normalizedHeadCount },
    (_, index) =>
      group.participants[index]
        ? { ...group.participants[index] }
        : { ...EMPTY_PARTICIPANT },
  );

  return {
    ...group,
    headCount: normalizedHeadCount,
    participants,
  };
}
