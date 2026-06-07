import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';

import { COURSE_CATEGORIES, COURSES } from '../../constants/courses';
import { server } from '../../mocks/server';
import type {
  EnrollmentRequest,
  EnrollmentResponse,
  ErrorResponse,
} from '../../type/enrollment';

import { EnrollmentWizardPage } from './EnrollmentWizardPage';

function renderWizard(
  props: Partial<Parameters<typeof EnrollmentWizardPage>[0]> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return render(<EnrollmentWizardPage {...props} />, { wrapper: Wrapper });
}

async function selectPersonalCourse(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole('radio', { name: /React 실전 입문/ }),
  );
  await user.click(screen.getByRole('button', { name: '다음' }));
}

async function fillApplicant(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('이름'), '홍길동');
  await user.type(screen.getByLabelText('이메일'), 'student@example.com');
  await user.type(screen.getByLabelText('전화번호'), '010-1234-5678');
}

async function fillGroupFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('단체명'), '코스 주식회사');
  await user.type(screen.getByLabelText('참가자 1 이름'), '김참가');
  await user.type(
    screen.getByLabelText('참가자 1 이메일'),
    'member1@example.com',
  );
  await user.type(screen.getByLabelText('참가자 2 이름'), '이참가');
  await user.type(
    screen.getByLabelText('참가자 2 이메일'),
    'member2@example.com',
  );
  await user.type(screen.getByLabelText('담당자 연락처'), '010-2222-3333');
}

async function moveToReview(user: ReturnType<typeof userEvent.setup>) {
  await selectPersonalCourse(user);
  await fillApplicant(user);
  await user.click(screen.getByRole('button', { name: '다음' }));
}

function createResponse(): EnrollmentResponse {
  return {
    enrollmentId: 'ENR-PAGE-001',
    status: 'confirmed',
    enrolledAt: '2026-06-06T12:00:00.000Z',
  };
}

describe('EnrollmentWizardPage', () => {
  test('첫 진입 시 API 강의 목록 로딩 후 응답 강의를 보여준다', async () => {
    renderWizard();

    expect(
      screen.getByText('강의 목록을 불러오는 중입니다.'),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('radio', { name: /React 실전 입문/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('그로스 마케팅 기본기')).toBeInTheDocument();
  });

  test('개인 신청 전체 흐름을 완료하고 성공 요약을 보여준다', async () => {
    const user = userEvent.setup();
    const submitEnrollment = vi.fn(async () => createResponse());
    renderWizard({ submitEnrollment });

    await moveToReview(user);

    expect(screen.getByText('React 실전 입문')).toBeInTheDocument();
    expect(screen.getByText('student@example.com')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: '이용약관 동의' }));
    await user.click(screen.getByRole('button', { name: '신청 제출' }));

    await screen.findByText('신청이 완료되었습니다.');
    expect(screen.getByText('ENR-PAGE-001')).toBeInTheDocument();
    expect(submitEnrollment).toHaveBeenCalledTimes(1);
  });

  test('submitEnrollment prop이 없어도 실제 신청 API로 개인 신청을 제출한다', async () => {
    const user = userEvent.setup();
    renderWizard();

    await moveToReview(user);
    await user.click(screen.getByRole('checkbox', { name: '이용약관 동의' }));
    await user.click(screen.getByRole('button', { name: '신청 제출' }));

    await screen.findByText('신청이 완료되었습니다.');
    expect(screen.getByText(/^ENR-/)).toBeInTheDocument();
    expect(screen.getByText('student@example.com')).toBeInTheDocument();
  });

  test('단체 신청 전체 흐름을 확인 화면까지 완료한다', async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.click(
      await screen.findByRole('radio', { name: /React 실전 입문/ }),
    );
    await user.click(screen.getByRole('radio', { name: '단체 신청' }));
    await user.click(screen.getByRole('button', { name: '다음' }));

    await fillApplicant(user);
    await user.clear(screen.getByLabelText('신청 인원수'));
    await user.type(screen.getByLabelText('신청 인원수'), '2');
    await fillGroupFields(user);
    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(screen.getByText('코스 주식회사')).toBeInTheDocument();
    expect(
      screen.getByText('김참가 / member1@example.com'),
    ).toBeInTheDocument();
  });

  test('단체 신청 성공 시 API 요청 body에 group을 포함하고 성공 화면에 단체 요약을 보여준다', async () => {
    const user = userEvent.setup();
    let requestBody: EnrollmentRequest | null = null;
    server.use(
      http.post('*/api/enrollments', async ({ request }) => {
        requestBody = (await request.json()) as EnrollmentRequest;

        return HttpResponse.json(createResponse(), { status: 201 });
      }),
    );
    renderWizard();

    await user.click(
      await screen.findByRole('radio', { name: /React 실전 입문/ }),
    );
    await user.click(screen.getByRole('radio', { name: '단체 신청' }));
    await user.click(screen.getByRole('button', { name: '다음' }));
    await fillApplicant(user);
    await fillGroupFields(user);
    await user.click(screen.getByRole('button', { name: '다음' }));
    await user.click(screen.getByRole('checkbox', { name: '이용약관 동의' }));
    await user.click(screen.getByRole('button', { name: '신청 제출' }));

    await screen.findByText('신청이 완료되었습니다.');
    expect(requestBody).toMatchObject({
      type: 'group',
      group: {
        organizationName: '코스 주식회사',
        headCount: 2,
        contactPerson: '010-2222-3333',
      },
    });
    expect(
      screen.getByText('김참가 / member1@example.com'),
    ).toBeInTheDocument();
  });

  test('카테고리별 빈 목록과 조회 실패 후 다시 불러오기를 처리한다', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWizard();

    await screen.findByRole('radio', { name: /React 실전 입문/ });
    await user.click(screen.getByRole('button', { name: '비즈니스' }));

    expect(
      await screen.findByText('선택 가능한 강의가 없습니다.'),
    ).toBeInTheDocument();
    unmount();

    let requestCount = 0;
    server.use(
      http.get('*/api/courses', () => {
        requestCount += 1;

        if (requestCount === 1) {
          const error: ErrorResponse = {
            code: 'COURSE_LIST_FAILED',
            message: '강의 목록을 불러오지 못했습니다.',
          };

          return HttpResponse.json(error, { status: 500 });
        }

        return HttpResponse.json({
          courses: [COURSES[0]],
          categories: COURSE_CATEGORIES,
        });
      }),
    );
    renderWizard();

    expect(
      await screen.findByText('강의 목록을 불러오지 못했습니다.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다시 불러오기' }));

    expect(
      await screen.findByRole('radio', { name: /React 실전 입문/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('강의 목록을 불러오지 못했습니다.'),
    ).not.toBeInTheDocument();
  });

  test('새 카테고리 조회 결과에 기존 선택 강의가 없으면 선택을 해제하고 재선택을 안내한다', async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.click(
      await screen.findByRole('radio', { name: /React 실전 입문/ }),
    );
    await user.click(screen.getByRole('button', { name: '마케팅' }));

    expect(
      await screen.findByRole('radio', { name: /그로스 마케팅 기본기/ }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('수강할 강의를 선택해 주세요.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('선택한 강의')).not.toBeInTheDocument();
  });

  test('현재 스텝만 검증하고 미래 단계 약관 오류는 미리 표시하지 않는다', async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(
      screen.getByText('수강할 강의를 선택해 주세요.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('이용약관에 동의해야 제출할 수 있습니다.'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /React 실전 입문/ }));
    await user.click(screen.getByRole('button', { name: '다음' }));
    await user.type(screen.getByLabelText('이름'), '홍길동');
    await user.type(screen.getByLabelText('이메일'), 'wrong-email');
    await user.type(screen.getByLabelText('전화번호'), '010-1234-5678');
    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(
      screen.getByText('이메일 형식으로 입력해 주세요.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('이용약관에 동의해야 제출할 수 있습니다.'),
    ).not.toBeInTheDocument();
  });

  test('blur 검증과 첫 오류 필드 포커스를 제공한다', async () => {
    const user = userEvent.setup();
    renderWizard();

    await selectPersonalCourse(user);
    await user.type(screen.getByLabelText('이메일'), 'wrong-email');
    await user.tab();

    expect(screen.getByLabelText('이메일')).toHaveAttribute(
      'aria-invalid',
      'true',
    );

    await user.click(screen.getByRole('button', { name: '다음' }));
    await waitFor(() => expect(screen.getByLabelText('이름')).toHaveFocus());
  });

  test('뒤로 갔다 와도 강의와 신청자 입력값을 유지한다', async () => {
    const user = userEvent.setup();
    renderWizard();

    await selectPersonalCourse(user);
    await fillApplicant(user);
    await user.click(screen.getByRole('button', { name: '이전' }));

    expect(
      screen.getByRole('radio', { name: /React 실전 입문/ }),
    ).toBeChecked();

    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(screen.getByLabelText('이메일')).toHaveValue('student@example.com');
  });

  test('확인 화면 수정 링크로 돌아가 변경 값을 다시 반영한다', async () => {
    const user = userEvent.setup();
    renderWizard();

    await moveToReview(user);
    await user.click(screen.getByRole('button', { name: '강의 선택 수정' }));
    await user.click(
      screen.getByRole('radio', { name: /그로스 마케팅 기본기/ }),
    );
    await user.click(screen.getByRole('button', { name: '다음' }));
    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(screen.getByText('그로스 마케팅 기본기')).toBeInTheDocument();
  });

  test('제출 실패 후에도 입력 데이터를 유지하고 재시도할 수 있다', async () => {
    const user = userEvent.setup();
    const submitEnrollment = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(createResponse());
    renderWizard({ submitEnrollment });

    await moveToReview(user);
    await user.click(screen.getByRole('checkbox', { name: '이용약관 동의' }));
    await user.click(screen.getByRole('button', { name: '신청 제출' }));

    await screen.findByText(
      '신청 제출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    );
    await user.click(screen.getByRole('button', { name: '수강생 정보 수정' }));
    expect(screen.getByLabelText('이메일')).toHaveValue('student@example.com');

    await user.click(screen.getByRole('button', { name: '다음' }));
    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    await user.click(screen.getByRole('button', { name: '신청 제출' }));

    await screen.findByText('신청이 완료되었습니다.');
    expect(submitEnrollment).toHaveBeenCalledTimes(2);
  });

  test('제출 중에는 중복 제출을 막는다', async () => {
    const user = userEvent.setup();
    let resolveSubmit: (response: EnrollmentResponse) => void = () => {};
    const submitEnrollment = vi.fn(
      () =>
        new Promise<EnrollmentResponse>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    renderWizard({ submitEnrollment });

    await moveToReview(user);
    await user.click(screen.getByRole('checkbox', { name: '이용약관 동의' }));
    await user.click(screen.getByRole('button', { name: '신청 제출' }));
    await user.click(screen.getByRole('button', { name: '제출 중' }));

    expect(submitEnrollment).toHaveBeenCalledTimes(1);

    resolveSubmit(createResponse());
    await screen.findByText('신청이 완료되었습니다.');
  });

  test('COURSE_FULL 실패 시 강의 수정 경로와 입력 데이터 유지를 제공한다', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/api/enrollments', () =>
        HttpResponse.json(
          {
            code: 'COURSE_FULL',
            message: '선택한 강의의 정원이 마감되었습니다.',
          },
          { status: 409 },
        ),
      ),
    );
    renderWizard();

    await moveToReview(user);
    await user.click(screen.getByRole('checkbox', { name: '이용약관 동의' }));
    await user.click(screen.getByRole('button', { name: '신청 제출' }));

    expect(
      await screen.findByText(
        '선택한 강의의 정원이 마감되었습니다. 다른 강의를 선택해 주세요.',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '강의 선택 수정' }));
    expect(screen.getByText('정원이 마감된 강의입니다.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(screen.getByLabelText('이메일')).toHaveValue('student@example.com');
  });

  test('INVALID_INPUT details를 필드 오류로 매핑하고 알 수 없는 필드는 전체 메시지로만 처리한다', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/api/enrollments', () =>
        HttpResponse.json(
          {
            code: 'INVALID_INPUT',
            message: '입력값을 확인해 주세요.',
            details: {
              'applicant.email': '서버에서 이메일을 다시 확인해 주세요.',
              'external.traceId': 'TRACE-001',
            },
          },
          { status: 400 },
        ),
      ),
    );
    renderWizard();

    await moveToReview(user);
    await user.click(screen.getByRole('checkbox', { name: '이용약관 동의' }));
    await user.click(screen.getByRole('button', { name: '신청 제출' }));

    expect(
      await screen.findByText('입력값을 다시 확인해 주세요.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '수강생 정보 수정' }));

    expect(
      screen.getByText('서버에서 이메일을 다시 확인해 주세요.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('TRACE-001')).not.toBeInTheDocument();
  });

  test('DUPLICATE_ENROLLMENT 실패 시 이미 신청된 강의 안내와 입력 데이터 유지를 제공한다', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/api/enrollments', () =>
        HttpResponse.json(
          {
            code: 'DUPLICATE_ENROLLMENT',
            message: '이미 신청된 강의입니다.',
          },
          { status: 409 },
        ),
      ),
    );
    renderWizard();

    await moveToReview(user);
    await user.click(screen.getByRole('checkbox', { name: '이용약관 동의' }));
    await user.click(screen.getByRole('button', { name: '신청 제출' }));

    expect(
      await screen.findByText(
        '이미 신청된 강의입니다. 신청 정보를 다시 확인해 주세요.',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '수강생 정보 수정' }));

    expect(screen.getByLabelText('이메일')).toHaveValue('student@example.com');
  });

  test('INVALID_INPUT details의 단체 참가자 이메일을 해당 필드 오류로 매핑한다', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/api/enrollments', () =>
        HttpResponse.json(
          {
            code: 'INVALID_INPUT',
            message: '입력값을 확인해 주세요.',
            details: {
              'group.participants.0.email':
                '서버에서 참가자 이메일을 다시 확인해 주세요.',
            },
          },
          { status: 400 },
        ),
      ),
    );
    renderWizard();

    await user.click(
      await screen.findByRole('radio', { name: /React 실전 입문/ }),
    );
    await user.click(screen.getByRole('radio', { name: '단체 신청' }));
    await user.click(screen.getByRole('button', { name: '다음' }));
    await fillApplicant(user);
    await fillGroupFields(user);
    await user.click(screen.getByRole('button', { name: '다음' }));
    await user.click(screen.getByRole('checkbox', { name: '이용약관 동의' }));
    await user.click(screen.getByRole('button', { name: '신청 제출' }));

    await screen.findByText('입력값을 다시 확인해 주세요.');
    await user.click(screen.getByRole('button', { name: '수강생 정보 수정' }));

    expect(
      screen.getByText('서버에서 참가자 이메일을 다시 확인해 주세요.'),
    ).toBeInTheDocument();
  });
});
