import { COURSES } from '../constants/courses';
import {
  buildGroupDraft,
  buildPersonalDraft,
} from '../test/enrollmentFixtures';

import {
  validateApplicantStep,
  validateCourseStep,
  validateCurrentStep,
  validateField,
  validateReviewStep,
} from './enrollmentValidation';

describe('enrollmentValidation', () => {
  test('신청자 이름이 2자 미만이면 오류를 반환한다', () => {
    const state = buildPersonalDraft({
      applicant: {
        name: '김',
        email: 'student@example.com',
        phone: '010-1234-5678',
        motivation: '',
      },
    });

    expect(validateField('applicant.name', state)).toEqual(
      '이름은 2자 이상 입력해 주세요.',
    );
  });

  test('신청자 이름이 20자를 넘으면 오류를 반환한다', () => {
    const state = buildPersonalDraft({
      applicant: {
        name: '가'.repeat(21),
        email: 'student@example.com',
        phone: '010-1234-5678',
        motivation: '',
      },
    });

    expect(validateField('applicant.name', state)).toEqual(
      '이름은 20자 이하로 입력해 주세요.',
    );
  });

  test('한국 전화번호 형식이 아니면 오류를 반환한다', () => {
    const state = buildPersonalDraft({
      applicant: {
        name: '홍길동',
        email: 'student@example.com',
        phone: '1234',
        motivation: '',
      },
    });

    expect(validateField('applicant.phone', state)).toEqual(
      '전화번호는 010-1234-5678 형식으로 입력해 주세요.',
    );
  });

  test('수강 동기가 300자를 넘으면 오류를 반환한다', () => {
    const state = buildPersonalDraft({
      applicant: {
        name: '홍길동',
        email: 'student@example.com',
        phone: '010-1234-5678',
        motivation: '가'.repeat(301),
      },
    });

    expect(validateField('applicant.motivation', state)).toEqual(
      '수강 동기는 300자 이하로 입력해 주세요.',
    );
  });

  test('강의를 선택하지 않으면 1단계 오류를 반환한다', () => {
    const state = buildPersonalDraft({ selectedCourseId: '' });

    expect(validateCourseStep(state, COURSES)).toEqual({
      selectedCourseId: '수강할 강의를 선택해 주세요.',
    });
  });

  test('정원 마감 강의를 선택하면 1단계 오류를 반환한다', () => {
    const state = buildPersonalDraft({
      selectedCourseId: 'course-product-design',
    });

    expect(validateCourseStep(state, COURSES)).toEqual({
      selectedCourseId: '정원이 마감된 강의는 선택할 수 없습니다.',
    });
  });

  test('개인 신청 2단계 검증은 약관 동의를 검증하지 않는다', () => {
    const state = buildPersonalDraft({
      agreedToTerms: false,
      applicant: {
        name: '홍길동',
        email: 'wrong-email',
        phone: '010-1234-5678',
        motivation: '',
      },
    });

    expect(validateApplicantStep(state, COURSES)).toEqual({
      'applicant.email': '이메일 형식으로 입력해 주세요.',
    });
  });

  test('단체 신청 필수 필드가 비어 있으면 오류를 반환한다', () => {
    const state = buildGroupDraft({
      group: {
        organizationName: '',
        headCount: 2,
        participants: [
          { name: '', email: 'member1@example.com' },
          { name: '이참가', email: 'wrong-email' },
        ],
        contactPerson: '1234',
      },
    });

    expect(validateApplicantStep(state, COURSES)).toMatchObject({
      'group.organizationName': '단체명을 입력해 주세요.',
      'group.participants.0.name': '참가자 이름을 입력해 주세요.',
      'group.participants.1.email': '참가자 이메일 형식으로 입력해 주세요.',
      'group.contactPerson':
        '담당자 연락처는 010-1234-5678 형식으로 입력해 주세요.',
    });
  });

  test('참가자 이메일이 서로 중복되면 필드별 오류를 반환한다', () => {
    const state = buildGroupDraft({
      group: {
        organizationName: '코스 주식회사',
        headCount: 2,
        participants: [
          { name: '김참가', email: 'same@example.com' },
          { name: '이참가', email: 'same@example.com' },
        ],
        contactPerson: '010-2222-3333',
      },
    });

    expect(validateApplicantStep(state, COURSES)).toMatchObject({
      'group.participants.0.email': '참가자 이메일은 서로 중복될 수 없습니다.',
      'group.participants.1.email': '참가자 이메일은 서로 중복될 수 없습니다.',
    });
  });

  test('신청자 이메일과 참가자 이메일이 같으면 오류를 반환한다', () => {
    const state = buildGroupDraft({
      applicant: {
        name: '홍길동',
        email: 'student@example.com',
        phone: '010-1234-5678',
        motivation: '',
      },
      group: {
        organizationName: '코스 주식회사',
        headCount: 2,
        participants: [
          { name: '김참가', email: 'student@example.com' },
          { name: '이참가', email: 'member2@example.com' },
        ],
        contactPerson: '010-2222-3333',
      },
    });

    expect(validateApplicantStep(state, COURSES)).toMatchObject({
      'group.participants.0.email':
        '신청자 이메일과 참가자 이메일은 같을 수 없습니다.',
    });
  });

  test('단체 신청 인원수가 잔여 정원보다 크면 진행을 막는다', () => {
    const state = buildGroupDraft({
      selectedCourseId: 'course-typescript-forms',
      group: {
        organizationName: '코스 주식회사',
        headCount: 3,
        participants: [
          { name: '김참가', email: 'member1@example.com' },
          { name: '이참가', email: 'member2@example.com' },
          { name: '박참가', email: 'member3@example.com' },
        ],
        contactPerson: '010-2222-3333',
      },
    });

    expect(validateApplicantStep(state, COURSES)).toMatchObject({
      'group.headCount': '선택한 강의의 잔여 정원은 2명입니다.',
    });
  });

  test('약관에 동의하지 않으면 3단계 오류를 반환한다', () => {
    const state = buildPersonalDraft({ agreedToTerms: false });

    expect(validateReviewStep(state)).toEqual({
      agreedToTerms: '이용약관에 동의해야 제출할 수 있습니다.',
    });
  });

  test('현재 스텝만 검증한다', () => {
    const state = buildPersonalDraft({
      selectedCourseId: '',
      agreedToTerms: false,
      applicant: {
        name: '',
        email: '',
        phone: '',
        motivation: '',
      },
    });

    expect(validateCurrentStep('course', state, COURSES)).toEqual({
      selectedCourseId: '수강할 강의를 선택해 주세요.',
    });
  });

  test('복구된 단체 draft도 참가자 수, 이메일 중복, 신청자 이메일 중복, 잔여 정원 검증을 받는다', () => {
    const participantCountMismatch = buildGroupDraft({
      group: {
        organizationName: '코스 주식회사',
        headCount: 3,
        participants: [
          { name: '김참가', email: 'member1@example.com' },
          { name: '이참가', email: 'member2@example.com' },
        ],
        contactPerson: '010-2222-3333',
      },
    });
    const duplicateEmails = buildGroupDraft({
      applicant: {
        name: '홍길동',
        email: 'student@example.com',
        phone: '010-1234-5678',
        motivation: '',
      },
      group: {
        organizationName: '코스 주식회사',
        headCount: 2,
        participants: [
          { name: '김참가', email: 'student@example.com' },
          { name: '이참가', email: 'student@example.com' },
        ],
        contactPerson: '010-2222-3333',
      },
    });
    const overCapacity = buildGroupDraft({
      selectedCourseId: 'course-typescript-forms',
      group: {
        organizationName: '코스 주식회사',
        headCount: 3,
        participants: [
          { name: '김참가', email: 'member1@example.com' },
          { name: '이참가', email: 'member2@example.com' },
          { name: '박참가', email: 'member3@example.com' },
        ],
        contactPerson: '010-2222-3333',
      },
    });

    expect(validateApplicantStep(participantCountMismatch, COURSES)).toMatchObject({
      'group.headCount': '참가자 명단은 신청 인원수 3명과 같아야 합니다.',
    });
    expect(validateApplicantStep(duplicateEmails, COURSES)).toMatchObject({
      'group.participants.0.email':
        '참가자 이메일은 서로 중복될 수 없습니다.',
      'group.participants.1.email':
        '참가자 이메일은 서로 중복될 수 없습니다.',
    });
    expect(validateApplicantStep(overCapacity, COURSES)).toMatchObject({
      'group.headCount': '선택한 강의의 잔여 정원은 2명입니다.',
    });
  });
});
