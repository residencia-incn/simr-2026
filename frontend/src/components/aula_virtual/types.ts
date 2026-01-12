export enum ViewState {
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_COURSE_EDITOR = 'ADMIN_COURSE_EDITOR',
  ADMIN_EXAM_MANAGER = 'ADMIN_EXAM_MANAGER',
  ADMIN_CERTIFICATE_EDITOR = 'ADMIN_CERTIFICATE_EDITOR',
  ADMIN_VIDEO_MANAGER = 'ADMIN_VIDEO_MANAGER',
  ADMIN_ENROLLMENT_MANAGER = 'ADMIN_ENROLLMENT_MANAGER',
  ADMIN_READING_MANAGER = 'ADMIN_READING_MANAGER',
  ADMIN_READING_EDITOR = 'ADMIN_READING_EDITOR',
  STUDENT_DASHBOARD = 'STUDENT_DASHBOARD',
  STUDENT_COURSE_CATALOG = 'STUDENT_COURSE_CATALOG',
  STUDENT_COURSE_DETAIL = 'STUDENT_COURSE_DETAIL',
  STUDENT_PLAYER = 'STUDENT_PLAYER',
  STUDENT_LIVE = 'STUDENT_LIVE',
  STUDENT_EXAM = 'STUDENT_EXAM',
  STUDENT_CERTIFICATES = 'STUDENT_CERTIFICATES',
  STUDENT_NOTES = 'STUDENT_NOTES',
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

export type VideoSourceType = 'local' | 'youtube' | 'vimeo' | 'gdrive' | 'bunny' | 'cloudflare';

export interface Video {
  id: number;
  title: string;
  description: string;
  courseId?: number;
  courseName: string;
  associatedCourses?: string[];
  category: string;
  specialty?: string;
  categoryColor: string;
  speaker: string;
  duration: string;
  date: string;
  thumbnail: string;
  sourceType: VideoSourceType;
  sourceUrl?: string;
  sourceId?: string;
  status: 'PROCESANDO' | 'LISTO' | 'ERROR';
  views: number;
  size?: string;
}

export type PlayerType = 'native' | 'plyr';

export interface PlayerConfig {
  defaultPlayer: PlayerType;
  youtube: {
    hideControls: boolean;
    modestBranding: boolean;
    disableRelated: boolean;
  };
  autoPlay: boolean;
}

// --- CORE DATA TYPES ---

export interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  type: 'VIDEO' | 'LECTURA' | 'QUIZ' | 'TAREA' | 'video' | 'quiz' | 'reading'; // Merged types for compatibility
  duration: string;
  order: number;
  isRequired: boolean;
  status: string;
  completed: boolean; // Added for compatibility

  // Content props
  videoUrl?: string | null;
  content?: string | null;
  downloadUrl?: string;
  completedBy?: string[];

  // Video Player Props
  videoId?: number; // Link to central video repository
  sourceType?: 'youtube' | 'vimeo' | 's3' | 'local';
  sourceId?: string;
  thumbnail?: string;
  icon?: string;
}

export interface InteractionData {
  time?: number;
  score?: number;
  completed?: boolean;
}

export interface UserLessonProgress {
  userId: string;
  lessonId: number;
  videoId?: number;
  data: {
    playedSeconds: number;
    totalSeconds: number;
    lastPosition?: number;
  };
  completed: boolean;
  updatedAt: string;
}

export interface VideoNote {
  id: string;
  userId: string;
  courseId: number;
  moduleId: number;
  lessonId: number;
  videoId?: number;
  content: string; // HTML content
  timestamp: number; // Video time in seconds
  formattedTimestamp: string; // "03:45"
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: number;
  courseId: number;
  title: string;
  name?: string; // Helper for compatibility
  description?: string;
  order: number;
  status: string;
  duration?: string;
  isRequired?: boolean;
  isSequential?: boolean; // Controls if lessons must be taken in order
  lessons?: Lesson[];
  items?: Lesson[]; // For flexible structure / compatibility
}

export interface Course {
  id: number;
  title: string;
  slug?: string;
  description: string;
  longDescription?: string;
  imageUrl: string; // Unified with coverImage potentially, but keeping imageUrl as primary
  coverImage?: string | null;
  coverGradient?: string;

  progress: number;
  category: string;
  specialty?: string;
  difficulty?: string;

  instructorId: number | string; // Supporting both for now to avoid breaking changes

  totalLessons: number;
  totalModules: number;
  duration: string;

  rating: number;
  totalRatings?: number; // Optional
  reviewsCount: number;

  status?: string; // 'BORRADOR' | 'PUBLICADO' | 'CERRADO'
  createdAt?: string;
  updatedAt?: string;
  price?: number;
  certificateEnabled?: boolean;
  enrolledStudents?: number;

  // Extended props
  instructorName?: string;
  instructorSpecialty?: string;
  instructorInstitution?: string;
  instructorDescription?: string;

  finalExamId?: string | number;
  finalExamCondition?: string;
  finalExamDate?: string;
  closingDate?: string;
  materials?: any[];

  modules?: Module[];
}

export interface Enrollment {
  id: number;
  courseId: number;
  userId: string;
  userName: string;
  userEmail: string;
  enrolledAt: string;
  progress: number;
  averageGrade?: number;
  status: 'ACTIVO' | 'COMPLETADO' | 'SUSPENDIDO';
  lastAccessAt: string;
  certificateIssued: boolean;
}

export interface CourseMaterial {
  id: number;
  courseId: number;
  moduleId: number;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  url: string;
  downloadCount: number;
}

export interface Instructor {
  id: string | number;
  name: string;
  email: string;
  specialty: string;
  title: string;
  bio: string;
  avatar: string;
  coursesCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role?: string; // Legacy
  roles?: string[]; // Legacy
  eventRole?: string; // New RBAC
  eventRoles?: string[]; // New RBAC
  modality?: string;
  purchasedItems?: string[];
  specialty?: string;
  occupation?: string;
  // Add other fields as needed from mockUsers
}