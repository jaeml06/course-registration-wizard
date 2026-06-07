import {
  buildGroupDraft,
  buildPersonalDraft,
} from '../test/enrollmentFixtures';

import { createEnrollmentPayload } from './enrollmentPayload';

describe('enrollmentPayload', () => {
  test('개인 신청 payload에는 group 데이터를 포함하지 않는다', () => {
    const payload = createEnrollmentPayload(
      buildPersonalDraft({
        applicant: {
          name: ' 홍길동 ',
          email: ' student@example.com ',
          phone: ' 010-1234-5678 ',
          motivation: '',
        },
      }),
    );

    expect(payload).toEqual({
      courseId: 'course-react-fundamentals',
      type: 'personal',
      applicant: {
        name: '홍길동',
        email: 'student@example.com',
        phone: '010-1234-5678',
      },
      agreedToTerms: true,
    });
    expect('group' in payload!).toBe(false);
  });

  test('단체 신청 payload에는 단체 데이터를 포함한다', () => {
    const payload = createEnrollmentPayload(buildGroupDraft());

    expect(payload).toMatchObject({
      courseId: 'course-react-fundamentals',
      type: 'group',
      group: {
        organizationName: '코스 주식회사',
        headCount: 2,
        contactPerson: '010-2222-3333',
      },
      agreedToTerms: true,
    });
  });

  test('공백 수강 동기는 payload에서 생략한다', () => {
    const payload = createEnrollmentPayload(
      buildPersonalDraft({
        applicant: {
          name: '홍길동',
          email: 'student@example.com',
          phone: '010-1234-5678',
          motivation: '   ',
        },
      }),
    );

    expect(payload?.applicant).not.toHaveProperty('motivation');
  });

  test('약관에 동의하지 않으면 payload를 만들지 않는다', () => {
    expect(
      createEnrollmentPayload(buildPersonalDraft({ agreedToTerms: false })),
    ).toBeNull();
  });
});
