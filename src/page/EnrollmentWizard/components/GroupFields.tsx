import type {
  FieldPath,
  GroupEnrollmentForm,
  ValidationErrors,
} from '../../../type/enrollmentForm';

import { FormField } from './FormField';
import { NumericInput } from './NumericInput';

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

export function GroupFields({
  group,
  errors,
  onGroupChange,
  onParticipantChange,
  onBlur,
}: GroupFieldsProps) {
  return (
    <div className="grid gap-5 rounded-md border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-base font-bold text-slate-950">단체 신청 정보</h3>
      <FormField
        label="단체명"
        htmlFor="group-organization-name"
        error={errors['group.organizationName']}
      >
        <input
          id="group-organization-name"
          className={inputClass(Boolean(errors['group.organizationName']))}
          value={group.organizationName}
          aria-invalid={Boolean(errors['group.organizationName'])}
          aria-describedby={
            errors['group.organizationName']
              ? 'group-organization-name-error'
              : undefined
          }
          onChange={(event) =>
            onGroupChange('organizationName', event.target.value)
          }
          onBlur={() => onBlur('group.organizationName')}
        />
      </FormField>

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
          className={inputClass(Boolean(errors['group.headCount']))}
          value={group.headCount}
          aria-invalid={Boolean(errors['group.headCount'])}
          aria-describedby={
            errors['group.headCount'] ? 'group-head-count-error' : undefined
          }
          onValueChange={(value) => onGroupChange('headCount', value)}
          onBlur={() => onBlur('group.headCount')}
        />
      </FormField>

      <div className="grid gap-4">
        <h4 className="text-sm font-bold text-slate-900">참가자 명단</h4>
        {group.participants.map((participant, index) => {
          const nameField = `group.participants.${index}.name` as FieldPath;
          const emailField = `group.participants.${index}.email` as FieldPath;
          const nameId = `group-participant-${index}-name`;
          const emailId = `group-participant-${index}-email`;

          return (
            <div
              key={index}
              className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-2"
            >
              <FormField
                label={`참가자 ${index + 1} 이름`}
                htmlFor={nameId}
                error={errors[nameField]}
              >
                <input
                  id={nameId}
                  className={inputClass(Boolean(errors[nameField]))}
                  value={participant.name}
                  aria-invalid={Boolean(errors[nameField])}
                  aria-describedby={
                    errors[nameField] ? `${nameId}-error` : undefined
                  }
                  onChange={(event) =>
                    onParticipantChange(index, 'name', event.target.value)
                  }
                  onBlur={() => onBlur(nameField)}
                />
              </FormField>
              <FormField
                label={`참가자 ${index + 1} 이메일`}
                htmlFor={emailId}
                error={errors[emailField]}
              >
                <input
                  id={emailId}
                  type="email"
                  className={inputClass(Boolean(errors[emailField]))}
                  value={participant.email}
                  aria-invalid={Boolean(errors[emailField])}
                  aria-describedby={
                    errors[emailField] ? `${emailId}-error` : undefined
                  }
                  onChange={(event) =>
                    onParticipantChange(index, 'email', event.target.value)
                  }
                  onBlur={() => onBlur(emailField)}
                />
              </FormField>
            </div>
          );
        })}
      </div>

      <FormField
        label="담당자 연락처"
        htmlFor="group-contact-person"
        error={errors['group.contactPerson']}
      >
        <input
          id="group-contact-person"
          className={inputClass(Boolean(errors['group.contactPerson']))}
          value={group.contactPerson}
          aria-invalid={Boolean(errors['group.contactPerson'])}
          aria-describedby={
            errors['group.contactPerson']
              ? 'group-contact-person-error'
              : undefined
          }
          onChange={(event) =>
            onGroupChange('contactPerson', event.target.value)
          }
          onBlur={() => onBlur('group.contactPerson')}
        />
      </FormField>
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:ring-red-200'
      : 'border-slate-300 focus:ring-slate-200'
  }`;
}
