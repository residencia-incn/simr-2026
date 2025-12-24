import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for form handling with validation and optional persistence
 * @param {Object} initialValues - Initial form values
 * @param {Function} validate - Validation function (optional)
 * @param {string} persistKey - Key for localStorage persistence (optional)
 * @returns {Object} Form state and control functions
 */
export const useForm = (initialValues = {}, validate = null, persistKey = null) => {
    // Initialize with stored value if persistKey exists and storage has data
    const [values, setValues] = useState(() => {
        if (persistKey && typeof window !== 'undefined') {
            try {
                const item = window.localStorage.getItem(persistKey);
                return item ? JSON.parse(item) : initialValues;
            } catch (error) {
                console.error(`Error loading persistent form state for key "${persistKey}":`, error);
                return initialValues;
            }
        }
        return initialValues;
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Persist to localStorage whenever values change
    useEffect(() => {
        if (persistKey && typeof window !== 'undefined') {
            try {
                window.localStorage.setItem(persistKey, JSON.stringify(values));
            } catch (error) {
                console.error(`Error persisting form state for key "${persistKey}":`, error);
            }
        }
    }, [values, persistKey]);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setValues(prev => ({
            ...prev,
            [name]: newValue
        }));

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    }, [errors]);

    const handleBlur = useCallback((e) => {
        const { name } = e.target;
        setTouched(prev => ({
            ...prev,
            [name]: true
        }));

        // Validate field on blur if validation function provided
        if (validate) {
            const fieldErrors = validate({ [name]: values[name] });
            if (fieldErrors[name]) {
                setErrors(prev => ({
                    ...prev,
                    [name]: fieldErrors[name]
                }));
            }
        }
    }, [validate, values]);

    const handleSubmit = useCallback((onSubmit) => {
        return async (e) => {
            if (e) e.preventDefault();

            // Mark all fields as touched
            const allTouched = Object.keys(values).reduce((acc, key) => {
                acc[key] = true;
                return acc;
            }, {});
            setTouched(allTouched);

            // Validate all fields
            if (validate) {
                const validationErrors = validate(values);
                setErrors(validationErrors);

                // Don't submit if there are errors
                if (Object.keys(validationErrors).length > 0) {
                    return;
                }
            }

            setIsSubmitting(true);
            try {
                await onSubmit(values);
            } catch (error) {
                console.error('Form submission error:', error);
                throw error;
            } finally {
                setIsSubmitting(false);
            }
        };
    }, [values, validate]);

    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
        if (persistKey && typeof window !== 'undefined') {
            window.localStorage.removeItem(persistKey);
        }
    }, [initialValues, persistKey]);

    const setFieldValue = useCallback((name, value) => {
        setValues(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const setFieldError = useCallback((name, error) => {
        setErrors(prev => ({
            ...prev,
            [name]: error
        }));
    }, []);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        handleChange,
        handleBlur,
        handleSubmit,
        reset,
        setFieldValue,
        setFieldError,
        setValues
    };
};

export default useForm;
