import {
    FileText,
    User,
    Users,
    AlertCircle,
    Clock,
    Mail
} from 'lucide-react';

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

export const EVENT_CONFIG = {
    startDate: "2026-10-22T09:00:00",
    specialties: ["Neurología", "Neuropediatría", "Neurocirugía"]
};

export const ACADEMIC_CONFIG = {
    titleWordLimit: 20,
    sections: [
        { id: 'introduction', label: 'Introducción', limit: 300, active: true },
        { id: 'objective', label: 'Objetivo', limit: 100, active: true },
        { id: 'methodology', label: 'Materiales y Métodos', limit: 400, active: true },
        { id: 'results', label: 'Resultados', limit: 400, active: true },
        { id: 'conclusions', label: 'Conclusiones', limit: 200, active: true }
    ],
    workTypes: ["Trabajo Original", "Reporte de Caso", "Revisión Sistemática"],
    declarations: [
        { id: 'd1', text: 'Declaración de Conflicto de Intereses', required: true },
        { id: 'd2', text: 'Aprobación de Comité de Ética', required: true }
    ]
};

export const MOCK_NEWS = [
    { id: 1, title: "Ampliación de fecha de envío", date: "20 Nov 2025", excerpt: "Se reciben abstracts hasta el 15 de Marzo." },
    { id: 2, title: "Confirmado Dr. García", date: "25 Nov 2025", excerpt: "Ponente internacional de Neurovascular confirmado." }
];

export const SPONSORS = [
    { name: "Universidad Nacional Mayor de San Marcos", logo: "UNMSM" },
    { name: "Colegio Médico del Perú", logo: "CMP" },
    { name: "Sociedad Peruana de Neurología", logo: "SPN" },
    { name: "Laboratorios NeuroPharma", logo: "LAB" }
];

export const COMMITTEE_DATA = [
    {
        role: "Presidenta",
        members: [
            { name: "Dra. Luciana Jara", year: "R2 Neurología", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200" }
        ]
    },
    {
        role: "Secretaría y Tesorería",
        members: [
            { name: "Dr. Carlos Gutiérrez", year: "R2 Neurología", img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200", subRole: "Secretario y Tesorero" }
        ]
    },
    {
        role: "Difusión",
        members: [
            { name: "Dr. Henderson Vasquez", year: "R2 Neurocirugía", img: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200" }
        ]
    },
    {
        role: "Comité Científico y Académico",
        members: [
            { name: "Dr. Luis Trujillo", year: "R2 Neurología", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200", subRole: "Director Científico" }
        ]
    },
    {
        role: "Auspicios y Relaciones Internacionales",
        members: [
            { name: "Dra. Luciana Jara", year: "R2 Neurología", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200" },
            { name: "Dr. Daniel Ospina", year: "R2 Neurología", img: "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=200" }
        ]
    },
    {
        role: "Logística y Finanzas",
        members: [
            { name: "Dra. Luciana Jara", year: "R2 Neurología", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200" },
            { name: "Dr. Daniel Ospina", year: "R2 Neurología", img: "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=200" }
        ]
    },
    {
        role: "Ponencias y Talleres",
        members: [
            { name: "Dr. Luis Trujillo", year: "R2 Neurología", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200" }
        ]
    }
];

export const PROGRAM_DATA = {
    day1: [
        { type: 'full', time: '08:00 - 09:00', title: 'Inscripción y Entrega de Credenciales', room: 'Hall Principal', color: 'bg-emerald-100 border-emerald-200 text-emerald-800' },
        { type: 'full', time: '09:00 - 09:30', title: 'Ceremonia de Inauguración', room: 'Auditorio Principal', color: 'bg-blue-100 border-blue-200 text-blue-800' },
        {
            type: 'split', time: '09:30 - 11:00', sessions: [
                { room: 0, title: 'Simposio: ACV Isquémico Agudo', speaker: 'Dr. Alejandro Rabinstein (USA)', color: 'bg-sky-50' },
                { room: 1, title: 'Taller: Neuroanatomía Quirúrgica', speaker: 'Dr. Rhoton Team', color: 'bg-purple-50' },
                { room: 2, title: 'Transmisión: Simposio ACV', speaker: 'Streaming en vivo', color: 'bg-gray-50' }
            ]
        },
        { type: 'full', time: '11:00 - 11:30', title: 'Coffee Break & Visita de Pósters', room: 'Patio Central', color: 'bg-orange-100 border-orange-200 text-orange-800' },
        {
            type: 'split', time: '11:30 - 13:00', sessions: [
                { room: 0, title: 'Mesa Redonda: Epilepsia Refractaria', speaker: 'Dra. Carmen Betancur', color: 'bg-sky-50' },
                { room: 1, title: 'Taller: Lectura de EEG para Residentes', speaker: 'Dr. Luis Trujillo', color: 'bg-purple-50' },
                { room: 2, title: 'Webinar: Genética en Epilepsia', speaker: 'Dra. Ana Maria', color: 'bg-gray-50' }
            ]
        }
    ],
    day2: [
        {
            type: 'split', time: '09:00 - 10:30', sessions: [
                { room: 0, title: 'Simposio: Neuroinfecciosas', speaker: 'Dr. Henderson Vasquez', color: 'bg-sky-50' },
                { room: 1, title: 'Taller: Doppler Transcraneal', speaker: 'Dr. Carlos Gutierrez', color: 'bg-purple-50' },
                { room: 2, title: 'Curso: Redacción Científica', speaker: 'Dra. Luciana Jara', color: 'bg-gray-50' }
            ]
        },
        { type: 'full', time: '10:30 - 11:00', title: 'Coffee Break', room: 'Patio Central', color: 'bg-orange-100 border-orange-200 text-orange-800' },
        {
            type: 'split', time: '11:00 - 13:00', sessions: [
                { room: 0, title: 'Presentación de Casos Clínicos R1', speaker: 'Residentes Neurología', color: 'bg-sky-50' },
                { room: 1, title: 'Discusión de Casos Neurocirugía', speaker: 'Residentes Neurocirugía', color: 'bg-purple-50' },
                { room: 2, title: 'Presentación Virtual Poster', speaker: 'Varios Autores', color: 'bg-gray-50' }
            ]
        }
    ],
    day3: [
        { type: 'full', time: '09:00 - 11:00', title: 'Concurso de Trabajos de Investigación (Final)', room: 'Auditorio Principal', color: 'bg-blue-100 border-blue-200 text-blue-800' },
        { type: 'full', time: '11:00 - 12:00', title: 'Clausura y Premiación', room: 'Auditorio Principal', color: 'bg-yellow-100 border-yellow-200 text-yellow-800' }
    ]
};

export const INITIAL_WORKS = [
    {
        id: "TRB-001",
        title: "Encefalitis Autoinmune: Serie de casos en INCN",
        author: "Dr. Juan Pérez (R2)",
        type: "Trabajo Original",
        specialty: "Neurología",
        status: "Aceptado",
        day: "Lunes 22",
        room: "Auditorio Principal",
        abstract: { intro: "...", methods: "...", results: "...", conclusions: "..." },
        scores: [4.5, 4.8, 5.0]
    },
    {
        id: "TRB-002",
        title: "Moya Moya en paciente pediátrico",
        author: "Dra. Maria Lopez (R1)",
        type: "Reporte de Caso",
        specialty: "Neuropediatría",
        status: "Observado",
        day: null,
        room: null,
        abstract: { intro: "...", methods: "...", results: "...", conclusions: "..." },
        scores: [3.5, 4.0],
        observations: "El resumen excede el límite de palabras en la introducción. Por favor corregir y ser más conciso con los objetivos."
    },
    {
        id: "TRB-003",
        title: "Uso de tPA en ACV isquémico extendido",
        author: "Dr. Carlos Ruiz (R2)",
        type: "Trabajo Original",
        specialty: "Neurología",
        status: "Aceptado",
        day: "Martes 23",
        room: "Sala 1",
        abstract: { intro: "...", methods: "...", results: "...", conclusions: "..." },
        scores: [4.2, 4.5, 4.3]
    },
    {
        id: "TRB-004",
        title: "Síndrome de Guillain-Barré atípico",
        author: "Dra. Ana Torres (R1)",
        type: "Reporte de Caso",
        specialty: "Neurología",
        status: "Aceptado",
        day: "Lunes 22",
        room: "Sala Virtual",
        abstract: { intro: "...", methods: "...", results: "...", conclusions: "..." },
        scores: [4.8, 4.9, 4.7]
    },
    {
        id: "TRB-005",
        title: "Revisión sistemática de tratamientos para ELA",
        author: "Dr. Pedro Castillo (R3)",
        type: "Revisión Sistemática",
        specialty: "Neurología",
        status: "Aceptado",
        day: "Miércoles 24",
        room: "Auditorio Principal",
        abstract: { intro: "...", methods: "...", results: "...", conclusions: "..." },
        scores: [4.0, 4.1, 3.9]
    },
    {
        id: "TRB-006",
        title: "Manifestaciones neurológicas de COVID-19",
        author: "Dr. Carlos Ruiz (R2)",
        type: "Revisión Sistemática",
        specialty: "Neurología",
        status: "Pendiente",
        day: null,
        room: null,
        abstract: { intro: "Pendiente de ...", methods: "...", results: "...", conclusions: "..." },
        scores: []
    },
    {
        id: "TRB-007",
        title: "Cirugía en epilepsia temporal mesial",
        author: "Dr. Carlos Ruiz (R2)",
        type: "Reporte de Caso",
        specialty: "Neurocirugía",
        status: "Observado",
        day: null,
        room: null,
        abstract: { intro: "...", methods: "...", results: "...", conclusions: "..." },
        scores: [],
        observations: "Favor aclarar la metodología quirúrgica empleada y ampliar la discusión sobre las complicaciones post-operatorias."
    }
];

export const INITIAL_GALLERY = [
    { id: 101, url: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&q=80&w=1200", title: "Inauguración SIMR 2025", year: 2025, category: "Ceremonia" },
    { id: 102, url: "https://images.unsplash.com/photo-1576091160550-2187d80a18f3?auto=format&fit=crop&q=80&w=1200", title: "Premiación R1 Neurología", year: 2024, category: "Premiación" },
    { id: 103, url: "https://images.unsplash.com/photo-1551818255-e6e10975bc17?auto=format&fit=crop&q=80&w=1200", title: "Ponencia Magistral Dr. Sato", year: 2025, category: "Académico" },
    { id: 104, url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1200", title: "Taller de Neuroimágenes", year: 2023, category: "Talleres" },
    { id: 105, url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1200", title: "Clausura y Compartir", year: 2024, category: "Social" },
];

export const INITIAL_POSTERS = [
    {
        id: "P-001",
        title: "Manifestaciones atípicas del Síndrome de Guillain-Barré: Reporte de 5 casos",
        author: "Dra. Ana Torres",
        coauthors: "Dr. L. Quispe, Dr. M. Benites",
        specialty: "Neurología",
        thumb: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=600",
        abstract: "Introducción: El SGB presenta variantes clínicas que dificultan el diagnóstico temprano...",
        institution: "INCN - Dpto. de Neuropatología"
    },
    {
        id: "P-002",
        title: "Eficacia de la dieta cetogénica en epilepsia refractaria infantil",
        author: "Dr. Carlos Mendez",
        coauthors: "Dra. P. Silva",
        specialty: "Neuropediatría",
        thumb: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600",
        abstract: "Introducción: La dieta cetogénica es una opción no farmacológica...",
        institution: "INCN - Unidad de Neuropediatría"
    },
    {
        id: "P-003",
        title: "Abordaje endoscópico de tumores de base de cráneo: Curva de aprendizaje",
        author: "Dr. Jorge Ruiz",
        coauthors: "Dr. A. Velasco",
        specialty: "Neurocirugía",
        thumb: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600",
        abstract: "Objetivo: Analizar tiempos quirúrgicos y complicaciones en los primeros 50 casos...",
        institution: "INCN - Dpto. de Neurocirugía"
    },
    {
        id: "P-004",
        title: "Neurocisticercosis racemosa: Hallazgos en RM 3 Tesla",
        author: "Dra. Elena Gomez",
        coauthors: "Dr. R. Alarcón",
        specialty: "Neurología",
        thumb: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&q=80&w=600",
        abstract: "Serie de casos mostrando la utilidad de secuencias FIESTA y SWI...",
        institution: "INCN - Unidad de Neuroimágenes"
    },
    {
        id: "P-005",
        title: "Calidad de vida en pacientes con Parkinson avanzado",
        author: "Dr. Victor Chan",
        coauthors: "-",
        specialty: "Neurología",
        thumb: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600",
        abstract: "Estudio transversal utilizando la escala PDQ-39 en 100 pacientes...",
        institution: "INCN - Movimientos Anormales"
    }
];

export const ADMIN_STATS = [
    { label: "Total Trabajos", val: "42", icon: FileText, color: "text-blue-700 bg-blue-100" },
    { label: "Jurados Activos", val: "15", icon: User, color: "text-purple-700 bg-purple-100" },
    { label: "Talleres", val: "85%", icon: Users, color: "text-green-700 bg-green-100" },
    { label: "Pendientes", val: "12", icon: AlertCircle, color: "text-orange-700 bg-orange-100" }
];

export const INITIAL_JURORS = [
    { id: 'J-001', name: 'Dr. Alejandro Rabinstein', specialty: 'Neurología', institution: 'Mayo Clinic', email: 'rabinstein@mayo.edu' },
    { id: 'J-002', name: 'Dr. Luis Trujillo', specialty: 'Neurología', institution: 'INCN', email: 'ltrujillo@incn.gob.pe' },
    { id: 'J-003', name: 'Dra. Carmen Betancur', specialty: 'Neuropediatría', institution: 'INCN', email: 'cbetancur@incn.gob.pe' },
    { id: 'J-004', name: 'Dr. Henderson Vasquez', specialty: 'Neurocirugía', institution: 'INCN', email: 'hvasquez@incn.gob.pe' },
    { id: 'J-005', name: 'Dr. Carlos Gutierrez', specialty: 'Neurología', institution: 'INCN', email: 'cgutierrez@incn.gob.pe' }
];
