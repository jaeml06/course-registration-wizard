import { useMemo, useState } from 'react';

export function useFunnel<const Step extends string>(steps: readonly Step[]) {
  const [currentStep, setCurrentStep] = useState<Step>(steps[0]);
  const currentIndex = steps.indexOf(currentStep);

  const controls = useMemo(() => {
    const canGoBack = currentIndex > 0;
    const canGoNext = currentIndex < steps.length - 1;

    function back() {
      setCurrentStep((step) => {
        const index = steps.indexOf(step);

        return steps[Math.max(0, index - 1)];
      });
    }

    function next() {
      setCurrentStep((step) => {
        const index = steps.indexOf(step);

        return steps[Math.min(steps.length - 1, index + 1)];
      });
    }

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
