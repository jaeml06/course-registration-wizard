import {
  buildGroupDraft,
  buildInvalidStoredEnrollmentDraft,
  buildPersonalDraft,
  buildStoredEnrollmentDraft,
} from '../test/enrollmentFixtures';

import {
  clearEnrollmentDraft,
  createStoredEnrollmentDraft,
  DRAFT_STORAGE_KEY,
  parseStoredEnrollmentDraft,
  readEnrollmentDraft,
  writeEnrollmentDraft,
} from './enrollmentDraftStorage';

function createThrowingStorage(): Storage {
  return {
    length: 0,
    clear: vi.fn(() => {
      throw new Error('storage unavailable');
    }),
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

describe('enrollmentDraftStorage', () => {
  test('저장 payload는 version, ISO savedAt, currentStep, formState를 포함한다', () => {
    const now = new Date('2026-06-08T12:34:56.000Z');
    const formState = buildPersonalDraft({ agreedToTerms: false });

    expect(createStoredEnrollmentDraft(formState, 'review', now)).toEqual({
      version: 1,
      savedAt: '2026-06-08T12:34:56.000Z',
      currentStep: 'review',
      formState,
    });
  });

  test('값 없음, 정상 개인 JSON, 정상 단체 JSON을 구분해 읽는다', () => {
    expect(readEnrollmentDraft(sessionStorage)).toEqual({
      status: 'empty',
      draft: null,
      message: null,
    });

    const personalDraft = buildStoredEnrollmentDraft({
      formState: buildPersonalDraft({ agreedToTerms: false }),
    });
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(personalDraft));

    expect(readEnrollmentDraft(sessionStorage)).toEqual({
      status: 'restored',
      draft: personalDraft,
      message: '이전에 작성하던 신청 정보를 복구했습니다.',
    });

    const groupDraft = buildStoredEnrollmentDraft({
      currentStep: 'review',
      formState: buildGroupDraft(),
    });
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(groupDraft));

    expect(readEnrollmentDraft(sessionStorage)).toEqual({
      status: 'restored',
      draft: groupDraft,
      message: '이전에 작성하던 신청 정보를 복구했습니다.',
    });
  });

  test('invalid JSON, schema mismatch, version mismatch, 잘못된 step은 invalid로 처리한다', () => {
    expect(parseStoredEnrollmentDraft('{')).toMatchObject({
      status: 'invalid',
      draft: null,
    });
    expect(
      parseStoredEnrollmentDraft(JSON.stringify(buildInvalidStoredEnrollmentDraft())),
    ).toMatchObject({
      status: 'invalid',
      draft: null,
    });
    expect(
      parseStoredEnrollmentDraft(
        JSON.stringify(buildStoredEnrollmentDraft({ version: 2 as 1 })),
      ),
    ).toMatchObject({
      status: 'invalid',
      draft: null,
    });
    expect(
      parseStoredEnrollmentDraft(
        JSON.stringify(
          buildStoredEnrollmentDraft({
            currentStep: 'unknown' as 'course',
          }),
        ),
      ),
    ).toMatchObject({
      status: 'invalid',
      draft: null,
    });
  });

  test('write, read, clear는 고정 key로 동작하고 invalid draft는 삭제한다', () => {
    const draft = buildStoredEnrollmentDraft();

    expect(writeEnrollmentDraft(sessionStorage, draft)).toMatchObject({
      isPersistenceAvailable: true,
    });
    expect(JSON.parse(sessionStorage.getItem(DRAFT_STORAGE_KEY) ?? '{}')).toEqual(
      draft,
    );

    clearEnrollmentDraft(sessionStorage);
    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();

    sessionStorage.setItem(DRAFT_STORAGE_KEY, '{');
    expect(readEnrollmentDraft(sessionStorage)).toMatchObject({
      status: 'invalid',
    });
    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  test('storage 접근 예외는 unavailable로 반환하고 Wizard 흐름을 막지 않는다', () => {
    const storage = createThrowingStorage();

    expect(readEnrollmentDraft(storage)).toMatchObject({
      status: 'unavailable',
      draft: null,
    });
    expect(writeEnrollmentDraft(storage, buildStoredEnrollmentDraft())).toEqual({
      recoveryStatus: 'unavailable',
      recoveryMessage: '임시 저장을 사용할 수 없습니다. 신청은 계속 진행할 수 있습니다.',
      isPersistenceAvailable: false,
    });
    expect(clearEnrollmentDraft(storage)).toEqual({
      recoveryStatus: 'unavailable',
      recoveryMessage: '임시 저장을 사용할 수 없습니다. 신청은 계속 진행할 수 있습니다.',
      isPersistenceAvailable: false,
    });
  });
});
