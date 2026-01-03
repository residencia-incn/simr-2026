/**
 * Recursively scans and truncates strings that are too large (likely base64 images)
 * to prevent QuotaExceededError in LocalStorage.
 */
function sanitizeData(data, maxStringLength = 102400) { // 100KB limit per string
    if (typeof data === 'string') {
        if (data.length > maxStringLength) {
            console.warn(`[Storage] Truncating large string (${data.length} bytes). Original content likely an oversized base64 image.`);
            return data.substring(0, 100) + '...[TRUNCATED_DUE_TO_STORAGE_LIMITS]...';
        }
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item, maxStringLength));
    }

    if (typeof data === 'object' && data !== null) {
        const sanitized = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                sanitized[key] = sanitizeData(data[key], maxStringLength);
            }
        }
        return sanitized;
    }

    return data;
}

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
            if (!item) return fallback;

            try {
                return JSON.parse(item);
            } catch (parseError) {
                // Data is corrupted, remove it and return fallback
                console.error(`Storage Error: Corrupted data for key "${key}". Removing corrupted data.`, parseError);
                localStorage.removeItem(key);
                return fallback;
            }
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
            // Sanitize value to prevent quota issues (truncate massive base64 strings)
            const sanitizedValue = sanitizeData(value);
            localStorage.setItem(key, JSON.stringify(sanitizedValue));
            return true;
        } catch (e) {
            console.error(`Storage Error (SET ${key}):`, e);
            if (e.name === 'QuotaExceededError') {
                console.warn(`Critical: LocalStorage Quota Exceeded while saving ${key}.`);
            }
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
    // New Treasury System Keys
    TREASURY_ACCOUNTS: 'treasury_accounts',
    TREASURY_TRANSACTIONS_V2: 'treasury_transactions_v2',
    TREASURY_CONTRIBUTION_PLAN: 'treasury_contribution_plan',
    TREASURY_BUDGET_PLAN: 'treasury_budget_plan',
    TREASURY_CONFIG: 'treasury_config',
    TREASURY_FINES: 'treasury_fines_v1',
    // End Treasury Keys
    PRINT_CONFIG: 'simr_print_config',
    PROGRAM: 'event_program',
    PROGRAM_DAYS: 'event_days',
    PROGRAM_HALLS: 'simr_program_halls',
    PROGRAM_SCHEDULE_CONFIG: 'simr_program_schedule_config',
    COMMITTEE: 'event_committee',
    GALLERY: 'simr_gallery',
    HERO_SLIDES: 'simr_hero_slides',
    CONFIG: 'simr_config',
    WORKS: 'simr_works_v5',
    JURORS: 'simr_jurors',
    ACADEMIC: 'simr_academic_config',
    ROADMAP: 'simr_roadmap',
    COUPONS: 'simr_coupons',
    USERS: 'simr_users_v5',
    NEWS: 'simr_news',
    SPONSORS: 'simr_sponsors',
    PLANNING_MEETINGS: 'simr_planning_meetings',
    PLANNING_TASKS: 'simr_planning_tasks',
    ATTENDANCE: 'simr_attendance',
    ATTENDANCE_TOKENS: 'simr_attendance_tokens',
    NOTIFICATIONS: 'simr_notifications'
};
