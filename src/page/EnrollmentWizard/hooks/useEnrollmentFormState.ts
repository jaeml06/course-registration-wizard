import { useMemo, useState } from 'react';

import type { Course } from '../../../type/course';
import type {
  ApplicantForm,
  EnrollmentFormState,
  EnrollmentStep,
  EnrollmentType,
  FieldPath,
  GroupEnrollmentForm,
  ValidationErrors,
} from '../../../type/enrollmentForm';
import {
  createInitialEnrollmentFormState,
  hasMeaningfulGroupData,
  switchEnrollmentType,
  updateApplicantField as updateApplicantFieldInState,
  updateGroupField as updateGroupFieldInState,
  updateParticipantField as updateParticipantFieldInState,
  updateSelectedCourse as updateSelectedCourseInState,
  updateTermsAgreement as updateTermsAgreementInState,
} from '../../../util/enrollmentFormState';
import {
  validateCurrentStep,
  validateField,
} from '../../../util/enrollmentValidation';

type TouchedFields = Partial<Record<FieldPath, true>>;

interface UseEnrollmentFormStateOptions {
  courses: Course[];
  confirmGroupReset?: () => boolean;
}

function removeFieldError(errors: ValidationErrors, field: FieldPath) {
  const nextErrors = { ...errors };
  delete nextErrors[field];

  return nextErrors;
}

export function useEnrollmentFormState({
  courses,
  confirmGroupReset,
}: UseEnrollmentFormStateOptions) {
  const [formState, setFormState] = useState<EnrollmentFormState>(() =>
    createInitialEnrollmentFormState(),
  );
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({});
  const [errors, setErrors] = useState<ValidationErrors>({});

  function updateSelectedCourse(selectedCourseId: string) {
    setFormState((state) =>
      updateSelectedCourseInState(state, selectedCourseId),
    );
    setErrors((currentErrors) =>
      removeFieldError(currentErrors, 'selectedCourseId'),
    );
  }

  function updateApplicantField(field: keyof ApplicantForm, value: string) {
    const fieldPath = `applicant.${field}` as FieldPath;

    setFormState((state) => updateApplicantFieldInState(state, field, value));
    setErrors((currentErrors) => removeFieldError(currentErrors, fieldPath));
  }

  function updateGroupField(
    field: Exclude<keyof GroupEnrollmentForm, 'participants'>,
    value: string | number,
  ) {
    const fieldPath = `group.${field}` as FieldPath;

    setFormState((state) => updateGroupFieldInState(state, field, value));
    setErrors((currentErrors) => removeFieldError(currentErrors, fieldPath));
  }

  function updateParticipantField(
    index: number,
    field: 'name' | 'email',
    value: string,
  ) {
    const fieldPath = `group.participants.${index}.${field}` as FieldPath;

    setFormState((state) =>
      updateParticipantFieldInState(state, index, field, value),
    );
    setErrors((currentErrors) => removeFieldError(currentErrors, fieldPath));
  }

  function updateTermsAgreement(agreedToTerms: boolean) {
    setFormState((state) => updateTermsAgreementInState(state, agreedToTerms));
    setErrors((currentErrors) =>
      removeFieldError(currentErrors, 'agreedToTerms'),
    );
  }

  function switchType(nextType: EnrollmentType) {
    setFormState((state) => {
      if (
        state.type === 'group' &&
        nextType === 'personal' &&
        hasMeaningfulGroupData(state.group)
      ) {
        const shouldReset = confirmGroupReset
          ? confirmGroupReset()
          : window.confirm(
              '단체 신청 정보를 초기화하고 개인 신청으로 바꿀까요?',
            );

        return switchEnrollmentType(state, nextType, {
          confirmedReset: shouldReset,
        });
      }

      return switchEnrollmentType(state, nextType);
    });
    setErrors({});
  }

  function blurField(field: FieldPath) {
    setTouchedFields((currentTouched) => ({
      ...currentTouched,
      [field]: true,
    }));
    setErrors((currentErrors) => {
      const message = validateField(field, formState);

      if (!message) {
        return removeFieldError(currentErrors, field);
      }

      return {
        ...currentErrors,
        [field]: message,
      };
    });
  }

  function validateStep(step: EnrollmentStep): boolean {
    const nextErrors = validateCurrentStep(step, formState, courses);
    setErrors((currentErrors) => ({
      ...currentErrors,
      ...nextErrors,
    }));

    return Object.keys(nextErrors).length === 0;
  }

  function getStepErrors(step: EnrollmentStep) {
    return validateCurrentStep(step, formState, courses);
  }

  function replaceErrors(nextErrors: ValidationErrors) {
    setErrors(nextErrors);
  }

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === formState.selectedCourseId),
    [courses, formState.selectedCourseId],
  );

  return {
    formState,
    selectedCourse,
    touchedFields,
    errors,
    setErrors: replaceErrors,
    updateSelectedCourse,
    updateApplicantField,
    updateGroupField,
    updateParticipantField,
    updateTermsAgreement,
    switchType,
    blurField,
    validateStep,
    getStepErrors,
  };
}
