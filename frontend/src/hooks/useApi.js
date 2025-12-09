import { useState, useEffect, useCallback, useRef } from 'react';

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

    // Use ref to store the latest apiFunction without causing re-renders
    const apiFunctionRef = useRef(apiFunction);

    // Update ref when apiFunction changes
    useEffect(() => {
        apiFunctionRef.current = apiFunction;
    }, [apiFunction]);

    const execute = useCallback(async (...params) => {
        setLoading(true);
        setError(null);

        try {
            const result = await apiFunctionRef.current(...params);
            setData(result);
            return result;
        } catch (err) {
            setError(err.message || 'An error occurred');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array - execute function never changes

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
