import {
  createInitialEnrollmentFormState,
  createInitialGroupForm,
  hasMeaningfulGroupData,
  switchEnrollmentType,
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
});
