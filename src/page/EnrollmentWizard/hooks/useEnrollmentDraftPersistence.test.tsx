import { renderHook } from '@testing-library/react';

import {
  buildEmptyPersonalDraft,
  buildPersonalDraft,
} from '../../../test/enrollmentFixtures';
import {
  DRAFT_STORAGE_KEY,
  readEnrollmentDraft,
} from '../../../util/enrollmentDraftStorage';

import { useEnrollmentDraftPersistence } from './useEnrollmentDraftPersistence';

type SubmissionStatus = 'idle' | 'submitting' | 'succeeded' | 'failed';

function createThrowingStorage(): Storage {
  return {
    length: 0,
    clear: vi.fn(),
    getItem: vi.fn(() => {
      throw new Error('storage unavailable');
    }),
    key: vi.fn(() => null),
    removeItem: vi.fn(() => {
      throw new Error('storage unavailable');
    }),
    setItem: vi.fn(() => {
      throw new Error('storage unavailable');
    }),
  };
}

describe('useEnrollmentDraftPersistence', () => {
  test('의미 있는 입력이 있으면 formState와 currentStep 변경을 자동 저장한다', () => {
    const { rerender } = renderHook(
      ({
        formState,
        currentStep,
      }: {
        formState: ReturnType<typeof buildPersonalDraft>;
        currentStep: 'course' | 'applicant' | 'review';
      }) =>
        useEnrollmentDraftPersistence({
          formState,
          currentStep,
          submissionStatus: 'idle',
          storage: sessionStorage,
        }),
      {
        initialProps: {
          formState: buildPersonalDraft({
            agreedToTerms: false,
            applicant: {
              name: '홍길동',
              email: 'student@example.com',
              phone: '010-1234-5678',
              motivation: '',
            },
          }),
          currentStep: 'applicant',
        },
      },
    );

    expect(readEnrollmentDraft(sessionStorage)).toMatchObject({
      status: 'restored',
      draft: {
        currentStep: 'applicant',
        formState: {
          applicant: {
            email: 'student@example.com',
          },
        },
      },
    });

    rerender({
      formState: buildPersonalDraft({
        agreedToTerms: true,
      }),
      currentStep: 'review',
    });

    expect(readEnrollmentDraft(sessionStorage)).toMatchObject({
      status: 'restored',
      draft: {
        currentStep: 'review',
        formState: {
          agreedToTerms: true,
        },
      },
    });
  });

  test('빈 draft면 저장 key를 삭제한다', () => {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, 'old');

    renderHook(() =>
      useEnrollmentDraftPersistence({
        formState: buildEmptyPersonalDraft(),
        currentStep: 'course',
        submissionStatus: 'idle',
        storage: sessionStorage,
      }),
    );

    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  test('제출 성공 후 draft를 삭제하고 이후 자동 저장을 멈춘다', () => {
    const { rerender } = renderHook(
      ({
        submissionStatus,
      }: {
        submissionStatus: 'idle' | 'submitting' | 'succeeded' | 'failed';
      }) =>
        useEnrollmentDraftPersistence({
          formState: buildPersonalDraft({ agreedToTerms: true }),
          currentStep: 'review',
          submissionStatus,
          storage: sessionStorage,
        }),
      {
        initialProps: {
          submissionStatus: 'idle' as SubmissionStatus,
        },
      },
    );

    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).not.toBeNull();

    rerender({ submissionStatus: 'succeeded' });

    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();

    rerender({ submissionStatus: 'idle' });

    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  test('storage가 예외를 던져도 렌더링을 막지 않는다', () => {
    const storage = createThrowingStorage();

    expect(() =>
      renderHook(() =>
        useEnrollmentDraftPersistence({
          formState: buildPersonalDraft(),
          currentStep: 'applicant',
          submissionStatus: 'idle',
          storage,
        }),
      ),
    ).not.toThrow();

    expect(storage.setItem).toHaveBeenCalled();
  });
});
