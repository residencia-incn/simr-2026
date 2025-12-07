import React from 'react';
import { Archive, Search } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
    icon: Icon = Archive,
    title = 'No hay datos',
    description = 'No se encontraron registros para mostrar.',
    actionLabel,
    onAction,
    className = ''
}) => {
    return (
        <div className={`text-center py-12 px-4 bg-white border border-gray-100 rounded-xl shadow-sm ${className}`}>
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
            {actionLabel && onAction && (
                <Button onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
