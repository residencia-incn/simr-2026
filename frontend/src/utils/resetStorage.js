/**
 * Database Version Control and Reset Utility
 * 
 * This utility manages localStorage versioning to ensure data consistency
 * between local development and deployed versions.
 * 
 * INCREMENT DB_VERSION to force a complete localStorage reset on next load.
 */

// Current database version - increment this to trigger a reset
const DB_VERSION = 3; // Incremented to 3 to force a full reset for SQL connection
const VERSION_KEY = 'simr_db_version';

/**
 * Check if localStorage needs to be reset based on version
 * @returns {boolean} True if reset was performed
 */
export function checkAndResetStorage() {
    try {
        const currentVersion = localStorage.getItem(VERSION_KEY);
        const storedVersion = currentVersion ? parseInt(currentVersion, 10) : 0;

        if (storedVersion < DB_VERSION) {
            console.warn(`[DB Reset] Database version mismatch. Stored: ${storedVersion}, Required: ${DB_VERSION}`);
            console.warn('[DB Reset] Clearing all localStorage data...');

            // Clear all localStorage
            localStorage.clear();

            // Set new version
            localStorage.setItem(VERSION_KEY, DB_VERSION.toString());

            console.log('[DB Reset] ✅ Database reset complete. Mock data will be loaded.');
            return true;
        }

        console.log(`[DB Reset] Database version OK (${DB_VERSION})`);
        return false;
    } catch (error) {
        console.error('[DB Reset] Error during version check:', error);
        return false;
    }
}

/**
 * Force clear all localStorage (use with caution)
 */
export function forceResetStorage() {
    console.warn('[DB Reset] Force clearing all localStorage...');
    localStorage.clear();
    localStorage.setItem(VERSION_KEY, DB_VERSION.toString());
    console.log('[DB Reset] ✅ Force reset complete.');
}
