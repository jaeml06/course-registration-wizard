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

const EMPTY_PARTICIPANT = { name: '', email: '' };

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

  return {
    ...state,
    group: {
      ...state.group,
      [field]: value,
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

export function isGroupEnrollmentFormState(
  state: EnrollmentFormState,
): state is GroupEnrollmentFormState {
  return state.type === 'group';
}
