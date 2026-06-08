import { useEffect, useRef } from 'react';

import type { Course } from '../../../type/course';
import type { ValidationErrors } from '../../../type/enrollmentForm';
import type { DraftRecoveryResult } from '../../../util/enrollmentDraftStorage';
import { isCourseFull } from '../../../util/courseCapacity';
import { ENROLLMENT_MESSAGES } from '../../../util/enrollmentMessages';

type CourseListStatus = 'loading' | 'ready' | 'failed';

interface UseRecoveredCourseGuardOptions {
  courses: Course[];
  listStatus: CourseListStatus;
  draftRecoveryStatus: DraftRecoveryResult['status'];
  selectedCourseId: string;
  goToCourseStep: () => void;
  clearSelectedCourse: () => void;
  setFormErrors: (updater: (errors: ValidationErrors) => ValidationErrors) => void;
  setReselectNotice: (notice: string | null) => void;
}

/**
 * [데이터 정합성] 선택된 강의가 현재 강의 목록 기준으로도 유효한지 지키는 훅.
 * 강의 목록 조회가 끝났는데(ready) 선택 강의가 사라졌거나 마감됐다면 선택을 비운다.
 * 특히 복구된 draft의 강의가 그사이 마감됐을 수 있어, 그 경우엔 강의 단계로 되돌려 재선택을 안내한다.
 * (Page에 흩어져 있던 효과를 옮겨, 페이지는 "조립"만 남기기 위한 추출이다.)
 */
export function useRecoveredCourseGuard({
  courses,
  listStatus,
  draftRecoveryStatus,
  selectedCourseId,
  goToCourseStep,
  clearSelectedCourse,
  setFormErrors,
  setReselectNotice,
}: UseRecoveredCourseGuardOptions): void {
  // 복구된 강의의 유효성 재검사를 "딱 한 번만" 하기 위한 플래그(렌더와 무관한 메모).
  const recoveredCourseCheckedRef = useRef(false);

  useEffect(() => {
    // 목록이 아직 안 왔거나 선택된 강의가 없으면 검사할 게 없다.
    if (listStatus !== 'ready' || !selectedCourseId) {
      return;
    }

    const selectedCourse = courses.find(
      (course) => course.id === selectedCourseId,
    );
    // "복구된 draft의 강의를 처음 확인하는 순간"인지 판별(딱 한 번만 안내를 띄우기 위함).
    const isRecoveredCourseCheck =
      draftRecoveryStatus === 'restored' &&
      !recoveredCourseCheckedRef.current;

    if (isRecoveredCourseCheck) {
      recoveredCourseCheckedRef.current = true;
    }

    // 강의가 존재하고 마감도 아니면 정상 — 아무것도 하지 않는다.
    if (selectedCourse && !isCourseFull(selectedCourse)) {
      return;
    }

    // 여기까지 왔다면 선택 강의가 사라졌거나 마감된 상태다.
    if (isRecoveredCourseCheck) {
      // 복구 직후라면 강의 단계로 되돌리고 재선택을 안내한다.
      goToCourseStep();
      setReselectNotice(ENROLLMENT_MESSAGES.recoveredCourseUnavailable);
    } else {
      // 복구가 아닌 일반 상황(예: 카테고리 전환으로 선택 강의가 목록에서 빠짐)에서는
      // 강의 단계로 강제 이동하지 않고 안내만 비운다.
      setReselectNotice(null);
    }

    // 어느 경우든 더 이상 유효하지 않은 선택은 비우고 에러를 표시한다.
    clearSelectedCourse();
    setFormErrors((currentErrors) => ({
      ...currentErrors,
      selectedCourseId: ENROLLMENT_MESSAGES.courseRequired,
    }));
  }, [
    courses,
    draftRecoveryStatus,
    goToCourseStep,
    listStatus,
    selectedCourseId,
    setFormErrors,
    clearSelectedCourse,
    setReselectNotice,
  ]);
}
