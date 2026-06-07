import { useRef, useState } from 'react';

import type {
  EnrollmentRequest,
  EnrollmentResponse,
} from '../../../type/enrollment';
import type { ValidationErrors } from '../../../type/enrollmentForm';
import { mapEnrollmentSubmissionError } from '../../../util/enrollmentSubmissionErrors';

type SubmissionStatus = 'idle' | 'submitting' | 'succeeded' | 'failed';

interface UseEnrollmentSubmissionStateOptions {
  submitEnrollment?: (
    payload: EnrollmentRequest,
  ) => Promise<EnrollmentResponse>;
}

async function localSubmitEnrollment(): Promise<EnrollmentResponse> {
  return {
    enrollmentId: `ENR-LOCAL-${Date.now()}`,
    status: 'confirmed',
    enrolledAt: new Date().toISOString(),
  };
}

export function useEnrollmentSubmissionState(
  options: UseEnrollmentSubmissionStateOptions = {},
) {
  const submitLockRef = useRef(false);
  const submitEnrollment = options.submitEnrollment ?? localSubmitEnrollment;
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [result, setResult] = useState<EnrollmentResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});

  async function submit(payload: EnrollmentRequest | null) {
    if (!payload) {
      setStatus('failed');
      setErrorMessage('이용약관에 동의해야 제출할 수 있습니다.');
      setFieldErrors({
        agreedToTerms: '이용약관에 동의해야 제출할 수 있습니다.',
      });
      return;
    }

    if (submitLockRef.current) {
      return;
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
    } catch (error) {
      const mappedError = mapEnrollmentSubmissionError(error);
      setStatus('failed');
      setErrorMessage(mappedError.message);
      setFieldErrors(mappedError.fieldErrors);
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
