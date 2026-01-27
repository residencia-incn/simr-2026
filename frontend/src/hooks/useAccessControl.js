import { useAuth } from '../context/AuthContext';
import { useMemo } from 'react';

/**
 * Hook to check if the current user has access to a specific resource.
 * Centralizes logic for 'purchasedItems', 'profiles', and legacy fields.
 */
export const useAccessControl = () => {
    const { user } = useAuth();

    const entitlements = useMemo(() => {
        if (!user) return new Set();

        const items = new Set([
            ...(user.purchasedItems || []),
            ...(user.workshops || []),
            ...(user.ticketType ? [user.ticketType] : [])
        ]);

        // Add implicit entitlements based on roles
        if (user.roles?.includes('aula_virtual') || user.modules?.includes('aula_virtual')) {
            items.add('virtual');
            items.add('virtual_nocert');
            items.add('virtual_cert');
        }

        return items;
    }, [user]);

    const hasAccess = (requiredInfo) => {
        if (!user) return false;

        // Admin override
        if (user.roles?.includes('admin') || user.permissions?.includes('admin:all')) return true;

        // If passing a single string
        if (typeof requiredInfo === 'string') {
            // Check for exact match or partial match for 'virtual'
            if (requiredInfo === 'virtual_access') {
                // Check if ANY entitlement string includes 'virtual' (case insensitive)
                // This covers 'virtual_nocert', 'virtual_cert', 't_... (Virtual)', or just 'virtual'
                return Array.from(entitlements).some(e => e.toLowerCase().includes('virtual'));
            }
            return entitlements.has(requiredInfo);
        }

        // If passing an array (at least one)
        if (Array.isArray(requiredInfo)) {
            return requiredInfo.some(r => hasAccess(r));
        }

        return false;
    };

    return { hasAccess, entitlements: Array.from(entitlements) };
};
