import {
    PROGRAM_DATA,
    COMMITTEE_DATA,
    INITIAL_GALLERY,
    MOCK_NEWS,
    EVENT_CONFIG,
    SPONSORS,
    INITIAL_WORKS,
    INITIAL_JURORS,
    ACADEMIC_CONFIG
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
        /**
         * Get all pending registrations
         * @returns {Promise<Array>} List of registrations
         */
        getAll: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.PENDING_REGISTRATIONS, []);
        },

        /**
         * Add a new registration
         * @param {Object} registration 
         */
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

        /**
         * Remove registration by ID
         * @param {string} id 
         */
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
            // Merge mock attendees with local ones
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
            // Ensure structure integrity in case of partial saves
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
            const localAttendees = storage.get(STORAGE_KEYS.ATTENDEES, []);

            // Manual transactions
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
            // Always show INITIAL_WORKS (mock data) + any locally created works
            // INITIAL_WORKS comes last so it overwrites any old localStorage data with same IDs
            const allWorks = [...local, ...INITIAL_WORKS];
            // Deduplicate by ID (later entries win, so INITIAL_WORKS data is preferred)
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

    // --- 10. Users ---
    users: {
        search: async (query) => {
            await delay(200);
            if (!query || query.length < 2) return [];
            const q = query.toLowerCase();
            // Allow searching mostly in MOCK_USERS but technically could extend to stored users if needed
            const localUsers = storage.get(STORAGE_KEYS.USERS, []);
            const allUsers = [...MOCK_USERS, ...localUsers];

            return allUsers.filter(u =>
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q)
            );
        }
    }
};
