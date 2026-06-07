import {
  COURSE_CATEGORY_LABELS,
  type COURSE_CATEGORIES,
} from '../../../constants/courses';
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
  categories: typeof COURSE_CATEGORIES;
  selectedCategory: CourseCategoryFilter;
  selectedCourseId: string;
  enrollmentType: EnrollmentType;
  errors: ValidationErrors;
  listStatus: CourseListStatus;
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

export function CourseSelectionStep({
  courses,
  categories,
  selectedCategory,
  selectedCourseId,
  enrollmentType,
  errors,
  listStatus,
  onCategoryChange,
  onSelectCourse,
  onTypeChange,
  onRetry,
}: CourseSelectionStepProps) {
  const selectedCourse = courses.find(
    (course) => course.id === selectedCourseId,
  );

  return (
    <section aria-labelledby="course-step-title" className="grid gap-6">
      <div>
        <h2
          id="course-step-title"
          className="text-2xl font-bold tracking-normal"
        >
          1단계 강의 선택
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          카테고리와 신청 유형을 선택한 뒤 신청 가능한 강의를 고릅니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="강의 카테고리">
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

      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold text-slate-900">
          신청 유형
        </legend>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
            <input
              type="radio"
              name="enrollment-type"
              checked={enrollmentType === 'personal'}
              onChange={() => onTypeChange('personal')}
            />
            개인 신청
          </label>
          <label className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
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
        <p className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700">
          강의 목록을 불러오는 중입니다.
        </p>
      ) : null}

      {listStatus === 'failed' ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">
            강의 목록을 불러오지 못했습니다.
          </p>
          <button
            type="button"
            className="mt-3 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-800"
            onClick={onRetry}
          >
            다시 불러오기
          </button>
        </div>
      ) : null}

      {listStatus === 'ready' && courses.length === 0 ? (
        <p className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700">
          선택 가능한 강의가 없습니다.
        </p>
      ) : null}

      {listStatus === 'ready' && courses.length > 0 ? (
        <div className="grid gap-3">
          {courses.map((course) => {
            const remainingSeats = getRemainingSeats(course);
            const isFull = isCourseFull(course);
            const isSelected = course.id === selectedCourseId;

            return (
              <label
                key={course.id}
                className={`grid gap-2 rounded-md border bg-white p-4 ${
                  isSelected ? 'border-slate-900' : 'border-slate-200'
                } ${isFull ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <span className="flex items-center gap-2 text-base font-bold text-slate-950">
                    <input
                      type="radio"
                      name="course"
                      disabled={isFull}
                      checked={isSelected}
                      onChange={() => onSelectCourse(course.id)}
                      onClick={() => {
                        if (!isFull) {
                          onSelectCourse(course.id);
                        }
                      }}
                    />
                    {course.title}
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    {isFull ? '정원 마감' : `잔여 ${remainingSeats}명`}
                  </span>
                </div>
                <span className="text-sm text-slate-600">
                  {course.description}
                </span>
                <span className="text-sm text-slate-600">
                  {COURSE_CATEGORY_LABELS[course.category]} ·{' '}
                  {course.instructor} · {formatDateRange(course)} ·{' '}
                  {formatPrice(course.price)}원
                </span>
                {isLowCapacityCourse(course) ? (
                  <span className="text-sm font-semibold text-amber-700">
                    잔여 정원이 적습니다.
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
      ) : null}

      {selectedCourse ? (
        <aside className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-bold text-slate-900">선택한 강의</h3>
          <p className="mt-2 text-base font-semibold text-slate-950">
            {selectedCourse.title}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {formatDateRange(selectedCourse)} ·{' '}
            {formatPrice(selectedCourse.price)}원
          </p>
        </aside>
      ) : null}
    </section>
  );
}

function categoryButtonClass(isActive: boolean) {
  return `rounded-md border px-3 py-2 text-sm font-semibold ${
    isActive
      ? 'border-slate-900 bg-slate-900 text-white'
      : 'border-slate-300 bg-white text-slate-700'
  }`;
}
