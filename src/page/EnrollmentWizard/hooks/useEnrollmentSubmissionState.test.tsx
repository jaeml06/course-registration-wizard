import { act, renderHook, waitFor } from '@testing-library/react';

import type { EnrollmentResponse } from '../../../type/enrollment';
import { buildPersonalDraft } from '../../../test/enrollmentFixtures';
import { createEnrollmentPayload } from '../../../util/enrollmentPayload';

import { useEnrollmentSubmissionState } from './useEnrollmentSubmissionState';

function createResponse(): EnrollmentResponse {
  return {
    enrollmentId: 'ENR-TEST-001',
    status: 'confirmed',
    enrolledAt: '2026-06-06T12:00:00.000Z',
  };
}

describe('useEnrollmentSubmissionState', () => {
  test('초기 상태는 idle이다', () => {
    const { result } = renderHook(() => useEnrollmentSubmissionState());

    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBeNull();
  });

  test('제출 성공 시 succeeded 상태와 결과를 저장한다', async () => {
    const submitEnrollment = vi.fn(async () => createResponse());
    const payload = createEnrollmentPayload(buildPersonalDraft());
    const { result } = renderHook(() =>
      useEnrollmentSubmissionState({ submitEnrollment }),
    );

    await act(async () => {
      await result.current.submit(payload);
    });

    expect(result.current.status).toBe('succeeded');
    expect(result.current.result).toEqual(createResponse());
  });

  test('제출 실패 시 failed 상태와 한국어 오류를 저장한다', async () => {
    const submitEnrollment = vi.fn(async () => {
      throw {
        code: 'COURSE_FULL',
        message: 'full',
      };
    });
    const payload = createEnrollmentPayload(buildPersonalDraft());
    const { result } = renderHook(() =>
      useEnrollmentSubmissionState({ submitEnrollment }),
    );

    await act(async () => {
      await result.current.submit(payload);
    });

    expect(result.current.status).toBe('failed');
    expect(result.current.errorMessage).toBe(
      '선택한 강의의 정원이 마감되었습니다. 다른 강의를 선택해 주세요.',
    );
    expect(result.current.fieldErrors.selectedCourseId).toBe(
      '정원이 마감된 강의입니다.',
    );
  });

  test('제출 중에는 중복 제출을 막는다', async () => {
    let resolveSubmit: (response: EnrollmentResponse) => void = () => {};
    const submitEnrollment = vi.fn(
      () =>
        new Promise<EnrollmentResponse>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const payload = createEnrollmentPayload(buildPersonalDraft());
    const { result } = renderHook(() =>
      useEnrollmentSubmissionState({ submitEnrollment }),
    );

    act(() => {
      void result.current.submit(payload);
    });
    act(() => {
      void result.current.submit(payload);
    });

    expect(submitEnrollment).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSubmit(createResponse());
    });
    await waitFor(() => expect(result.current.status).toBe('succeeded'));
  });

  test('재시도는 실패 상태를 idle로 되돌리되 결과는 비운다', async () => {
    const submitEnrollment = vi.fn(async () => {
      throw new Error('network');
    });
    const payload = createEnrollmentPayload(buildPersonalDraft());
    const { result } = renderHook(() =>
      useEnrollmentSubmissionState({ submitEnrollment }),
    );

    await act(async () => {
      await result.current.submit(payload);
    });
    act(() => {
      result.current.retry();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.result).toBeNull();
  });

  test('payload가 없으면 제출하지 않고 약관 오류를 표시한다', async () => {
    const submitEnrollment = vi.fn(async () => createResponse());
    const { result } = renderHook(() =>
      useEnrollmentSubmissionState({ submitEnrollment }),
    );

    await act(async () => {
      await result.current.submit(null);
    });

    expect(submitEnrollment).not.toHaveBeenCalled();
    expect(result.current.fieldErrors.agreedToTerms).toBe(
      '이용약관에 동의해야 제출할 수 있습니다.',
    );
  });
});
