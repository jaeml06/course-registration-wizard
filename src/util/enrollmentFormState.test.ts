import {
  buildEmptyPersonalDraft,
  buildMeaningfulGroupDraft,
  buildPersonalDraft,
  buildGroupDraft,
} from '../test/enrollmentFixtures';

import {
  createInitialEnrollmentFormState,
  createInitialGroupForm,
  hasMeaningfulGroupData,
  hasMeaningfulEnrollmentData,
  switchEnrollmentType,
  syncParticipantsToHeadCount,
  updateApplicantField,
  updateGroupField,
} from './enrollmentFormState';

describe('enrollmentFormState', () => {
  test('초기 상태는 개인 신청과 빈 입력값으로 만든다', () => {
    expect(createInitialEnrollmentFormState()).toEqual({
      selectedCourseId: '',
      type: 'personal',
      applicant: {
        name: '',
        email: '',
        phone: '',
        motivation: '',
      },
      agreedToTerms: false,
      group: null,
    });
  });

  test('개인 신청에서 단체 신청으로 바꾸면 단체 기본값을 생성한다', () => {
    const state = createInitialEnrollmentFormState();

    expect(switchEnrollmentType(state, 'group')).toEqual({
      ...state,
      type: 'group',
      group: createInitialGroupForm(),
    });
  });

  test('의미 있는 단체 데이터가 없으면 확인 없이 개인 신청으로 초기화한다', () => {
    const groupState = switchEnrollmentType(
      createInitialEnrollmentFormState(),
      'group',
    );

    expect(switchEnrollmentType(groupState, 'personal')).toEqual({
      selectedCourseId: '',
      type: 'personal',
      applicant: {
        name: '',
        email: '',
        phone: '',
        motivation: '',
      },
      agreedToTerms: false,
      group: null,
    });
  });

  test('의미 있는 단체 데이터가 있으면 확인 전에는 개인 신청으로 바꾸지 않는다', () => {
    const groupState = updateGroupField(
      switchEnrollmentType(createInitialEnrollmentFormState(), 'group'),
      'organizationName',
      '코스 주식회사',
    );

    expect(hasMeaningfulGroupData(groupState.group)).toBe(true);
    expect(switchEnrollmentType(groupState, 'personal')).toEqual(groupState);
  });

  test('확인된 단체 신청은 개인 신청으로 바꾸며 단체 데이터를 초기화한다', () => {
    const groupState = updateGroupField(
      switchEnrollmentType(createInitialEnrollmentFormState(), 'group'),
      'organizationName',
      '코스 주식회사',
    );

    expect(
      switchEnrollmentType(groupState, 'personal', { confirmedReset: true }),
    ).toEqual({
      ...groupState,
      type: 'personal',
      group: null,
    });
  });

  test('신청 인원수를 늘리면 기존 참가자를 유지하고 빈 참가자를 추가한다', () => {
    const group = {
      ...createInitialGroupForm(),
      participants: [
        { name: '김참가', email: 'member1@example.com' },
        { name: '이참가', email: 'member2@example.com' },
      ],
    };

    expect(syncParticipantsToHeadCount(group, 4).participants).toEqual([
      { name: '김참가', email: 'member1@example.com' },
      { name: '이참가', email: 'member2@example.com' },
      { name: '', email: '' },
      { name: '', email: '' },
    ]);
  });

  test('신청 인원수를 줄이면 앞 참가자만 유지한다', () => {
    const group = {
      ...createInitialGroupForm(),
      headCount: 4,
      participants: [
        { name: '김참가', email: 'member1@example.com' },
        { name: '이참가', email: 'member2@example.com' },
        { name: '박참가', email: 'member3@example.com' },
        { name: '최참가', email: 'member4@example.com' },
      ],
    };

    expect(syncParticipantsToHeadCount(group, 2).participants).toEqual([
      { name: '김참가', email: 'member1@example.com' },
      { name: '이참가', email: 'member2@example.com' },
    ]);
  });

  test('신청 인원수는 10명을 초과해 입력해도 10명으로 제한한다', () => {
    const groupState = updateGroupField(
      switchEnrollmentType(createInitialEnrollmentFormState(), 'group'),
      'headCount',
      622,
    );

    expect(groupState.type).toBe('group');

    if (groupState.type !== 'group') {
      return;
    }

    expect(groupState.group.headCount).toBe(10);
    expect(groupState.group.participants).toHaveLength(10);
  });

  test('신청자 필드를 불변 업데이트한다', () => {
    const state = createInitialEnrollmentFormState();

    expect(updateApplicantField(state, 'name', '홍길동')).toEqual({
      ...state,
      applicant: {
        ...state.applicant,
        name: '홍길동',
      },
    });
  });

  test('빈 개인 신청은 의미 있는 입력으로 보지 않는다', () => {
    const state = buildEmptyPersonalDraft();

    expect(hasMeaningfulEnrollmentData(state)).toBe(false);
  });

  test('강의 선택, 신청자 입력, 약관 동의는 의미 있는 입력으로 판단한다', () => {
    expect(
      hasMeaningfulEnrollmentData(
        buildEmptyPersonalDraft({ selectedCourseId: 'course-react-fundamentals' }),
      ),
    ).toBe(true);
    expect(
      hasMeaningfulEnrollmentData(
        buildEmptyPersonalDraft({
          applicant: {
            name: '',
            email: 'student@example.com',
            phone: '',
            motivation: '',
          },
        }),
      ),
    ).toBe(true);
    expect(
      hasMeaningfulEnrollmentData(buildEmptyPersonalDraft({ agreedToTerms: true })),
    ).toBe(true);
  });

  test('개인 draft는 group 값을 의미 있는 입력으로 보지 않고 단체 draft의 단체 필드는 의미 있게 본다', () => {
    expect(
      hasMeaningfulEnrollmentData(
        buildPersonalDraft({
          selectedCourseId: '',
          applicant: { name: '', email: '', phone: '', motivation: '' },
          agreedToTerms: false,
          group: createInitialGroupForm(),
        }),
      ),
    ).toBe(false);

    expect(hasMeaningfulEnrollmentData(buildMeaningfulGroupDraft())).toBe(true);
    expect(
      hasMeaningfulEnrollmentData(
        buildGroupDraft({
          selectedCourseId: '',
          applicant: { name: '', email: '', phone: '', motivation: '' },
          agreedToTerms: false,
          group: createInitialGroupForm(),
        }),
      ),
    ).toBe(false);
  });
});
