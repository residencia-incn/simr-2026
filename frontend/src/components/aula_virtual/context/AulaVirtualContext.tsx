import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mockCourses, mockModules, mockLessons, mockEnrollments, mockCourseMaterials, mockInstructors } from '../../../data/mockAulaVirtualData';

// ========== TYPES ==========
export interface Course {
    id: number;
    title: string;
    slug: string;
    description: string;
    longDescription: string;
    createdAt: string;
    updatedAt: string;
    status: 'PUBLICADO' | 'BORRADOR' | 'CERRADO';
    specialty: 'Neurología Clínica' | 'Neurología' | 'Neurocirugía' | 'Psiquiatría' | 'Medicina Interna' | 'Pediatría' | 'Medicina Intensiva' | 'Otro' | string;
    category: 'Curso' | 'Taller' | 'Congreso' | string;
    difficulty: 'BASICO' | 'MEDIO' | 'AVANZADO';
    coverImage: string | null;
    coverGradient: string;
    enrolledStudents: number;
    rating: number;
    totalRatings: number;
    duration: string;
    totalModules: number;
    totalLessons: number;
    certificateEnabled: boolean;
    instructorId: string;
    price: number;
}

export interface Module {
    id: number;
    courseId: number;
    title: string;
    description: string;
    order: number;
    status: string;
    duration: string;
    isRequired: boolean;
}

export interface Lesson {
    id: number;
    moduleId: number;
    title: string;
    type: 'VIDEO' | 'LECTURA' | 'QUIZ' | 'TAREA';
    duration: string;
    order: number;
    isRequired: boolean;
    status: string;
    videoUrl: string | null;
    content: string | null;
    downloadUrl?: string;
    completedBy: string[];
}

export interface Enrollment {
    id: number;
    courseId: number;
    userId: string;
    userName: string;
    userEmail: string;
    enrolledAt: string;
    progress: number;
    averageGrade: number;
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
    id: string;
    name: string;
    email: string;
    specialty: string;
    title: string;
    bio: string;
    avatar: string;
    coursesCount: number;
}

// ========== CONTEXT ==========
interface AulaVirtualContextType {
    // State
    courses: Course[];
    modules: Module[];
    lessons: Lesson[];
    enrollments: Enrollment[];
    materials: CourseMaterial[];
    instructors: Instructor[];

    // Course Actions
    addCourse: (course: Course) => void;
    updateCourse: (id: number, updates: Partial<Course>) => void;
    deleteCourse: (id: number) => void;
    getCourseById: (id: number) => Course | undefined;

    // Module Actions
    getModulesByCourseId: (courseId: number) => Module[];

    // Lesson Actions
    getLessonsByModuleId: (moduleId: number) => Lesson[];

    // Enrollment Actions
    getEnrollmentsByCourseId: (courseId: number) => Enrollment[];

    // Material Actions
    getMaterialsByCourseId: (courseId: number) => CourseMaterial[];

    // Instructor Actions
    getInstructorById: (id: string) => Instructor | undefined;

    // Stats
    getStats: () => {
        totalCourses: number;
        publishedCourses: number;
        draftCourses: number;
        closedCourses: number;
    };
}

const AulaVirtualContext = createContext<AulaVirtualContextType | undefined>(undefined);

// ========== CONSTANTS ==========
const STORAGE_KEY = 'aula_virtual_data';

// ========== PROVIDER ==========
interface AulaVirtualProviderProps {
    children: ReactNode;
}

export const AulaVirtualProvider: React.FC<AulaVirtualProviderProps> = ({ children }) => {
    // Initialize state from localStorage or use mock data
    const [courses, setCourses] = useState<Course[]>(() => {
        const stored = localStorage.getItem(`${STORAGE_KEY}_courses`);
        return stored ? JSON.parse(stored) : mockCourses;
    });

    const [modules] = useState<Module[]>(mockModules);
    const [lessons] = useState<Lesson[]>(mockLessons as unknown as Lesson[]);
    const [enrollments] = useState<Enrollment[]>(mockEnrollments as unknown as Enrollment[]);
    const [materials] = useState<CourseMaterial[]>(mockCourseMaterials);
    const [instructors] = useState<Instructor[]>(mockInstructors);

    // Persist courses to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_courses`, JSON.stringify(courses));
    }, [courses]);

    // ========== COURSE ACTIONS ==========
    const addCourse = (course: Course) => {
        setCourses(prev => [...prev, course]);
    };

    const updateCourse = (id: number, updates: Partial<Course>) => {
        setCourses(prev =>
            prev.map(course =>
                course.id === id
                    ? { ...course, ...updates, updatedAt: new Date().toISOString() }
                    : course
            )
        );
    };

    const deleteCourse = (id: number) => {
        setCourses(prev => prev.filter(course => course.id !== id));
    };

    const getCourseById = (id: number) => {
        return courses.find(course => course.id === id);
    };

    // ========== MODULE ACTIONS ==========
    const getModulesByCourseId = (courseId: number) => {
        return modules.filter(module => module.courseId === courseId);
    };

    // ========== LESSON ACTIONS ==========
    const getLessonsByModuleId = (moduleId: number) => {
        return lessons.filter(lesson => lesson.moduleId === moduleId);
    };

    // ========== ENROLLMENT ACTIONS ==========
    const getEnrollmentsByCourseId = (courseId: number) => {
        return enrollments.filter(enrollment => enrollment.courseId === courseId);
    };

    // ========== MATERIAL ACTIONS ==========
    const getMaterialsByCourseId = (courseId: number) => {
        return materials.filter(material => material.courseId === courseId);
    };

    // ========== INSTRUCTOR ACTIONS ==========
    const getInstructorById = (id: string) => {
        return instructors.find(instructor => instructor.id === id);
    };

    // ========== STATS ==========
    const getStats = () => {
        return {
            totalCourses: courses.length,
            publishedCourses: courses.filter(c => c.status === 'PUBLICADO').length,
            draftCourses: courses.filter(c => c.status === 'BORRADOR').length,
            closedCourses: courses.filter(c => c.status === 'CERRADO').length,
        };
    };

    const value: AulaVirtualContextType = {
        // State
        courses,
        modules,
        lessons,
        enrollments,
        materials,
        instructors,

        // Actions
        addCourse,
        updateCourse,
        deleteCourse,
        getCourseById,
        getModulesByCourseId,
        getLessonsByModuleId,
        getEnrollmentsByCourseId,
        getMaterialsByCourseId,
        getInstructorById,
        getStats,
    };

    return (
        <AulaVirtualContext.Provider value={value}>
            {children}
        </AulaVirtualContext.Provider>
    );
};

// ========== HOOK ==========
export const useAulaVirtual = () => {
    const context = useContext(AulaVirtualContext);
    if (!context) {
        throw new Error('useAulaVirtual must be used within an AulaVirtualProvider');
    }
    return context;
};
