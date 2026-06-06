export interface Applicant {
  name: string;
  email: string;
  phone: string;
  motivation?: string;
}

export interface PersonalEnrollmentRequest {
  courseId: string;
  type: 'personal';
  applicant: Applicant;
  agreedToTerms: boolean;
}

export interface GroupEnrollmentRequest {
  courseId: string;
  type: 'group';
  applicant: Applicant;
  group: {
    organizationName: string;
    headCount: number;
    participants: Array<{ name: string; email: string }>;
    contactPerson: string;
  };
  agreedToTerms: boolean;
}

export type EnrollmentRequest =
  | PersonalEnrollmentRequest
  | GroupEnrollmentRequest;

export interface EnrollmentResponse {
  enrollmentId: string;
  status: 'confirmed' | 'pending';
  enrolledAt: string;
}

export interface ErrorResponse {
  code: string; // COURSE_FULL | DUPLICATE_ENROLLMENT | INVALID_INPUT | UNKNOWN_ERROR
  message: string;
  details?: Record<string, string>;
}
