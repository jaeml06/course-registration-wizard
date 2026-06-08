import { http, HttpResponse } from 'msw';

import { server } from '../mocks/server';
import {
  buildGroupDraft,
  buildPersonalDraft,
} from '../test/enrollmentFixtures';
import { createEnrollmentPayload } from '../util/enrollmentPayload';

import { postEnrollment } from './enrollments';

describe('postEnrollment', () => {
  test('개인 신청 payload를 제출하고 성공 응답을 반환한다', async () => {
    const payload = createEnrollmentPayload(buildPersonalDraft());

    await expect(postEnrollment(payload!)).resolves.toMatchObject({
      enrollmentId: expect.stringMatching(/^ENR-/),
      status: 'confirmed',
    });
  });

  test('단체 신청 payload를 제출하고 성공 응답을 반환한다', async () => {
    const payload = createEnrollmentPayload(buildGroupDraft());

    await expect(postEnrollment(payload!)).resolves.toMatchObject({
      enrollmentId: expect.stringMatching(/^ENR-/),
      status: 'confirmed',
    });
  });

  test('COURSE_FULL 실패 응답은 code와 message를 유지해 throw한다', async () => {
    const payload = createEnrollmentPayload(
      buildPersonalDraft({ selectedCourseId: 'course-product-design' }),
    );

    await expect(postEnrollment(payload!)).rejects.toMatchObject({
      code: 'COURSE_FULL',
      message: '선택한 강의의 정원이 마감되었습니다.',
    });
  });

  test('DUPLICATE_ENROLLMENT 실패 응답은 code와 message를 유지해 throw한다', async () => {
    const payload = createEnrollmentPayload(
      buildPersonalDraft({
        applicant: {
          name: '홍길동',
          email: 'duplicate@example.com',
          phone: '010-1234-5678',
          motivation: '',
        },
      }),
    );

    await expect(postEnrollment(payload!)).rejects.toMatchObject({
      code: 'DUPLICATE_ENROLLMENT',
      message: '이미 신청된 강의입니다.',
    });
  });

  test('INVALID_INPUT 실패 응답은 details를 유지해 throw한다', async () => {
    const payload = createEnrollmentPayload(
      buildPersonalDraft({
        applicant: {
          name: '',
          email: 'wrong-email',
          phone: '',
          motivation: '',
        },
      }),
    );

    await expect(postEnrollment(payload!)).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      details: {
        'applicant.name': '이름을 입력해 주세요.',
        'applicant.email': '이메일 형식으로 입력해 주세요.',
        'applicant.phone': '전화번호를 입력해 주세요.',
      },
    });
  });

  test('JSON이 아닌 실패 응답은 일반 Error로 throw한다', async () => {
    server.use(
      http.post(
        '*/api/enrollments',
        () => new HttpResponse('server error', { status: 500 }),
      ),
    );
    const payload = createEnrollmentPayload(buildPersonalDraft());

    await expect(postEnrollment(payload!)).rejects.toBeInstanceOf(Error);
  });
});
