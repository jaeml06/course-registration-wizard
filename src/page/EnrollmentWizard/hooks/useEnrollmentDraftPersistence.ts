import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import type {
  EnrollmentFormState,
  EnrollmentStep,
} from '../../../type/enrollmentForm';
import {
  clearEnrollmentDraft,
  createStoredEnrollmentDraft,
  type DraftPersistenceState,
  writeEnrollmentDraft,
} from '../../../util/enrollmentDraftStorage';
import { hasMeaningfulEnrollmentData } from '../../../util/enrollmentFormState';

type SubmissionStatus = 'idle' | 'submitting' | 'succeeded' | 'failed';

interface UseEnrollmentDraftPersistenceOptions {
  formState: EnrollmentFormState;
  currentStep: EnrollmentStep;
  submissionStatus: SubmissionStatus;
  storage?: Storage | null;
}

const AVAILABLE_STATE: DraftPersistenceState = {
  recoveryStatus: 'empty',
  recoveryMessage: null,
  isPersistenceAvailable: true,
};

export function useEnrollmentDraftPersistence({
  formState,
  currentStep,
  submissionStatus,
  storage = getBrowserSessionStorage(),
}: UseEnrollmentDraftPersistenceOptions): DraftPersistenceState {
  const hasSucceededRef = useRef(false);
  const [persistenceState, setPersistenceState] =
    useState<DraftPersistenceState>(AVAILABLE_STATE);

  useEffect(() => {
    if (!storage) {
      setNextPersistenceState(setPersistenceState, {
        recoveryStatus: 'unavailable',
        recoveryMessage:
          '임시 저장을 사용할 수 없습니다. 신청은 계속 진행할 수 있습니다.',
        isPersistenceAvailable: false,
      });
      return;
    }

    if (submissionStatus === 'succeeded') {
      hasSucceededRef.current = true;
      setNextPersistenceState(
        setPersistenceState,
        clearEnrollmentDraft(storage),
      );
      return;
    }

    if (hasSucceededRef.current) {
      return;
    }

    if (!hasMeaningfulEnrollmentData(formState)) {
      setNextPersistenceState(
        setPersistenceState,
        clearEnrollmentDraft(storage),
      );
      return;
    }

    setNextPersistenceState(
      setPersistenceState,
      writeEnrollmentDraft(
        storage,
        createStoredEnrollmentDraft(formState, currentStep),
      ),
    );
  }, [currentStep, formState, storage, submissionStatus]);

  return persistenceState;
}

function setNextPersistenceState(
  setPersistenceState: Dispatch<SetStateAction<DraftPersistenceState>>,
  nextState: DraftPersistenceState,
) {
  setPersistenceState((currentState) => {
    if (
      currentState.recoveryStatus === nextState.recoveryStatus &&
      currentState.recoveryMessage === nextState.recoveryMessage &&
      currentState.isPersistenceAvailable === nextState.isPersistenceAvailable
    ) {
      return currentState;
    }

    return nextState;
  });
}

function getBrowserSessionStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage;
}
