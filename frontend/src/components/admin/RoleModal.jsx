import React, { useState, useEffect } from 'react';
import { X, User, Users, Scale, Presentation } from 'lucide-react';
import { EVENT_ROLES, EVENT_ROLE_LABELS } from '../../data/mockData';

/**
 * Modal para gestionar el ROL del evento de un usuario
 * Define qué ES la persona en el evento (Organizador, Asistente, Jurado, Ponente)
 */
const RoleModal = ({ isOpen, onClose, user, onSave }) => {
    // Inicializar con array de roles (soporte legacy para eventRole único)
    const [selectedRoles, setSelectedRoles] = useState([]);

    // Sync state when user changes or modal opens
    useEffect(() => {
        if (user) {
            let roles = [];
            if (user.eventRoles && Array.isArray(user.eventRoles)) {
                roles = user.eventRoles;
            } else if (user.eventRole) {
                roles = [user.eventRole];
            } else {
                roles = [EVENT_ROLES.ATTENDEE];
            }
            setSelectedRoles(roles);
        }
    }, [user, isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(selectedRoles);
        onClose();
    };

    const toggleRole = (roleValue) => {
        setSelectedRoles(prev => {
            if (prev.includes(roleValue)) {
                // Evitar dejar al usuario sin roles (opcional, pero recomendado)
                if (prev.length === 1) return prev;
                return prev.filter(r => r !== roleValue);
            } else {
                return [...prev, roleValue];
            }
        });
    };

    const roleOptions = [
        {
            value: EVENT_ROLES.ORGANIZER,
            label: EVENT_ROLE_LABELS.organizador,
            icon: Users,
            description: 'Miembro del comité organizador/staff del evento. Tiene responsabilidades de gestión y organización.',
            color: 'text-blue-600 bg-blue-50'
        },
        {
            value: EVENT_ROLES.ATTENDEE,
            label: EVENT_ROLE_LABELS.asistente,
            icon: User,
            description: 'Participante regular del evento. Asiste a conferencias, talleres y actividades.',
            color: 'text-green-600 bg-green-50'
        },
        {
            value: EVENT_ROLES.JURY,
            label: EVENT_ROLE_LABELS.jurado,
            icon: Scale,
            description: 'Evaluador de trabajos académicos. Califica y proporciona retroalimentación.',
            color: 'text-purple-600 bg-purple-50'
        },
        {
            value: EVENT_ROLES.SPEAKER,
            label: EVENT_ROLE_LABELS.ponente,
            icon: Presentation,
            description: 'Presentador o conferencista. Dicta charlas, talleres o ponencias.',
            color: 'text-orange-600 bg-orange-50'
        }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Gestionar Roles del Evento</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {user?.name} - {user?.email}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            <strong>Roles del Evento:</strong> Define las funciones que cumple esta persona.
                            Puede seleccionar múltiples roles (ej. Organizador y Ponente).
                        </p>
                    </div>

                    {roleOptions.map((option) => {
                        const Icon = option.icon;
                        // Case-insensitive check
                        const isSelected = selectedRoles.some(r => r.toString().toLowerCase() === option.value.toString().toLowerCase());

                        return (
                            <button
                                key={option.value}
                                onClick={() => toggleRole(option.value)}
                                className={`
                                    w-full text-left p-4 rounded-lg border-2 transition-all
                                    ${isSelected
                                        ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }
                                `}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${option.color}`}>
                                        <Icon size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">{option.label}</h3>
                                            {isSelected && (
                                                <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full flex items-center gap-1">
                                                    ✓ Seleccionado
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Guardar Roles
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoleModal;
