import React, { useState, useEffect } from 'react';
import { X, Monitor, DollarSign, GraduationCap, UserCheck, ClipboardCheck, Calendar, Settings, FileText, Users, Scale, BookOpen, UserCog, QrCode } from 'lucide-react';
import { SYSTEM_PROFILES, PROFILE_LABELS } from '../../data/mockData';

/**
 * Modal para gestionar los PERFILES de acceso de un usuario
 * Define a qué secciones del sistema tiene acceso
 */
const ProfilesModal = ({ isOpen, onClose, user, onSave }) => {
    const [selectedProfiles, setSelectedProfiles] = useState([]);

    useEffect(() => {
        if (user?.profiles) {
            setSelectedProfiles(user.profiles);
        } else {
            setSelectedProfiles([SYSTEM_PROFILES.BASIC]);
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

    const handleToggleProfile = (profile) => {
        // Perfil básico siempre debe estar seleccionado
        if (profile === SYSTEM_PROFILES.BASIC) return;

        setSelectedProfiles(prev => {
            // Case-insensitive check
            const exists = prev.some(p => p.toString().toLowerCase() === profile.toString().toLowerCase());

            if (exists) {
                return prev.filter(p => p.toString().toLowerCase() !== profile.toString().toLowerCase());
            } else {
                return [...prev, profile];
            }
        });
    };

    const handleSave = () => {
        // Asegurar que perfil básico siempre esté incluido
        const basicIncluded = selectedProfiles.some(p => p.toString().toLowerCase() === SYSTEM_PROFILES.BASIC.toString().toLowerCase());

        const finalProfiles = basicIncluded
            ? selectedProfiles
            : [SYSTEM_PROFILES.BASIC, ...selectedProfiles];

        onSave(finalProfiles);
        onClose();
    };

    const profileOptions = [
        {
            value: SYSTEM_PROFILES.BASIC,
            label: PROFILE_LABELS.perfil_basico,
            icon: UserCheck,
            description: 'Acceso básico al sistema. Incluido por defecto para todos los usuarios.',
            color: 'text-gray-600 bg-gray-50',
            locked: true
        },
        {
            value: SYSTEM_PROFILES.ORGANIZATION,
            label: PROFILE_LABELS.organizacion,
            icon: Settings,
            description: 'Panel de organización. Gestión de usuarios, configuración y administración general.',
            color: 'text-purple-600 bg-purple-50'
        },
        {
            value: SYSTEM_PROFILES.SECRETARY,
            label: PROFILE_LABELS.secretaria,
            icon: FileText,
            description: 'Secretaría. Gestión de documentos, actas, comunicaciones y planificación de reuniones.',
            color: 'text-slate-600 bg-slate-50'
        },
        {
            value: SYSTEM_PROFILES.RESEARCH,
            label: PROFILE_LABELS.investigacion,
            icon: BookOpen,
            description: 'Investigación. Acceso a herramientas y recursos para investigadores.',
            color: 'text-cyan-600 bg-cyan-50'
        },
        {
            value: SYSTEM_PROFILES.JURY,
            label: PROFILE_LABELS.jurado,
            icon: Scale,
            description: 'Jurado. Evaluación y calificación de trabajos de investigación.',
            color: 'text-amber-600 bg-amber-50'
        },
        {
            value: SYSTEM_PROFILES.WORKS,
            label: PROFILE_LABELS.trabajos,
            icon: Users,
            description: 'Trabajos. Gestión y seguimiento de trabajos de investigación.',
            color: 'text-rose-600 bg-rose-50'
        },
        {
            value: SYSTEM_PROFILES.VIRTUAL_CLASSROOM,
            label: PROFILE_LABELS.aula_virtual,
            icon: Monitor,
            description: 'Acceso al aula virtual, materiales de estudio y contenido del evento.',
            color: 'text-blue-600 bg-blue-50'
        },
        {
            value: SYSTEM_PROFILES.TREASURY,
            label: PROFILE_LABELS.contabilidad,
            icon: DollarSign,
            description: 'Contabilidad. Control de ingresos, egresos, aportes y presupuesto.',
            color: 'text-green-600 bg-green-50'
        },
        {
            value: SYSTEM_PROFILES.ATTENDANCE,
            label: PROFILE_LABELS.asistencia,
            icon: QrCode,
            description: 'Asistencia. Control y registro de asistencia de participantes.',
            color: 'text-emerald-600 bg-emerald-50'
        },
        {
            value: SYSTEM_PROFILES.ACADEMIC,
            label: PROFILE_LABELS.academico,
            icon: GraduationCap,
            description: 'Académico. Revisión de trabajos, asignación de jurados y programación.',
            color: 'text-indigo-600 bg-indigo-50'
        }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Gestionar Perfiles de Acceso</h2>
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
                            <strong>Perfiles de Acceso:</strong> Define a qué secciones del sistema puede acceder este usuario.
                            Puedes seleccionar múltiples perfiles según las responsabilidades del usuario.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {profileOptions.map((option) => {
                            const Icon = option.icon;
                            // Case insensitive check
                            const isSelected = selectedProfiles.some(p => p.toString().toLowerCase() === option.value.toString().toLowerCase());
                            const isLocked = option.locked;

                            return (
                                <button
                                    key={option.value}
                                    onClick={() => !isLocked && handleToggleProfile(option.value)}
                                    disabled={isLocked}
                                    className={`
                                        text-left p-4 rounded-lg border-2 transition-all
                                        ${isSelected
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }
                                        ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                                    `}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${option.color} flex-shrink-0`}>
                                            <Icon size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900 text-sm">{option.label}</h3>
                                                {isLocked && (
                                                    <span className="px-2 py-0.5 bg-gray-300 text-gray-700 text-xs rounded-full">
                                                        Por defecto
                                                    </span>
                                                )}
                                                {isSelected && !isLocked && (
                                                    <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                                                        ✓
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">{option.description}</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            <strong>Nota:</strong> Los perfiles asignados automáticamente según el tipo de inscripción
                            (Presencial, Presencial+Certificado, Virtual) se mantendrán. Puedes agregar perfiles adicionales aquí.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                        {selectedProfiles.length} perfil{selectedProfiles.length !== 1 ? 'es' : ''} seleccionado{selectedProfiles.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex gap-3">
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
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilesModal;
