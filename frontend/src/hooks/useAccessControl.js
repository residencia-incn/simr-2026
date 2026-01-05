import { useAuth } from '../context/AuthContext';
import { useMemo } from 'react';

/**
 * Hook to check if the current user has access to specific items.
 * @param {string | string[]} requiredItems - Single item ID or array of item IDs required.
 * @param {object} options - Options for the check.
 * @param {boolean} options.any - If true, returns true if user has ANY of the required items. Default is ALL.
 * @returns {object} { hasAccess, missingItems }
 */
export const useAccessControl = (requiredItems, options = { any: false }) => {
    const { user } = useAuth();

    const result = useMemo(() => {
        if (!user) return { hasAccess: false, missingItems: requiredItems };
        // Superadmin bypass
        if (user.isSuperAdmin) return { hasAccess: true, missingItems: [] };

        const itemsToCheck = Array.isArray(requiredItems) ? requiredItems : [requiredItems];
        if (itemsToCheck.length === 0) return { hasAccess: true, missingItems: [] };

        const userItems = user.purchasedItems || [];

        // Normalize for case insensitivity if needed, but IDs should be consistent.
        // We assume IDs are consistent strings.

        const missing = itemsToCheck.filter(id => !userItems.includes(id));

        if (options.any) {
            // Access if fewer missing items than total items (meaning at least one matches)
            // Or if all match (missing 0)
            const hasAtLeastOne = itemsToCheck.some(id => userItems.includes(id));
            return { hasAccess: hasAtLeastOne, missingItems: missing };
        } else {
            // Access only if NO missing items
            return { hasAccess: missing.length === 0, missingItems: missing };
        }
    }, [user, requiredItems, options.any]);

    return result;
};

export default useAccessControl;
