import { useCallback, useMemo, useState } from 'react';

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

// 사용자가 한 번이라도 건드린(blur한) 필드 집합. 값이 true인 키만 담는다.
type TouchedFields = Partial<Record<FieldPath, true>>;

interface UseEnrollmentFormStateOptions {
  courses: Course[];
  initialFormState?: EnrollmentFormState;
  // 단체→개인 전환 시 "정말 초기화할까요?" 확인. 테스트에서 window.confirm 대신 주입하기 위함.
  confirmGroupReset?: () => boolean;
}

// 특정 필드의 에러만 불변(immutable)하게 제거한 새 errors 객체를 반환한다.
function removeFieldError(errors: ValidationErrors, field: FieldPath) {
  const nextErrors = { ...errors };
  delete nextErrors[field];

  return nextErrors;
}

/**
 * 폼의 "상태 보관소" 훅.
 * 실제 상태 변환 규칙은 전부 util/enrollmentFormState.ts의 순수 함수에 있고,
 * 이 훅은 그것들을 useState에 연결하는 얇은 어댑터다.
 * 공통 패턴: 값을 바꾸면(setFormState) 그 필드의 기존 에러도 같이 지운다(setErrors).
 */
export function useEnrollmentFormState({
  courses,
  initialFormState,
  confirmGroupReset,
}: UseEnrollmentFormStateOptions) {
  // 복구된 초기값이 있으면 그것으로, 없으면 빈 폼으로 시작한다.
  const [formState, setFormState] = useState<EnrollmentFormState>(() =>
    initialFormState ?? createInitialEnrollmentFormState(),
  );
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({});
  const [errors, setErrors] = useState<ValidationErrors>({});

  // updateSelectedCourse만 useCallback으로 감싼 이유: Page의 useEffect 의존성 배열에
  // 들어가므로 참조가 매 렌더 바뀌면 효과가 불필요하게 재실행된다. 나머지 핸들러는
  // 의존성에 들어가지 않아 굳이 메모이즈하지 않았다.
  const updateSelectedCourse = useCallback((selectedCourseId: string) => {
    setFormState((state) =>
      updateSelectedCourseInState(state, selectedCourseId),
    );
    setErrors((currentErrors) =>
      removeFieldError(currentErrors, 'selectedCourseId'),
    );
  }, []);

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

  // 개인/단체 신청 유형 전환.
  // 핵심 규칙: 단체→개인으로 바꿀 때 입력된 단체 데이터가 있으면 사용자에게 확인을 받고,
  // 동의한 경우에만 단체 데이터를 버린다(요구사항의 데이터 정합성 정책).
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
    // 유형이 바뀌면 이전 에러는 더 이상 의미가 없으므로 전부 비운다.
    setErrors({});
  }

  // 필드에서 포커스가 빠질 때(blur) 그 필드 하나만 즉시 검증한다(요구사항: blur 단위 검증).
  function blurField(field: FieldPath) {
    setTouchedFields((currentTouched) => ({
      ...currentTouched,
      [field]: true,
    }));
    setErrors((currentErrors) => {
      const message = validateField(field, formState);

      // 통과하면 기존 에러 제거, 실패하면 메시지로 갱신.
      if (!message) {
        return removeFieldError(currentErrors, field);
      }

      return {
        ...currentErrors,
        [field]: message,
      };
    });
  }

  // 단계 이동 직전, 그 단계 전체를 한꺼번에 검증해 에러 맵을 돌려준다(Page의 handleNext가 사용).
  function getStepErrors(step: EnrollmentStep) {
    return validateCurrentStep(step, formState, courses);
  }

  // 선택된 강의 객체를 id로 찾아 메모이즈. 여러 컴포넌트가 잔여 정원 표시 등에 재사용한다.
  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === formState.selectedCourseId),
    [courses, formState.selectedCourseId],
  );

  return {
    formState,
    selectedCourse,
    touchedFields,
    errors,
    setErrors,
    updateSelectedCourse,
    updateApplicantField,
    updateGroupField,
    updateParticipantField,
    updateTermsAgreement,
    switchType,
    blurField,
    getStepErrors,
  };
}
