import { useRef, useState } from 'react';

import type {
  EnrollmentRequest,
  EnrollmentResponse,
} from '../../../type/enrollment';
import type {
  SubmissionStatus,
  ValidationErrors,
} from '../../../type/enrollmentForm';
import { postEnrollment } from '../../../apis/enrollments';
import { ENROLLMENT_MESSAGES } from '../../../util/enrollmentMessages';
import { mapEnrollmentSubmissionError } from '../../../util/enrollmentSubmissionErrors';

type SubmissionResult =
  | {
      ok: true;
      response: EnrollmentResponse;
      fieldErrors: ValidationErrors;
    }
  | {
      ok: false;
      response: null;
      message: string;
      fieldErrors: ValidationErrors;
    };

interface UseEnrollmentSubmissionStateOptions {
  submitEnrollment?: (
    payload: EnrollmentRequest,
  ) => Promise<EnrollmentResponse>;
}

export function useEnrollmentSubmissionState(
  options: UseEnrollmentSubmissionStateOptions = {},
) {
  const submitLockRef = useRef(false);
  const submitEnrollment = options.submitEnrollment ?? postEnrollment;
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [result, setResult] = useState<EnrollmentResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});

  async function submit(
    payload: EnrollmentRequest | null,
  ): Promise<SubmissionResult> {
    if (!payload) {
      const fieldErrors = {
        agreedToTerms: ENROLLMENT_MESSAGES.termsRequired,
      };
      setStatus('failed');
      setErrorMessage(ENROLLMENT_MESSAGES.termsRequired);
      setFieldErrors(fieldErrors);

      return {
        ok: false,
        response: null,
        message: ENROLLMENT_MESSAGES.termsRequired,
        fieldErrors,
      };
    }

    if (submitLockRef.current) {
      return {
        ok: false,
        response: null,
        message: '이미 제출을 처리 중입니다.',
        fieldErrors: {},
      };
    }

    submitLockRef.current = true;
    setStatus('submitting');
    setResult(null);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      const response = await submitEnrollment(payload);
      setStatus('succeeded');
      setResult(response);

      return {
        ok: true,
        response,
        fieldErrors: {},
      };
    } catch (error) {
      const mappedError = mapEnrollmentSubmissionError(error);
      setStatus('failed');
      setErrorMessage(mappedError.message);
      setFieldErrors(mappedError.fieldErrors);

      return {
        ok: false,
        response: null,
        message: mappedError.message,
        fieldErrors: mappedError.fieldErrors,
      };
    } finally {
      submitLockRef.current = false;
    }
  }

  function retry() {
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
    setFieldErrors({});
  }

  return {
    status,
    result,
    errorMessage,
    fieldErrors,
    isSubmitting: status === 'submitting',
    submit,
    retry,
  };
}
