import type { Course } from '../../../type/course';
import type { EnrollmentResponse } from '../../../type/enrollment';
import type {
  EnrollmentFormState,
  SubmissionStatus,
  ValidationErrors,
} from '../../../type/enrollmentForm';

import { FieldError } from './FieldError';

interface EnrollmentReviewStepProps {
  formState: EnrollmentFormState;
  selectedCourse?: Course;
  errors: ValidationErrors;
  submissionStatus: SubmissionStatus;
  errorMessage: string | null;
  result: EnrollmentResponse | null;
  onTermsChange: (agreedToTerms: boolean) => void;
  onSubmit: () => void;
  onEditCourse: () => void;
  onEditApplicant: () => void;
  onRetry: () => void;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function EnrollmentReviewStep({
  formState,
  selectedCourse,
  errors,
  submissionStatus,
  errorMessage,
  result,
  onTermsChange,
  onSubmit,
  onEditCourse,
  onEditApplicant,
  onRetry,
}: EnrollmentReviewStepProps) {
  if (submissionStatus === 'succeeded' && result) {
    return (
      <section aria-labelledby="success-title" className="grid min-w-0 gap-6">
        <div className="min-w-0 rounded-md border border-emerald-200 bg-emerald-50 p-5">
          <h2
            id="success-title"
            className="break-words text-2xl font-bold text-emerald-950"
          >
            신청이 완료되었습니다.
          </h2>
          <dl className="mt-4 grid min-w-0 gap-2 text-sm text-emerald-950">
            <div className="min-w-0">
              <dt className="font-semibold">신청 번호</dt>
              <dd className="break-words">{result.enrollmentId}</dd>
            </div>
            <div className="min-w-0">
              <dt className="font-semibold">상태</dt>
              <dd className="break-words">
                {result.status === 'confirmed' ? '확정' : '대기'}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-semibold">신청 시각</dt>
              <dd className="break-words">{formatDateTime(result.enrolledAt)}</dd>
            </div>
          </dl>
        </div>
        <SummarySections
          formState={formState}
          selectedCourse={selectedCourse}
          onEditCourse={onEditCourse}
          onEditApplicant={onEditApplicant}
          showEditButtons={false}
        />
      </section>
    );
  }

  return (
    <section aria-labelledby="review-step-title" className="grid min-w-0 gap-6">
      <div className="min-w-0">
        <h2
          id="review-step-title"
          className="break-words text-2xl font-bold tracking-normal"
        >
          3단계 확인 및 제출
        </h2>
        <p className="mt-2 min-w-0 break-words text-sm text-slate-600">
          선택한 강의와 입력한 정보를 확인한 뒤 약관에 동의하고 제출합니다.
        </p>
      </div>

      <SummarySections
        formState={formState}
        selectedCourse={selectedCourse}
        onEditCourse={onEditCourse}
        onEditApplicant={onEditApplicant}
        showEditButtons
      />

      <div className="min-w-0 rounded-md border border-slate-200 bg-white p-4">
        <label className="flex min-h-11 min-w-0 items-start gap-3 text-sm font-semibold text-slate-900">
          <input
            id="agreed-to-terms"
            type="checkbox"
            className="mt-1 shrink-0"
            checked={formState.agreedToTerms}
            aria-invalid={Boolean(errors.agreedToTerms)}
            aria-describedby={
              errors.agreedToTerms ? 'agreed-to-terms-error' : undefined
            }
            onChange={(event) => onTermsChange(event.target.checked)}
          />
          이용약관 동의
        </label>
        <FieldError id="agreed-to-terms-error" message={errors.agreedToTerms} />
      </div>

      {submissionStatus === 'failed' && errorMessage ? (
        <div className="min-w-0 rounded-md border border-red-200 bg-red-50 p-4">
          <p className="min-w-0 break-words text-sm font-semibold text-red-800">
            {errorMessage}
          </p>
          <button
            type="button"
            className="mt-3 min-h-11 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800"
            onClick={onRetry}
          >
            다시 시도
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className="min-h-11 w-full rounded-md bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={submissionStatus === 'submitting'}
        onClick={onSubmit}
      >
        {submissionStatus === 'submitting' ? '제출 중' : '신청 제출'}
      </button>
    </section>
  );
}

interface SummarySectionsProps {
  formState: EnrollmentFormState;
  selectedCourse?: Course;
  onEditCourse: () => void;
  onEditApplicant: () => void;
  showEditButtons: boolean;
}

function SummarySections({
  formState,
  selectedCourse,
  onEditCourse,
  onEditApplicant,
  showEditButtons,
}: SummarySectionsProps) {
  return (
    <div className="grid min-w-0 gap-4">
      <section
        className="min-w-0 break-words rounded-md border border-slate-200 bg-white p-4"
        data-testid="summary-section-course"
      >
        <div
          className="flex min-w-0 flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"
          data-testid="summary-section-header-course"
        >
          <h3 className="min-w-0 break-words text-base font-bold text-slate-950">
            강의 선택
          </h3>
          {showEditButtons ? (
            <button
              type="button"
              className="min-h-11 rounded-md px-3 py-2 text-sm font-semibold text-blue-700"
              onClick={onEditCourse}
            >
              강의 선택 수정
            </button>
          ) : null}
        </div>
        <p className="mt-3 min-w-0 break-words text-sm text-slate-700">
          {selectedCourse?.title ?? '선택한 강의 없음'}
        </p>
      </section>

      <section className="min-w-0 break-words rounded-md border border-slate-200 bg-white p-4">
        <div className="flex min-w-0 flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <h3 className="min-w-0 break-words text-base font-bold text-slate-950">
            수강생 정보
          </h3>
          {showEditButtons ? (
            <button
              type="button"
              className="min-h-11 rounded-md px-3 py-2 text-sm font-semibold text-blue-700"
              onClick={onEditApplicant}
            >
              수강생 정보 수정
            </button>
          ) : null}
        </div>
        <dl className="mt-3 grid min-w-0 gap-2 text-sm text-slate-700">
          <div className="min-w-0">
            <dt className="font-semibold text-slate-950">이름</dt>
            <dd className="break-words">{formState.applicant.name}</dd>
          </div>
          <div className="min-w-0">
            <dt className="font-semibold text-slate-950">이메일</dt>
            <dd className="break-words">{formState.applicant.email}</dd>
          </div>
          <div className="min-w-0">
            <dt className="font-semibold text-slate-950">전화번호</dt>
            <dd className="break-words">{formState.applicant.phone}</dd>
          </div>
        </dl>
      </section>

      {formState.type === 'group' ? (
        <section className="min-w-0 break-words rounded-md border border-slate-200 bg-white p-4">
          <h3 className="min-w-0 break-words text-base font-bold text-slate-950">
            단체 정보
          </h3>
          <dl className="mt-3 grid min-w-0 gap-2 text-sm text-slate-700">
            <div className="min-w-0">
              <dt className="font-semibold text-slate-950">단체명</dt>
              <dd className="break-words">{formState.group.organizationName}</dd>
            </div>
            <div className="min-w-0">
              <dt className="font-semibold text-slate-950">신청 인원수</dt>
              <dd className="break-words">{formState.group.headCount}명</dd>
            </div>
            <div className="min-w-0">
              <dt className="font-semibold text-slate-950">담당자 연락처</dt>
              <dd className="break-words">{formState.group.contactPerson}</dd>
            </div>
          </dl>
          <ul className="mt-3 grid min-w-0 gap-1 text-sm text-slate-700">
            {formState.group.participants.map((participant, index) => (
              <li
                key={`${participant.email}-${index}`}
                className="min-w-0 break-words"
              >
                {participant.name} / {participant.email}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
