import { render, screen } from '@testing-library/react';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';

import { buildGroupForm } from '../../../test/enrollmentFixtures';
import type { GroupEnrollmentForm } from '../../../type/enrollmentForm';
import { syncParticipantsToHeadCount } from '../../../util/enrollmentFormState';

import { GroupFields } from './GroupFields';

describe('GroupFields', () => {
  test('참가자 행과 필드별 오류를 표시한다', () => {
    render(
      <GroupFields
        group={buildGroupForm()}
        errors={{
          'group.participants.0.email':
            '참가자 이메일은 서로 중복될 수 없습니다.',
        }}
        onGroupChange={vi.fn()}
        onParticipantChange={vi.fn()}
        onBlur={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('참가자 1 이메일')).toBeInTheDocument();
    expect(
      screen.getByText('참가자 이메일은 서로 중복될 수 없습니다.'),
    ).toBeInTheDocument();
  });

  test('참가자 입력 변경을 전달한다', async () => {
    const user = userEvent.setup();
    const onParticipantChange = vi.fn();

    function StatefulGroupFields() {
      const [group, setGroup] = useState<GroupEnrollmentForm>(buildGroupForm());

      return (
        <GroupFields
          group={group}
          errors={{}}
          onGroupChange={vi.fn()}
          onParticipantChange={(index, field, value) => {
            onParticipantChange(index, field, value);
            setGroup((currentGroup) => ({
              ...currentGroup,
              participants: currentGroup.participants.map(
                (participant, currentIndex) =>
                  currentIndex === index
                    ? { ...participant, [field]: value }
                    : participant,
              ),
            }));
          }}
          onBlur={vi.fn()}
        />
      );
    }

    render(<StatefulGroupFields />);

    await user.clear(screen.getByLabelText('참가자 1 이름'));
    await user.type(screen.getByLabelText('참가자 1 이름'), '박참가');

    expect(onParticipantChange).toHaveBeenLastCalledWith(0, 'name', '박참가');
  });

  test('신청 인원수 입력 중 빈 값과 leading zero를 안전하게 처리한다', async () => {
    const user = userEvent.setup();
    const onGroupChange = vi.fn();

    function StatefulGroupFields() {
      const [group, setGroup] = useState<GroupEnrollmentForm>(buildGroupForm());

      return (
        <GroupFields
          group={group}
          errors={{}}
          onGroupChange={(field, value) => {
            onGroupChange(field, value);
            setGroup((currentGroup) => {
              if (field === 'headCount') {
                return syncParticipantsToHeadCount(
                  currentGroup,
                  Number(value),
                );
              }

              return {
                ...currentGroup,
                [field]: value,
              };
            });
          }}
          onParticipantChange={vi.fn()}
          onBlur={vi.fn()}
        />
      );
    }

    render(<StatefulGroupFields />);

    const headCountInput = screen.getByLabelText('신청 인원수');

    await user.clear(headCountInput);

    expect(headCountInput).toHaveDisplayValue('');
    expect(onGroupChange).not.toHaveBeenCalledWith('headCount', 0);

    await user.type(headCountInput, '010');

    expect(headCountInput).toHaveDisplayValue('10');
    expect(onGroupChange).toHaveBeenLastCalledWith('headCount', 10);
  });

  test('참가자 입력 grid는 모바일 1열과 md 2열 class를 유지하고 긴 이메일을 줄바꿈한다', () => {
    render(
      <GroupFields
        group={buildGroupForm({
          participants: [
            {
              name: '김참가',
              email:
                'very.long.participant.email.address.for.mobile@example.com',
            },
            { name: '이참가', email: 'member2@example.com' },
          ],
        })}
        errors={{
          'group.participants.0.email':
            '아주 긴 참가자 이메일 오류 메시지가 모바일에서도 줄바꿈되어야 합니다.',
        }}
        onGroupChange={vi.fn()}
        onParticipantChange={vi.fn()}
        onBlur={vi.fn()}
      />,
    );

    expect(screen.getByTestId('group-participant-row-0')).toHaveClass(
      'grid-cols-1',
      'min-w-0',
      'md:grid-cols-2',
    );
    expect(screen.getByLabelText('참가자 1 이메일')).toHaveClass('min-w-0');
    expect(
      screen.getByText(/아주 긴 참가자 이메일 오류 메시지/),
    ).toHaveClass('break-words');
  });
});
