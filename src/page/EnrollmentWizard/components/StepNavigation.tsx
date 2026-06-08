interface StepNavigationProps {
  canGoBack: boolean;
  isLastStep: boolean;
  isSubmitting?: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function StepNavigation({
  canGoBack,
  isLastStep,
  isSubmitting = false,
  onBack,
  onNext,
}: StepNavigationProps) {
  return (
    <div className="mt-8 flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
      <button
        type="button"
        className="min-h-11 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!canGoBack || isSubmitting}
        onClick={onBack}
      >
        이전
      </button>
      <button
        type="button"
        className="min-h-11 rounded-md bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSubmitting}
        onClick={onNext}
      >
        {isLastStep ? '신청 제출' : '다음'}
      </button>
    </div>
  );
}
