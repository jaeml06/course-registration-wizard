import type {
  ApplicantForm,
  EnrollmentFormState,
  EnrollmentType,
  GroupEnrollmentForm,
  GroupEnrollmentFormState,
} from '../type/enrollmentForm';

type ApplicantField = keyof ApplicantForm;
type GroupField = Exclude<keyof GroupEnrollmentForm, 'participants'>;

interface SwitchEnrollmentTypeOptions {
  confirmedReset?: boolean;
}

export interface MeaningfulEnrollmentData {
  hasSelectedCourse: boolean;
  hasApplicantInput: boolean;
  hasGroupInput: boolean;
  hasTermsAgreement: boolean;
  isMeaningful: boolean;
}

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

export function getMeaningfulEnrollmentData(
  state: EnrollmentFormState,
): MeaningfulEnrollmentData {
  const hasSelectedCourse = state.selectedCourseId.trim().length > 0;
  const hasApplicantInput = Object.values(state.applicant).some(
    (value) => value.trim().length > 0,
  );
  const hasGroupInput =
    state.type === 'group' && hasMeaningfulGroupData(state.group);
  const hasTermsAgreement = state.agreedToTerms;

  return {
    hasSelectedCourse,
    hasApplicantInput,
    hasGroupInput,
    hasTermsAgreement,
    isMeaningful:
      hasSelectedCourse ||
      hasApplicantInput ||
      hasGroupInput ||
      hasTermsAgreement,
  };
}

export function hasMeaningfulEnrollmentData(
  state: EnrollmentFormState,
): boolean {
  return getMeaningfulEnrollmentData(state).isMeaningful;
}

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

export function updateGroupField(
  state: EnrollmentFormState,
  field: GroupField,
  value: string | number,
): EnrollmentFormState {
  if (state.type !== 'group') {
    return state;
  }

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

export function isGroupEnrollmentFormState(
  state: EnrollmentFormState,
): state is GroupEnrollmentFormState {
  return state.type === 'group';
}
