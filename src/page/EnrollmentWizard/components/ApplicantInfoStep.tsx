import type { Course } from '../../../type/course';
import type {
  ApplicantForm,
  EnrollmentFormState,
  FieldPath,
  GroupEnrollmentForm,
  ValidationErrors,
} from '../../../type/enrollmentForm';
import { getRemainingSeats } from '../../../util/courseCapacity';

import { GroupFields } from './GroupFields';
import { TextField } from './TextField';

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

// 2단계 화면: 공통(신청자) 필드를 그리고, 단체 신청일 때만 GroupFields를 덧붙인다.
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
    <section
      aria-labelledby="applicant-step-title"
      className="grid min-w-0 gap-6"
    >
      <div className="min-w-0">
        <h2
          id="applicant-step-title"
          className="break-words text-2xl font-bold tracking-normal"
        >
          2단계 수강생 정보 입력
        </h2>
        <p className="mt-2 min-w-0 break-words text-sm text-slate-600">
          대표 신청자 정보를 입력합니다. 단체 신청은 참가자 명단까지 확인합니다.
        </p>
        {selectedCourse ? (
          <p className="mt-2 min-w-0 break-words text-sm font-semibold text-slate-700">
            선택 강의 잔여 정원: {getRemainingSeats(selectedCourse)}명
          </p>
        ) : null}
      </div>

      <div
        className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2"
        data-testid="applicant-fields-grid"
      >
        <TextField
          field="applicant.name"
          label="이름"
          value={formState.applicant.name}
          error={errors['applicant.name']}
          onChange={(value) => onApplicantChange('name', value)}
          onBlur={onBlur}
        />

        <TextField
          field="applicant.email"
          label="이메일"
          type="email"
          value={formState.applicant.email}
          error={errors['applicant.email']}
          onChange={(value) => onApplicantChange('email', value)}
          onBlur={onBlur}
        />

        <TextField
          field="applicant.phone"
          label="전화번호"
          value={formState.applicant.phone}
          error={errors['applicant.phone']}
          onChange={(value) => onApplicantChange('phone', value)}
          onBlur={onBlur}
        />

        <TextField
          field="applicant.motivation"
          label="수강 동기"
          multiline
          helperText="선택 입력이며 300자 이하로 작성할 수 있습니다."
          value={formState.applicant.motivation}
          error={errors['applicant.motivation']}
          onChange={(value) => onApplicantChange('motivation', value)}
          onBlur={onBlur}
        />
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
