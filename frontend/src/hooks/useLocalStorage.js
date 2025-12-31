import { useState, useEffect } from 'react';
import { storage } from '../services/storage';

/**
 * Custom hook for localStorage with JSON serialization
 * Refactored to use safe storage wrapper for sanitization and error handling.
 * @param {string} key - localStorage key
 * @param {*} initialValue - Initial value if key doesn't exist
 * @returns {Array} [value, setValue, removeValue]
 */
export const useLocalStorage = (key, initialValue) => {
    // State to store our value
    const [storedValue, setStoredValue] = useState(() => {
        return storage.get(key, initialValue);
    });

    // Return a wrapped version of useState's setter function that
    // persists the new value to localStorage.
    const setValue = (value) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            setStoredValue(valueToStore);
            storage.set(key, valueToStore);
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    };

    // Remove value from localStorage
    const removeValue = () => {
        try {
            setStoredValue(initialValue);
            storage.remove(key);
        } catch (error) {
            console.error(`Error removing localStorage key "${key}":`, error);
        }
    };

    // Listen for changes to this key in other tabs/windows
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === key && e.newValue !== null) {
                try {
                    setStoredValue(JSON.parse(e.newValue));
                } catch (error) {
                    console.error(`Error parsing storage event for key "${key}":`, error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);

    return [storedValue, setValue, removeValue];
};

export default useLocalStorage;
