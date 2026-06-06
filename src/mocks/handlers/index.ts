import { courseHandlers } from './courses';
import { enrollmentHandlers } from './enrollments';

export const handlers = [...courseHandlers, ...enrollmentHandlers];
