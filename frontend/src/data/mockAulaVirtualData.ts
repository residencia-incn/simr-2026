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
        enrolledStudents: 11,
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
        id: 10,
        courseId: 1,
        title: 'Día 1: Neurovasculares',
        description: 'Módulo intensivo sobre patología vascular',
        order: 2,
        status: 'PUBLICADO',
        duration: '1 día',
        isRequired: true,
        isSequential: true, // Enable sequential locking
    },
    {
        id: 11,
        courseId: 1,
        title: 'Día 2: Neuroinmunología',
        description: 'Enfoque en esclerosis múltiple y otras autoinmunes',
        order: 3,
        status: 'PUBLICADO',
        duration: '1 día',
        isRequired: true,
        isSequential: true, // Enable sequential locking
    },
];

// ========== LESSONS DATA ==========
export const mockLessons = [
    {
        id: 1,
        moduleId: 1,
        title: 'Bienvenida y Objetivos del Curso',
        type: 'VIDEO',
        duration: '05:20',
        order: 1,
        isRequired: true,
        status: 'PUBLICADO',
        videoId: 2,
        videoUrl: null, // Should use videoId lookup
        content: null,
        completedBy: [],
    },
    {
        id: 101,
        moduleId: 10, // Día 1
        title: 'Reumatología',
        type: 'VIDEO',
        duration: '1:49:17',
        order: 1,
        isRequired: true,
        status: 'PUBLICADO',
        videoId: 101, // LINKS TO VIDEO 101 in mockVideos
        videoUrl: null, // Crucial: No direct URL, forces lookup
        content: null,
        completedBy: [],
    },
    {
        id: 102,
        moduleId: 10,
        title: 'SIMR 2026 - Taller de Neuroimagen',
        type: 'VIDEO',
        duration: '4:35:54',
        order: 2,
        isRequired: false,
        status: 'PUBLICADO',
        videoId: 102,
        videoUrl: null,
        content: null,
        completedBy: [],
    },
    {
        id: 2,
        moduleId: 11, // Día 2
        title: 'Lectura: Historia Clínica Neurológica',
        type: 'LECTURA',
        duration: '15 min',
        order: 1,
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

// ========== READINGS DATA (from ReadingManagement) ==========
export const mockReadings = [
    {
        id: 1,
        title: 'Guía de Práctica Clínica en Epilepsia 2024',
        module: 'Módulo 1: Introducción',
        updatedAt: '12 May 2024',
        format: 'PDF',
        type: 'pdf',
        views: 124,
    },
    {
        id: 2,
        title: 'Atlas de Neuroanatomía Funcional (NIH)',
        module: 'Módulo 2: Neuroimagen',
        updatedAt: '05 May 2024',
        format: 'ENLACE',
        type: 'link',
        views: 89,
    },
    {
        id: 3,
        title: 'Caso Clínico: Esclerosis Múltiple Remitente',
        module: 'Módulo 3: Casos Interactivos',
        updatedAt: '28 Abr 2024',
        format: 'TEXTO',
        type: 'text',
        views: 215,
    },
    {
        id: 4,
        title: 'Manual de Farmacoterapia en Parkinson',
        module: 'Módulo 1: Introducción',
        updatedAt: '22 Abr 2024',
        format: 'PDF',
        type: 'pdf',
        views: 156,
    },
    {
        id: 5,
        title: 'Sociedad Española de Neurología - Artículos',
        module: 'Módulo 1: Introducción',
        updatedAt: '15 Abr 2024',
        format: 'ENLACE',
        type: 'link',
        views: 45,
    },
];

// ========== VIDEOS DATA (New) ==========
export const mockVideos = [
    {
        id: 1,
        title: 'Introducción a la Epilepsia Refractaria',
        description: 'Una visión general completa sobre el diagnóstico y manejo de la epilepsia refractaria en pacientes adultos.',
        courseId: 1,
        courseName: 'Diplomado en Neurología Clínica',
        category: 'Curso',
        specialty: 'Epilepsia',
        categoryColor: 'bg-indigo-100 text-indigo-700',
        speaker: 'Dr. Carlos Mendoza',
        duration: '45:12',
        date: '2023-10-12',
        thumbnail: 'https://img.freepik.com/free-photo/brain-scan-x-ray_53876-88746.jpg',
        sourceType: 'local',
        sourceUrl: '/videos/epilepsia-intro.mp4',
        status: 'LISTO',
        views: 1250,
        size: '450 MB'
    },
    {
        id: 101,
        title: 'Reumatología - Sesión Completa',
        description: 'Grabación completa de la sesión de Reumatología del Día 1.',
        courseId: 1,
        courseName: 'Neurología Clínica Avanzada',
        category: 'Congreso',
        specialty: 'Neuroinmunología',
        categoryColor: 'bg-red-100 text-red-700',
        speaker: 'Dr. Especialista',
        duration: '1:49:17',
        date: '2024-01-15',
        thumbnail: 'https://img.freepik.com/free-photo/rheumatology-concept_23-2148761405.jpg',
        sourceType: 'local', // Or youtube, but user said "local" is what they want to avoid as *source of truth* in lesson. Here in DB it's fine.
        sourceUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', // Dummy valid video
        status: 'LISTO',
        views: 50,
        size: '1.2 GB'
    },
    {
        id: 102,
        title: 'Taller de Neuroimagen - Sesión Tarde',
        description: 'Taller práctico de interpretación de neuroimágenes.',
        courseId: 1,
        courseName: 'Neurología Clínica Avanzada',
        category: 'Taller',
        specialty: 'Neuroimagen',
        categoryColor: 'bg-blue-100 text-blue-700',
        speaker: 'Dra. Radióloga',
        duration: '4:35:54',
        date: '2024-01-15',
        thumbnail: 'https://img.freepik.com/free-photo/mri-scan_23-2149245678.jpg',
        sourceType: 'youtube', // Mix it up
        sourceUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        status: 'LISTO',
        views: 12,
        size: '0 MB'
    },
    {
        id: 2,
        title: 'Manejo Agudo del ACV Isquémico',
        description: 'Protocolos actualizados para el manejo agudo, incluyendo trombolisis y trombectomía mecánica.',
        courseId: 2,
        courseName: 'Maestría en Stroke',
        category: 'Taller',
        specialty: 'Vascular',
        categoryColor: 'bg-purple-100 text-purple-700',
        speaker: 'Dra. Ana Patricia López',
        duration: '1:02:45',
        date: '2023-10-08',
        thumbnail: 'https://img.freepik.com/free-photo/doctor-explaining-diagnosis_23-2148761405.jpg',
        sourceType: 'youtube',
        sourceUrl: 'https://youtube.com/watch?v=example1',
        status: 'LISTO',
        views: 3420,
        size: '0 MB'
    },
    {
        id: 3,
        title: 'Farmacología de Nuevos Antiepilépticos',
        description: 'Revisión de los últimos fármacos aprobados y sus perfiles de seguridad.',
        courseId: 3,
        courseName: 'Actualización Farmacológica 2023',
        category: 'Webinar',
        specialty: 'Farmacia',
        categoryColor: 'bg-green-100 text-green-700',
        speaker: 'Dr. Roberto García',
        duration: '38:20',
        date: '2023-10-05',
        thumbnail: 'https://img.freepik.com/free-vector/video-player-template-flat-style_23-2147775537.jpg',
        sourceType: 'bunny',
        sourceId: 'video-guid-123',
        status: 'LISTO',
        views: 890,
        size: '0 MB'
    }
];

// ========== EXAMS DATA (New) ==========
export const mockExams = [
    {
        id: 1,
        title: 'Evaluación Módulo 1: Fundamentos',
        questions: 10,
        timeLimit: '20 min',
        type: 'Quiz',
    },
    {
        id: 2,
        title: 'Examen Parcial: Neuroanatomía',
        questions: 25,
        timeLimit: '45 min',
        type: 'Examen',
    },
    {
        id: 3,
        title: 'Autoevaluación: Farmacología',
        questions: 15,
        timeLimit: '30 min',
        type: 'Quiz',
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
