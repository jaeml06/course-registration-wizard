import { setupServer } from 'msw/node';

import type {
  EnrollmentRequest,
  PersonalEnrollmentRequest,
} from '../../type/enrollment';

import { enrollmentHandlers } from './enrollments';

const server = setupServer(...enrollmentHandlers);

function buildRequest(
  overrides: Partial<PersonalEnrollmentRequest> = {},
): PersonalEnrollmentRequest {
  return {
    courseId: 'course-react-fundamentals',
    type: 'personal',
    applicant: {
      name: '홍길동',
      email: 'student@example.com',
      phone: '010-1234-5678',
    },
    agreedToTerms: true,
    ...overrides,
  };
}

async function postEnrollment(body: EnrollmentRequest) {
  return fetch('http://localhost/api/enrollments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('enrollmentHandlers', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test('유효한 신청은 201 성공 응답을 반환한다', async () => {
    const response = await postEnrollment(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      enrollmentId: expect.stringMatching(/^ENR-/),
      status: 'confirmed',
    });
  });

  test('정원 마감 강의는 COURSE_FULL 응답을 반환한다', async () => {
    const response = await postEnrollment(
      buildRequest({ courseId: 'course-product-design' }),
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.code).toBe('COURSE_FULL');
  });

  test('중복 신청 이메일은 DUPLICATE_ENROLLMENT 응답을 반환한다', async () => {
    const response = await postEnrollment(
      buildRequest({
        applicant: {
          name: '홍길동',
          email: 'duplicate@example.com',
          phone: '010-1234-5678',
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.code).toBe('DUPLICATE_ENROLLMENT');
  });

  test('필수 입력이 누락되면 INVALID_INPUT details를 반환한다', async () => {
    const response = await postEnrollment(
      buildRequest({
        applicant: {
          name: '',
          email: 'wrong-email',
          phone: '',
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      code: 'INVALID_INPUT',
      message: '입력값을 확인해 주세요.',
      details: {
        'applicant.name': '이름을 입력해 주세요.',
        'applicant.email': '이메일 형식으로 입력해 주세요.',
        'applicant.phone': '전화번호를 입력해 주세요.',
      },
    });
  });
});
