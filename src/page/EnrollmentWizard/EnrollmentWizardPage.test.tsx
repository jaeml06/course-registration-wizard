import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { EnrollmentResponse } from '../../type/enrollment';

import { EnrollmentWizardPage } from './EnrollmentWizardPage';

async function selectPersonalCourse(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('radio', { name: /React 실전 입문/ }));
  await user.click(screen.getByRole('button', { name: '다음' }));
}

async function fillApplicant(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('이름'), '홍길동');
  await user.type(screen.getByLabelText('이메일'), 'student@example.com');
  await user.type(screen.getByLabelText('전화번호'), '010-1234-5678');
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
  test('개인 신청 전체 흐름을 완료하고 성공 요약을 보여준다', async () => {
    const user = userEvent.setup();
    const submitEnrollment = vi.fn(async () => createResponse());
    render(<EnrollmentWizardPage submitEnrollment={submitEnrollment} />);

    await moveToReview(user);

    expect(screen.getByText('React 실전 입문')).toBeInTheDocument();
    expect(screen.getByText('student@example.com')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: '이용약관 동의' }));
    await user.click(screen.getByRole('button', { name: '신청 제출' }));

    await screen.findByText('신청이 완료되었습니다.');
    expect(screen.getByText('ENR-PAGE-001')).toBeInTheDocument();
    expect(submitEnrollment).toHaveBeenCalledTimes(1);
  });

  test('단체 신청 전체 흐름을 확인 화면까지 완료한다', async () => {
    const user = userEvent.setup();
    render(<EnrollmentWizardPage />);

    await user.click(screen.getByRole('radio', { name: /React 실전 입문/ }));
    await user.click(screen.getByRole('radio', { name: '단체 신청' }));
    await user.click(screen.getByRole('button', { name: '다음' }));

    await fillApplicant(user);
    await user.type(screen.getByLabelText('단체명'), '코스 주식회사');
    await user.clear(screen.getByLabelText('신청 인원수'));
    await user.type(screen.getByLabelText('신청 인원수'), '2');
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
    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(screen.getByText('코스 주식회사')).toBeInTheDocument();
    expect(
      screen.getByText('김참가 / member1@example.com'),
    ).toBeInTheDocument();
  });

  test('현재 스텝만 검증하고 미래 단계 약관 오류는 미리 표시하지 않는다', async () => {
    const user = userEvent.setup();
    render(<EnrollmentWizardPage />);

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
    render(<EnrollmentWizardPage />);

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
    render(<EnrollmentWizardPage />);

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
    render(<EnrollmentWizardPage />);

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
    render(<EnrollmentWizardPage submitEnrollment={submitEnrollment} />);

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
    render(<EnrollmentWizardPage submitEnrollment={submitEnrollment} />);

    await moveToReview(user);
    await user.click(screen.getByRole('checkbox', { name: '이용약관 동의' }));
    await user.click(screen.getByRole('button', { name: '신청 제출' }));
    await user.click(screen.getByRole('button', { name: '제출 중' }));

    expect(submitEnrollment).toHaveBeenCalledTimes(1);

    resolveSubmit(createResponse());
    await screen.findByText('신청이 완료되었습니다.');
  });
});
