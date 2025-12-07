import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for API calls with loading and error states
 * @param {Function} apiFunction - Async function to call
 * @param {boolean} immediate - Whether to call immediately on mount (default: true)
 * @returns {Object} Data, loading, error states and refetch function
 */
export const useApi = (apiFunction, immediate = true) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState(null);

    const execute = useCallback(async (...params) => {
        setLoading(true);
        setError(null);

        try {
            const result = await apiFunction(...params);
            setData(result);
            return result;
        } catch (err) {
            setError(err.message || 'An error occurred');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiFunction]);

    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, [immediate, execute]);

    const refetch = useCallback(() => {
        return execute();
    }, [execute]);

    return {
        data,
        loading,
        error,
        execute,
        refetch
    };
};

export default useApi;
