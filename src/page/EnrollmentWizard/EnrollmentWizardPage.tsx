import { useEffect, useMemo, useRef, useState } from 'react';

import {
  COURSE_CATEGORIES,
  COURSES,
  COURSE_CATEGORY_LABELS,
} from '../../constants/courses';
import { useFunnel } from '../../hooks/useFunnel';
import type { CourseCategory } from '../../type/course';
import type {
  EnrollmentRequest,
  EnrollmentResponse,
} from '../../type/enrollment';
import type { EnrollmentStep, FieldPath } from '../../type/enrollmentForm';
import { createEnrollmentPayload } from '../../util/enrollmentPayload';

import { ApplicantInfoStep } from './components/ApplicantInfoStep';
import { CourseSelectionStep } from './components/CourseSelectionStep';
import { EnrollmentReviewStep } from './components/EnrollmentReviewStep';
import { StepNavigation } from './components/StepNavigation';
import { useEnrollmentFormState } from './hooks/useEnrollmentFormState';
import { useEnrollmentSubmissionState } from './hooks/useEnrollmentSubmissionState';

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

export function EnrollmentWizardPage({
  submitEnrollment,
}: EnrollmentWizardPageProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<CourseCategoryFilter>('all');
  const [listStatus, setListStatus] = useState<'loading' | 'ready' | 'failed'>(
    'ready',
  );
  const { currentStep, currentIndex, canGoBack, back, next, goTo } =
    useFunnel(STEPS);
  const form = useEnrollmentFormState({
    courses: COURSES,
  });
  const submission = useEnrollmentSubmissionState({ submitEnrollment });
  const firstErrorFieldRef = useRef<FieldPath | null>(null);

  const visibleCourses = useMemo(() => {
    if (selectedCategory === 'all') {
      return COURSES;
    }

    return COURSES.filter((course) => course.category === selectedCategory);
  }, [selectedCategory]);

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

  function handleNext() {
    const nextErrors = form.getStepErrors(currentStep);
    const isValid = Object.keys(nextErrors).length === 0;
    form.setErrors({
      ...form.errors,
      ...nextErrors,
    });

    if (!isValid) {
      const field = firstErrorFieldForStep(currentStep, nextErrors);
      firstErrorFieldRef.current = field;
      requestAnimationFrame(() => {
        const nextField = field;
        if (!nextField) {
          return;
        }

        const element = document.getElementById(
          fieldPathToElementId(nextField),
        );
        element?.focus();
        scrollElementIntoView(element);
      });
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

    await submission.submit(createEnrollmentPayload(form.formState));

    if (Object.keys(submission.fieldErrors).length > 0) {
      form.setErrors(submission.fieldErrors);
    }
  }

  function handleRetry() {
    submission.retry();
  }

  function renderCurrentStep() {
    if (currentStep === 'course') {
      return (
        <CourseSelectionStep
          courses={visibleCourses}
          categories={COURSE_CATEGORIES}
          selectedCategory={selectedCategory}
          selectedCourseId={form.formState.selectedCourseId}
          enrollmentType={form.formState.type}
          errors={form.errors}
          listStatus={listStatus}
          onCategoryChange={(category) => {
            setSelectedCategory(category);
            setListStatus(category === 'all' ? 'ready' : listStatus);
          }}
          onSelectCourse={form.updateSelectedCourse}
          onTypeChange={form.switchType}
          onRetry={() => setListStatus('ready')}
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
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-5 py-8 md:px-8">
        <header className="grid gap-3">
          <p className="text-sm font-semibold text-blue-700">
            Course Registration Wizard
          </p>
          <h1 className="text-3xl font-bold tracking-normal">
            수강 신청 Wizard
          </h1>
          <nav aria-label="신청 단계" className="grid gap-2 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={`rounded-md border p-3 text-sm ${
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

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
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

        <footer className="text-sm text-slate-500">
          {selectedCategory !== 'all'
            ? `현재 카테고리: ${COURSE_CATEGORY_LABELS[selectedCategory]}`
            : '전체 카테고리'}
        </footer>
      </div>
    </main>
  );
}

function fieldPathToElementId(field: FieldPath): string {
  if (field === 'selectedCourseId') {
    return 'course-step-title';
  }

  if (field === 'agreedToTerms') {
    return 'agreed-to-terms';
  }

  if (field === 'applicant.name') {
    return 'applicant-name';
  }

  if (field === 'applicant.email') {
    return 'applicant-email';
  }

  if (field === 'applicant.phone') {
    return 'applicant-phone';
  }

  if (field === 'applicant.motivation') {
    return 'applicant-motivation';
  }

  if (field === 'group.organizationName') {
    return 'group-organization-name';
  }

  if (field === 'group.headCount') {
    return 'group-head-count';
  }

  if (field === 'group.contactPerson') {
    return 'group-contact-person';
  }

  const participantMatch = field.match(
    /^group\.participants\.(\d+)\.(name|email)$/,
  );

  if (participantMatch) {
    return `group-participant-${participantMatch[1]}-${participantMatch[2]}`;
  }

  return field;
}

function scrollElementIntoView(element: HTMLElement | null) {
  if (!element || !('scrollIntoView' in element)) {
    return;
  }

  element.scrollIntoView({ block: 'center' });
}

function firstErrorFieldForStep(
  step: EnrollmentStep,
  errors: Partial<Record<FieldPath, string>>,
): FieldPath | null {
  const fieldsByStep: Record<EnrollmentStep, FieldPath[]> = {
    course: ['selectedCourseId'],
    applicant: [
      'applicant.name',
      'applicant.email',
      'applicant.phone',
      'applicant.motivation',
      'group.organizationName',
      'group.headCount',
      'group.contactPerson',
      'group.participants.0.name',
      'group.participants.0.email',
      'group.participants.1.name',
      'group.participants.1.email',
      'group.participants.2.name',
      'group.participants.2.email',
      'group.participants.3.name',
      'group.participants.3.email',
      'group.participants.4.name',
      'group.participants.4.email',
      'group.participants.5.name',
      'group.participants.5.email',
      'group.participants.6.name',
      'group.participants.6.email',
      'group.participants.7.name',
      'group.participants.7.email',
      'group.participants.8.name',
      'group.participants.8.email',
      'group.participants.9.name',
      'group.participants.9.email',
    ],
    review: ['agreedToTerms'],
  };

  return fieldsByStep[step].find((field) => errors[field]) ?? null;
}
