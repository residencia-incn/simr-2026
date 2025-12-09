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
    INITIAL_COUPONS
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
        add: async (registration) => {
            await delay();
            const current = storage.get(STORAGE_KEYS.PENDING_REGISTRATIONS, []);
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
        }
    },

    // --- 3. Treasury ---
    treasury: {
        getTransactions: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.TREASURY, []);
        },
        addTransaction: async (tx) => {
            await delay();
            const current = storage.get(STORAGE_KEYS.TREASURY, []);
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
            const current = storage.get(STORAGE_KEYS.TREASURY, []);
            const updated = current.filter(t => t.id !== id);
            storage.set(STORAGE_KEYS.TREASURY, updated);
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
        addCategory: async (type, name) => {
            await delay();
            const categories = storage.get(STORAGE_KEYS.TREASURY_CATEGORIES, DEFAULT_CATEGORIES);
            const list = categories[type] || [];
            if (!list.includes(name)) {
                const updated = {
                    ...categories,
                    [type]: [...list, name]
                };
                storage.set(STORAGE_KEYS.TREASURY_CATEGORIES, updated);
            }
            return name;
        },
        deleteCategory: async (type, name) => {
            await delay();
            const categories = storage.get(STORAGE_KEYS.TREASURY_CATEGORIES, DEFAULT_CATEGORIES);
            if (categories[type]) {
                const updated = {
                    ...categories,
                    [type]: categories[type].filter(c => c !== name)
                };
                storage.set(STORAGE_KEYS.TREASURY_CATEGORIES, updated);
            }
            return true;
        },
        getStats: async () => {
            await delay();
            const transactions = storage.get(STORAGE_KEYS.TREASURY, []);
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
        }
    },

    // --- 5. Committee ---
    committee: {
        getAll: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.COMMITTEE, COMMITTEE_DATA);
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
        }
    },

    // --- 7. Works (Academic) ---
    works: {
        getAll: async () => {
            await delay();
            const local = storage.get(STORAGE_KEYS.WORKS, []);
            const allWorks = [...local, ...INITIAL_WORKS];
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
            if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) throw new Error("Cupón agorades");

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

    // --- 11. Authentication ---
    auth: {
        login: async (email, password) => {
            await delay(600); // Simulate network latency

            // Allow "admin" generic login
            if (email === 'admin' && password === 'admin') {
                return {
                    id: 'admin_master',
                    name: 'Super Usuario',
                    email: 'admin@simr.pe',
                    role: 'superadmin',
                    roles: ['superadmin', 'admin', 'academic', 'jury', 'resident', 'participant', 'treasurer', 'admission']
                };
            }

            const allUsers = await api.users.getAll();
            const user = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());

            if (user) {
                return {
                    ...user,
                    roles: user.roles || [user.role]
                };
            }
            throw new Error('Credenciales inválidas');
        }
    }
};
