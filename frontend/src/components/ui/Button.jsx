import React from 'react';

const Button = ({ children, onClick, variant = 'primary', className = '', loading, disabled, ...props }) => {
    const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 justify-center active:scale-95";
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg hover:-translate-y-0.5",
        secondary: "bg-white text-blue-900 border border-blue-200 hover:bg-blue-50 hover:shadow-sm hover:-translate-y-0.5",
        outline: "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        danger: "bg-red-50 text-red-600 hover:bg-red-100",
        ghost: "text-gray-600 hover:bg-gray-100"
    };

    const isDisabled = disabled || loading;

    return (
        <button
            onClick={onClick}
            className={`${baseStyle} ${variants[variant]} ${className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isDisabled}
            {...props}
        >
            {loading ? (
                <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {children}
                </>
            ) : children}
        </button>
    );
};

export default Button;
