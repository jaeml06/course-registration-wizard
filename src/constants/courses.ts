import type { Course, CourseCategory } from '../type/course';

export const COURSE_CATEGORIES: CourseCategory[] = [
  'development',
  'design',
  'marketing',
  'business',
];

export const COURSE_CATEGORY_LABELS: Record<CourseCategory, string> = {
  development: '개발',
  design: '디자인',
  marketing: '마케팅',
  business: '비즈니스',
};

export const COURSES: Course[] = [
  {
    id: 'course-react-fundamentals',
    title: 'React 실전 입문',
    description: '컴포넌트, 상태, 이벤트를 중심으로 React 기본기를 다집니다.',
    category: 'development',
    price: 220000,
    maxCapacity: 12,
    currentEnrollment: 6,
    startDate: '2026-07-06',
    endDate: '2026-07-27',
    instructor: '김하늘',
  },
  {
    id: 'course-typescript-forms',
    title: 'TypeScript 폼 상태 설계',
    description: '복잡한 폼 상태와 검증 로직을 타입 안전하게 설계합니다.',
    category: 'development',
    price: 280000,
    maxCapacity: 8,
    currentEnrollment: 6,
    startDate: '2026-08-03',
    endDate: '2026-08-24',
    instructor: '이도윤',
  },
  {
    id: 'course-product-design',
    title: '프로덕트 디자인 워크숍',
    description: '문제 정의부터 화면 설계까지 제품 디자인 흐름을 실습합니다.',
    category: 'design',
    price: 260000,
    maxCapacity: 10,
    currentEnrollment: 10,
    startDate: '2026-07-14',
    endDate: '2026-08-04',
    instructor: '박서연',
  },
  {
    id: 'course-growth-marketing',
    title: '그로스 마케팅 기본기',
    description:
      '퍼널 분석과 실험 설계를 통해 성장 지표를 개선하는 방법을 배웁니다.',
    category: 'marketing',
    price: 190000,
    maxCapacity: 15,
    currentEnrollment: 4,
    startDate: '2026-07-20',
    endDate: '2026-08-10',
    instructor: '최민준',
  },
];
