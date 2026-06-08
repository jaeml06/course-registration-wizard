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

// 카테고리 필터에는 실제 카테고리 외에 '전체 보기'를 뜻하는 'all'이 추가로 필요하다.
type CourseCategoryFilter = CourseCategory | 'all';

interface EnrollmentWizardPageProps {
  // 제출 함수를 주입받을 수 있게 열어 둔다. 평소에는 비워 두면 실제 API(postEnrollment)를
  // 쓰지만, 테스트에서는 가짜 함수를 넣어 네트워크 없이 성공/실패 시나리오를 검증한다.
  submitEnrollment?: (
    payload: EnrollmentRequest,
  ) => Promise<EnrollmentResponse>;
}

// Wizard의 단계 순서. 배열의 순서가 곧 화면 흐름이다(강의 → 정보 → 확인).
const STEPS: EnrollmentStep[] = ['course', 'applicant', 'review'];
const STEP_LABELS: Record<EnrollmentStep, string> = {
  course: '강의 선택',
  applicant: '수강생 정보',
  review: '확인 및 제출',
};
// 매 렌더마다 새 빈 배열을 만들면 참조가 바뀌어 하위 useMemo/효과가 불필요하게 재실행된다.
// 모듈 수준에 하나만 두고 재사용해 참조를 고정한다.
const EMPTY_COURSES: Course[] = [];

export function EnrollmentWizardPage({
  submitEnrollment,
}: EnrollmentWizardPageProps) {
  // 1) 최초 마운트 시 sessionStorage에 저장된 임시 신청서(draft)를 한 번만 읽는다.
  //    useState의 초기화 함수로 감싸 첫 렌더에서 딱 한 번 실행되게 한다.
  const [draftRecovery] = useState<DraftRecoveryResult>(() =>
    readInitialDraft(),
  );
  // 복구에 성공한 경우에만 실제 draft를 꺼낸다. 그 외(빈/손상/사용불가)는 null.
  const recoveredDraft =
    draftRecovery.status === 'restored' ? draftRecovery.draft : null;
  // 사용자에게 보여줄 안내 문구("복구했습니다" / "복구할 수 없어 새로 시작합니다" 등).
  // 저장된 게 아예 없으면(empty) 안내할 것도 없으므로 null.
  const [recoveryNotice] = useState<string | null>(() => {
    if (draftRecovery.status === 'empty') {
      return null;
    }

    return draftRecovery.message;
  });
  // 복구한 강의가 지금은 신청 불가(마감 등)일 때, 강의 단계로 돌려보내며 띄우는 안내.
  const [courseReselectNotice, setCourseReselectNotice] = useState<
    string | null
  >(null);
  const [selectedCategory, setSelectedCategory] =
    useState<CourseCategoryFilter>('all');
  // 서버에서 강의 목록을 가져오는 React Query 훅. 카테고리가 바뀌면 자동으로 다시 조회한다.
  const coursesQuery = useCoursesQuery(selectedCategory);
  // 데이터가 아직 없을 때를 대비한 기본값. 빈 배열은 위의 고정 참조를 쓴다.
  const courses = coursesQuery.data?.courses ?? EMPTY_COURSES;
  const categories = coursesQuery.data?.categories ?? COURSE_CATEGORIES;
  // React Query의 3가지 상태(isPending/isError/그 외)를 화면이 쓰기 쉬운
  // 'loading' | 'failed' | 'ready' 단일 값으로 좁힌다.
  const listStatus = coursesQuery.isPending
    ? 'loading'
    : coursesQuery.isError
      ? 'failed'
      : 'ready';
  // 단계 이동 담당 훅. 복구된 draft가 있으면 그 단계에서 다시 시작한다.
  const { currentStep, currentIndex, canGoBack, back, next, goTo } =
    useFunnel(STEPS, { initialStep: recoveredDraft?.currentStep });
  // 폼 입력값/에러 담당 훅. 복구된 draft가 있으면 그 값으로 초기화한다.
  const form = useEnrollmentFormState({
    courses,
    initialFormState: recoveredDraft?.formState,
  });
  // 제출 진행/성공/실패 상태 담당 훅.
  const submission = useEnrollmentSubmissionState({ submitEnrollment });
  // "다음/제출 시 검증 실패한 첫 필드"를 효과(useEffect)에 넘기기 위한 임시 보관함.
  const firstErrorFieldRef = useRef<FieldPath | null>(null);
  // 이탈 경고를 띄울지 여부: 의미 있는 입력이 있고 + 아직 제출 성공 전일 때만.
  // (제출에 성공했다면 더 이상 데이터를 잃을 위험이 없으므로 막지 않는다.)
  const shouldBlockLeave =
    hasMeaningfulEnrollmentData(form.formState) &&
    submission.status !== 'succeeded';

  // 입력값이 바뀔 때마다 sessionStorage에 자동 임시저장(성공 시 자동 삭제).
  useEnrollmentDraftPersistence({
    formState: form.formState,
    currentStep,
    submissionStatus: submission.status,
  });
  // 작성 중 새로고침/닫기/뒤로가기 시 확인 대화상자를 띄운다.
  useLeavePrevention(shouldBlockLeave);

  // [접근성] 검증 실패 시 첫 에러 필드로 포커스/스크롤을 옮긴다.
  // handleNext/handleSubmit이 firstErrorFieldRef에 필드를 적어 두면, 에러 상태가
  // 갱신되어 화면이 다시 그려진 "이후"에 이 효과가 실제 DOM을 찾아 포커스한다.
  // (렌더 도중이 아니라 렌더 이후에 DOM을 만져야 안전하므로 효과로 분리했다.)
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

    // 한 번 처리했으면 비워 다음 렌더에서 또 포커스가 튀지 않게 한다.
    firstErrorFieldRef.current = null;
  }, [form.errors, currentStep]);

  const selectedCourseId = form.formState.selectedCourseId;
  const { updateSelectedCourse, setErrors: setFormErrors } = form;

  // 훅에 넘길 콜백은 참조를 고정해(useCallback) 내부 효과가 불필요하게 재실행되지 않게 한다.
  const goToCourseStep = useCallback(() => goTo('course'), [goTo]);
  const clearSelectedCourse = useCallback(
    () => updateSelectedCourse(''),
    [updateSelectedCourse],
  );

  // 선택 강의가 현재 목록 기준으로도 유효한지 지킨다(마감/삭제 시 선택 비우고 안내).
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

  // "다음" 클릭: 요구사항대로 "현재 단계만" 검증한다(전체가 아니라).
  function handleNext() {
    const nextErrors = form.getStepErrors(currentStep);
    const isValid = Object.keys(nextErrors).length === 0;
    // 기존 에러에 이번 검증 결과를 덮어쓴다.
    form.setErrors({
      ...form.errors,
      ...nextErrors,
    });

    if (!isValid) {
      // 검증 실패: 다음으로 넘어가지 않고, 포커스를 옮길 첫 에러 필드만 기록한다.
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

  // 최종 제출: 약관 동의 검증 → payload 생성 → 제출 → 서버 필드 에러 반영.
  async function handleSubmit() {
    const nextErrors = form.getStepErrors('review');
    const isValid = Object.keys(nextErrors).length === 0;
    form.setErrors({
      ...form.errors,
      ...nextErrors,
    });

    if (!isValid) {
      // review 단계의 유일한 검증 대상은 약관 동의 체크박스다.
      firstErrorFieldRef.current = 'agreedToTerms';
      return;
    }

    // 폼 상태를 API 요청 형태로 변환해 제출한다.
    const submitResult = await submission.submit(
      createEnrollmentPayload(form.formState),
    );

    // 서버가 INVALID_INPUT 등으로 필드별 에러를 돌려줬다면 해당 필드에 매핑해 보여준다.
    if (!submitResult.ok && Object.keys(submitResult.fieldErrors).length > 0) {
      form.setErrors({
        ...form.errors,
        ...submitResult.fieldErrors,
      });
    }
  }

  // 제출 실패 후 "다시 시도": 제출 상태와 폼 에러를 초기화해 깨끗한 상태로 되돌린다.
  function handleRetry() {
    submission.retry();
    form.setErrors({});
  }

  // 현재 단계에 해당하는 화면 컴포넌트를 골라 렌더한다.
  // 각 Step 컴포넌트는 상태를 직접 갖지 않고, 위 훅들이 준 값/핸들러를 props로만 받는다.
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

// 최초 렌더에서 임시저장된 draft를 읽는다. 서버 사이드 렌더 등 window가 없는 환경에서는
// sessionStorage에 접근할 수 없으므로 'unavailable'로 안전하게 빠진다.
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

