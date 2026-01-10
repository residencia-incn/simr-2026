// Mock Data for Aula Virtual Module
// Base de datos local para desarrollo del módulo de Aula Virtual

// ========== COURSES DATA ==========
export const mockCourses = [
    {
        id: 1,
        title: 'Neurología Clínica Avanzada',
        slug: 'neurologia-clinica-avanzada',
        description: 'Este curso integral está diseñado para especialistas que buscan profundizar en las técnicas diagnósticas más recientes y los protocolos terapéuticos de vanguardia en la práctica neurológica actual.',
        longDescription: `Este curso integral está diseñado para especialistas que buscan profundizar en las técnicas diagnósticas más recientes y los protocolos terapéuticos de vanguardia en la práctica neurológica actual.

A lo largo de los módulos, exploraremos:
• Avances en neuroimagen funcional.
• Manejo terapéutico de patologías neurodegenerativas.
• Casos prácticos y discusión de dilemas diagnósticos.`,
        createdAt: '2023-10-12',
        updatedAt: '2024-01-15',
        status: 'PUBLICADO', // PUBLICADO, BORRADOR, CERRADO
        specialty: 'Neurología Clínica',
        category: 'Curso',
        difficulty: 'MEDIO', // BASICO, MEDIO, AVANZADO
        coverImage: '/images/courses/neurologia-clinica.jpg',
        coverGradient: 'from-teal-100 to-teal-300',
        enrolledStudents: 1240,
        rating: 4.8,
        totalRatings: 342,
        duration: '8 semanas',
        totalModules: 3,
        totalLessons: 24,
        certificateEnabled: true,
        instructorId: 'INST001',
        price: 0, // Gratis
    },
    {
        id: 2,
        title: 'Neuroimagen en Trauma',
        slug: 'neuroimagen-en-trauma',
        description: 'Curso especializado en técnicas de neuroimagen aplicadas al diagnóstico y seguimiento de traumatismos craneoencefálicos.',
        longDescription: 'Curso especializado en técnicas de neuroimagen aplicadas al diagnóstico y seguimiento de traumatismos craneoencefálicos. Incluye análisis de casos reales y protocolos de interpretación.',
        createdAt: '2023-11-05',
        updatedAt: '2023-11-05',
        status: 'BORRADOR',
        specialty: 'Neurología Clínica',
        category: 'Taller',
        difficulty: 'AVANZADO',
        coverImage: null,
        coverGradient: 'from-orange-100 to-orange-300',
        enrolledStudents: 0,
        rating: 0,
        totalRatings: 0,
        duration: '6 semanas',
        totalModules: 2,
        totalLessons: 16,
        certificateEnabled: false,
        instructorId: 'INST002',
        price: 0,
    },
    {
        id: 3,
        title: 'Farmacología del SNC',
        slug: 'farmacologia-del-snc',
        description: 'Estudio completo de fármacos que actúan sobre el sistema nervioso central, mecanismos de acción e interacciones.',
        longDescription: 'Estudio completo de fármacos que actúan sobre el sistema nervioso central, mecanismos de acción e interacciones farmacológicas.',
        createdAt: '2023-09-20',
        updatedAt: '2023-12-10',
        status: 'CERRADO',
        specialty: 'Farmacología',
        category: 'Curso',
        difficulty: 'MEDIO',
        coverImage: null,
        coverGradient: 'from-gray-100 to-gray-300',
        enrolledStudents: 850,
        rating: 4.5,
        totalRatings: 203,
        duration: '10 semanas',
        totalModules: 4,
        totalLessons: 32,
        certificateEnabled: true,
        instructorId: 'INST001',
        price: 0,
    },
    {
        id: 4,
        title: 'Neuropediatría Aplicada',
        slug: 'neuropediatria-aplicada',
        description: 'Abordaje integral de patologías neurológicas en población pediátrica, desde el diagnóstico hasta el tratamiento.',
        longDescription: 'Abordaje integral de patologías neurológicas en población pediátrica, desde el diagnóstico hasta el tratamiento. Incluye casos clínicos y protocolos actualizados.',
        createdAt: '2024-01-02',
        updatedAt: '2024-01-20',
        status: 'PUBLICADO',
        specialty: 'Pediatría',
        category: 'Congreso',
        difficulty: 'MEDIO',
        coverImage: null,
        coverGradient: 'from-green-100 to-green-300',
        enrolledStudents: 512,
        rating: 4.9,
        totalRatings: 156,
        duration: '7 semanas',
        totalModules: 3,
        totalLessons: 21,
        certificateEnabled: true,
        instructorId: 'INST003',
        price: 0,
    },
];

// ========== MODULES DATA ==========
export const mockModules = [
    {
        id: 1,
        courseId: 1,
        title: 'Introducción a la Neuropatología',
        description: 'Fundamentos básicos de la neuropatología moderna',
        order: 1,
        status: 'PUBLICADO',
        duration: '2 semanas',
        isRequired: true,
    },
    {
        id: 2,
        courseId: 1,
        title: 'Neuroimagen Avanzada',
        description: 'Técnicas de neuroimagen y su interpretación',
        order: 2,
        status: 'PUBLICADO',
        duration: '3 semanas',
        isRequired: true,
    },
    {
        id: 3,
        courseId: 1,
        title: 'Casos Clínicos Prácticos',
        description: 'Análisis de casos reales y resolución de dilemas diagnósticos',
        order: 3,
        status: 'PUBLICADO',
        duration: '3 semanas',
        isRequired: false,
    },
];

// ========== LESSONS DATA ==========
export const mockLessons = [
    {
        id: 1,
        moduleId: 1,
        title: 'Bienvenida y Objetivos del Curso',
        type: 'VIDEO', // VIDEO, LECTURA, QUIZ, TAREA
        duration: '05:20',
        order: 1,
        isRequired: true,
        status: 'PUBLICADO',
        videoUrl: 'https://example.com/videos/intro.mp4',
        content: null,
        completedBy: [],
    },
    {
        id: 2,
        moduleId: 1,
        title: 'Lectura: Historia Clínica Neurológica',
        type: 'LECTURA',
        duration: '15 min',
        order: 2,
        isRequired: false,
        status: 'PUBLICADO',
        videoUrl: null,
        content: 'Contenido de la lectura sobre historia clínica neurológica...',
        downloadUrl: '/files/historia-clinica.pdf',
        completedBy: [],
    },
];

// ========== COURSE ENROLLMENTS ==========
export const mockEnrollments = [
    {
        id: 1,
        courseId: 1,
        userId: 'USER001',
        userName: 'Dr. Alejandro Arriaga',
        userEmail: 'ale.arriaga@email.com',
        enrolledAt: '2024-05-12',
        progress: 85, // percentage
        averageGrade: 9.2,
        status: 'ACTIVO', // ACTIVO, COMPLETADO, SUSPENDIDO
        lastAccessAt: '2024-01-25',
        certificateIssued: false,
    },
    {
        id: 2,
        courseId: 1,
        userId: 'USER002',
        userName: 'Dra. María Sánchez',
        userEmail: 'm.sanchez@hospital.org',
        enrolledAt: '2024-05-08',
        progress: 100,
        averageGrade: 9.8,
        status: 'COMPLETADO',
        lastAccessAt: '2024-01-20',
        certificateIssued: true,
    },
    {
        id: 3,
        courseId: 1,
        userId: 'USER003',
        userName: 'Ricardo Castillo',
        userEmail: 'r.castillo.neuro@unit.edu.mx',
        enrolledAt: '2024-04-15',
        progress: 42,
        averageGrade: 7.5,
        status: 'ACTIVO',
        lastAccessAt: '2024-01-18',
        certificateIssued: false,
    },
    {
        id: 4,
        courseId: 1,
        userId: 'USER004',
        userName: 'Laura Ruiz',
        userEmail: 'l.ruiz.neuro@gmail.com',
        enrolledAt: '2024-05-02',
        progress: 12,
        averageGrade: 8.0,
        status: 'ACTIVO',
        lastAccessAt: '2024-01-15',
        certificateIssued: false,
    },
];

// ========== COURSE MATERIALS ==========
export const mockCourseMaterials = [
    {
        id: 1,
        courseId: 1,
        moduleId: 1,
        name: 'Guía de Examen Neurológico.pdf',
        type: 'PDF',
        size: '2.4 MB',
        uploadedAt: '2023-10-12',
        url: '/materials/guia-examen-neurologico.pdf',
        downloadCount: 1240,
    },
    {
        id: 2,
        courseId: 1,
        moduleId: 2,
        name: 'Atlas de Resonancia Magnética - Tomo I.pdf',
        type: 'PDF',
        size: '18.7 MB',
        uploadedAt: '2023-10-14',
        url: '/materials/atlas-rm-tomo1.pdf',
        downloadCount: 856,
    },
    {
        id: 3,
        courseId: 1,
        moduleId: 3,
        name: 'Casos de Estudio: Esclerosis Múltiple.docx',
        type: 'DOCX',
        size: '1.2 MB',
        uploadedAt: '2023-10-15',
        url: '/materials/casos-esclerosis-multiple.docx',
        downloadCount: 432,
    },
    {
        id: 4,
        courseId: 1,
        moduleId: 1,
        name: 'Tabla de Dosis Farmacológicas.xlsx',
        type: 'XLSX',
        size: '0.5 MB',
        uploadedAt: '2023-10-18',
        url: '/materials/tabla-dosis.xlsx',
        downloadCount: 987,
    },
];

// ========== INSTRUCTORS DATA ==========
export const mockInstructors = [
    {
        id: 'INST001',
        name: 'Dr. Carlos Mendoza',
        email: 'carlos.mendoza@hospital.com',
        specialty: 'Neurología',
        title: 'Jefe de Servicio de Neurología',
        bio: 'Especialista en neurología con más de 15 años de experiencia.',
        avatar: '/avatars/instructor1.jpg',
        coursesCount: 2,
    },
    {
        id: 'INST002',
        name: 'Dra. Ana Patricia López',
        email: 'ana.lopez@hospital.com',
        specialty: 'Neuroimagen',
        title: 'Especialista en Neuroimagen',
        bio: 'Experta en técnicas avanzadas de neuroimagen.',
        avatar: '/avatars/instructor2.jpg',
        coursesCount: 1,
    },
    {
        id: 'INST003',
        name: 'Dr. Roberto García',
        email: 'roberto.garcia@hospital.com',
        specialty: 'Neuropediatría',
        title: 'Neuropediatra',
        bio: 'Especialista en neurología pediátrica con certificación internacional.',
        avatar: '/avatars/instructor3.jpg',
        coursesCount: 1,
    },
];

// ========== STATISTICS ==========
export const mockCourseStats = {
    totalCourses: 4,
    publishedCourses: 2,
    draftCourses: 1,
    closedCourses: 1,
    totalStudents: 2602,
    averageRating: 4.7,
    totalCertificates: 156,
};

// ========== HELPER FUNCTIONS ==========
export const getCourseById = (courseId: number) => {
    return mockCourses.find(course => course.id === courseId);
};

export const getModulesByCourseId = (courseId: number) => {
    return mockModules.filter(module => module.courseId === courseId);
};

export const getLessonsByModuleId = (moduleId: number) => {
    return mockLessons.filter(lesson => lesson.moduleId === moduleId);
};

export const getEnrollmentsByCourseId = (courseId: number) => {
    return mockEnrollments.filter(enrollment => enrollment.courseId === courseId);
};

export const getMaterialsByCourseId = (courseId: number) => {
    return mockCourseMaterials.filter(material => material.courseId === courseId);
};

export const getInstructorById = (instructorId: string) => {
    return mockInstructors.find(instructor => instructor.id === instructorId);
};

// Exportar todo como objeto por defecto
export default {
    courses: mockCourses,
    modules: mockModules,
    lessons: mockLessons,
    enrollments: mockEnrollments,
    materials: mockCourseMaterials,
    instructors: mockInstructors,
    stats: mockCourseStats,
    // Helper functions
    getCourseById,
    getModulesByCourseId,
    getLessonsByModuleId,
    getEnrollmentsByCourseId,
    getMaterialsByCourseId,
    getInstructorById,
};
