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
    INITIAL_BUDGETS
} from '../data/mockData';
import { MOCK_ATTENDEES } from '../data/mockAttendees';
import { MOCK_USERS } from '../data/mockUsers';
import { storage, STORAGE_KEYS } from './storage';

// Helper for simulating async operations
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

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
 * Main API Service Module
 * Handles specific data operations using the storage utility
 */
export const api = {

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
            const local = storage.get(STORAGE_KEYS.ATTENDEES, []);
            return [...MOCK_ATTENDEES, ...local];
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

    // --- 3. Treasury ---
    treasury: {
        getTransactions: async () => {
            await delay();
            const stored = storage.get(STORAGE_KEYS.TREASURY);
            if (!stored) {
                // Seed initial if empty
                storage.set(STORAGE_KEYS.TREASURY, INITIAL_TRANSACTIONS);
                return INITIAL_TRANSACTIONS;
            }
            return stored;
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
        addIncome: async (amount, description, category) => {
            return await api.treasury.addTransaction({
                type: 'income',
                amount: parseFloat(amount),
                description,
                category
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
        // ... categories methods ...
        getBudgets: async () => {
            await delay();
            const stored = storage.get(STORAGE_KEYS.TREASURY_BUDGETS);
            if (!stored) return INITIAL_BUDGETS;
            return stored;
        },
        updateBudget: async (budgetList) => {
            await delay();
            storage.set(STORAGE_KEYS.TREASURY_BUDGETS, budgetList);
            return true;
        },
        getCategories: async () => {
            await delay();
            const stored = storage.get(STORAGE_KEYS.TREASURY_CATEGORIES);
            if (!stored) return DEFAULT_CATEGORIES;
            return {
                income: stored.income || DEFAULT_CATEGORIES.income,
                expense: stored.expense || DEFAULT_CATEGORIES.expense
            };
        },
        // ...
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
        }
    },

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
                scores: []
            };
            const local = storage.get(STORAGE_KEYS.WORKS, []);
            storage.set(STORAGE_KEYS.WORKS, [...local, work]);
            return work;
        }
    },

    // --- 8. Jurors ---
    jurors: {
        getAll: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.JURORS, INITIAL_JURORS);
        },
        save: async (jurors) => {
            await delay();
            storage.set(STORAGE_KEYS.JURORS, jurors);
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
    users: {
        getAll: async () => {
            await delay();
            const localUsers = storage.get(STORAGE_KEYS.USERS, []);
            return [...MOCK_USERS, ...localUsers];
        },
        search: async (query) => {
            await delay(200);
            if (!query || query.length < 2) return [];
            const q = query.toLowerCase();
            const localUsers = storage.get(STORAGE_KEYS.USERS, []);
            const allUsers = [...MOCK_USERS, ...localUsers];

            return allUsers.filter(u =>
                u.name?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q)
            );
        },
        delete: async (id) => {
            await delay();
            const local = storage.get(STORAGE_KEYS.USERS, []);
            if (local.find(u => u.id === id)) {
                storage.set(STORAGE_KEYS.USERS, local.filter(u => u.id !== id));
            }
            return true;
        },
        resetPassword: async (id) => {
            await delay();
            return true; // Mock success
        },
        update: async (user) => {
            await delay();
            const local = storage.get(STORAGE_KEYS.USERS, []);
            const updatedLocal = local.map(u => u.id === user.id ? user : u);
            // If not in local, it might be mock, so we save it to local to "override" it
            if (!local.find(u => u.id === user.id)) {
                updatedLocal.push(user);
            }
            storage.set(STORAGE_KEYS.USERS, updatedLocal);
            return user;
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

    // --- 13. Authentication ---
    auth: {
        login: async (email, password) => {
            await delay();

            // Mock users
            if (email === 'admin' && password === 'admin') {
                return {
                    id: '1',
                    name: 'Super Usuario',
                    email: 'admin@simr.pe',
                    role: 'superadmin', // Primary role
                    roles: ['superadmin', 'admin', 'secretary', 'academic', 'jury', 'resident', 'participant', 'treasurer', 'admission', 'committee'], // Added 'committee'
                    image: null
                };
            }

            if (email === 'committee' && password === 'committee') {
                return {
                    id: 'committee-1',
                    name: 'Miembro del Comité',
                    email: 'comite@simr.pe',
                    role: 'committee',
                    roles: ['committee'],
                    image: null
                };
            }

            if (email === 'jury' && password === 'jury') {
                return {
                    id: '2',
                    name: 'Dr. Roberto Paz',
                    email: 'roberto.paz@example.com',
                    role: 'jury',
                    roles: ['jury'],
                    image: null
                };
            }
            throw new Error('Credenciales inválidas');
        }
    }
};
