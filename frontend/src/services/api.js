import {
    PROGRAM_DATA,
    COMMITTEE_DATA,
    INITIAL_GALLERY,
    MOCK_NEWS,
    EVENT_CONFIG,
    SPONSORS,
    INITIAL_WORKS,
    INITIAL_JURORS,
    ACADEMIC_CONFIG,
    INITIAL_ROADMAP,
    INITIAL_COUPONS,
    INITIAL_TRANSACTIONS,
    INITIAL_BUDGETS,
    // New Treasury System
    INITIAL_ACCOUNTS,
    INITIAL_TRANSACTIONS_V2,
    INITIAL_CONTRIBUTION_PLAN,
    INITIAL_BUDGET_PLAN,
    TREASURY_CONFIG
} from '../data/mockData';
import { MOCK_ATTENDEES } from '../data/mockAttendees';
import { MOCK_USERS } from '../data/mockUsers';
import { storage, STORAGE_KEYS } from './storage';

// Helper for simulating async operations
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Asigna perfiles automáticamente según el tipo de inscripción
 * @param {string} registrationType - Tipo de inscripción: 'presencial', 'presencial_certificado', 'virtual'
 * @returns {string[]} Array de perfiles asignados
 */
const assignProfilesByRegistrationType = (registrationType) => {
    const baseProfiles = ['perfil_basico']; // Perfil básico para todos

    switch (registrationType) {
        case 'presencial':
            // Solo acceso a perfil básico (control de asistencia)
            return baseProfiles;

        case 'presencial_certificado':
            // Acceso a Aula Virtual + perfil básico
            return [...baseProfiles, 'aula_virtual'];

        case 'virtual':
            // Acceso a Aula Virtual + perfil básico
            return [...baseProfiles, 'aula_virtual'];

        default:
            return baseProfiles;
    }
};

// Default Data Constants
const DEFAULT_DAYS = [
    { id: 'day1', label: 'Día 1', date: 'Lunes 22' },
    { id: 'day2', label: 'Día 2', date: 'Martes 23' },
    { id: 'day3', label: 'Día 3', date: 'Miércoles 24' }
];

const DEFAULT_CATEGORIES = {
    income: ['Inscripciones', 'Patrocinio', 'Subvención', 'Donación', 'Otro'],
    expense: ['Logística', 'Honorarios', 'Alimentación', 'Transporte', 'Publicidad', 'Materiales', 'Otro']
};

/**
 * Helper to fetch users securely
 */
const getLocalUsers = () => {
    const users = storage.get(STORAGE_KEYS.USERS, MOCK_USERS);
    // FILTRAR SUPERADMIN de las listas
    return users.filter(u => !u.isSuperAdmin);
};

/**
 * Main API Service Module
 * Handles specific data operations using the storage utility
 */
export const api = {

    // --- Upload Service ---
    upload: {
        image: async (file) => {
            await delay(1000); // Simulate network delay
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        }
    },

    // --- 0. System Config ---
    system: {
        getConfig: async () => {
            await delay(100);
            return {
                occupations: EVENT_CONFIG.occupations,
                institutions: EVENT_CONFIG.institutions
            };
        }
    },

    // --- 1. Registrations ---
    registrations: {
        getAll: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.PENDING_REGISTRATIONS, []);
        },
        checkDuplicates: async (registration) => {
            await delay(300);
            const current = storage.get(STORAGE_KEYS.PENDING_REGISTRATIONS, []);
            const normalize = (str) => str ? str.toString().trim().toLowerCase() : '';

            const existingDni = current.find(r => normalize(r.dni) === normalize(registration.dni));
            if (existingDni) return { isDuplicate: true, field: 'dni', message: `El DNI ${registration.dni} ya se encuentra registrado.` };

            const existingEmail = current.find(r => normalize(r.email) === normalize(registration.email));
            if (existingEmail) return { isDuplicate: true, field: 'email', message: `El correo ${registration.email} ya se encuentra registrado.` };

            if (registration.cmp) {
                const existingCmp = current.find(r => normalize(r.cmp) === normalize(registration.cmp));
                if (existingCmp) return { isDuplicate: true, field: 'cmp', message: `El CMP ${registration.cmp} ya se encuentra registrado.` };
            }

            if (registration.rne) {
                const existingRne = current.find(r => normalize(r.rne) === normalize(registration.rne));
                if (existingRne) return { isDuplicate: true, field: 'rne', message: `El RNE ${registration.rne} ya se encuentra registrado.` };
            }

            return { isDuplicate: false };
        },
        add: async (registration) => {
            await delay();
            const current = storage.get(STORAGE_KEYS.PENDING_REGISTRATIONS, []);

            // Basic failsafe reuse of logic logic if needed, but we rely on checkDuplicates in UI.
            // Keeping minimal check here just in case.
            // ... (We could call checkDuplicates here too, but to avoid double delay/logic, let's keep the throw logic or assume UI handled it. 
            // For robustness, I'll leave the direct check I added previously, ensuring data integrity even if UI bypasses)

            // --- SIMULATED BACKEND VALIDATION REPEAT ---
            const normalize = (str) => str ? str.toString().trim().toLowerCase() : '';
            if (current.some(r => normalize(r.dni) === normalize(registration.dni))) throw new Error("Ya registrado.");
            // ------------------------------------------

            const newReg = {
                id: `REG-${Date.now()}`,
                timestamp: new Date().toISOString(),
                status: 'pending',
                ...registration
            };
            storage.set(STORAGE_KEYS.PENDING_REGISTRATIONS, [newReg, ...current]);
            return newReg;
        },
        remove: async (id) => {
            await delay();
            const current = storage.get(STORAGE_KEYS.PENDING_REGISTRATIONS, []);
            const updated = current.filter(r => r.id !== id);
            storage.set(STORAGE_KEYS.PENDING_REGISTRATIONS, updated);
            return true;
        }
    },

    // --- 2. Attendees ---
    attendees: {
        getAll: async () => {
            await delay();
            // SYNC: Turn Attendees into a view of Users
            return getLocalUsers();
        },
        add: async (attendee) => {
            await delay();
            const current = storage.get(STORAGE_KEYS.ATTENDEES, []);
            const updated = [attendee, ...current];
            storage.set(STORAGE_KEYS.ATTENDEES, updated);
            return attendee;
        },
        delete: async (id) => {
            await delay();
            const local = storage.get(STORAGE_KEYS.ATTENDEES, []);
            const updated = local.filter(a => a.id !== id);
            storage.set(STORAGE_KEYS.ATTENDEES, updated);
            return true;
        }
    },

    // --- 3. Treasury (Implementation merged with V2 block below) ---

    // --- 4. Program ---
    program: {
        getAll: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.PROGRAM, PROGRAM_DATA);
        },
        save: async (programData) => {
            await delay();
            storage.set(STORAGE_KEYS.PROGRAM, programData);
            window.dispatchEvent(new Event('program-updated'));
            return true;
        },
        getDays: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.PROGRAM_DAYS, DEFAULT_DAYS);
        },
        saveDays: async (days) => {
            await delay();
            storage.set(STORAGE_KEYS.PROGRAM_DAYS, days);
            window.dispatchEvent(new Event('program-days-updated'));
            return true;
        },
        getHalls: async () => {
            await delay();
            const defaultHalls = [
                { id: 'h1', name: 'Auditorio Principal' },
                { id: 'h2', name: 'Sala 1 (Talleres)' },
                { id: 'h3', name: 'Sala Virtual' }
            ];
            return storage.get(STORAGE_KEYS.PROGRAM_HALLS, defaultHalls);
        },

        saveHalls: async (halls) => {
            await delay();
            storage.set(STORAGE_KEYS.PROGRAM_HALLS, halls);
            return true;
        },
        getScheduleConfig: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.PROGRAM_SCHEDULE_CONFIG, {
                startTime: "08:00",
                endTime: "20:00",
                interval: 30
            });
        },
        saveScheduleConfig: async (config) => {
            await delay();
            storage.set(STORAGE_KEYS.PROGRAM_SCHEDULE_CONFIG, config);
            return true;
        }
    },

    // --- 5. Committee ---
    committee: {
        getAll: async () => {
            await delay();
            let data = storage.get(STORAGE_KEYS.COMMITTEE, COMMITTEE_DATA);

            // Self-healing: if any item lacks an ID, assign one and save
            if (data.some(d => !d.id)) {
                data = data.map((d, i) => ({
                    ...d,
                    id: d.id || `com-fixed-${Date.now()}-${i}`
                }));
                storage.set(STORAGE_KEYS.COMMITTEE, data);
            }
            return data;
        },
        save: async (committeeData) => {
            await delay();
            storage.set(STORAGE_KEYS.COMMITTEE, committeeData);
            window.dispatchEvent(new Event('committee-updated'));
            return true;
        }
    },

    // --- 6. Content ---
    content: {
        getGallery: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.GALLERY, INITIAL_GALLERY);
        },
        saveGallery: async (gallery) => {
            await delay();
            storage.set(STORAGE_KEYS.GALLERY, gallery);
            return true;
        },
        getNews: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.NEWS, MOCK_NEWS);
        },
        saveNews: async (newsList) => {
            await delay();
            storage.set(STORAGE_KEYS.NEWS, newsList);
            return true;
        },
        getSponsors: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.SPONSORS, SPONSORS);
        },
        saveSponsors: async (sponsorsList) => {
            await delay();
            storage.set(STORAGE_KEYS.SPONSORS, sponsorsList);
            return true;
        },
        getHeroSlides: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.HERO_SLIDES, null);
        },
        saveHeroSlides: async (slides) => {
            await delay();
            storage.set(STORAGE_KEYS.HERO_SLIDES, slides);
            window.dispatchEvent(new Event('hero-slides-updated'));
            return slides;
        },
        getConfig: async () => {
            await delay();
            const local = storage.get(STORAGE_KEYS.CONFIG, EVENT_CONFIG);
            return { ...EVENT_CONFIG, ...local };
        },
        saveConfig: async (config) => {
            await delay();
            storage.set(STORAGE_KEYS.CONFIG, config);
            window.dispatchEvent(new Event('config-updated'));
            return true;
        },
        getSpecialties: async () => {
            await delay();
            const config = storage.get(STORAGE_KEYS.CONFIG, EVENT_CONFIG);
            const mergedConfig = { ...EVENT_CONFIG, ...config };
            return mergedConfig.specialties || [];
        },
        getPrintConfig: async () => {
            await delay();
            const config = storage.get(STORAGE_KEYS.PRINT_CONFIG, {
                width: 9,
                height: 13,
                margin: 0.5,
                pageMargin: 1
            });
            return {
                width: parseFloat(config.width),
                height: parseFloat(config.height),
                margin: parseFloat(config.margin),
                pageMargin: parseFloat(config.pageMargin || 1)
            };
        },
        savePrintConfig: async (config) => {
            await delay();
            storage.set(STORAGE_KEYS.PRINT_CONFIG, config);
            return true;
        }
    },

    // --- 7. Works (Academic) ---
    works: {
        getAll: async () => {
            await delay();
            const local = storage.get(STORAGE_KEYS.WORKS, []);
            const allWorks = [...INITIAL_WORKS, ...local];
            const uniqueWorks = Array.from(new Map(allWorks.map(item => [item.id, item])).values());
            return uniqueWorks;
        },
        getById: async (id) => {
            await delay();
            const works = await api.works.getAll();
            return works.find(w => w.id === id);
        },
        update: async (updatedWork) => {
            await delay();
            const currentWorks = await api.works.getAll();
            const newWorks = currentWorks.map(w => w.id === updatedWork.id ? updatedWork : w);
            storage.set(STORAGE_KEYS.WORKS, newWorks);
            return updatedWork;
        },
        create: async (newWork) => {
            await delay();
            const work = {
                ...newWork,
                id: `TRB-${Date.now()}`,
                status: 'En Evaluación',
                scores: [],
                evaluations: [] // Initialize empty evaluations array
            };
            const local = storage.get(STORAGE_KEYS.WORKS, []);
            storage.set(STORAGE_KEYS.WORKS, [...local, work]);
            return work;
        },
        addEvaluation: async (workId, evaluation) => {
            await delay();
            const currentWorks = await api.works.getAll();
            const workIndex = currentWorks.findIndex(w => w.id === workId);

            if (workIndex === -1) throw new Error("Trabajo no encontrado");

            const work = currentWorks[workIndex];
            const evaluations = work.evaluations || [];

            // Check if juror already evaluated
            const existingEvalIndex = evaluations.findIndex(e => e.jurorId === evaluation.jurorId);

            if (existingEvalIndex >= 0) {
                // Update existing evaluation
                evaluations[existingEvalIndex] = { ...evaluation, updatedAt: new Date().toISOString() };
            } else {
                // Add new evaluation
                evaluations.push({ ...evaluation, createdAt: new Date().toISOString() });
            }

            // Calculate average score if needed (simple average of all evaluations)
            const allScores = evaluations.map(e => e.totalScore);
            const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;

            const updatedWork = {
                ...work,
                evaluations,
                scores: allScores, // Legacy compatibility
                averageScore: avgScore
            };

            // Update local storage
            const newWorks = [...currentWorks];
            newWorks[workIndex] = updatedWork;
            storage.set(STORAGE_KEYS.WORKS, newWorks);

            return updatedWork;
        }
    },

    // --- 8. Jurors (SYNCED WITH USERS) ---
    jurors: {
        getAll: async () => {
            await delay();
            const users = await api.users.getAll();
            // Filter users who have the 'jurado' role (in roles array or eventRoles)
            return users.filter(u => {
                const roles = u.eventRoles || [];
                // Check eventRoles (preferred) or legacy role/roles
                return roles.some(r => r.toLowerCase() === 'jurado') ||
                    (u.roles && u.roles.includes('jurado')) ||
                    u.role === 'jurado'; // Fallback
            }).map(u => ({
                ...u,
                active: u.status === 'Confirmado' || u.status === 'Activo' // Map status to active boolean for UI compatibility
            }));
        },
        create: async (jurorData) => {
            await delay();
            // Check if user exists by email
            const allUsers = await api.users.getAllIncludingSuperAdmin();
            const normalize = (str) => str ? str.toString().trim().toLowerCase() : '';
            const existingUser = allUsers.find(u => normalize(u.email) === normalize(jurorData.email));

            if (existingUser) {
                // Update existing user: Add 'jurado' to eventRoles and ensure profiles
                const currentRoles = existingUser.eventRoles || [];
                const currentProfiles = existingUser.profiles || [];

                const updates = {};

                // Add 'jurado' to system roles (user.roles) if missing
                const currentSystemRoles = existingUser.roles || [];
                const newSystemRoles = [...new Set([...currentSystemRoles, 'jurado'])];

                if (newSystemRoles.length !== currentSystemRoles.length) {
                    updates.roles = newSystemRoles;
                }

                // Add 'jurado' role if missing using SET to ensure uniqueness
                const newRoles = [...new Set([...currentRoles, 'jurado'])];
                if (newRoles.length !== currentRoles.length) {
                    updates.eventRoles = newRoles;
                }

                // Add required profiles if missing
                const requiredProfiles = ['perfil_basico', 'aula_virtual', 'jurado'];
                const newProfiles = [...new Set([...currentProfiles, ...requiredProfiles])];

                if (newProfiles.length !== currentProfiles.length) {
                    updates.profiles = newProfiles;
                }

                // FORCE PASSWORD RESET to '123456'
                // This is critical for users imported from lists (Attendees) who do not have a set password.
                // The Admin expects '123456' to work for anyone they add via this modal.
                updates.password = '123456';

                if (Object.keys(updates).length > 0) {
                    // Always update professional info if provided
                    const updatedUser = {
                        ...existingUser,
                        ...updates,
                        specialty: jurorData.specialty || existingUser.specialty,
                        institution: jurorData.institution || existingUser.institution
                    };
                    return await api.users.update(updatedUser);
                }
                return existingUser; // No changes needed
            } else {
                // Create new user with 'jurado' role and specific profiles
                return await api.users.add({
                    ...jurorData,
                    password: '123456', // Default as requested
                    eventRoles: ['jurado'],
                    profiles: ['perfil_basico', 'aula_virtual', 'jurado'], // Specific access rules
                    roles: ['participant', 'jurado'], // Default system role + jurado
                    role: 'participant',
                    status: 'Confirmado'
                });
            }
        },
        // Legacy save is removed as we now write to users
        delete: async (id) => {
            // To "delete" a juror, we actually just remove the role, don't delete the user
            await delay();
            const allUsers = await api.users.getAllIncludingSuperAdmin();
            const user = allUsers.find(u => u.id === id);
            if (user) {
                const newRoles = (user.eventRoles || []).filter(r => r.toLowerCase() !== 'jurado');
                await api.users.update({
                    ...user,
                    eventRoles: newRoles
                });
            }
            return true;
        }
    },

    // --- 9. Academic Config ---
    academic: {
        getConfig: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.ACADEMIC, ACADEMIC_CONFIG);
        },
        saveConfig: async (config) => {
            await delay();
            storage.set(STORAGE_KEYS.ACADEMIC, config);
            return true;
        }
    },

    // --- 10. Roadmap ---
    roadmap: {
        getAll: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.ROADMAP, INITIAL_ROADMAP);
        },
        save: async (roadmapData) => {
            await delay();
            storage.set(STORAGE_KEYS.ROADMAP, roadmapData);
            return true;
        },
        add: async (event) => {
            await delay();
            const current = storage.get(STORAGE_KEYS.ROADMAP, INITIAL_ROADMAP);
            const newEvent = { ...event, id: `ev-${Date.now()}` };
            const updated = [...current, newEvent];
            storage.set(STORAGE_KEYS.ROADMAP, updated);
            return newEvent;
        },
        update: async (event) => {
            await delay();
            const current = storage.get(STORAGE_KEYS.ROADMAP, INITIAL_ROADMAP);
            const updated = current.map(e => e.id === event.id ? event : e);
            storage.set(STORAGE_KEYS.ROADMAP, updated);
            return event;
        },
        delete: async (id) => {
            await delay();
            const current = storage.get(STORAGE_KEYS.ROADMAP, INITIAL_ROADMAP);
            const updated = current.filter(e => e.id !== id);
            storage.set(STORAGE_KEYS.ROADMAP, updated);
            return true;
        }
    },

    // --- 11. Coupons ---
    coupons: {
        getAll: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
        },
        create: async (coupon) => {
            await delay();
            const current = storage.get(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
            const newCoupon = { ...coupon, id: `cpn-${Date.now()}`, usedCount: 0 };
            storage.set(STORAGE_KEYS.COUPONS, [newCoupon, ...current]);
            return newCoupon;
        },
        delete: async (id) => {
            await delay();
            const current = storage.get(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
            const updated = current.filter(c => c.id !== id);
            storage.set(STORAGE_KEYS.COUPONS, updated);
            return true;
        },
        validate: async (code) => {
            await delay(500);
            const all = storage.get(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
            const coupon = all.find(c => c.code.toUpperCase() === code.toUpperCase());

            if (!coupon) throw new Error("Cupón no encontrado");
            if (!coupon.active) throw new Error("Cupón inactivo");
            if (new Date(coupon.expiry) < new Date()) throw new Error("Cupón expirado");
            if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) throw new Error("Este cupón ya ha alcanzado su límite de usos permitidos.");

            return coupon;
        },
        redeem: async (code) => {
            await delay();
            const all = storage.get(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
            const index = all.findIndex(c => c.code.toUpperCase() === code.toUpperCase());

            if (index !== -1) {
                const updated = [...all];
                updated[index] = { ...updated[index], usedCount: updated[index].usedCount + 1 };
                storage.set(STORAGE_KEYS.COUPONS, updated);
                return true;
            }
            return false;
        }
    },

    // --- 12. Users ---
    // --- 10. Users (CENTRALIZADO - ÚNICA FUENTE DE VERDAD) ---
    users: {
        /**
         * Obtiene todos los usuarios EXCEPTO el superadmin
         * Usar para listas, tablas, reportes, etc.
         */
        getAll: async () => {
            await delay();
            return getLocalUsers();
        },

        /**
         * Obtiene TODOS los usuarios incluyendo superadmin
         * Usar solo para login y operaciones internas
         */
        getAllIncludingSuperAdmin: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.USERS, MOCK_USERS);
        },

        /**
         * Buscar usuarios por nombre o email
         * NO incluye superadmin en resultados
         */
        search: async (query) => {
            await delay(200);
            if (!query || query.length < 2) return [];

            const q = query.toLowerCase();
            const users = await api.users.getAll(); // Ya filtra superadmin

            return users.filter(u =>
                u.name?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q)
            );
        },

        /**
         * Agregar nuevo usuario
         * Valida email duplicado
         */
        add: async (userData) => {
            await delay();
            const users = storage.get(STORAGE_KEYS.USERS, MOCK_USERS);
            const email = userData.email ? userData.email.trim() : '';

            // Validar email duplicado
            const existingUser = users.find(u => u.email === email);
            if (existingUser) {
                throw new Error('El email ya está registrado en el sistema');
            }

            const newUser = {
                id: `user-${Date.now()}`,
                password: '123456', // Default password
                eventRoles: userData.eventRoles || [userData.eventRole || 'asistente'],
                profiles: userData.profiles || ['perfil_basico'],
                role: userData.role || 'participant',
                roles: userData.roles || ['participant'],
                isSuperAdmin: false, // Nunca permitir crear superadmin
                registrationDate: new Date().toISOString().split('T')[0],
                status: 'Confirmado',
                ...userData,
                email: email // Ensure trimmed email
            };

            users.push(newUser);
            storage.set(STORAGE_KEYS.USERS, users);
            return newUser;
        },

        /**
         * Actualizar usuario existente
         */
        update: async (userData) => {
            await delay();
            const users = storage.get(STORAGE_KEYS.USERS, MOCK_USERS);
            const index = users.findIndex(u => u.id === userData.id);

            if (index === -1) {
                throw new Error('Usuario no encontrado');
            }

            const email = userData.email ? userData.email.trim() : users[index].email;

            // Validar email duplicado (excepto el mismo usuario)
            const duplicateEmail = users.find(u =>
                u.email === email && u.id !== userData.id
            );
            if (duplicateEmail) {
                throw new Error('El email ya está registrado en el sistema');
            }

            // No permitir cambiar isSuperAdmin
            // Ensure complexity objects are fully replaced if provided
            const updatedUser = {
                ...users[index],
                ...userData,
                email: email, // Ensure trimmed email
                eventRoles: userData.eventRoles || users[index].eventRoles, // Ensure specific fields are taken if provided
                profiles: userData.profiles || users[index].profiles,
                modules: userData.modules || users[index].modules || [], // Preserve modules array
                isSuperAdmin: users[index].isSuperAdmin // Mantener flag original
            };

            users[index] = updatedUser;
            storage.set(STORAGE_KEYS.USERS, users);

            return updatedUser;
        },

        /**
         * Eliminar usuario
         * PROHIBIDO eliminar superadmin
         */
        delete: async (userId) => {
            await delay();
            const users = storage.get(STORAGE_KEYS.USERS, MOCK_USERS);
            const user = users.find(u => u.id === userId);

            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // PROHIBIR eliminar superadmin
            if (user.isSuperAdmin) {
                throw new Error('No se puede eliminar el superadministrador del sistema');
            }

            const filtered = users.filter(u => u.id !== userId);
            storage.set(STORAGE_KEYS.USERS, filtered);

            return true;
        },

        /**
         * Resetear contraseña de usuario
         */
        resetPassword: async (userId) => {
            await delay();
            const users = storage.get(STORAGE_KEYS.USERS, MOCK_USERS);
            const index = users.findIndex(u => u.id === userId);

            if (index !== -1) {
                users[index].password = '123456';
                storage.set(STORAGE_KEYS.USERS, users);
            }

            return true;
        }
    },


    // --- 11. Planning & Task Management ---
    planning: {
        // Meetings
        getMeetings: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.PLANNING_MEETINGS, []);
        },
        saveMeeting: async (meeting) => {
            await delay();
            const meetings = storage.get(STORAGE_KEYS.PLANNING_MEETINGS, []);
            const existing = meetings.findIndex(m => m.id === meeting.id);

            if (existing >= 0) {
                meetings[existing] = { ...meeting, updatedAt: Date.now() };
            } else {
                meetings.push({
                    ...meeting,
                    id: meeting.id || `meeting-${Date.now()}`,
                    createdAt: Date.now()
                });
            }

            storage.set(STORAGE_KEYS.PLANNING_MEETINGS, meetings);
            return meeting;
        },
        deleteMeeting: async (id) => {
            await delay();
            const meetings = storage.get(STORAGE_KEYS.PLANNING_MEETINGS, []);
            const updated = meetings.filter(m => m.id !== id);
            storage.set(STORAGE_KEYS.PLANNING_MEETINGS, updated);

            // Also delete associated tasks
            const tasks = storage.get(STORAGE_KEYS.PLANNING_TASKS, []);
            const updatedTasks = tasks.filter(t => t.meetingId !== id);
            storage.set(STORAGE_KEYS.PLANNING_TASKS, updatedTasks);

            return true;
        },

        // Tasks
        getTasks: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.PLANNING_TASKS, []);
        },
        saveTask: async (task) => {
            await delay();
            const tasks = storage.get(STORAGE_KEYS.PLANNING_TASKS, []);
            const existing = tasks.findIndex(t => t.id === task.id);

            if (existing >= 0) {
                tasks[existing] = { ...task, updatedAt: Date.now() };
            } else {
                tasks.push({
                    ...task,
                    id: task.id || `task-${Date.now()}`,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                });
            }

            storage.set(STORAGE_KEYS.PLANNING_TASKS, tasks);
            return task;
        },
        deleteTask: async (id) => {
            await delay();
            const tasks = storage.get(STORAGE_KEYS.PLANNING_TASKS, []);
            const updated = tasks.filter(t => t.id !== id);
            storage.set(STORAGE_KEYS.PLANNING_TASKS, updated);
            return true;
        },
        updateTaskProgress: async (taskId, progress, comment, userId) => {
            await delay();
            const tasks = storage.get(STORAGE_KEYS.PLANNING_TASKS, []);
            const taskIndex = tasks.findIndex(t => t.id === taskId);

            if (taskIndex >= 0) {
                const task = tasks[taskIndex];
                task.progress = progress;
                task.updatedAt = Date.now();

                // Update status based on progress
                if (progress === 100) {
                    task.status = 'completed';
                } else if (progress > 0) {
                    task.status = 'in_progress';
                } else {
                    task.status = 'pending';
                }

                // Add comment if provided
                if (comment) {
                    if (!task.comments) task.comments = [];
                    task.comments.push({
                        userId,
                        text: comment,
                        timestamp: Date.now(),
                        progress
                    });
                }

                storage.set(STORAGE_KEYS.PLANNING_TASKS, tasks);
                return task;
            }

            throw new Error('Task not found');
        },
        getMyTasks: async (userId) => {
            await delay();
            const tasks = storage.get(STORAGE_KEYS.PLANNING_TASKS, []);
            return tasks.filter(t => t.assignedTo === userId);
        },

        // --- Attendance Management for Meetings ---

        /**
         * Get active meetings (today or next 24 hours)
         * Used by organizers to see which meetings they can mark attendance for
         */
        getActiveMeetings: async () => {
            await delay();
            const meetings = storage.get(STORAGE_KEYS.PLANNING_MEETINGS, []);
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            return meetings.filter(m => {
                if (m.status === 'closed') return false;

                // Parse meeting date and time
                const meetingDateTime = new Date(`${m.date}T${m.time || '00:00'}`);

                // Show meetings from today until tomorrow
                return meetingDateTime >= now && meetingDateTime <= tomorrow;
            });
        },

        /**
         * Mark attendance for a meeting
         * Only organizers can mark attendance
         */
        markAttendance: async (meetingId, userId, userName) => {
            await delay();
            const meetings = storage.get(STORAGE_KEYS.PLANNING_MEETINGS, []);
            const meetingIndex = meetings.findIndex(m => m.id === meetingId);

            if (meetingIndex === -1) {
                throw new Error('Reunión no encontrada');
            }

            const meeting = meetings[meetingIndex];

            // Check if meeting is closed
            if (meeting.status === 'closed') {
                throw new Error('No se puede marcar asistencia a una reunión cerrada');
            }

            // Initialize attendance array if it doesn't exist
            if (!meeting.attendance) {
                meeting.attendance = [];
            }

            // Check if user already marked attendance
            const existing = meeting.attendance.find(a => a.userId === userId);
            if (existing) {
                throw new Error('Ya has marcado asistencia a esta reunión');
            }

            // Add attendance record
            meeting.attendance.push({
                userId,
                userName,
                markedAt: new Date().toISOString(),
                status: 'pending' // pending, confirmed, rejected
            });

            meetings[meetingIndex] = meeting;
            storage.set(STORAGE_KEYS.PLANNING_MEETINGS, meetings);

            return meeting;
        },

        /**
         * Update attendance status (confirm or reject)
         * Only secretary can update attendance status
         */
        updateAttendanceStatus: async (meetingId, userId, status, confirmedBy) => {
            await delay();
            const meetings = storage.get(STORAGE_KEYS.PLANNING_MEETINGS, []);
            const meetingIndex = meetings.findIndex(m => m.id === meetingId);

            if (meetingIndex === -1) {
                throw new Error('Reunión no encontrada');
            }

            const meeting = meetings[meetingIndex];

            if (!meeting.attendance) {
                throw new Error('No hay registros de asistencia para esta reunión');
            }

            const attendanceIndex = meeting.attendance.findIndex(a => a.userId === userId);
            if (attendanceIndex === -1) {
                throw new Error('Registro de asistencia no encontrado');
            }

            // Update attendance status
            meeting.attendance[attendanceIndex] = {
                ...meeting.attendance[attendanceIndex],
                status, // 'confirmed' or 'rejected'
                confirmedBy,
                confirmedAt: new Date().toISOString()
            };

            meetings[meetingIndex] = meeting;
            storage.set(STORAGE_KEYS.PLANNING_MEETINGS, meetings);

            return meeting;
        },

        /**
         * Get participants of a meeting
         * Returns only confirmed attendees
         */
        getMeetingParticipants: async (meetingId) => {
            await delay();
            const meetings = storage.get(STORAGE_KEYS.PLANNING_MEETINGS, []);
            const meeting = meetings.find(m => m.id === meetingId);

            if (!meeting || !meeting.attendance) {
                return [];
            }

            // Return all attendance records (pending, confirmed, rejected)
            // UI will filter based on needs
            return meeting.attendance;
        }
    },

    // --- 12. Attendance ---
    attendance: {
        record: async (userId, type, timestamp = new Date().toISOString(), method = 'staff_scan') => {
            await delay();
            const attendance = storage.get(STORAGE_KEYS.ATTENDANCE, []);

            // Generate a unique ID for this record
            const id = `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const newRecord = {
                id,
                userId,
                type, // 'entry' or 'exit'
                timestamp,
                method // 'staff_scan' or 'self_scan'
            };

            storage.set(STORAGE_KEYS.ATTENDANCE, [newRecord, ...attendance]);
            return newRecord;
        },

        getStats: async () => {
            await delay();
            const attendance = storage.get(STORAGE_KEYS.ATTENDANCE, []);
            const users = await api.users.getAll();
            const registrations = await api.registrations.getAll(); // Assuming accepted registrations define total participants

            // Get today's start and end
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Filter today's records
            const todayRecords = attendance.filter(r => {
                const rDate = new Date(r.timestamp);
                return rDate >= today && rDate < tomorrow;
            });

            // Unique users present today (have at least one entry)
            const presentUserIds = new Set(
                todayRecords
                    .filter(r => r.type === 'entry')
                    .map(r => r.userId)
            );

            return {
                totalRegistered: users.length, // Or use registrations count
                todayPresent: presentUserIds.size,
                todayVirtual: 0, // Placeholder for future virtual attendance logic
                inPerson: presentUserIds.size,
                history: attendance
            };
        },

        getUserHistory: async (userId) => {
            await delay();
            const attendance = storage.get(STORAGE_KEYS.ATTENDANCE, []);
            return attendance.filter(r => r.userId === userId);
        },

        generateDayToken: async (dayId) => {
            await delay();
            const activeTokens = storage.get(STORAGE_KEYS.ATTENDANCE_TOKENS, {});

            // If exists and valid, return it, otherwise generate new
            // For simplicity, we regenerate or return existing. 
            // In a real app, this would change dynamically or be valid for specific timeframe.
            const token = `SIMR2026-${dayId}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

            activeTokens[dayId] = {
                token,
                generatedAt: new Date().toISOString()
            };

            storage.set(STORAGE_KEYS.ATTENDANCE_TOKENS, activeTokens);
            return token;
        },

        verifyDayToken: async (token) => {
            await delay();
            const activeTokens = storage.get(STORAGE_KEYS.ATTENDANCE_TOKENS, {});
            const dayId = Object.keys(activeTokens).find(key => activeTokens[key].token === token);
            return dayId ? true : false;
        }
    },

    // --- Treasury System ---
    treasury: {
        // Configuration
        getConfig: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.TREASURY_CONFIG, TREASURY_CONFIG);
        },

        saveConfig: async (config) => {
            await delay();
            storage.set(STORAGE_KEYS.TREASURY_CONFIG, config);
            return config;
        },

        // Accounts Management
        getAccounts: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.TREASURY_ACCOUNTS, INITIAL_ACCOUNTS);
        },

        addAccount: async (accountData) => {
            await delay();
            const accounts = storage.get(STORAGE_KEYS.TREASURY_ACCOUNTS, INITIAL_ACCOUNTS);
            const newAccount = {
                id: `acc-${Date.now()}`,
                saldo_actual: 0,
                createdAt: new Date().toISOString(),
                ...accountData
            };
            storage.set(STORAGE_KEYS.TREASURY_ACCOUNTS, [...accounts, newAccount]);
            return newAccount;
        },

        updateAccount: async (accountId, updates) => {
            await delay();
            const accounts = storage.get(STORAGE_KEYS.TREASURY_ACCOUNTS, INITIAL_ACCOUNTS);
            const updated = accounts.map(acc =>
                acc.id === accountId ? { ...acc, ...updates, updatedAt: new Date().toISOString() } : acc
            );
            storage.set(STORAGE_KEYS.TREASURY_ACCOUNTS, updated);
            return updated.find(acc => acc.id === accountId);
        },

        deleteAccount: async (accountId) => {
            await delay();
            const transactions = storage.get(STORAGE_KEYS.TREASURY_TRANSACTIONS_V2, INITIAL_TRANSACTIONS_V2);
            const hasTransactions = transactions.some(tx => tx.cuenta_id === accountId);

            if (hasTransactions) {
                throw new Error('No se puede eliminar una cuenta con transacciones asociadas');
            }

            const accounts = storage.get(STORAGE_KEYS.TREASURY_ACCOUNTS, INITIAL_ACCOUNTS);
            const updated = accounts.filter(acc => acc.id !== accountId);
            storage.set(STORAGE_KEYS.TREASURY_ACCOUNTS, updated);
            return true;
        },

        // Transactions V2
        getTransactionsV2: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.TREASURY_TRANSACTIONS_V2, INITIAL_TRANSACTIONS_V2);
        },

        addTransactionV2: async (transactionData) => {
            await delay();
            const transactions = storage.get(STORAGE_KEYS.TREASURY_TRANSACTIONS_V2, INITIAL_TRANSACTIONS_V2);
            const accounts = storage.get(STORAGE_KEYS.TREASURY_ACCOUNTS, INITIAL_ACCOUNTS);

            const account = accounts.find(acc => acc.id === transactionData.cuenta_id);
            if (!account) throw new Error('Cuenta no encontrada');

            const newTransaction = {
                id: `tx-${Date.now()}`,
                estado: 'validado',
                createdAt: new Date().toISOString(),
                ...transactionData
            };

            const updatedAccounts = accounts.map(acc =>
                acc.id === transactionData.cuenta_id
                    ? { ...acc, saldo_actual: acc.saldo_actual + transactionData.monto }
                    : acc
            );

            storage.set(STORAGE_KEYS.TREASURY_TRANSACTIONS_V2, [newTransaction, ...transactions]);
            storage.set(STORAGE_KEYS.TREASURY_ACCOUNTS, updatedAccounts);

            return newTransaction;
        },

        deleteTransactionV2: async (transactionId) => {
            await delay();
            const transactions = storage.get(STORAGE_KEYS.TREASURY_TRANSACTIONS_V2, INITIAL_TRANSACTIONS_V2);
            const accounts = storage.get(STORAGE_KEYS.TREASURY_ACCOUNTS, INITIAL_ACCOUNTS);

            const transaction = transactions.find(tx => tx.id === transactionId);
            if (!transaction) throw new Error('Transacción no encontrada');

            const updatedAccounts = accounts.map(acc =>
                acc.id === transaction.cuenta_id
                    ? { ...acc, saldo_actual: acc.saldo_actual - transaction.monto }
                    : acc
            );

            const updated = transactions.filter(tx => tx.id !== transactionId);
            storage.set(STORAGE_KEYS.TREASURY_TRANSACTIONS_V2, updated);
            storage.set(STORAGE_KEYS.TREASURY_ACCOUNTS, updatedAccounts);

            return true;
        },

        // Contribution Plan
        getContributionPlan: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.TREASURY_CONTRIBUTION_PLAN, INITIAL_CONTRIBUTION_PLAN);
        },

        initializeContributionPlan: async () => {
            await delay();
            const config = storage.get(STORAGE_KEYS.TREASURY_CONFIG, TREASURY_CONFIG);
            const committee = storage.get(STORAGE_KEYS.COMMITTEE, COMMITTEE_DATA);

            // NOTE: En el futuro, cuando todos los usuarios tengan eventRole,
            // esta función debería filtrar usuarios con eventRole === 'organizador'
            // en lugar de usar COMMITTEE_DATA directamente.
            // Ejemplo: const users = await api.users.getAll();
            //          const organizers = users.filter(u => u.eventRole === 'organizador');

            const allMembers = [];
            const seenNames = new Set();

            committee.forEach(group => {
                group.members.forEach(member => {
                    // Use name for duplicate detection instead of ID
                    if (!seenNames.has(member.name)) {
                        seenNames.add(member.name);
                        allMembers.push({
                            id: member.id,
                            nombre: member.name,
                            rol: group.role
                        });
                    }
                });
            });

            const plan = [];
            allMembers.forEach(member => {
                config.contribution.months.forEach(month => {
                    plan.push({
                        id: `contrib-${member.nombre}-${month.id}`,
                        organizador_id: member.id,
                        organizador_nombre: member.nombre,
                        organizador_rol: member.rol,
                        mes: month.id,
                        mes_label: month.label,
                        monto_esperado: config.contribution.monthlyAmount,
                        estado: 'pendiente',
                        transaccion_id: null,
                        deadline: month.deadline
                    });
                });
            });

            storage.set(STORAGE_KEYS.TREASURY_CONTRIBUTION_PLAN, plan);

            const totalExpected = allMembers.length * (config.contribution.months?.length || 0) * config.contribution.monthlyAmount;
            const budgetPlan = storage.get(STORAGE_KEYS.TREASURY_BUDGET_PLAN, INITIAL_BUDGET_PLAN);
            const updatedBudget = budgetPlan.map(item =>
                item.categoria === 'Aportes' ? { ...item, presupuestado: totalExpected } : item
            );
            storage.set(STORAGE_KEYS.TREASURY_BUDGET_PLAN, updatedBudget);

            return plan;
        },

        recordContribution: async (organizadorId, mes, accountId, amount, comprobante = null) => {
            await delay();
            const plan = storage.get(STORAGE_KEYS.TREASURY_CONTRIBUTION_PLAN, INITIAL_CONTRIBUTION_PLAN);
            const contrib = plan.find(c => c.organizador_id === organizadorId && c.mes === mes);

            if (!contrib) throw new Error('Aporte no encontrado en el plan');
            if (contrib.estado === 'pagado') throw new Error('Este aporte ya fue registrado');

            const transaction = {
                fecha: new Date().toISOString().split('T')[0],
                descripcion: `Aporte ${contrib.mes_label} - ${contrib.organizador_nombre}`,
                monto: amount,
                categoria: 'Aportes',
                cuenta_id: accountId,
                url_comprobante: comprobante,
                estado: 'validado'
            };

            const newTx = await api.treasury.addTransactionV2(transaction);

            const updatedPlan = plan.map(c =>
                c.id === contrib.id
                    ? { ...c, estado: 'pagado', transaccion_id: newTx.id, fecha_pago: newTx.fecha }
                    : c
            );
            storage.set(STORAGE_KEYS.TREASURY_CONTRIBUTION_PLAN, updatedPlan);

            return {
                contribution: updatedPlan.find(c => c.id === contrib.id),
                transaction: newTx
            };
        },

        // Budget Plan
        getBudgetPlan: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.TREASURY_BUDGET_PLAN, INITIAL_BUDGET_PLAN);
        },

        updateBudgetCategory: async (categoria, presupuestado) => {
            await delay();
            const budgetPlan = storage.get(STORAGE_KEYS.TREASURY_BUDGET_PLAN, INITIAL_BUDGET_PLAN);
            const updated = budgetPlan.map(item =>
                item.categoria === categoria ? { ...item, presupuestado } : item
            );
            storage.set(STORAGE_KEYS.TREASURY_BUDGET_PLAN, updated);
            return updated.find(item => item.categoria === categoria);
        },

        // Legacy Compatibility
        getTransactions: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.TREASURY, INITIAL_TRANSACTIONS);
        },

        addTransaction: async (tx) => {
            await delay();
            const current = await api.treasury.getTransactions();
            const newTx = {
                id: Date.now(),
                date: new Date().toISOString().split('T')[0],
                ...tx
            };
            storage.set(STORAGE_KEYS.TREASURY, [newTx, ...current]);
            return newTx;
        },

        deleteTransaction: async (id) => {
            await delay();
            const current = await api.treasury.getTransactions();
            const updated = current.filter(t => t.id !== id);
            storage.set(STORAGE_KEYS.TREASURY, updated);
            return true;
        },

        addIncome: async (amount, description, category, voucherData = null) => {
            return await api.treasury.addTransaction({
                type: 'income',
                amount: parseFloat(amount),
                description,
                category,
                url_comprobante: voucherData
            });
        },

        addExpense: async (amount, description, category) => {
            return await api.treasury.addTransaction({
                type: 'expense',
                amount: parseFloat(amount),
                description,
                category
            });
        },

        getStats: async () => {
            await delay();
            const transactions = await api.treasury.getTransactions();
            const manualIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
            const manualExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
            return {
                income: manualIncome,
                expense: manualExpense,
                balance: manualIncome - manualExpense
            };
        },

        getCategories: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.TREASURY_CATEGORIES, DEFAULT_CATEGORIES);
        },

        addCategory: async (type, category) => {
            await delay();
            const categories = storage.get(STORAGE_KEYS.TREASURY_CATEGORIES, DEFAULT_CATEGORIES);
            if (!categories[type].includes(category)) {
                categories[type].push(category);
                storage.set(STORAGE_KEYS.TREASURY_CATEGORIES, categories);
            }
            return categories;
        },

        renameCategory: async (type, oldName, newName) => {
            await delay();
            const categories = storage.get(STORAGE_KEYS.TREASURY_CATEGORIES, DEFAULT_CATEGORIES);

            // Validate: check if new name already exists
            if (categories[type].includes(newName)) throw new Error('Ya existe una categoría con ese nombre');

            // Find and replace
            const index = categories[type].indexOf(oldName);
            if (index !== -1) {
                categories[type][index] = newName;
                storage.set(STORAGE_KEYS.TREASURY_CATEGORIES, categories);
            }
            return categories;
        },

        deleteCategory: async (type, category) => {
            await delay();
            const categories = storage.get(STORAGE_KEYS.TREASURY_CATEGORIES, DEFAULT_CATEGORIES);
            categories[type] = categories[type].filter(c => c !== category);
            storage.set(STORAGE_KEYS.TREASURY_CATEGORIES, categories);
            return categories;
        },

        getBudgets: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.TREASURY_BUDGETS, INITIAL_BUDGETS);
        },

        updateBudget: async (budgets) => {
            await delay();
            storage.set(STORAGE_KEYS.TREASURY_BUDGETS, budgets);
            return budgets;
        }
    },

    // --- 13. Authentication ---
    // --- 13. Authentication ---
    auth: {
        login: async (email, password) => {
            await delay();
            const cleanEmail = email ? email.trim().toLowerCase() : '';

            // Buscar en base de datos centralizada (INCLUYE superadmin)
            const users = await api.users.getAllIncludingSuperAdmin();

            const user = users.find(u =>
                (u.email?.toLowerCase() === cleanEmail || u.email?.toLowerCase() === `${cleanEmail}@simr.pe`) &&
                u.password === password
            );

            if (user) {
                // Retornar usuario sin password
                const { password: _, ...userWithoutPassword } = user;
                return userWithoutPassword;
            }

            throw new Error('Credenciales inválidas');
        }
    }
};
