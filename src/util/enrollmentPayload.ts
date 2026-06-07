import type {
  Applicant,
  EnrollmentRequest,
  GroupEnrollmentRequest,
  PersonalEnrollmentRequest,
} from '../type/enrollment';
import type { EnrollmentFormState } from '../type/enrollmentForm';

function createApplicantPayload(
  applicant: EnrollmentFormState['applicant'],
): Applicant {
  const payload: Applicant = {
    name: applicant.name.trim(),
    email: applicant.email.trim(),
    phone: applicant.phone.trim(),
  };

  const motivation = applicant.motivation.trim();

  if (motivation) {
    payload.motivation = motivation;
  }

  return payload;
}

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
