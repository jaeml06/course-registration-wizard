import { useMemo, useState } from 'react';

interface UseFunnelOptions {
  initialStep?: string;
}

/**
 * 단계(스텝) 이동만 담당하는 범용 훅. 검증/상태 변경은 일부러 포함하지 않아
 * "지금 어느 단계인가"라는 한 가지 책임만 갖는다(README의 설계 결정 참고).
 * 제네릭 <const Step>으로 steps 배열의 문자열 리터럴 타입을 그대로 보존한다.
 */
export function useFunnel<const Step extends string>(
  steps: readonly Step[],
  options: UseFunnelOptions = {},
) {
  // 복구된 단계처럼 외부에서 받은 initialStep이 유효한 단계일 때만 채택하고,
  // 아니면 첫 단계로 안전하게 시작한다.
  const initialStep = steps.includes(options.initialStep as Step)
    ? (options.initialStep as Step)
    : steps[0];
  const [currentStep, setCurrentStep] = useState<Step>(initialStep);
  const currentIndex = steps.indexOf(currentStep);

  const controls = useMemo(() => {
    const canGoBack = currentIndex > 0;
    const canGoNext = currentIndex < steps.length - 1;

    // 이전 단계로. Math.max로 첫 단계 밑으로는 내려가지 않게 막는다.
    function back() {
      setCurrentStep((step) => {
        const index = steps.indexOf(step);

        return steps[Math.max(0, index - 1)];
      });
    }

    // 다음 단계로. Math.min으로 마지막 단계 위로는 넘어가지 않게 막는다.
    function next() {
      setCurrentStep((step) => {
        const index = steps.indexOf(step);

        return steps[Math.min(steps.length - 1, index + 1)];
      });
    }

    // 특정 단계로 바로 이동(확인 화면의 "수정" 링크 등에서 사용).
    function goTo(step: Step) {
      setCurrentStep(step);
    }

    return {
      canGoBack,
      canGoNext,
      back,
      next,
      goTo,
    };
  }, [currentIndex, steps]);

  return {
    currentStep,
    currentIndex,
    ...controls,
  };
}
