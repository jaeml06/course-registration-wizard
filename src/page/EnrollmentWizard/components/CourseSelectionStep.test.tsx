import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { COURSE_CATEGORIES, COURSES } from '../../../constants/courses';

import { CourseSelectionStep } from './CourseSelectionStep';

function renderCourseSelectionStep(
  overrides: Partial<Parameters<typeof CourseSelectionStep>[0]> = {},
) {
  const props: Parameters<typeof CourseSelectionStep>[0] = {
    courses: COURSES,
    categories: COURSE_CATEGORIES,
    selectedCategory: 'all',
    selectedCourseId: '',
    enrollmentType: 'personal',
    errors: {},
    listStatus: 'ready',
    onCategoryChange: vi.fn(),
    onSelectCourse: vi.fn(),
    onTypeChange: vi.fn(),
    onRetry: vi.fn(),
    ...overrides,
  };

  render(<CourseSelectionStep {...props} />);

  return props;
}

describe('CourseSelectionStep', () => {
  test('카테고리를 선택할 수 있다', async () => {
    const user = userEvent.setup();
    const props = renderCourseSelectionStep();

    await user.click(screen.getByRole('button', { name: '개발' }));

    expect(props.onCategoryChange).toHaveBeenCalledWith('development');
  });

  test('신청 가능한 강의를 선택하고 선택 요약을 보여준다', async () => {
    const user = userEvent.setup();
    const props = renderCourseSelectionStep({
      selectedCourseId: 'course-react-fundamentals',
    });

    await user.click(screen.getByRole('radio', { name: /React 실전 입문/ }));

    expect(props.onSelectCourse).toHaveBeenCalledWith(
      'course-react-fundamentals',
    );
    expect(screen.getByText('선택한 강의')).toBeInTheDocument();
    expect(screen.getAllByText('React 실전 입문')).toHaveLength(2);
  });

  test('정원 마감 강의는 선택할 수 없다', () => {
    renderCourseSelectionStep();

    expect(
      screen.getByRole('radio', { name: /프로덕트 디자인 워크숍/ }),
    ).toBeDisabled();
  });

  test('개인 신청과 단체 신청 유형을 선택할 수 있다', async () => {
    const user = userEvent.setup();
    const props = renderCourseSelectionStep();

    await user.click(screen.getByRole('radio', { name: '단체 신청' }));

    expect(props.onTypeChange).toHaveBeenCalledWith('group');
  });

  test('로딩, 빈 목록, 실패 상태를 표시한다', () => {
    const { rerender } = render(
      <CourseSelectionStep
        courses={[]}
        categories={COURSE_CATEGORIES}
        selectedCategory="all"
        selectedCourseId=""
        enrollmentType="personal"
        errors={{}}
        listStatus="loading"
        onCategoryChange={vi.fn()}
        onSelectCourse={vi.fn()}
        onTypeChange={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(
      screen.getByText('강의 목록을 불러오는 중입니다.'),
    ).toBeInTheDocument();

    rerender(
      <CourseSelectionStep
        courses={[]}
        categories={COURSE_CATEGORIES}
        selectedCategory="business"
        selectedCourseId=""
        enrollmentType="personal"
        errors={{}}
        listStatus="ready"
        onCategoryChange={vi.fn()}
        onSelectCourse={vi.fn()}
        onTypeChange={vi.fn()}
        onRetry={vi.fn()}
      />,
    );
    expect(
      screen.getByText('선택 가능한 강의가 없습니다.'),
    ).toBeInTheDocument();

    rerender(
      <CourseSelectionStep
        courses={[]}
        categories={COURSE_CATEGORIES}
        selectedCategory="all"
        selectedCourseId=""
        enrollmentType="personal"
        errors={{}}
        listStatus="failed"
        onCategoryChange={vi.fn()}
        onSelectCourse={vi.fn()}
        onTypeChange={vi.fn()}
        onRetry={vi.fn()}
      />,
    );
    expect(
      screen.getByText('강의 목록을 불러오지 못했습니다.'),
    ).toBeInTheDocument();
  });

  test('잔여 정원이 적은 강의 안내를 보여준다', () => {
    renderCourseSelectionStep();

    expect(screen.getByText('잔여 2명')).toBeInTheDocument();
  });

  test('모바일에서 강의 카드, 라디오 label, 선택 강의 요약이 줄바꿈과 터치 여백을 유지한다', () => {
    renderCourseSelectionStep({
      selectedCourseId: 'course-react-fundamentals',
      courses: [
        {
          ...COURSES[0],
          title:
            '아주 긴 강의 제목으로 모바일 폭에서도 줄바꿈되어야 하는 React 실전 입문 과정',
        },
      ],
    });

    expect(
      screen.getByTestId('course-card-course-react-fundamentals'),
    ).toHaveClass('min-w-0', 'wrap-break-word', 'p-4');
    expect(screen.getByTestId('course-title-course-react-fundamentals')).toHaveClass(
      'min-w-0',
      'wrap-break-word',
    );
    expect(screen.getByTestId('selected-course-summary')).toHaveClass(
      'min-w-0',
      'wrap-break-word',
    );
    expect(screen.getByRole('radio', { name: /개인 신청/ }).closest('label')).toHaveClass(
      'min-h-11',
      'px-4',
    );
  });
});
