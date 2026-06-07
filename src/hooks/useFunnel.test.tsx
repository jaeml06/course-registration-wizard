import { act, renderHook } from '@testing-library/react';

import { useFunnel } from './useFunnel';

describe('useFunnel', () => {
  test('초기 스텝은 첫 번째 스텝이다', () => {
    const { result } = renderHook(() =>
      useFunnel(['course', 'applicant', 'review'] as const),
    );

    expect(result.current.currentStep).toBe('course');
  });

  test('다음 스텝과 이전 스텝으로 이동한다', () => {
    const { result } = renderHook(() =>
      useFunnel(['course', 'applicant', 'review'] as const),
    );

    act(() => result.current.next());
    expect(result.current.currentStep).toBe('applicant');

    act(() => result.current.back());
    expect(result.current.currentStep).toBe('course');
  });

  test('경계에서는 스텝을 유지한다', () => {
    const { result } = renderHook(() =>
      useFunnel(['course', 'applicant', 'review'] as const),
    );

    act(() => result.current.back());
    expect(result.current.currentStep).toBe('course');

    act(() => result.current.goTo('review'));
    act(() => result.current.next());
    expect(result.current.currentStep).toBe('review');
  });

  test('직접 이동과 이동 가능 여부를 제공한다', () => {
    const { result } = renderHook(() =>
      useFunnel(['course', 'applicant', 'review'] as const),
    );

    expect(result.current.canGoBack).toBe(false);
    expect(result.current.canGoNext).toBe(true);

    act(() => result.current.goTo('review'));

    expect(result.current.currentStep).toBe('review');
    expect(result.current.canGoBack).toBe(true);
    expect(result.current.canGoNext).toBe(false);
  });
});
