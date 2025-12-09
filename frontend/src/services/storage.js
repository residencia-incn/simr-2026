/**
 * Safe wrapper for LocalStorage operations
 */
export const storage = {
    /**
     * Get value from storage
     * @param {string} key - Storage key
     * @param {*} fallback - Default value if key doesn't exist or error
     * @returns {*} Parsed value or fallback
     */
    get: (key, fallback = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : fallback;
        } catch (e) {
            console.error(`Storage Error (GET ${key}):`, e);
            return fallback;
        }
    },

    /**
     * Set value to storage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success status
     */
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`Storage Error (SET ${key}):`, e);
            return false;
        }
    },

    /**
     * Remove item from storage
     * @param {string} key - Storage key
     */
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error(`Storage Error (REMOVE ${key}):`, e);
        }
    }
};

export const STORAGE_KEYS = {
    PENDING_REGISTRATIONS: 'simr_pending_registrations',
    ATTENDEES: 'simr_attendees',
    TREASURY: 'treasury_data',
    TREASURY_CATEGORIES: 'simr_treasury_categories',
    TREASURY_BUDGETS: 'simr_treasury_budgets',
    PRINT_CONFIG: 'simr_print_config',
    PROGRAM: 'event_program',
    PROGRAM_DAYS: 'event_days',
    PROGRAM_HALLS: 'simr_program_halls',
    PROGRAM_SCHEDULE_CONFIG: 'simr_program_schedule_config',
    COMMITTEE: 'event_committee',
    GALLERY: 'simr_gallery',
    HERO_SLIDES: 'simr_hero_slides',
    CONFIG: 'simr_config',
    WORKS: 'simr_works',
    ACADEMIC: 'simr_academic_config',
    ROADMAP: 'simr_roadmap',
    COUPONS: 'simr_coupons',
    USERS: 'simr_users',
    NEWS: 'simr_news',
    PLANNING_MEETINGS: 'simr_planning_meetings',
    PLANNING_TASKS: 'simr_planning_tasks',
    ATTENDANCE: 'simr_attendance',
    ATTENDANCE_TOKENS: 'simr_attendance_tokens'
};
