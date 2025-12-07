import React from 'react';

const FormField = ({
    label,
    name,
    type = 'text',
    value,
    onChange,
    error,
    placeholder,
    className = '',
    required = false,
    disabled = false,
    options = [], // for select
    rows = 3, // for textarea
    ...props
}) => {
    const baseInputStyles = `
        w-full p-2.5 border rounded-lg outline-none transition-all
        ${error
            ? 'border-red-300 focus:ring-2 focus:ring-red-200 bg-red-50'
            : 'border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500'
        }
        ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-900'}
    `;

    const renderInput = () => {
        if (type === 'select') {
            return (
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={baseInputStyles}
                    {...props}
                >
                    {options.map((opt, idx) => (
                        <option key={idx} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            );
        }

        if (type === 'textarea') {
            return (
                <textarea
                    name={name}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    placeholder={placeholder}
                    rows={rows}
                    className={`${baseInputStyles} resize-none`}
                    {...props}
                />
            );
        }

        return (
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                placeholder={placeholder}
                className={baseInputStyles}
                {...props}
            />
        );
    };

    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            {renderInput()}
            {error && (
                <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                    <span className="block w-1 h-1 bg-red-500 rounded-full"></span>
                    {error}
                </p>
            )}
        </div>
    );
};

export default FormField;
