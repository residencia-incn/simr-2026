import { useState, useMemo } from 'react';

/**
 * Custom hook for sorting data
 * @param {Array} items - Array of items to sort
 * @param {Object} config - Initial sort configuration
 * @returns {Object} Sorted items and sort control functions
 */
export const useSortableData = (items, config = { key: null, direction: 'asc' }) => {
    const [sortConfig, setSortConfig] = useState(config);

    const sortedItems = useMemo(() => {
        if (!items) return [];

        let sortableItems = [...items];

        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                // Handle null/undefined values
                if (aValue == null) return 1;
                if (bValue == null) return -1;

                // Handle different types
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }

                // Numeric or other comparable types
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return sortableItems;
    }, [items, sortConfig]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const resetSort = () => {
        setSortConfig({ key: null, direction: 'asc' });
    };

    return {
        items: sortedItems,
        sortConfig,
        requestSort,
        resetSort
    };
};

export default useSortableData;
