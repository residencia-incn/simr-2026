
export const SPECIALTIES_LIST = [
    "Neurovasculares",
    "Neuroinmunología",
    "Epilepsia",
    "Neuroinfectología",
    "Neuropediatría",
    "Neurodegenerativas",
    "Neurocirugía"
];

export const SPECIALTIES = ["Neurología", "Neuropediatría", "Neurocirugía"];
export const WORK_TYPES = ["Reporte de Caso", "Trabajo Original", "Revisión Sistemática"];
export const ROOMS = ["Auditorio Principal", "Sala 1 (Talleres)", "Sala Virtual"];

export const MODULE_CONFIG = {
    'mi_perfil': { label: 'Mi Perfil', description: 'Acceso a datos personales y certificado' },
    'organizacion': { label: 'Organización', description: 'Panel de control para organizadores' },
    'secretaria': { label: 'Secretaría', description: 'Gestión de inscripciones y usuarios' },
    'contabilidad': { label: 'Contabilidad', description: 'Gestión de pagos y presupuestos' },
    'investigacion': { label: 'Investigación', description: 'Gestión de trabajos académicos' },
    'jurado': { label: 'Jurado', description: 'Evaluación de trabajos' },
    'academico': { label: 'Académico', description: 'Gestión de cursos y contenido' },
    'aula_virtual': { label: 'Aula Virtual', description: 'Acceso a cursos y exámenes' },
    'asistencia': { label: 'Asistencia', description: 'Control de accesos y admisiones' },
    'trabajos': { label: 'Mis Trabajos', description: 'Envío de trabajos de investigación' }
};

export const EVENT_ROLES = {
    ORGANIZER: 'organizador',
    ATTENDEE: 'asistente',
    JURY: 'jurado',
    SPEAKER: 'ponente'
};

export const EVENT_ROLE_LABELS = {
    organizador: 'Organizador (Staff)',
    asistente: 'Asistente',
    jurado: 'Jurado',
    ponente: 'Ponente'
};

export const SYSTEM_PROFILES = {
    BASIC: 'mi_perfil',
    ORGANIZATION: 'organizacion',
    SECRETARY: 'secretaria',
    RESEARCH: 'investigacion',
    JURY: 'jurado',
    WORKS: 'trabajos',
    VIRTUAL_CLASSROOM: 'aula_virtual',
    TREASURY: 'contabilidad',
    ATTENDANCE: 'asistencia',
    ACADEMIC: 'academico'
};

export const PROFILE_LABELS = {
    mi_perfil: 'Mi Perfil',
    organizacion: 'Organización',
    secretaria: 'Secretaría',
    investigacion: 'Investigación',
    jurado: 'Jurado',
    trabajos: 'Trabajos',
    aula_virtual: 'Aula Virtual',
    contabilidad: 'Contabilidad',
    asistencia: 'Asistencia',
    academico: 'Académico'
};

export const REGISTRATION_TYPES = {
    PRESENCIAL: 'presencial',
    PRESENCIAL_CERTIFICADO: 'presencial_certificado',
    VIRTUAL: 'virtual'
};

export const EVENT_CONFIG = {
    year: "2026",
    startDate: "2026-10-22",
    duration: 3,
    schedule: [
        { day: 1, open: "08:00", close: "18:00" },
        { day: 2, open: "09:00", close: "18:00" },
        { day: 3, open: "09:00", close: "13:00" }
    ],
    specialties: ["Neurología", "Neuropediatría", "Neurocirugía"],
    participantSpecialties: ["Neurología", "Neurocirugía", "Psiquiatría", "Medicina Interna", "Pediatría", "Medicina Intensiva", "Otro"],
    occupations: ["Médico Especialista", "Médico General", "Médico Residente", "Estudiante de Medicina", "Otro"],
    institutions: ["INCN", "Hospital Almenara", "Hospital Rebagliati", "Hospital Loayza", "Hospital Dos de Mayo", "Hospital Cayetano Heredia", "Instituto Nacional de Salud del Niño", "Clinica Delgado", "Clinica San Felipe", "Otro"],
    residencyYears: ["R1", "R2", "R3", "R4", "R5"],
    eventAcronym: "SIMR 2026",
    eventType: "Híbrido",
    showHeroCountdown: true,
    credits: {
        presencialValue: "5.0 Créditos",
        virtualValue: "2.0 Créditos",
        resolution: "Resolución Nº 0285-22 SISTCERE/CMP",
        points: "5"
    },
    contact: {
        phone: "999 888 777",
        email: "inscripciones@simr.pe"
    }
};

export const PROGRAM_CONFIG = {
    days: [
        { id: 1, label: 'Día 1', date: '2026-06-22', active: true },
        { id: 2, label: 'Día 2', date: '2026-06-23', active: true },
        { id: 3, label: 'Día 3', date: '2026-06-24', active: true },
        { id: 4, label: 'Día 4', date: '2026-06-25', active: true },
        { id: 5, label: 'Día 5', date: '2026-06-26', active: true }
    ],
    timeSlots: [
        { id: 'ts1', start: '08:00', end: '09:00', label: '08:00 - 09:00' },
        { id: 'ts2', start: '09:00', end: '10:00', label: '09:00 - 10:00' },
        { id: 'ts3', start: '10:00', end: '11:00', label: '10:00 - 11:00' },
        { id: 'ts4', start: '11:00', end: '11:30', label: '11:00 - 11:30 (Break)' },
        { id: 'ts5', start: '11:30', end: '12:30', label: '11:30 - 12:30' },
        { id: 'ts6', start: '12:30', end: '13:30', label: '12:30 - 13:30' },
        { id: 'ts7', start: '15:00', end: '16:00', label: '15:00 - 16:00' },
        { id: 'ts8', start: '16:00', end: '17:00', label: '16:00 - 17:00' }
    ]
};

export const ACADEMIC_CONFIG = {
    titleWordLimit: 20,
    submissionDeadline: "2026-03-15T23:59",
    extensionDeadline: "2026-03-20T23:59",
    latePenalty: 2.0,
    workTypes: ["Trabajo Original", "Reporte de Caso", "Revisión Sistemática"],
    rooms: {
        physical: [
            { id: 'r1', name: 'Auditorio Principal' },
            { id: 'r2', name: 'Sala 1 (Talleres)' },
            { id: 'r3', name: 'Sala 2' }
        ],
        virtual: [
            { id: 'v1', name: 'Sala Virtual A' },
            { id: 'v2', name: 'Sala Virtual B' }
        ]
    }
};
