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
    income: ['Inscripciones', 'Aporte Mensual', 'Patrocinio', 'Subvención', 'Donación', 'Otro'],
    expense: ['Logística', 'Honorarios', 'Alimentación', 'Transporte', 'Publicidad', 'Materiales', 'Otro']
};

/**
 * Helper to fetch users securely
 */
const getLocalUsers = () => {
    let users = storage.get(STORAGE_KEYS.USERS, MOCK_USERS);

    // 1. Auto-sync with MOCK_USERS (Code updates)
    const missingMockUsers = MOCK_USERS.filter(mockUser => !users.find(u => u.id === mockUser.id));
    if (missingMockUsers.length > 0) {
        console.log(`[Auto-Sync] Adding ${missingMockUsers.length} missing mock users.`);
        users = [...users, ...missingMockUsers];
        storage.set(STORAGE_KEYS.USERS, users);
    }

    // 2. Migration: Sync legacy Attendees into Users (Data unification)
    // This ensures that if the user had attendees that weren't in the users list, they are merged.
    const legacyAttendees = storage.get(STORAGE_KEYS.ATTENDEES, []);
    const missingFromUsers = legacyAttendees.filter(att => {
        const email = (att.email || '').toLowerCase().trim();
        return email && !users.find(u => (u.email || '').toLowerCase().trim() === email);
    });

    if (missingFromUsers.length > 0 && !window.__migrationAttempted) {
        window.__migrationAttempted = true;
        console.log(`[Migration] Merging ${missingFromUsers.length} legacy attendees into master user list.`);
        const migratedUsers = missingFromUsers.map(att => ({
            id: att.id ? (String(att.id).startsWith('user-') ? att.id : `user-${att.id}`) : `user-mig-${Date.now()}-${Math.random()}`,
            name: att.name,
            email: (att.email || '').toLowerCase().trim(),
            password: '123456',
            eventRoles: att.eventRoles || [att.role || 'asistente'],
            profiles: ['perfil_basico'],
            registrationDate: att.date || att.registrationDate || new Date().toISOString().split('T')[0],
            status: att.status || 'Confirmado',
            ...att
        }));
        users = [...users, ...migratedUsers];
        const success = storage.set(STORAGE_KEYS.USERS, users);
        if (!success) {
            console.warn('[Migration] Failed to save migrated users to storage. Content might be too large.');
        }
    }

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

    // --- 0. Notifications ---
    notifications: {
        getAll: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.NOTIFICATIONS, []);
        },
        add: async (notification) => {
            await delay();
            const current = storage.get(STORAGE_KEYS.NOTIFICATIONS, []);
            const newNotification = {
                id: `NTF-${Date.now()}`,
                timestamp: new Date().toISOString(),
                read: false,
                ...notification
            };
            storage.set(STORAGE_KEYS.NOTIFICATIONS, [newNotification, ...current]);
            return newNotification;
        },
        markAsRead: async (id) => {
            await delay();
            const current = storage.get(STORAGE_KEYS.NOTIFICATIONS, []);
            const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
            storage.set(STORAGE_KEYS.NOTIFICATIONS, updated);
            return true;
        },
        clear: async () => {
            await delay();
            storage.set(STORAGE_KEYS.NOTIFICATIONS, []);
            return true;
        }
    },

    // --- 0.5 System Config ---
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

            // Notify Admins/Treasurers
            await api.notifications.add({
                type: 'registration',
                title: 'Nueva Inscripción',
                message: `Nueva solicitud de ${registration.name} esperando validación.`,
                link: '?view=admission-dashboard&role=asistencia&tab=verification',
                profiles: ['organizacion', 'contabilidad', 'secretaria']
            });

            return newReg;
        },
        remove: async (id) => {
            await delay();
            const current = storage.get(STORAGE_KEYS.PENDING_REGISTRATIONS, []);
            const updated = current.filter(r => r.id !== id);
            storage.set(STORAGE_KEYS.PENDING_REGISTRATIONS, updated);
            return true;
        },

        approve: async (reg) => {
            await delay();

            // 1. Create/Update User (SINGLE ENTRY POINT)
            const allUsers = await api.users.getAllIncludingSuperAdmin();
            const existingUser = allUsers.find(u => u.email === reg.email);

            let shouldHaveVirtualAccess = false;

            // Logic to determine virtual access
            if (reg.ticketType) {
                shouldHaveVirtualAccess = reg.ticketType !== 'presencial';
            } else {
                // Fallback using modality and certification flag
                const isVirtual = reg.modalidad && reg.modalidad.toLowerCase() === 'virtual';
                const wantsCert = reg.wantsCertification === true;
                shouldHaveVirtualAccess = isVirtual || wantsCert;
            }

            const assignedRoles = shouldHaveVirtualAccess ? ['participant'] : [];
            const assignedModules = shouldHaveVirtualAccess ? ['mi_perfil', 'aula_virtual'] : ['mi_perfil'];

            const userPayload = {
                id: existingUser ? existingUser.id : `user-${Date.now()}`,
                name: reg.name,
                firstName: reg.firstName || reg.name.split(' ')[0],
                lastName: reg.lastName || reg.name.split(' ').slice(1).join(' '),
                email: reg.email,
                dni: reg.dni,
                cmp: reg.cmp,
                rne: reg.rne,
                occupation: reg.occupation,
                specialty: reg.specialty,
                modality: reg.modalidad || reg.ticketType || 'presencial',
                amount: reg.amount,
                institution: reg.institution,
                registrationDate: reg.timestamp || reg.registrationDate || new Date().toISOString(),
                status: 'Confirmado',
                role: shouldHaveVirtualAccess ? 'participant' : 'user',
                roles: existingUser ? [...new Set([...(existingUser.roles || []), ...assignedRoles])] : assignedRoles,
                eventRoles: existingUser ? [...new Set([...(existingUser.eventRoles || []), 'asistente'])] : ['asistente'],
                modules: existingUser ? [...new Set([...(existingUser.modules || []), ...assignedModules])] : assignedModules,
                password: existingUser ? existingUser.password : '123456',
                voucherData: reg.voucherData,
                image: reg.img // Ensure image is preserved if present
            };

            if (existingUser) {
                await api.users.update(userPayload);
            } else {
                await api.users.add(userPayload);
            }

            // 2. Legacy: We NO LONGER need dedicated api.attendees.add here 
            // since Attendees.getAll now proxies to Users.getAll

            // 3. Add to Treasury Income
            await api.treasury.addIncome(reg.amount, `Inscripción: ${reg.name}`, 'Inscripciones', reg.voucherData);

            // 4. Remove from Pending
            await api.registrations.remove(reg.id);

            return true;
        }
    },

    // --- 2. Attendees (UNIFICADO CON USUARIOS) ---
    attendees: {
        getAll: async () => {
            // Proxies directly to unified users list
            return api.users.getAll();
        },
        add: async (attendee) => {
            // Proxies to users system
            return api.users.add({
                ...attendee,
                eventRoles: attendee.eventRoles || [attendee.role || 'asistente']
            });
        },
        delete: async (id) => {
            // Proxies to users system
            return api.users.delete(id);
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

            // Notify author if status changed to 'Observado'
            const previousWork = currentWorks.find(w => w.id === updatedWork.id);
            if (updatedWork.status === 'Observado' && (!previousWork || previousWork.status !== 'Observado')) {
                await api.notifications.add({
                    type: 'work_observation',
                    title: 'Trabajo Observado',
                    message: `Tu trabajo "${updatedWork.title}" ha sido observado. Por favor, realiza las correcciones.`,
                    link: '?view=resident-dashboard&role=trabajos&section=mis-trabajos',
                    userId: updatedWork.authorId
                });
            }

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
                id: userData.id || `user-${Date.now()}`,
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
                fecha: new Date().toISOString().split('T')[0],
                date: new Date().toISOString(),
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

            // Get all users and filter organizers
            const allUsers = await api.users.getAll();
            const organizers = allUsers.filter(u =>
                u.eventRole === 'organizador' ||
                u.eventRoles?.includes('organizador')
            );

            console.log('🔧 Inicializando plan de aportes con', organizers.length, 'organizadores');
            console.log('📋 IDs de organizadores:', organizers.map(o => ({ id: o.id, nombre: o.nombre })));

            const plan = [];
            organizers.forEach(organizer => {
                config.contribution.months.forEach(month => {
                    plan.push({
                        id: `contrib-${organizer.id}-${month.id}`,
                        organizador_id: organizer.id,
                        organizador_nombre: organizer.nombre || organizer.name || 'Sin nombre',
                        organizador_rol: organizer.eventRole || 'organizador',
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

            const totalExpected = organizers.length * (config.contribution.months?.length || 0) * config.contribution.monthlyAmount;
            const budgetPlan = storage.get(STORAGE_KEYS.TREASURY_BUDGET_PLAN, INITIAL_BUDGET_PLAN);
            const updatedBudget = budgetPlan.map(item =>
                item.categoria === 'Aporte Mensual' ? { ...item, presupuestado: totalExpected } : item
            );
            storage.set(STORAGE_KEYS.TREASURY_BUDGET_PLAN, updatedBudget);

            return plan;
        },

        recordContribution: async (organizadorId, mesIds, accountId, totalAmount, comprobante = null, isValidationRequest = false) => {
            await delay();
            const plan = storage.get(STORAGE_KEYS.TREASURY_CONTRIBUTION_PLAN, INITIAL_CONTRIBUTION_PLAN);
            const mesArray = Array.isArray(mesIds) ? mesIds : [mesIds];

            console.log('🔍 Buscando aportes para:', { organizadorId, mesIds: mesArray });

            // Find all matching contributions
            const targetContribs = plan.filter(c => c.organizador_id === organizadorId && mesArray.includes(c.mes));

            console.log('✅ Aportes encontrados:', targetContribs);

            if (targetContribs.length === 0) {
                console.error('❌ No se encontraron aportes. Detalles:', {
                    organizadorId,
                    mesIds: mesArray,
                    planLength: plan.length,
                    uniqueOrgIds: [...new Set(plan.map(c => c.organizador_id))]
                });
                throw new Error('Aportes no encontrados en el plan. Por favor, contacta al tesorero para inicializar tu plan de aportes.');
            }
            if (targetContribs.some(c => c.estado === 'pagado')) throw new Error('Uno o más aportes ya fueron registrados');

            // If it's a validation request (from organizer), we don't create a transaction yet
            if (isValidationRequest) {
                const updatedPlan = plan.map(c => {
                    if (c.organizador_id === organizadorId && mesArray.includes(c.mes)) {
                        return {
                            ...c,
                            estado: 'validando',
                            comprobante: comprobante,
                            voucheredAt: new Date().toISOString()
                        };
                    }
                    return c;
                });
                storage.set(STORAGE_KEYS.TREASURY_CONTRIBUTION_PLAN, updatedPlan);

                // Notify Treasurer about new voucher to validate
                const organizerName = targetContribs[0]?.organizador_nombre || 'Organizador';
                const mesLabels = targetContribs.map(c => c.mes_label).join(', ');
                await api.notifications.add({
                    type: 'contribution_validation',
                    title: 'Nuevo Comprobante para Validar',
                    message: `${organizerName} envió comprobante para ${mesLabels} (S/ ${totalAmount}).`,
                    link: `?view=treasurer-dashboard&role=contabilidad&tab=contributions&organizerId=${organizadorId}`,
                    profiles: ['contabilidad']
                });

                return { updatedPlan: targetContribs.map(c => ({ ...c, estado: 'validando', comprobante })) };
            }

            // Direct registration by Treasurer (creates transaction)
            let targetAccountId = accountId;
            if (!targetAccountId) {
                const config = await api.treasury.getConfig();
                targetAccountId = config?.contribution?.defaultContributionAccount;
                if (!targetAccountId) {
                    const accounts = await api.treasury.getAccounts();
                    if (accounts.length > 0) targetAccountId = accounts[0].id;
                }
            }

            if (!targetAccountId) throw new Error("No hay cuenta asignada para este aporte.");

            const mesLabels = targetContribs.map(c => c.mes_label).join(', ');
            const transaction = {
                fecha: new Date().toISOString().split('T')[0],
                descripcion: `Aporte ${mesLabels} - ${targetContribs[0].organizador_nombre}`,
                monto: totalAmount,
                categoria: 'Aporte Mensual',
                cuenta_id: targetAccountId,
                url_comprobante: comprobante,
                estado: 'validado',
                meses: mesArray // Keep track of which months this covers
            };

            const newTx = await api.treasury.addTransactionV2(transaction);

            const updatedPlan = plan.map(c => {
                if (c.organizador_id === organizadorId && mesArray.includes(c.mes)) {
                    return { ...c, estado: 'pagado', transaccion_id: newTx.id, fecha_pago: newTx.fecha, comprobante };
                }
                return c;
            });
            storage.set(STORAGE_KEYS.TREASURY_CONTRIBUTION_PLAN, updatedPlan);

            return {
                updatedMonths: targetContribs.map(c => ({ ...c, estado: 'pagado', transaccion_id: newTx.id })),
                transaction: newTx
            };
        },

        validateContribution: async (organizadorId, mesIds, accountId) => {
            await delay();
            const plan = storage.get(STORAGE_KEYS.TREASURY_CONTRIBUTION_PLAN, INITIAL_CONTRIBUTION_PLAN);
            const mesArray = Array.isArray(mesIds) ? mesIds : [mesIds];
            const targetContribs = plan.filter(c => c.organizador_id === organizadorId && mesArray.includes(c.mes));

            if (targetContribs.length === 0) throw new Error('Aportes no encontrados');

            // Use config for account if not provided
            let targetAccountId = accountId;
            if (!targetAccountId) {
                const config = await api.treasury.getConfig();
                targetAccountId = config?.contribution?.defaultContributionAccount;
            }
            if (!targetAccountId) {
                const accounts = await api.treasury.getAccounts();
                targetAccountId = accounts[0]?.id;
            }

            const totalAmount = targetContribs.reduce((sum, c) => sum + (c.monto_esperado || 0), 0);
            const mesLabels = targetContribs.map(c => c.mes_label).join(', ');

            const transaction = {
                fecha: new Date().toISOString().split('T')[0],
                descripcion: `Aporte Validado ${mesLabels} - ${targetContribs[0].organizador_nombre}`,
                monto: totalAmount,
                categoria: 'Aporte Mensual',
                cuenta_id: targetAccountId,
                url_comprobante: targetContribs[0].comprobante, // Use the first one (they should be grouped)
                estado: 'validado',
                meses: mesArray
            };

            const newTx = await api.treasury.addTransactionV2(transaction);

            const updatedPlan = plan.map(c => {
                if (c.organizador_id === organizadorId && mesArray.includes(c.mes)) {
                    return { ...c, estado: 'pagado', transaccion_id: newTx.id, fecha_pago: newTx.fecha };
                }
                return c;
            });
            storage.set(STORAGE_KEYS.TREASURY_CONTRIBUTION_PLAN, updatedPlan);

            return {
                transaction: newTx,
                updatedPlan
            };
        },

        rejectContribution: async (organizadorId, mesIds, reason) => {
            await delay();
            const plan = storage.get(STORAGE_KEYS.TREASURY_CONTRIBUTION_PLAN, INITIAL_CONTRIBUTION_PLAN);
            const mesArray = Array.isArray(mesIds) ? mesIds : [mesIds];

            // Revert status to 'pendiente'
            const updatedPlan = plan.map(c => {
                if (c.organizador_id === organizadorId && mesArray.includes(c.mes) && c.estado === 'validando') {
                    return {
                        ...c,
                        estado: 'pendiente',
                        comprobante: null,
                        voucheredAt: null
                    };
                }
                return c;
            });
            storage.set(STORAGE_KEYS.TREASURY_CONTRIBUTION_PLAN, updatedPlan);

            // Notify Organizer
            const organizerName = plan.find(c => c.organizador_id === organizadorId)?.organizador_nombre || 'Organizador';
            const mesLabels = plan.filter(c => mesArray.includes(c.mes)).map(c => c.mes_label).join(', ');

            await api.notifications.add({
                type: 'contribution_rejection',
                title: 'Comprobante Rechazado',
                message: `Tu comprobante para ${mesLabels} fue rechazado. ${reason ? `Motivo: ${reason}` : ''}`,
                link: `?view=tasks-dashboard&tab=payments`, // Adjust link as needed
                userId: organizadorId
            });

            return updatedPlan;
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
            await delay();
            const accounts = await api.treasury.getAccounts();
            if (accounts.length === 0) throw new Error("No hay cuentas disponibles para registrar el ingreso.");

            // Try to get confirmation from treasury config
            const config = await api.treasury.getConfig();
            const defaultAccountId = config?.contribution?.defaultInscriptionAccount;

            let targetAccountId = defaultAccountId;

            // Validate if configured account still exists
            if (targetAccountId && !accounts.find(a => a.id === targetAccountId)) {
                console.warn(`Configured default inscription account ${targetAccountId} not found. Falling back to first account.`);
                targetAccountId = null;
            }

            // Fallback to first account
            if (!targetAccountId) {
                targetAccountId = accounts[0].id;
            }

            return await api.treasury.addTransactionV2({
                type: 'income',
                monto: parseFloat(amount), // Map amount -> monto
                descripcion: description,  // Map description -> descripcion
                categoria: category,       // Map category -> categoria
                cuenta_id: targetAccountId,// Map accountId -> cuenta_id
                url_comprobante: voucherData
            });
        },

        addExpense: async (amount, description, category) => {
            // For expenses, we also need an account. Logic similar to income or just pick first/default?
            // Since this is usually manual or automated, let's pick first account if not specified (adding implicit account logic here)
            // But addExpense signature doesn't have accountId. We should update it or pick default.
            // For now, let's pick accounts[0] to be safe, assuming 'Caja Chica'.

            const accounts = await api.treasury.getAccounts();
            if (accounts.length === 0) throw new Error("No hay cuentas disponibles.");
            // Ideally should be configurable too, but for now fallback to first.
            const accountId = accounts[0].id;

            return await api.treasury.addTransactionV2({
                type: 'expense',
                monto: parseFloat(amount),
                descripcion: description,
                categoria: category,
                cuenta_id: accountId
            });
        },

        migrateLegacyData: async () => {
            await delay();
            const legacyTransactions = storage.get(STORAGE_KEYS.TREASURY, []);
            if (legacyTransactions.length === 0) return { migrated: 0, message: "No hay datos antiguos para migrar." };

            const currentV2 = await api.treasury.getTransactionsV2();
            const accounts = await api.treasury.getAccounts();
            const defaultAccount = accounts[0];

            if (!defaultAccount) throw new Error("Se requiere al menos una cuenta (ej. Caja Chica) para migrar los datos.");

            const migratedStartCount = currentV2.length;
            const newV2Transactions = [];

            // Helper to check duplicates (simple check by description/date/amount/type)
            const isDuplicate = (legacyTx) => {
                return currentV2.some(v2 =>
                    v2.fecha === (legacyTx.date || legacyTx.fecha) &&
                    v2.monto === parseFloat(legacyTx.amount || legacyTx.monto) &&
                    v2.descripcion === (legacyTx.description || legacyTx.descripcion)
                );
            };

            for (const tx of legacyTransactions) {
                // Skip if already exists in V2
                if (isDuplicate(tx)) continue;

                // Normalize to V2
                const newTx = {
                    id: `migrated-${tx.id}-${Date.now()}`, // Ensure unique ID
                    fecha: tx.date || tx.fecha || new Date().toISOString().split('T')[0],
                    descripcion: tx.description || tx.descripcion || 'Sin descripción',
                    monto: parseFloat(tx.amount || tx.monto || 0),
                    categoria: tx.category || tx.categoria || 'Sin categoría',
                    cuenta_id: tx.accountId || tx.cuenta_id || defaultAccount.id, // Fallback to default account
                    type: tx.type || 'income',
                    url_comprobante: tx.url_comprobante || null,
                    estado: 'validado',
                    migratedAt: new Date().toISOString()
                };
                newV2Transactions.push(newTx);
            }

            // Save new V2 list
            const finalV2 = [...newV2Transactions, ...currentV2];
            storage.set(STORAGE_KEYS.TREASURY_TRANSACTIONS_V2, finalV2);

            // Update Account Balances (Re-calculate from scratch or add delta? Safer to add delta of migrated items)
            // But wait, getTransactionsV2 is used to calculate balances dynamically in useTreasury usually?
            // Actually useTreasury calculates balance from accounts state, and addTransactionV2 updates accounts state.
            // Since we are bypassing addTransactionV2, we need to update account balances manually here too.
            // Let's recalculate balances for affected accounts.

            const updatedAccounts = accounts.map(acc => {
                const accountTxs = newV2Transactions.filter(t => t.cuenta_id === acc.id);
                const deltaBalance = accountTxs.reduce((sum, t) => {
                    return sum + (t.type === 'income' || t.monto >= 0 ? t.monto : -Math.abs(t.monto));
                }, 0);
                return { ...acc, saldo_actual: (acc.saldo_actual || 0) + deltaBalance };
            });
            storage.set(STORAGE_KEYS.TREASURY_ACCOUNTS, updatedAccounts);

            // Clear Legacy Storage
            storage.set(STORAGE_KEYS.TREASURY, []);

            return {
                migrated: newV2Transactions.length,
                message: `Se migraron ${newV2Transactions.length} registros exitosamente.`
            };
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
            } else {
                throw new Error('Categoría no encontrada para renombrar');
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
