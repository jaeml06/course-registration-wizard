import { useCallback, useEffect, useRef, useState } from 'react';

import {
  COURSE_CATEGORIES,
} from '../../constants/courses';
import { useFunnel } from '../../hooks/useFunnel';
import { useCoursesQuery } from '../../hooks/query/useCoursesQuery';
import type { Course, CourseCategory } from '../../type/course';
import type {
  EnrollmentRequest,
  EnrollmentResponse,
} from '../../type/enrollment';
import type { EnrollmentStep, FieldPath } from '../../type/enrollmentForm';
import { createEnrollmentPayload } from '../../util/enrollmentPayload';
import {
  INVALID_DRAFT_MESSAGE,
  readEnrollmentDraft,
  type DraftRecoveryResult,
} from '../../util/enrollmentDraftStorage';
import { hasMeaningfulEnrollmentData } from '../../util/enrollmentFormState';
import { fieldPathToElementId } from '../../util/fieldElementId';
import { firstErrorFieldForStep } from '../../util/firstErrorField';

import { ApplicantInfoStep } from './components/ApplicantInfoStep';
import { CourseSelectionStep } from './components/CourseSelectionStep';
import { EnrollmentReviewStep } from './components/EnrollmentReviewStep';
import { StepNavigation } from './components/StepNavigation';
import { useEnrollmentDraftPersistence } from './hooks/useEnrollmentDraftPersistence';
import { useEnrollmentFormState } from './hooks/useEnrollmentFormState';
import { useEnrollmentSubmissionState } from './hooks/useEnrollmentSubmissionState';
import { useLeavePrevention } from './hooks/useLeavePrevention';
import { useRecoveredCourseGuard } from './hooks/useRecoveredCourseGuard';

type CourseCategoryFilter = CourseCategory | 'all';

interface EnrollmentWizardPageProps {
  submitEnrollment?: (
    payload: EnrollmentRequest,
  ) => Promise<EnrollmentResponse>;
}

const STEPS: EnrollmentStep[] = ['course', 'applicant', 'review'];
const STEP_LABELS: Record<EnrollmentStep, string> = {
  course: '강의 선택',
  applicant: '수강생 정보',
  review: '확인 및 제출',
};
const EMPTY_COURSES: Course[] = [];

export function EnrollmentWizardPage({
  submitEnrollment,
}: EnrollmentWizardPageProps) {
  const [draftRecovery] = useState<DraftRecoveryResult>(() =>
    readInitialDraft(),
  );
  const recoveredDraft =
    draftRecovery.status === 'restored' ? draftRecovery.draft : null;
  const [recoveryNotice] = useState<string | null>(() => {
    if (draftRecovery.status === 'empty') {
      return null;
    }

    return draftRecovery.message;
  });
  const [courseReselectNotice, setCourseReselectNotice] = useState<
    string | null
  >(null);
  const [selectedCategory, setSelectedCategory] =
    useState<CourseCategoryFilter>('all');
  const coursesQuery = useCoursesQuery(selectedCategory);
  const courses = coursesQuery.data?.courses ?? EMPTY_COURSES;
  const categories = coursesQuery.data?.categories ?? COURSE_CATEGORIES;
  const listStatus = coursesQuery.isPending
    ? 'loading'
    : coursesQuery.isError
      ? 'failed'
      : 'ready';
  const { currentStep, currentIndex, canGoBack, back, next, goTo } =
    useFunnel(STEPS, { initialStep: recoveredDraft?.currentStep });
  const form = useEnrollmentFormState({
    courses,
    initialFormState: recoveredDraft?.formState,
  });
  const submission = useEnrollmentSubmissionState({ submitEnrollment });
  const firstErrorFieldRef = useRef<FieldPath | null>(null);
  const shouldBlockLeave =
    hasMeaningfulEnrollmentData(form.formState) &&
    submission.status !== 'succeeded';

  useEnrollmentDraftPersistence({
    formState: form.formState,
    currentStep,
    submissionStatus: submission.status,
  });
  useLeavePrevention(shouldBlockLeave);

  useEffect(() => {
    if (!firstErrorFieldRef.current) {
      return;
    }

    const fieldId = fieldPathToElementId(firstErrorFieldRef.current);
    const element = document.getElementById(fieldId);

    if (element) {
      element.focus();
      scrollElementIntoView(element);
    }

    firstErrorFieldRef.current = null;
  }, [form.errors, currentStep]);

  const selectedCourseId = form.formState.selectedCourseId;
  const { updateSelectedCourse, setErrors: setFormErrors } = form;

  const goToCourseStep = useCallback(() => goTo('course'), [goTo]);
  const clearSelectedCourse = useCallback(
    () => updateSelectedCourse(''),
    [updateSelectedCourse],
  );

  useRecoveredCourseGuard({
    courses,
    listStatus,
    draftRecoveryStatus: draftRecovery.status,
    selectedCourseId,
    goToCourseStep,
    clearSelectedCourse,
    setFormErrors,
    setReselectNotice: setCourseReselectNotice,
  });

  function handleNext() {
    const nextErrors = form.getStepErrors(currentStep);
    const isValid = Object.keys(nextErrors).length === 0;
    form.setErrors({
      ...form.errors,
      ...nextErrors,
    });

    if (!isValid) {
      firstErrorFieldRef.current = firstErrorFieldForStep(
        currentStep,
        nextErrors,
      );
      return;
    }

    next();
  }

  function handleBack() {
    back();
  }

  async function handleSubmit() {
    const nextErrors = form.getStepErrors('review');
    const isValid = Object.keys(nextErrors).length === 0;
    form.setErrors({
      ...form.errors,
      ...nextErrors,
    });

    if (!isValid) {
      firstErrorFieldRef.current = 'agreedToTerms';
      return;
    }

    const submitResult = await submission.submit(
      createEnrollmentPayload(form.formState),
    );

    if (!submitResult.ok && Object.keys(submitResult.fieldErrors).length > 0) {
      form.setErrors({
        ...form.errors,
        ...submitResult.fieldErrors,
      });
    }
  }

  function handleRetry() {
    submission.retry();
    form.setErrors({});
  }

  function renderCurrentStep() {
    if (currentStep === 'course') {
      return (
        <CourseSelectionStep
          courses={courses}
          categories={categories}
          selectedCategory={selectedCategory}
          selectedCourseId={form.formState.selectedCourseId}
          enrollmentType={form.formState.type}
          errors={form.errors}
          listStatus={listStatus}
          errorMessage={
            coursesQuery.isError ? '강의 목록을 불러오지 못했습니다.' : null
          }
          onCategoryChange={setSelectedCategory}
          onSelectCourse={form.updateSelectedCourse}
          onTypeChange={form.switchType}
          onRetry={() => {
            void coursesQuery.refetch();
          }}
        />
      );
    }

    if (currentStep === 'applicant') {
      return (
        <ApplicantInfoStep
          formState={form.formState}
          selectedCourse={form.selectedCourse}
          errors={form.errors}
          onApplicantChange={form.updateApplicantField}
          onGroupChange={form.updateGroupField}
          onParticipantChange={form.updateParticipantField}
          onBlur={form.blurField}
        />
      );
    }

    return (
      <EnrollmentReviewStep
        formState={form.formState}
        selectedCourse={form.selectedCourse}
        errors={{ ...form.errors, ...submission.fieldErrors }}
        submissionStatus={submission.status}
        errorMessage={submission.errorMessage}
        result={submission.result}
        onTermsChange={form.updateTermsAgreement}
        onSubmit={() => {
          void handleSubmit();
        }}
        onEditCourse={() => goTo('course')}
        onEditApplicant={() => goTo('applicant')}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 md:px-8 md:py-8">
        <header className="grid min-w-0 gap-3">
          <p className="text-sm font-semibold text-blue-700">
            Course Registration Wizard
          </p>
          <h1 className="break-words text-3xl font-bold tracking-normal">
            수강 신청 Wizard
          </h1>
          <nav
            aria-label="신청 단계"
            className="grid min-w-0 gap-2 sm:grid-cols-3"
          >
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={`min-w-0 break-words rounded-md border p-3 text-sm ${
                  index === currentIndex
                    ? 'border-slate-900 bg-white font-bold text-slate-950'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
                aria-current={index === currentIndex ? 'step' : undefined}
              >
                {index + 1}. {STEP_LABELS[step]}
              </div>
            ))}
          </nav>
        </header>

        {recoveryNotice ? (
          <p
            className={`min-w-0 break-words rounded-md border p-4 text-sm font-semibold ${
              recoveryNotice === INVALID_DRAFT_MESSAGE
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-blue-200 bg-blue-50 text-blue-900'
            }`}
            role="status"
          >
            {recoveryNotice}
          </p>
        ) : null}

        {courseReselectNotice ? (
          <p
            className="min-w-0 break-words rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900"
            role="alert"
          >
            {courseReselectNotice}
          </p>
        ) : null}

        <div className="min-w-0 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          {renderCurrentStep()}

          {currentStep !== 'review' ? (
            <StepNavigation
              canGoBack={canGoBack}
              isLastStep={false}
              onBack={handleBack}
              onNext={handleNext}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}

function readInitialDraft(): DraftRecoveryResult {
  if (typeof window === 'undefined') {
    return {
      status: 'unavailable',
      draft: null,
      message: '임시 저장을 사용할 수 없습니다. 신청은 계속 진행할 수 있습니다.',
    };
  }

  return readEnrollmentDraft(window.sessionStorage);
}

function scrollElementIntoView(element: HTMLElement | null) {
  if (!element || !('scrollIntoView' in element)) {
    return;
  }

  element.scrollIntoView({ block: 'center' });
}
