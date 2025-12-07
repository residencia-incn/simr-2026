import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({
    type = 'success', // success | error | info
    message,
    onClose,
    duration = 3000
}) => {
    useEffect(() => {
        if (duration) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle className="text-green-500" size={20} />,
        error: <AlertCircle className="text-red-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />
    };

    const styles = {
        success: 'bg-white border-green-100 text-green-800 shadow-green-100',
        error: 'bg-white border-red-100 text-red-800 shadow-red-100',
        info: 'bg-white border-blue-100 text-blue-800 shadow-blue-100'
    };

    return (
        <div className={`
            flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-slideInRight
            ${styles[type]}
            fixed bottom-4 right-4 z-[100] max-w-sm w-full
        `}>
            <div className="flex-shrink-0">
                {icons[type]}
            </div>
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-black/5"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
