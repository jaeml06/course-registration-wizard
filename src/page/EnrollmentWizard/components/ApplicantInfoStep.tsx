import type { Course } from '../../../type/course';
import type {
  ApplicantForm,
  EnrollmentFormState,
  FieldPath,
  GroupEnrollmentForm,
  ValidationErrors,
} from '../../../type/enrollmentForm';
import { getRemainingSeats } from '../../../util/courseCapacity';

import { FormField } from './FormField';
import { GroupFields } from './GroupFields';

interface ApplicantInfoStepProps {
  formState: EnrollmentFormState;
  selectedCourse?: Course;
  errors: ValidationErrors;
  onApplicantChange: (field: keyof ApplicantForm, value: string) => void;
  onGroupChange: (
    field: Exclude<keyof GroupEnrollmentForm, 'participants'>,
    value: string | number,
  ) => void;
  onParticipantChange: (
    index: number,
    field: 'name' | 'email',
    value: string,
  ) => void;
  onBlur: (field: FieldPath) => void;
}

export function ApplicantInfoStep({
  formState,
  selectedCourse,
  errors,
  onApplicantChange,
  onGroupChange,
  onParticipantChange,
  onBlur,
}: ApplicantInfoStepProps) {
  return (
    <section aria-labelledby="applicant-step-title" className="grid gap-6">
      <div>
        <h2
          id="applicant-step-title"
          className="text-2xl font-bold tracking-normal"
        >
          2단계 수강생 정보 입력
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          대표 신청자 정보를 입력합니다. 단체 신청은 참가자 명단까지 확인합니다.
        </p>
        {selectedCourse ? (
          <p className="mt-2 text-sm font-semibold text-slate-700">
            선택 강의 잔여 정원: {getRemainingSeats(selectedCourse)}명
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField
          label="이름"
          htmlFor="applicant-name"
          error={errors['applicant.name']}
        >
          <input
            id="applicant-name"
            className={inputClass(Boolean(errors['applicant.name']))}
            value={formState.applicant.name}
            aria-invalid={Boolean(errors['applicant.name'])}
            aria-describedby={
              errors['applicant.name'] ? 'applicant-name-error' : undefined
            }
            onChange={(event) => onApplicantChange('name', event.target.value)}
            onBlur={() => onBlur('applicant.name')}
          />
        </FormField>

        <FormField
          label="이메일"
          htmlFor="applicant-email"
          error={errors['applicant.email']}
        >
          <input
            id="applicant-email"
            type="email"
            className={inputClass(Boolean(errors['applicant.email']))}
            value={formState.applicant.email}
            aria-invalid={Boolean(errors['applicant.email'])}
            aria-describedby={
              errors['applicant.email'] ? 'applicant-email-error' : undefined
            }
            onChange={(event) => onApplicantChange('email', event.target.value)}
            onBlur={() => onBlur('applicant.email')}
          />
        </FormField>

        <FormField
          label="전화번호"
          htmlFor="applicant-phone"
          error={errors['applicant.phone']}
        >
          <input
            id="applicant-phone"
            className={inputClass(Boolean(errors['applicant.phone']))}
            value={formState.applicant.phone}
            aria-invalid={Boolean(errors['applicant.phone'])}
            aria-describedby={
              errors['applicant.phone'] ? 'applicant-phone-error' : undefined
            }
            onChange={(event) => onApplicantChange('phone', event.target.value)}
            onBlur={() => onBlur('applicant.phone')}
          />
        </FormField>

        <FormField
          label="수강 동기"
          htmlFor="applicant-motivation"
          error={errors['applicant.motivation']}
          helperText="선택 입력이며 300자 이하로 작성할 수 있습니다."
        >
          <textarea
            id="applicant-motivation"
            className={inputClass(Boolean(errors['applicant.motivation']))}
            value={formState.applicant.motivation}
            aria-invalid={Boolean(errors['applicant.motivation'])}
            aria-describedby={
              errors['applicant.motivation']
                ? 'applicant-motivation-error'
                : undefined
            }
            rows={4}
            onChange={(event) =>
              onApplicantChange('motivation', event.target.value)
            }
            onBlur={() => onBlur('applicant.motivation')}
          />
        </FormField>
      </div>

      {formState.type === 'group' ? (
        <GroupFields
          group={formState.group}
          errors={errors}
          onGroupChange={onGroupChange}
          onParticipantChange={onParticipantChange}
          onBlur={onBlur}
        />
      ) : null}
    </section>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:ring-red-200'
      : 'border-slate-300 focus:ring-slate-200'
  }`;
}
