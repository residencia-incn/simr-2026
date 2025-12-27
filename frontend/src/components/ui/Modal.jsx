import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md', className = '' }) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                // Only close if this is the topmost modal
                const allModals = document.querySelectorAll('[role="dialog"]');
                if (allModals.length > 0) {
                    const lastModal = allModals[allModals.length - 1];
                    const thisModalTitle = lastModal.querySelector('h3')?.textContent;
                    // Only close if this modal is the topmost one
                    if (thisModalTitle === title) {
                        onClose();
                    }
                } else {
                    onClose();
                }
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        '2xl': 'max-w-6xl',
        '3xl': 'max-w-7xl',
        full: 'max-w-full m-4'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fadeIn"
                onClick={(e) => {
                    // Only close if this is the topmost modal
                    const allModals = document.querySelectorAll('[role="dialog"]');
                    if (allModals.length > 0) {
                        const lastModal = allModals[allModals.length - 1];
                        const thisModalTitle = lastModal.querySelector('h3')?.textContent;
                        if (thisModalTitle === title) {
                            onClose();
                        }
                    } else {
                        onClose();
                    }
                }}
            ></div>

            {/* Modal Content */}
            <div
                className={`
                    relative w-full bg-white rounded-xl shadow-2xl overflow-hidden animate-slideUp
                    flex flex-col max-h-[90vh]
                    ${sizes[size] || sizes.md}
                    ${className}
                `}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 md:px-6 py-2.5 border-b border-gray-100 bg-white z-10">
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        aria-label="Cerrar modal"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
