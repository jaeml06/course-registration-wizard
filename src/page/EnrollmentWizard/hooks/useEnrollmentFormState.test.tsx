import { act, renderHook } from '@testing-library/react';

import { COURSES } from '../../../constants/courses';

import { useEnrollmentFormState } from './useEnrollmentFormState';

describe('useEnrollmentFormState', () => {
  test('강의 선택과 신청자 필드를 업데이트하고 유지한다', () => {
    const { result } = renderHook(() =>
      useEnrollmentFormState({ courses: COURSES }),
    );

    act(() => {
      result.current.updateSelectedCourse('course-react-fundamentals');
      result.current.updateApplicantField('name', '홍길동');
    });

    expect(result.current.formState.selectedCourseId).toBe(
      'course-react-fundamentals',
    );
    expect(result.current.formState.applicant.name).toBe('홍길동');
  });

  test('필드 blur 시 touched와 필드 오류를 기록한다', () => {
    const { result } = renderHook(() =>
      useEnrollmentFormState({ courses: COURSES }),
    );

    act(() => {
      result.current.blurField('applicant.email');
    });

    expect(result.current.touchedFields['applicant.email']).toBe(true);
    expect(result.current.errors['applicant.email']).toBe(
      '이메일 형식으로 입력해 주세요.',
    );
  });

  test('현재 스텝 검증 결과를 오류 상태에 반영한다', () => {
    const { result } = renderHook(() =>
      useEnrollmentFormState({ courses: COURSES }),
    );

    let isValid = true;

    act(() => {
      isValid = result.current.validateStep('course');
    });

    expect(isValid).toBe(false);
    expect(result.current.errors.selectedCourseId).toBe(
      '수강할 강의를 선택해 주세요.',
    );
  });

  test('개인 신청에서 단체 신청으로 바꾸면 단체 기본값을 생성한다', () => {
    const { result } = renderHook(() =>
      useEnrollmentFormState({ courses: COURSES }),
    );

    act(() => {
      result.current.switchType('group');
    });

    expect(result.current.formState.type).toBe('group');
    expect(result.current.formState.group?.headCount).toBe(2);
    expect(result.current.formState.group?.participants).toHaveLength(2);
  });

  test('의미 있는 단체 데이터가 있으면 취소 시 단체 신청을 유지한다', () => {
    const { result } = renderHook(() =>
      useEnrollmentFormState({
        courses: COURSES,
        confirmGroupReset: () => false,
      }),
    );

    act(() => {
      result.current.switchType('group');
      result.current.updateGroupField('organizationName', '코스 주식회사');
      result.current.switchType('personal');
    });

    expect(result.current.formState.type).toBe('group');
  });

  test('의미 있는 단체 데이터가 있으면 확인 후 개인 신청으로 초기화한다', () => {
    const { result } = renderHook(() =>
      useEnrollmentFormState({
        courses: COURSES,
        confirmGroupReset: () => true,
      }),
    );

    act(() => {
      result.current.switchType('group');
      result.current.updateGroupField('organizationName', '코스 주식회사');
      result.current.switchType('personal');
    });

    expect(result.current.formState.type).toBe('personal');
    expect(result.current.formState.group).toBeNull();
  });

  test('신청 인원수 변경 시 참가자 수를 동기화한다', () => {
    const { result } = renderHook(() =>
      useEnrollmentFormState({ courses: COURSES }),
    );

    act(() => {
      result.current.switchType('group');
      result.current.updateParticipantField(0, 'name', '김참가');
      result.current.updateGroupField('headCount', 3);
    });

    expect(result.current.formState.group?.participants).toHaveLength(3);
    expect(result.current.formState.group?.participants[0].name).toBe('김참가');
  });
});
