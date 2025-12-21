import { useState, useMemo } from 'react';

/**
 * Custom hook for search and filter functionality
 * @param {Array} items - Array of items to search/filter
 * @param {Object} config - Configuration object
 * @returns {Object} Filtered items and control functions
 */
export const useSearch = (items, config = {}) => {
    const {
        searchFields = ['name'], // Fields to search in
        filterField = null, // Field to filter by
        filterOptions = [] // Available filter options
    } = config;

    const [searchTerm, setSearchTerm] = useState('');
    const [filterValue, setFilterValue] = useState('All');

    const filteredItems = useMemo(() => {
        if (!items) return [];

        return items.filter(item => {
            // Search filter
            const matchesSearch = searchTerm === '' || searchFields.some(field => {
                const value = item[field];
                if (value == null) return false;
                return String(value).toLowerCase().includes(searchTerm.toLowerCase());
            });

            // Category/role filter
            const matchesFilter = (() => {
                if (!filterField || filterValue === 'All') return true;

                const itemValue = item[filterField];
                const filterValStr = String(filterValue).toLowerCase();

                if (Array.isArray(itemValue)) {
                    return itemValue.some(val => String(val).toLowerCase() === filterValStr);
                }

                return String(itemValue).toLowerCase() === filterValStr;
            })();

            return matchesSearch && matchesFilter;
        });
    }, [items, searchTerm, filterValue, searchFields, filterField]);

    const reset = () => {
        setSearchTerm('');
        setFilterValue('All');
    };

    return {
        searchTerm,
        setSearchTerm,
        filterValue,
        setFilterValue,
        filteredItems,
        reset
    };
};

export default useSearch;
