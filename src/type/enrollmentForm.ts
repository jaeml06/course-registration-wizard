export type EnrollmentType = 'personal' | 'group';

export type EnrollmentStep = 'course' | 'applicant' | 'review';

export type FieldPath =
  | 'selectedCourseId'
  | 'type'
  | 'applicant.name'
  | 'applicant.email'
  | 'applicant.phone'
  | 'applicant.motivation'
  | 'agreedToTerms'
  | 'group.organizationName'
  | 'group.headCount'
  | 'group.contactPerson'
  | `group.participants.${number}.name`
  | `group.participants.${number}.email`;

export interface ApplicantForm {
  name: string;
  email: string;
  phone: string;
  motivation: string;
}

export interface ParticipantForm {
  name: string;
  email: string;
}

export interface GroupEnrollmentForm {
  organizationName: string;
  headCount: number;
  participants: ParticipantForm[];
  contactPerson: string;
}

interface EnrollmentFormBase {
  selectedCourseId: string;
  applicant: ApplicantForm;
  agreedToTerms: boolean;
}

export interface PersonalEnrollmentFormState extends EnrollmentFormBase {
  type: 'personal';
  group: null;
}

export interface GroupEnrollmentFormState extends EnrollmentFormBase {
  type: 'group';
  group: GroupEnrollmentForm;
}

export type EnrollmentFormState =
  | PersonalEnrollmentFormState
  | GroupEnrollmentFormState;

export interface ValidationIssue {
  field: FieldPath;
  message: string;
}

export type ValidationErrors = Partial<Record<FieldPath, string>>;
