import type {
  FieldPath,
  GroupEnrollmentForm,
  ValidationErrors,
} from '../../../type/enrollmentForm';
import { FormField } from './FormField';
import { NumericInput } from './NumericInput';
import { TextField } from './TextField';
import { textControlClassName } from './textControlClassName';

interface GroupFieldsProps {
  group: GroupEnrollmentForm;
  errors: ValidationErrors;
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

// 단체 신청 전용 필드: 단체명, 인원수(NumericInput), 인원수만큼 동적으로 생기는 참가자 명단,
// 담당자 연락처. 참가자 행은 group.participants 길이에 맞춰 자동으로 늘고 준다.
export function GroupFields({
  group,
  errors,
  onGroupChange,
  onParticipantChange,
  onBlur,
}: GroupFieldsProps) {
  return (
    <div className="grid min-w-0 gap-5 rounded-md border border-slate-200 bg-slate-50 p-4">
      <h3 className="min-w-0 break-words text-base font-bold text-slate-950">
        단체 신청 정보
      </h3>
      <TextField
        field="group.organizationName"
        label="단체명"
        value={group.organizationName}
        error={errors['group.organizationName']}
        onChange={(value) => onGroupChange('organizationName', value)}
        onBlur={onBlur}
      />

      <FormField
        label="신청 인원수"
        htmlFor="group-head-count"
        error={errors['group.headCount']}
        helperText="2명 이상 10명 이하로 입력해 주세요."
      >
        <NumericInput
          id="group-head-count"
          min={2}
          max={10}
          fallbackValue={2}
          className={textControlClassName(Boolean(errors['group.headCount']))}
          value={group.headCount}
          aria-invalid={Boolean(errors['group.headCount'])}
          aria-describedby={
            errors['group.headCount'] ? 'group-head-count-error' : undefined
          }
          onValueChange={(value) => onGroupChange('headCount', value)}
          onBlur={() => onBlur('group.headCount')}
        />
      </FormField>

      <div className="grid min-w-0 gap-4">
        <h4 className="min-w-0 break-words text-sm font-bold text-slate-900">
          참가자 명단
        </h4>
        {group.participants.map((participant, index) => {
          const nameField = `group.participants.${index}.name` as FieldPath;
          const emailField = `group.participants.${index}.email` as FieldPath;

          return (
            <div
              key={index}
              className="grid min-w-0 grid-cols-1 gap-3 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-2"
              data-testid={`group-participant-row-${index}`}
            >
              <TextField
                field={nameField}
                label={`참가자 ${index + 1} 이름`}
                value={participant.name}
                error={errors[nameField]}
                onChange={(value) => onParticipantChange(index, 'name', value)}
                onBlur={onBlur}
              />
              <TextField
                field={emailField}
                label={`참가자 ${index + 1} 이메일`}
                type="email"
                value={participant.email}
                error={errors[emailField]}
                onChange={(value) => onParticipantChange(index, 'email', value)}
                onBlur={onBlur}
              />
            </div>
          );
        })}
      </div>

      <TextField
        field="group.contactPerson"
        label="담당자 연락처"
        value={group.contactPerson}
        error={errors['group.contactPerson']}
        onChange={(value) => onGroupChange('contactPerson', value)}
        onBlur={onBlur}
      />
    </div>
  );
}
