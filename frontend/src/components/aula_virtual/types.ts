export enum ViewState {
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_COURSE_EDITOR = 'ADMIN_COURSE_EDITOR',
  ADMIN_EXAM_MANAGER = 'ADMIN_EXAM_MANAGER',
  ADMIN_CERTIFICATE_EDITOR = 'ADMIN_CERTIFICATE_EDITOR',
  ADMIN_VIDEO_MANAGER = 'ADMIN_VIDEO_MANAGER', // New View
  STUDENT_DASHBOARD = 'STUDENT_DASHBOARD',
  STUDENT_COURSE_CATALOG = 'STUDENT_COURSE_CATALOG',
  STUDENT_COURSE_DETAIL = 'STUDENT_COURSE_DETAIL',
  STUDENT_PLAYER = 'STUDENT_PLAYER',
  STUDENT_LIVE = 'STUDENT_LIVE',
  STUDENT_EXAM = 'STUDENT_EXAM',
  STUDENT_CERTIFICATES = 'STUDENT_CERTIFICATES',
  STUDENT_NOTES = 'STUDENT_NOTES', // New View
}

export interface NavItem {
  id: ViewState;
  label: string;
  icon: string;
  role: 'admin' | 'student';
}

export interface Question {
  id: number;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  points: number;
}