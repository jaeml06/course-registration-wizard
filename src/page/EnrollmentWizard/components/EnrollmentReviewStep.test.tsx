import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { COURSES } from '../../../constants/courses';
import {
  buildGroupDraft,
  buildPersonalDraft,
} from '../../../test/enrollmentFixtures';

import { EnrollmentReviewStep } from './EnrollmentReviewStep';

function renderEnrollmentReviewStep(
  overrides: Partial<Parameters<typeof EnrollmentReviewStep>[0]> = {},
) {
  const props: Parameters<typeof EnrollmentReviewStep>[0] = {
    formState: buildPersonalDraft({ agreedToTerms: false }),
    selectedCourse: COURSES[0],
    errors: {},
    submissionStatus: 'idle',
    errorMessage: null,
    result: null,
    onTermsChange: vi.fn(),
    onSubmit: vi.fn(),
    onEditCourse: vi.fn(),
    onEditApplicant: vi.fn(),
    onRetry: vi.fn(),
    ...overrides,
  };

  render(<EnrollmentReviewStep {...props} />);

  return props;
}

describe('EnrollmentReviewStep', () => {
  test('선택 강의와 신청자 요약을 보여준다', () => {
    renderEnrollmentReviewStep();

    expect(screen.getByText('React 실전 입문')).toBeInTheDocument();
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('student@example.com')).toBeInTheDocument();
  });

  test('단체 신청 요약을 보여준다', () => {
    renderEnrollmentReviewStep({
      formState: buildGroupDraft({ agreedToTerms: false }),
    });

    expect(screen.getByText('코스 주식회사')).toBeInTheDocument();
    expect(screen.getByText('2명')).toBeInTheDocument();
    expect(
      screen.getByText('김참가 / member1@example.com'),
    ).toBeInTheDocument();
  });

  test('섹션별 수정 링크를 제공한다', async () => {
    const user = userEvent.setup();
    const props = renderEnrollmentReviewStep();

    await user.click(screen.getByRole('button', { name: '강의 선택 수정' }));
    await user.click(screen.getByRole('button', { name: '수강생 정보 수정' }));

    expect(props.onEditCourse).toHaveBeenCalled();
    expect(props.onEditApplicant).toHaveBeenCalled();
  });

  test('약관 동의와 제출을 전달한다', async () => {
    const user = userEvent.setup();
    const props = renderEnrollmentReviewStep();

    await user.click(screen.getByRole('checkbox', { name: '이용약관 동의' }));
    await user.click(screen.getByRole('button', { name: '신청 제출' }));

    expect(props.onTermsChange).toHaveBeenCalledWith(true);
    expect(props.onSubmit).toHaveBeenCalled();
  });

  test('약관 오류와 제출 실패 재시도를 보여준다', async () => {
    const user = userEvent.setup();
    const props = renderEnrollmentReviewStep({
      errors: {
        agreedToTerms: '이용약관에 동의해야 제출할 수 있습니다.',
      },
      submissionStatus: 'failed',
      errorMessage: '신청 제출 중 오류가 발생했습니다.',
    });

    expect(
      screen.getByText('이용약관에 동의해야 제출할 수 있습니다.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('신청 제출 중 오류가 발생했습니다.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(props.onRetry).toHaveBeenCalled();
  });

  test('성공 결과를 보여준다', () => {
    renderEnrollmentReviewStep({
      submissionStatus: 'succeeded',
      result: {
        enrollmentId: 'ENR-TEST-001',
        status: 'confirmed',
        enrolledAt: '2026-06-06T12:00:00.000Z',
      },
    });

    expect(screen.getByText('신청이 완료되었습니다.')).toBeInTheDocument();
    expect(screen.getByText('ENR-TEST-001')).toBeInTheDocument();
  });
});
