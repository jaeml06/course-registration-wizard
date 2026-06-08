import { useEffect, useRef } from 'react';

import type {
  EnrollmentFormState,
  EnrollmentStep,
  SubmissionStatus,
} from '../../../type/enrollmentForm';
import {
  clearEnrollmentDraft,
  createStoredEnrollmentDraft,
  writeEnrollmentDraft,
} from '../../../util/enrollmentDraftStorage';
import { hasMeaningfulEnrollmentData } from '../../../util/enrollmentFormState';

interface UseEnrollmentDraftPersistenceOptions {
  formState: EnrollmentFormState;
  currentStep: EnrollmentStep;
  submissionStatus: SubmissionStatus;
  storage?: Storage | null;
}

/**
 * 입력값/단계가 바뀔 때마다 sessionStorage에 자동 임시저장하는 훅.
 * storage를 주입 가능하게 열어 테스트에서 가짜 저장소를 넣을 수 있다.
 */
export function useEnrollmentDraftPersistence({
  formState,
  currentStep,
  submissionStatus,
  storage = getBrowserSessionStorage(),
}: UseEnrollmentDraftPersistenceOptions): void {
  // 한 번 제출에 성공하면 그 이후로는 다시 저장하지 않기 위한 빗장.
  const hasSucceededRef = useRef(false);

  useEffect(() => {
    // 저장소가 없거나(서버 환경 등) 이미 성공 처리한 뒤면 아무것도 하지 않는다.
    if (!storage || hasSucceededRef.current) {
      return;
    }

    // 제출 성공: 더 이상 복구할 필요가 없으니 저장된 draft를 삭제한다.
    if (submissionStatus === 'succeeded') {
      hasSucceededRef.current = true;
      clearEnrollmentDraft(storage);
      return;
    }

    // 의미 있는 입력이 없으면(빈 폼) 굳이 저장하지 않고, 남아 있던 draft도 지운다.
    if (!hasMeaningfulEnrollmentData(formState)) {
      clearEnrollmentDraft(storage);
      return;
    }

    // 그 외에는 현재 폼 상태 + 현재 단계를 묶어 저장한다.
    writeEnrollmentDraft(
      storage,
      createStoredEnrollmentDraft(formState, currentStep),
    );
  }, [currentStep, formState, storage, submissionStatus]);
}

// 브라우저에서만 sessionStorage를 반환하고, 그 외 환경에서는 null로 안전하게 빠진다.
function getBrowserSessionStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage;
}
