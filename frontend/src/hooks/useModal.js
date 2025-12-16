import { useState } from 'react';

/**
 * Custom hook for managing modal state
 * @param {boolean} initialState - Initial open state (default: false)
 * @returns {Object} Modal state and control functions
 */
export const useModal = (initialState = false) => {
    const [isOpen, setIsOpen] = useState(initialState);
    const [data, setData] = useState(null);

    const open = (modalData = null) => {
        setData(modalData);
        setIsOpen(true);
    };

    const close = () => {
        setIsOpen(false);
        // Clear data after animation completes
        setTimeout(() => setData(null), 300);
    };

    const toggle = () => {
        setIsOpen(prev => !prev);
    };

    return {
        isOpen,
        data,
        open,
        close,
        toggle,
        updateData: setData
    };
};

export default useModal;
