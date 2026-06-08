import { render, screen } from '@testing-library/react';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';

import { COURSES } from '../../../constants/courses';
import {
  buildGroupDraft,
  buildPersonalDraft,
} from '../../../test/enrollmentFixtures';
import type {
  EnrollmentFormState,
  GroupEnrollmentForm,
} from '../../../type/enrollmentForm';

import { ApplicantInfoStep } from './ApplicantInfoStep';

function renderApplicantInfoStep(
  overrides: Partial<Parameters<typeof ApplicantInfoStep>[0]> = {},
) {
  const props: Parameters<typeof ApplicantInfoStep>[0] = {
    formState: buildPersonalDraft({ agreedToTerms: false }),
    selectedCourse: COURSES[0],
    errors: {},
    onApplicantChange: vi.fn(),
    onGroupChange: vi.fn(),
    onParticipantChange: vi.fn(),
    onBlur: vi.fn(),
    ...overrides,
  };

  render(<ApplicantInfoStep {...props} />);

  return props;
}

describe('ApplicantInfoStep', () => {
  test('개인 신청 공통 필드를 입력할 수 있다', async () => {
    const user = userEvent.setup();
    const props = renderApplicantInfoStep();

    await user.type(screen.getByLabelText('이름'), '김');

    expect(props.onApplicantChange).toHaveBeenCalledWith('name', '홍길동김');
  });

  test('blur 검증 오류를 필드에 표시한다', () => {
    renderApplicantInfoStep({
      errors: {
        'applicant.email': '이메일 형식으로 입력해 주세요.',
      },
    });

    expect(
      screen.getByText('이메일 형식으로 입력해 주세요.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('이메일')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  test('공통 정보 입력칸은 필드 종류에 맞는 높이 스타일을 사용한다', () => {
    renderApplicantInfoStep();

    expect(screen.getByLabelText('이름')).toHaveClass('min-h-10');
    expect(screen.getByLabelText('이메일')).toHaveClass('min-h-10');
    expect(screen.getByLabelText('전화번호')).toHaveClass('min-h-10');
    expect(screen.getByLabelText('수강 동기')).toHaveClass('min-h-32');
  });

  test('개인 신청에서는 단체 필드를 숨긴다', () => {
    renderApplicantInfoStep();

    expect(screen.queryByLabelText('단체명')).not.toBeInTheDocument();
  });

  test('단체 신청에서는 단체 필드와 참가자 명단을 표시한다', () => {
    renderApplicantInfoStep({
      formState: buildGroupDraft({ agreedToTerms: false }),
    });

    expect(screen.getByLabelText('단체명')).toBeInTheDocument();
    expect(screen.getByLabelText('참가자 1 이름')).toBeInTheDocument();
    expect(screen.getByLabelText('담당자 연락처')).toBeInTheDocument();
  });

  test('단체 신청 필드 변경을 전달한다', async () => {
    const user = userEvent.setup();
    const onGroupChange = vi.fn();

    function StatefulApplicantInfoStep() {
      const [formState, setFormState] = useState<EnrollmentFormState>(
        buildGroupDraft({ agreedToTerms: false }),
      );

      function handleGroupChange(
        field: Exclude<keyof GroupEnrollmentForm, 'participants'>,
        value: string | number,
      ) {
        onGroupChange(field, value);
        setFormState((currentState) => {
          if (currentState.type !== 'group') {
            return currentState;
          }

          return {
            ...currentState,
            group: {
              ...currentState.group,
              [field]: value,
            },
          };
        });
      }

      return (
        <ApplicantInfoStep
          formState={formState}
          selectedCourse={COURSES[0]}
          errors={{}}
          onApplicantChange={vi.fn()}
          onGroupChange={handleGroupChange}
          onParticipantChange={vi.fn()}
          onBlur={vi.fn()}
        />
      );
    }

    render(<StatefulApplicantInfoStep />);

    await user.clear(screen.getByLabelText('신청 인원수'));
    await user.type(screen.getByLabelText('신청 인원수'), '3');

    expect(onGroupChange).toHaveBeenLastCalledWith('headCount', 3);
  });

  test('모바일에서 공통 입력 필드와 긴 오류 메시지가 세로 흐름과 줄바꿈 class를 유지한다', () => {
    renderApplicantInfoStep({
      errors: {
        'applicant.email':
          '아주 긴 이메일 오류 메시지가 모바일 폭에서도 줄바꿈되어 주변 입력 필드와 겹치지 않아야 합니다.',
      },
    });

    expect(screen.getByTestId('applicant-fields-grid')).toHaveClass(
      'grid-cols-1',
      'min-w-0',
      'md:grid-cols-2',
    );
    expect(screen.getByLabelText('이메일')).toHaveClass('min-w-0');
    expect(
      screen.getByText(/아주 긴 이메일 오류 메시지/),
    ).toHaveClass('break-words');
  });
});
