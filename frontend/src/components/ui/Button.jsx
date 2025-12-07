import React from 'react';

const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
    const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 justify-center active:scale-95";
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg hover:-translate-y-0.5",
        secondary: "bg-white text-blue-900 border border-blue-200 hover:bg-blue-50 hover:shadow-sm hover:-translate-y-0.5",
        outline: "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        danger: "bg-red-50 text-red-600 hover:bg-red-100",
        ghost: "text-gray-600 hover:bg-gray-100"
    };
    return (
        <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

export default Button;
