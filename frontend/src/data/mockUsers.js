/**
 * MOCK_USERS - ÚNICA FUENTE DE VERDAD PARA USUARIOS
 * 
 * Este archivo contiene TODOS los usuarios del sistema.
 * Cualquier operación CRUD de usuarios debe hacerse aquí.
 * 
 * Estructura de usuario:
 * - id: Identificador único
 * - email: Email (usado para login)
 * - password: Contraseña (cambiar en producción para superadmin)
 * - name: Nombre completo
 * - firstName, lastName: Nombres separados
 * - dni: Documento de identidad
 * - eventRoles: Array de roles en el evento ('organizador', 'asistente', 'jurado', 'ponente')
 * - profiles: Array de perfiles de acceso a secciones
 * - role, roles: Legacy (mantener por compatibilidad)
 * - isSuperAdmin: Flag para filtrar de listas (solo para superadmin)
 * - specialty, occupation, institution: Datos profesionales
 * - modality: Presencial, Virtual, Híbrido
 * - registrationType: presencial, presencial_certificado, virtual
 * - registrationDate, status, amount: Datos de inscripción
 */

export const MOCK_USERS = [
    // ============================================
    // SUPERADMINISTRADOR (NO APARECE EN LISTAS)
    // ============================================
    {
        id: 'superadmin-1',
        email: 'admin@simr.pe',
        password: 'admin', // CAMBIAR EN PRODUCCIÓN
        name: 'Super Usuario',
        firstName: 'Super',
        lastName: 'Usuario',
        dni: '00000000',

        // Nuevos campos
        eventRoles: ['organizador'],
        profiles: ['organizacion', 'secretaria', 'investigacion', 'jurado', 'trabajos',
            'aula_virtual', 'contabilidad', 'asistencia', 'academico', 'perfil_basico'],
        isSuperAdmin: true, // FLAG PARA FILTRAR

        // Legacy

        specialty: 'Administración',
        occupation: 'Administrador del Sistema',
        institution: 'SIMR 2026',
        modality: 'Virtual',
        registrationType: 'virtual',
        registrationDate: '2024-01-01',
        status: 'Confirmado',
        amount: 0,
        image: null
    },

    // ============================================
    // USUARIOS NORMALES (MIGRADOS DE MOCK_ATTENDEES)
    // ============================================
    {
        id: 'user-1',
        email: 'juan.perez@example.com',
        password: '123456',
        name: 'Dr. Juan Perez',
        firstName: 'Juan',
        lastName: 'Perez',
        dni: '12345678',

        eventRoles: ['ponente', 'asistente'],
        profiles: ['aula_virtual', 'trabajos', 'perfil_basico'], // Presencial sin certificado
        isSuperAdmin: false,


        occupation: 'Especialista',
        institution: 'Hospital Rebagliati',
        modality: 'Presencial',
        registrationType: 'presencial',
        registrationDate: '2025-10-15',
        status: 'Confirmado',
        amount: 120,
        cmp: '12345',
        grade: 18,
        attendancePercentage: 90,
        certificationApproved: true,
        image: null
    },
    {
        id: 'user-2',
        email: 'maria.rodriguez@example.com',
        password: '123456',
        name: 'Dra. Maria Rodriguez',
        firstName: 'Maria',
        lastName: 'Rodriguez',
        dni: '87654321',

        eventRoles: ['asistente'],
        profiles: ['aula_virtual', 'trabajos', 'perfil_basico'], // Híbrido = tiene aula virtual
        isSuperAdmin: false,


        occupation: 'Residente',
        institution: 'INCN',
        modality: 'Hibrido',
        registrationType: 'presencial_certificado',
        registrationDate: '2025-10-16',
        status: 'Confirmado',
        amount: 50,
        cmp: '54321',
        grade: 16,
        attendancePercentage: 85,
        certificationApproved: false,
        image: null
    },
    {
        id: 'user-3',
        email: 'carlos.gomez@example.com',
        password: '123456',
        name: 'Dr. Carlos Gomez',
        firstName: 'Carlos',
        lastName: 'Gomez',
        dni: '11223344',

        eventRoles: ['ponente'],
        profiles: ['aula_virtual', 'perfil_basico'],
        isSuperAdmin: false,


        occupation: 'Especialista',
        institution: 'Mayo Clinic',
        modality: 'Presencial',
        registrationType: 'presencial_certificado',
        registrationDate: '2025-10-10',
        status: 'Confirmado',
        amount: 0,
        cmp: '67890',
        grade: 12,
        attendancePercentage: 30,
        certificationApproved: false,
        image: null
    },
    {
        id: 'user-4',
        email: 'ana.lopez@example.com',
        password: '123456',
        name: 'Est. Ana Lopez',
        firstName: 'Ana',
        lastName: 'Lopez',
        dni: '44332211',

        eventRoles: ['asistente'],
        profiles: ['perfil_basico'],
        isSuperAdmin: false,


        occupation: 'Estudiante',
        institution: 'UNMSM',
        modality: 'Presencial',
        registrationType: 'presencial',
        registrationDate: '2025-10-18',
        status: 'Pendiente',
        amount: 30,
        cmp: null,
        grade: 14,
        attendancePercentage: 75,
        certificationApproved: false,
        image: null
    },
    {
        id: 'user-5',
        email: 'luis.torres@example.com',
        password: '123456',
        name: 'Dr. Luis Torres',
        firstName: 'Luis',
        lastName: 'Torres',
        dni: '55667788',

        eventRoles: ['jurado', 'asistente'],
        profiles: ['jurado', 'aula_virtual', 'perfil_basico'],
        isSuperAdmin: false,


        occupation: 'Especialista',
        institution: 'Cayetano Heredia',
        modality: 'Presencial',
        registrationType: 'presencial_certificado',
        registrationDate: '2025-10-12',
        status: 'Confirmado',
        amount: 0,
        cmp: '98765',
        grade: null,
        attendancePercentage: 100,
        certificationApproved: false,
        image: null
    },
    {
        id: 'user-6',
        email: 'sofia.mendez@example.com',
        password: '123456',
        name: 'Dra. Sofia Mendez',
        firstName: 'Sofia',
        lastName: 'Mendez',
        dni: '99887766',

        eventRoles: ['organizador'],
        profiles: ['organizacion', 'secretaria', 'aula_virtual', 'trabajos', 'perfil_basico'],
        isSuperAdmin: false,


        occupation: 'Residente',
        institution: 'INCN',
        modality: 'Presencial',
        registrationType: 'presencial_certificado',
        registrationDate: '2025-09-01',
        status: 'Confirmado',
        amount: 0,
        cmp: '13579',
        grade: null,
        attendancePercentage: 100,
        certificationApproved: false,
        image: null
    },
    {
        id: 'user-7',
        email: 'pedro.castillo@example.com',
        password: '123456',
        name: 'Dr. Pedro Castillo',
        firstName: 'Pedro',
        lastName: 'Castillo',
        dni: '22334455',

        eventRoles: ['ponente', 'asistente'],
        profiles: ['aula_virtual', 'trabajos', 'perfil_basico'],
        isSuperAdmin: false,

        role: 'Ponente',
        roles: ['participant', 'resident'],

        specialty: 'Neurocirugía',
        occupation: 'Especialista',
        institution: 'Hospital Loayza',
        modality: 'Hibrido',
        registrationType: 'presencial_certificado',
        registrationDate: '2025-10-20',
        status: 'Confirmado',
        amount: 120,
        cmp: '24680',
        grade: 19,
        attendancePercentage: 95,
        certificationApproved: true,
        image: null
    },
    {
        id: 'user-8',
        email: 'elena.quispe@example.com',
        password: '123456',
        name: 'Res. Elena Quispe',
        firstName: 'Elena',
        lastName: 'Quispe',
        dni: '66778899',

        eventRoles: ['asistente'],
        profiles: ['trabajos', 'perfil_basico'],
        isSuperAdmin: false,


        occupation: 'Residente',
        institution: 'Hospital 2 de Mayo',
        modality: 'Presencial',
        registrationType: 'presencial',
        registrationDate: '2025-10-21',
        status: 'Confirmado',
        amount: 50,
        cmp: '11223',
        grade: 15,
        attendancePercentage: 60,
        certificationApproved: false,
        justification: 'Guardia nocturna de emergencia el día 23.',
        justificationStatus: 'pending',
        image: null
    },
    {
        id: 'user-9',
        email: 'jorge.ruiz@example.com',
        password: '123456',
        name: 'Dr. Jorge Ruiz',
        firstName: 'Jorge',
        lastName: 'Ruiz',
        dni: '33445566',

        eventRoles: ['ponente', 'asistente'],
        profiles: ['aula_virtual', 'trabajos', 'perfil_basico'],
        isSuperAdmin: false,


        occupation: 'Especialista',
        institution: 'INCN',
        modality: 'Presencial',
        registrationType: 'presencial',
        registrationDate: '2025-10-22',
        status: 'Confirmado',
        amount: 120,
        cmp: '33445',
        grade: 17,
        attendancePercentage: 92,
        certificationApproved: true,
        image: null
    },
    {
        id: 'user-10',
        email: 'miguel.angel@example.com',
        password: '123456',
        name: 'Est. Miguel Angel',
        firstName: 'Miguel',
        lastName: 'Angel',
        dni: '77889900',

        eventRoles: ['asistente'],
        profiles: ['aula_virtual', 'perfil_basico'],
        isSuperAdmin: false,


        occupation: 'Estudiante',
        institution: 'UPCH',
        modality: 'Hibrido',
        registrationType: 'presencial_certificado',
        registrationDate: '2025-10-23',
        status: 'Confirmado',
        amount: 30,
        cmp: null,
        grade: 12,
        attendancePercentage: 88,
        certificationApproved: false,
        image: null
    },
    {
        id: 'user-11',
        email: 'carmen.lima@example.com',
        password: '123456',
        name: 'Dra. Carmen Lima',
        firstName: 'Carmen',
        lastName: 'Lima',
        dni: '44556677',

        eventRoles: ['asistente'],
        profiles: ['perfil_basico'],
        isSuperAdmin: false,


        occupation: 'Especialista',
        institution: 'INCN',
        modality: 'Presencial',
        registrationType: 'presencial',
        registrationDate: '2025-10-24',
        status: 'Confirmado',
        amount: 120,
        cmp: '55667',
        grade: 20,
        attendancePercentage: 100,
        certificationApproved: true,
        image: null
    },
    {
        id: 'user-12',
        email: 'roberto.paz@example.com',
        password: '123456',
        name: 'Dr. Roberto Paz',
        firstName: 'Roberto',
        lastName: 'Paz',
        dni: '88990011',

        eventRoles: ['ponente'],
        profiles: ['aula_virtual', 'perfil_basico'],
        isSuperAdmin: false,


        occupation: 'Especialista',
        institution: 'UCL London',
        modality: 'Hibrido',
        registrationType: 'presencial_certificado',
        registrationDate: '2025-10-11',
        status: 'Confirmado',
        amount: 0,
        cmp: '99001',
        grade: null,
        attendancePercentage: 100,
        certificationApproved: false,
        image: null
    },

    // ============================================
    // USUARIOS ADICIONALES DEL COMITÉ
    // ============================================
    {
        id: 'user-13',
        email: 'luciana.jara@incn.gob.pe',
        password: '123456',
        name: 'Dra. Luciana Jara',
        firstName: 'Luciana',
        lastName: 'Jara',
        dni: '11111111',

        eventRoles: ['organizador'],
        profiles: ['organizacion', 'academico', 'aula_virtual', 'trabajos', 'perfil_basico'],
        isSuperAdmin: false,


        occupation: 'Residente R3',
        institution: 'INCN',
        modality: 'Presencial',
        registrationType: 'presencial_certificado',
        registrationDate: '2024-01-01',
        status: 'Confirmado',
        amount: 0,
        cmp: '11111',
        image: null
    },
    {
        id: 'user-14',
        email: 'carlos.gutierrez@incn.gob.pe',
        password: '123456',
        name: 'Dr. Carlos Gutiérrez',
        firstName: 'Carlos',
        lastName: 'Gutiérrez',
        dni: '22222222',

        eventRoles: ['organizador'],
        profiles: ['organizacion', 'contabilidad', 'aula_virtual', 'trabajos', 'perfil_basico'],
        isSuperAdmin: false,


        occupation: 'Residente R2',
        institution: 'INCN',
        modality: 'Presencial',
        registrationType: 'presencial_certificado',
        registrationDate: '2024-01-01',
        status: 'Confirmado',
        amount: 0,
        cmp: '22222',
        image: null
    },
    {
        id: 'user-15',
        email: 'henderson.vasquez@incn.gob.pe',
        password: '123456',
        name: 'Dr. Henderson Vasquez',
        firstName: 'Henderson',
        lastName: 'Vasquez',
        dni: '33333333',

        eventRoles: ['organizador'],
        profiles: ['organizacion', 'secretaria', 'aula_virtual', 'trabajos', 'perfil_basico'],
        isSuperAdmin: false,


        occupation: 'Residente R1',
        institution: 'INCN',
        modality: 'Presencial',
        registrationType: 'presencial_certificado',
        registrationDate: '2024-01-01',
        status: 'Confirmado',
        amount: 0,
        cmp: '33333',
        image: null
    },
    // Nuevos Autores con Trabajos PENDIENTES (Rol: Asistente/Residente)
    {
        id: 'user-20',
        email: 'maria.gonzalez@incn.gob.pe',
        password: '123456',
        name: 'Dra. María González',
        firstName: 'María',
        lastName: 'González',
        dni: '44455566',
        eventRoles: ['asistente'],
        profiles: ['trabajos', 'perfil_basico'],
        isSuperAdmin: false,

        occupation: 'Residente R4',
        institution: 'INCN',
        modality: 'Presencial',
        registrationType: 'presencial',
        status: 'Confirmado'
    },
    {
        id: 'user-21',
        email: 'roberto.sanchez@incn.gob.pe',
        password: '123456',
        name: 'Dr. Roberto Sánchez',
        firstName: 'Roberto',
        lastName: 'Sánchez',
        dni: '55566677',
        eventRoles: ['asistente'],
        profiles: ['trabajos', 'perfil_basico'],
        isSuperAdmin: false,

        occupation: 'Residente R3',
        institution: 'INCN',
        modality: 'Presencial',
        registrationType: 'presencial',
        status: 'Confirmado'
    },
    {
        id: 'user-22',
        email: 'luis.fernandez@incn.gob.pe',
        password: '123456',
        name: 'Dr. Luis Fernández',
        firstName: 'Luis',
        lastName: 'Fernández',
        dni: '66677788',
        eventRoles: ['asistente'],
        profiles: ['trabajos', 'perfil_basico'],
        isSuperAdmin: false,

        occupation: 'Residente R4',
        institution: 'INCN',
        modality: 'Presencial',
        registrationType: 'presencial',
        status: 'Confirmado'
    },
    {
        id: 'user-23',
        email: 'carlos.ruiz@incn.gob.pe',
        password: '123456',
        name: 'Dr. Carlos Ruiz',
        firstName: 'Carlos',
        lastName: 'Ruiz',
        dni: '77788899',
        eventRoles: ['asistente'],
        profiles: ['trabajos', 'perfil_basico'],
        isSuperAdmin: false,

        occupation: 'Residente R2',
        institution: 'INCN',
        modality: 'Presencial',
        registrationType: 'presencial',
        status: 'Confirmado'
    },
    {
        id: 'user-24',
        email: 'ana.torres@incn.gob.pe',
        password: '123456',
        name: 'Dra. Ana Torres',
        firstName: 'Ana',
        lastName: 'Torres',
        dni: '88899900',
        eventRoles: ['ponente', 'asistente'],
        profiles: ['aula_virtual', 'trabajos', 'perfil_basico'],
        isSuperAdmin: false,

        occupation: 'Residente R1',
        institution: 'INCN',
        modality: 'Presencial',
        registrationType: 'presencial',
        status: 'Confirmado'
    },

    // Autores con Trabajos ACEPTADOS (Deben ser Ponentes)
    {
        id: 'user-25',
        email: 'maria.lopez@incn.gob.pe',
        password: '123456',
        name: 'Dra. Maria Lopez',
        firstName: 'Maria',
        lastName: 'Lopez',
        dni: '99900011',
        // YA PROMOVIDA A PONENTE
        eventRoles: ['ponente', 'asistente'],
        profiles: ['aula_virtual', 'trabajos', 'perfil_basico'],
        isSuperAdmin: false,

        occupation: 'Residente R1',
        institution: 'INCN',
        modality: 'Presencial',
        registrationType: 'presencial',
        status: 'Confirmado'
    }
];
