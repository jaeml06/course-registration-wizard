import { z } from 'zod';

import type {
  EnrollmentFormState,
  EnrollmentStep,
} from '../type/enrollmentForm';

export const DRAFT_STORAGE_KEY = 'course-registration-wizard:draft:v1';
export const DRAFT_SCHEMA_VERSION = 1;

const RESTORED_MESSAGE = '이전에 작성하던 신청 정보를 복구했습니다.';
export const INVALID_DRAFT_MESSAGE =
  '저장된 신청 정보를 복구할 수 없어 새 신청으로 시작합니다.';
export const UNAVAILABLE_DRAFT_MESSAGE =
  '임시 저장을 사용할 수 없습니다. 신청은 계속 진행할 수 있습니다.';

export interface StoredEnrollmentDraft {
  version: 1;
  savedAt: string;
  currentStep: EnrollmentStep;
  formState: EnrollmentFormState;
}

export type DraftRecoveryResult =
  | { status: 'empty'; draft: null; message: null }
  | { status: 'restored'; draft: StoredEnrollmentDraft; message: string }
  | { status: 'invalid'; draft: null; message: string }
  | { status: 'unavailable'; draft: null; message: string };

export interface DraftPersistenceState {
  recoveryStatus: DraftRecoveryResult['status'];
  recoveryMessage: string | null;
  isPersistenceAvailable: boolean;
}

const applicantSchema = z
  .object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    motivation: z.string(),
  })
  .strict();

const participantSchema = z
  .object({
    name: z.string(),
    email: z.string(),
  })
  .strict();

const groupSchema = z
  .object({
    organizationName: z.string(),
    headCount: z.number(),
    participants: z.array(participantSchema),
    contactPerson: z.string(),
  })
  .strict();

const personalFormStateSchema = z
  .object({
    selectedCourseId: z.string(),
    type: z.literal('personal'),
    applicant: applicantSchema,
    agreedToTerms: z.boolean(),
    group: z.null(),
  })
  .strict();

const groupFormStateSchema = z
  .object({
    selectedCourseId: z.string(),
    type: z.literal('group'),
    applicant: applicantSchema,
    agreedToTerms: z.boolean(),
    group: groupSchema,
  })
  .strict();

const enrollmentFormStateSchema = z.union([
  personalFormStateSchema,
  groupFormStateSchema,
]);

const storedEnrollmentDraftSchema = z
  .object({
    version: z.literal(DRAFT_SCHEMA_VERSION),
    savedAt: z.string().refine(isIsoDateString),
    currentStep: z.enum(['course', 'applicant', 'review']),
    formState: enrollmentFormStateSchema,
  })
  .strict();

export function createStoredEnrollmentDraft(
  formState: EnrollmentFormState,
  currentStep: EnrollmentStep,
  now = new Date(),
): StoredEnrollmentDraft {
  return {
    version: DRAFT_SCHEMA_VERSION,
    savedAt: now.toISOString(),
    currentStep,
    formState,
  };
}

export function parseStoredEnrollmentDraft(raw: string): DraftRecoveryResult {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = storedEnrollmentDraftSchema.safeParse(parsed);

    if (!result.success) {
      return invalidResult();
    }

    return {
      status: 'restored',
      draft: result.data,
      message: RESTORED_MESSAGE,
    };
  } catch {
    return invalidResult();
  }
}

export function readEnrollmentDraft(storage: Storage): DraftRecoveryResult {
  try {
    const raw = storage.getItem(DRAFT_STORAGE_KEY);

    if (!raw) {
      return {
        status: 'empty',
        draft: null,
        message: null,
      };
    }

    const result = parseStoredEnrollmentDraft(raw);

    if (result.status === 'invalid') {
      storage.removeItem(DRAFT_STORAGE_KEY);
    }

    return result;
  } catch {
    return unavailableResult();
  }
}

export function writeEnrollmentDraft(
  storage: Storage,
  draft: StoredEnrollmentDraft,
): DraftPersistenceState {
  try {
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));

    return {
      recoveryStatus: 'restored',
      recoveryMessage: null,
      isPersistenceAvailable: true,
    };
  } catch {
    return persistenceUnavailableState();
  }
}

export function clearEnrollmentDraft(storage: Storage): DraftPersistenceState {
  try {
    storage.removeItem(DRAFT_STORAGE_KEY);

    return {
      recoveryStatus: 'empty',
      recoveryMessage: null,
      isPersistenceAvailable: true,
    };
  } catch {
    return persistenceUnavailableState();
  }
}

function isIsoDateString(value: string): boolean {
  const date = new Date(value);

  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function invalidResult(): DraftRecoveryResult {
  return {
    status: 'invalid',
    draft: null,
    message: INVALID_DRAFT_MESSAGE,
  };
}

function unavailableResult(): DraftRecoveryResult {
  return {
    status: 'unavailable',
    draft: null,
    message: UNAVAILABLE_DRAFT_MESSAGE,
  };
}

function persistenceUnavailableState(): DraftPersistenceState {
  return {
    recoveryStatus: 'unavailable',
    recoveryMessage: UNAVAILABLE_DRAFT_MESSAGE,
    isPersistenceAvailable: false,
  };
}
