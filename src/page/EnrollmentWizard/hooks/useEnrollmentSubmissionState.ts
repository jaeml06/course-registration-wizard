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

// 제출 결과를 discriminated union으로 표현해, 성공이면 response가, 실패면 message가
// 반드시 있도록 타입 수준에서 강제한다.
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

/**
 * 제출 상태 전담 훅. 성공/실패/재시도 UX가 폼과 밀접해 React Query mutation 대신
 * 직접 상태를 들고 있다(README의 설계 결정 참고).
 */
export function useEnrollmentSubmissionState(
  options: UseEnrollmentSubmissionStateOptions = {},
) {
  // [중복 제출 방지] 진행 중 여부를 ref로 잠근다. state가 아니라 ref인 이유는
  // 비동기 처리 도중 리렌더 타이밍과 무관하게 "동기적으로 즉시" 잠가야 하기 때문.
  const submitLockRef = useRef(false);
  // 주입된 제출 함수가 없으면 실제 API(postEnrollment)를 쓴다.
  const submitEnrollment = options.submitEnrollment ?? postEnrollment;
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [result, setResult] = useState<EnrollmentResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});

  async function submit(
    payload: EnrollmentRequest | null,
  ): Promise<SubmissionResult> {
    // payload가 null이면 약관 미동의로 만들어지지 못한 경우다(createEnrollmentPayload 참고).
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

    // 이미 처리 중이면 두 번째 호출은 무시한다(따닥 클릭/중복 제출 차단).
    if (submitLockRef.current) {
      return {
        ok: false,
        response: null,
        message: '이미 제출을 처리 중입니다.',
        fieldErrors: {},
      };
    }

    // 잠그고 이전 결과를 초기화한 뒤 제출을 시작한다.
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
      // 서버 에러코드(COURSE_FULL 등)를 사용자용 메시지와 필드 에러로 변환한다.
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
      // 성공/실패와 무관하게 잠금을 풀어 재시도가 가능하게 한다.
      submitLockRef.current = false;
    }
  }

  // 제출 실패 후 깨끗한 초기 상태로 되돌린다(입력값은 그대로 유지됨에 유의).
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
