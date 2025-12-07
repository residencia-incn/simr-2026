import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmar Acción',
    message = '¿Estás seguro de realizar esta acción?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger', // danger | warning | info
    isLoading = false
}) => {
    const getIcon = () => {
        switch (variant) {
            case 'danger':
                return <AlertCircle className="text-red-600" size={48} />;
            case 'warning':
                return <AlertCircle className="text-orange-600" size={48} />;
            default:
                return <HelpCircle className="text-blue-600" size={48} />;
        }
    };

    const getConfirmButtonVariant = () => {
        switch (variant) {
            case 'danger': return 'primary'; // Button component might need 'danger' variant or we use primary with red style manually if needed
            case 'warning': return 'secondary';
            default: return 'primary';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
        >
            <div className="text-center py-4">
                <div className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center bg-${variant === 'danger' ? 'red' : variant === 'warning' ? 'orange' : 'blue'}-50`}>
                    {getIcon()}
                </div>
                <p className="text-gray-600 mb-8 px-4 text-base">
                    {message}
                </p>
                <div className="flex gap-3 justify-center">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        // Assuming Button component supports className overriding or variant
                        className={`w-full ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Procesando...' : confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
