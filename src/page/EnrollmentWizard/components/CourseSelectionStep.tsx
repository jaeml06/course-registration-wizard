import { COURSE_CATEGORY_LABELS } from '../../../constants/courses';
import type { Course, CourseCategory } from '../../../type/course';
import type {
  EnrollmentType,
  ValidationErrors,
} from '../../../type/enrollmentForm';
import {
  getRemainingSeats,
  isCourseFull,
  isLowCapacityCourse,
} from '../../../util/courseCapacity';

import { FieldError } from './FieldError';

type CourseCategoryFilter = CourseCategory | 'all';
type CourseListStatus = 'loading' | 'ready' | 'failed';

interface CourseSelectionStepProps {
  courses: Course[];
  categories: CourseCategory[];
  selectedCategory: CourseCategoryFilter;
  selectedCourseId: string;
  enrollmentType: EnrollmentType;
  errors: ValidationErrors;
  listStatus: CourseListStatus;
  errorMessage?: string | null;
  onCategoryChange: (category: CourseCategoryFilter) => void;
  onSelectCourse: (courseId: string) => void;
  onTypeChange: (type: EnrollmentType) => void;
  onRetry: () => void;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('ko-KR').format(price);
}

function formatDateRange(course: Course) {
  return `${course.startDate} ~ ${course.endDate}`;
}

// 1단계 화면: 카테고리 필터, 신청 유형 선택, 강의 목록(로딩/실패/빈/정상), 선택 강의 요약.
// 상태는 갖지 않고 props로 받은 값/콜백만 그린다(상태는 Page의 훅들이 보유).
export function CourseSelectionStep({
  courses,
  categories,
  selectedCategory,
  selectedCourseId,
  enrollmentType,
  errors,
  listStatus,
  errorMessage,
  onCategoryChange,
  onSelectCourse,
  onTypeChange,
  onRetry,
}: CourseSelectionStepProps) {
  const selectedCourse = courses.find(
    (course) => course.id === selectedCourseId,
  );

  return (
    <section aria-labelledby="course-step-title" className="grid min-w-0 gap-6">
      <div className="min-w-0">
        <h2
          id="course-step-title"
          className="break-words text-2xl font-bold tracking-normal"
        >
          1단계 강의 선택
        </h2>
        <p className="mt-2 min-w-0 break-words text-sm text-slate-600">
          카테고리와 신청 유형을 선택한 뒤 신청 가능한 강의를 고릅니다.
        </p>
      </div>

      <div
        className="flex min-w-0 flex-wrap gap-2"
        aria-label="강의 카테고리"
      >
        <button
          type="button"
          className={categoryButtonClass(selectedCategory === 'all')}
          onClick={() => onCategoryChange('all')}
        >
          전체
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={categoryButtonClass(selectedCategory === category)}
            onClick={() => onCategoryChange(category)}
          >
            {COURSE_CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      <fieldset className="grid min-w-0 gap-3">
        <legend className="min-w-0 break-words text-sm font-semibold text-slate-900">
          신청 유형
        </legend>
        <div className="flex min-w-0 flex-wrap gap-3">
          <label className="flex min-h-11 min-w-0 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm">
            <input
              type="radio"
              name="enrollment-type"
              checked={enrollmentType === 'personal'}
              onChange={() => onTypeChange('personal')}
            />
            개인 신청
          </label>
          <label className="flex min-h-11 min-w-0 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm">
            <input
              type="radio"
              name="enrollment-type"
              checked={enrollmentType === 'group'}
              onChange={() => onTypeChange('group')}
            />
            단체 신청
          </label>
        </div>
      </fieldset>

      <FieldError message={errors.selectedCourseId} />

      {listStatus === 'loading' ? (
        <p className="min-w-0 break-words rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700">
          강의 목록을 불러오는 중입니다.
        </p>
      ) : null}

      {listStatus === 'failed' ? (
        <div className="min-w-0 rounded-md border border-red-200 bg-red-50 p-4">
          <p className="min-w-0 break-words text-sm font-semibold text-red-800">
            {errorMessage ?? '강의 목록을 불러오지 못했습니다.'}
          </p>
          <button
            type="button"
            className="mt-3 min-h-11 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800"
            onClick={onRetry}
          >
            다시 불러오기
          </button>
        </div>
      ) : null}

      {listStatus === 'ready' && courses.length === 0 ? (
        <p className="min-w-0 break-words rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700">
          선택 가능한 강의가 없습니다.
        </p>
      ) : null}

      {listStatus === 'ready' && courses.length > 0 ? (
        <div className="grid min-w-0 gap-3">
          {courses.map((course) => {
            const remainingSeats = getRemainingSeats(course);
            const isFull = isCourseFull(course);
            const isSelected = course.id === selectedCourseId;

            return (
              <label
                key={course.id}
                className={`grid min-w-0 break-words gap-2 rounded-md border bg-white p-4 ${
                  isSelected ? 'border-slate-900' : 'border-slate-200'
                } ${isFull ? 'opacity-60' : ''}`}
                data-testid={`course-card-${course.id}`}
              >
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                  <span
                    className="flex min-w-0 items-start gap-2 break-words text-base font-bold text-slate-950"
                    data-testid={`course-title-${course.id}`}
                  >
                    {/* onChange는 키보드(방향키/스페이스) 선택을, onClick은 "이미 선택된 강의를
                        다시 클릭"하는 경우를 처리한다(이미 체크된 라디오는 onChange가 안 뜬다).
                        마감 강의는 disabled라 onClick의 추가 가드 없이도 호출되지 않는다. */}
                    <input
                      type="radio"
                      name="course"
                      className="mt-1 shrink-0"
                      disabled={isFull}
                      checked={isSelected}
                      onChange={() => onSelectCourse(course.id)}
                      onClick={() => onSelectCourse(course.id)}
                    />
                    {course.title}
                  </span>
                  <span className="min-w-0 break-words text-sm font-semibold text-slate-700">
                    {isFull ? '정원 마감' : `잔여 ${remainingSeats}명`}
                  </span>
                </div>
                <span className="min-w-0 break-words text-sm text-slate-600">
                  {course.description}
                </span>
                <span className="min-w-0 break-words text-sm text-slate-600">
                  {COURSE_CATEGORY_LABELS[course.category]} ·{' '}
                  {course.instructor} · {formatDateRange(course)} ·{' '}
                  {formatPrice(course.price)}원
                </span>
                {isLowCapacityCourse(course) ? (
                  <span className="min-w-0 break-words text-sm font-semibold text-amber-700">
                    잔여 정원이 적습니다.
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
      ) : null}

      {selectedCourse ? (
        <aside
          className="min-w-0 break-words rounded-md border border-slate-200 bg-slate-50 p-4"
          data-testid="selected-course-summary"
        >
          <h3 className="min-w-0 break-words text-sm font-bold text-slate-900">
            선택한 강의
          </h3>
          <p className="mt-2 min-w-0 break-words text-base font-semibold text-slate-950">
            {selectedCourse.title}
          </p>
          <p className="mt-1 min-w-0 break-words text-sm text-slate-600">
            {formatDateRange(selectedCourse)} ·{' '}
            {formatPrice(selectedCourse.price)}원
          </p>
        </aside>
      ) : null}
    </section>
  );
}

function categoryButtonClass(isActive: boolean) {
  return `min-h-11 min-w-0 break-words rounded-md border px-4 py-2 text-sm font-semibold ${
    isActive
      ? 'border-slate-900 bg-slate-900 text-white'
      : 'border-slate-300 bg-white text-slate-700'
  }`;
}
