import React, { useState, useEffect } from 'react';
import { X, Monitor, DollarSign, GraduationCap, UserCheck, ClipboardCheck, Calendar, Settings, FileText, Users, Scale, BookOpen, UserCog, QrCode, Check, Sliders } from 'lucide-react';
import { MODULE_PERMISSIONS } from '../../context/AuthContext';

/**
 * Modal mejorado para gestionar módulos y permisos de acceso
 * Combina la visualización de módulos con control granular de permisos
 */
const PermissionsModal = ({ isOpen, onClose, user, onSave }) => {
    const [selectedModules, setSelectedModules] = useState([]);
    const [advancedMode, setAdvancedMode] = useState(false);
    const [customPermissions, setCustomPermissions] = useState([]);
    const [expandedModule, setExpandedModule] = useState(null);

    useEffect(() => {
        if (user?.modules) {
            setSelectedModules(user.modules);
        } else if (user?.profiles) {
            // Legacy support
            setSelectedModules(user.profiles);
        } else {
            setSelectedModules(['mi_perfil']);
        }

        // Initialize custom permissions
        if (user?.permissions) {
            setCustomPermissions(user.permissions);
        } else {
            setCustomPermissions([]);
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

    const handleToggleModule = (moduleId) => {
        // Mi perfil siempre debe estar seleccionado
        if (moduleId === 'mi_perfil') return;

        setSelectedModules(prev => {
            const exists = prev.includes(moduleId);
            if (exists) {
                return prev.filter(m => m !== moduleId);
            } else {
                return [...prev, moduleId];
            }
        });
    };

    const handleSave = () => {
        if (advancedMode) {
            // En modo avanzado, usar permisos personalizados directamente
            onSave({
                modules: selectedModules,
                permissions: customPermissions
            });
        } else {
            // Modo normal: calcular permisos desde módulos
            const finalModules = selectedModules.includes('mi_perfil')
                ? selectedModules
                : ['mi_perfil', ...selectedModules];

            // Calcular permisos basados en módulos seleccionados
            const permissions = new Set();
            finalModules.forEach(module => {
                const modulePerms = MODULE_PERMISSIONS[module] || [];
                modulePerms.forEach(p => permissions.add(p));
            });

            onSave({
                modules: finalModules,
                permissions: Array.from(permissions)
            });
        }
        onClose();
    };

    const handleTogglePermission = (permission) => {
        setCustomPermissions(prev => {
            const exists = prev.includes(permission);
            if (exists) {
                return prev.filter(p => p !== permission);
            } else {
                return [...prev, permission];
            }
        });
    };

    const moduleOptions = [
        {
            id: 'mi_perfil',
            label: 'Mi Perfil',
            icon: UserCheck,
            description: 'Acceso básico al sistema. Incluido por defecto para todos los usuarios.',
            color: 'text-gray-600 bg-gray-50',
            locked: true,
            category: 'basic'
        },
        {
            id: 'aula_virtual',
            label: 'Aula Virtual',
            icon: Monitor,
            description: 'Acceso al aula virtual, materiales de estudio y contenido del evento.',
            color: 'text-blue-600 bg-blue-50',
            category: 'basic'
        },
        {
            id: 'trabajos',
            label: 'Trabajos',
            icon: Users,
            description: 'Trabajos. Gestión y seguimiento de trabajos de investigación.',
            color: 'text-rose-600 bg-rose-50',
            category: 'academic'
        },
        {
            id: 'academico',
            label: 'Académico',
            icon: GraduationCap,
            description: 'Académico. Revisión de trabajos, asignación de jurados y programación.',
            color: 'text-indigo-600 bg-indigo-50',
            category: 'academic'
        },
        {
            id: 'investigacion',
            label: 'Investigación',
            icon: BookOpen,
            description: 'Investigación. Acceso a herramientas y recursos para investigadores.',
            color: 'text-cyan-600 bg-cyan-50',
            category: 'academic'
        },
        {
            id: 'jurado',
            label: 'Jurado',
            icon: Scale,
            description: 'Jurado. Evaluación y calificación de trabajos de investigación.',
            color: 'text-amber-600 bg-amber-50',
            category: 'academic'
        },
        {
            id: 'secretaria',
            label: 'Secretaría',
            icon: FileText,
            description: 'Secretaría. Gestión de documentos, actas, comunicaciones y planificación de reuniones.',
            color: 'text-slate-600 bg-slate-50',
            category: 'admin'
        },
        {
            id: 'contabilidad',
            label: 'Contabilidad',
            icon: DollarSign,
            description: 'Contabilidad. Control de ingresos, egresos, aportes y presupuesto.',
            color: 'text-green-600 bg-green-50',
            category: 'admin'
        },
        {
            id: 'asistencia',
            label: 'Asistencia',
            icon: QrCode,
            description: 'Asistencia. Control y registro de asistencia de participantes.',
            color: 'text-emerald-600 bg-emerald-50',
            category: 'admin'
        },
        {
            id: 'organizacion',
            label: 'Organización',
            icon: Settings,
            description: 'Panel de organización. Gestión de usuarios, configuración y administración general.',
            color: 'text-purple-600 bg-purple-50',
            category: 'admin'
        }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Gestión de Módulos de Acceso</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Editando permisos para: <span className="font-semibold text-gray-800">{user?.name}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Advanced Mode Toggle */}
                            <button
                                onClick={() => setAdvancedMode(!advancedMode)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${advancedMode
                                    ? 'bg-purple-600 text-white border-purple-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                                    }`}
                            >
                                <Sliders size={18} />
                                <span className="text-sm font-medium">
                                    {advancedMode ? 'Modo Avanzado' : 'Modo Normal'}
                                </span>
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                    {!advancedMode ? (
                        // MODULE VIEW (Normal Mode)
                        <>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    <strong>Módulos de Acceso:</strong> Define a qué secciones del sistema puede acceder este usuario.
                                    Puedes seleccionar múltiples módulos según las responsabilidades del usuario.
                                </p>
                            </div>

                            {/* Acceso Básico */}
                            <div>
                                <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Acceso Básico</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {moduleOptions.filter(m => m.category === 'basic').map((option) => {
                                        const Icon = option.icon;
                                        const isSelected = selectedModules.includes(option.id);
                                        const isLocked = option.locked;

                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => !isLocked && handleToggleModule(option.id)}
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
                            </div>

                            {/* Gestión Académica */}
                            <div>
                                <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Gestión Académica</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {moduleOptions.filter(m => m.category === 'academic').map((option) => {
                                        const Icon = option.icon;
                                        const isSelected = selectedModules.includes(option.id);

                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => handleToggleModule(option.id)}
                                                className={`
                                            text-left p-4 rounded-lg border-2 transition-all cursor-pointer
                                            ${isSelected
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }
                                        `}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`p-2 rounded-lg ${option.color} flex-shrink-0`}>
                                                        <Icon size={20} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold text-gray-900 text-sm">{option.label}</h3>
                                                            {isSelected && (
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
                            </div>

                            {/* Gestión Administrativa */}
                            <div>
                                <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Gestión Administrativa</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {moduleOptions.filter(m => m.category === 'admin').map((option) => {
                                        const Icon = option.icon;
                                        const isSelected = selectedModules.includes(option.id);

                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => handleToggleModule(option.id)}
                                                className={`
                                            text-left p-4 rounded-lg border-2 transition-all cursor-pointer
                                            ${isSelected
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }
                                        `}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`p-2 rounded-lg ${option.color} flex-shrink-0`}>
                                                        <Icon size={20} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold text-gray-900 text-sm">{option.label}</h3>
                                                            {isSelected && (
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
                            </div>
                        </>
                    ) : (
                        // ADVANCED VIEW (Granular Permissions)
                        <>
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <p className="text-sm text-purple-800">
                                    <strong>Modo Avanzado:</strong> Control granular de permisos individuales (scopes).
                                    Puedes habilitar o deshabilitar permisos específicos para un control preciso del acceso.
                                </p>
                            </div>

                            {/* Profile Permissions */}
                            <div>
                                <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Perfil y Acceso Básico</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[
                                        { scope: 'profile:read', label: 'Ver Perfil', description: 'Acceso de lectura al perfil personal' },
                                        { scope: 'profile:write', label: 'Editar Perfil', description: 'Modificar información del perfil' },
                                        { scope: 'classroom:read', label: 'Aula Virtual', description: 'Acceso al aula virtual y materiales' }
                                    ].map(perm => {
                                        const isActive = customPermissions.includes(perm.scope);
                                        return (
                                            <button
                                                key={perm.scope}
                                                onClick={() => handleTogglePermission(perm.scope)}
                                                className={`text-left p-3 rounded-lg border-2 transition-all ${isActive
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-sm text-gray-900">{perm.label}</h4>
                                                        <p className="text-xs text-gray-600 mt-0.5">{perm.description}</p>
                                                        <code className="text-xs font-mono text-gray-500 mt-1 block">{perm.scope}</code>
                                                    </div>
                                                    {isActive && (
                                                        <Check size={18} className="text-purple-600 flex-shrink-0" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Academic Permissions */}
                            <div>
                                <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Permisos Académicos</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[
                                        { scope: 'papers:read', label: 'Ver Trabajos', description: 'Acceso de lectura a trabajos de investigación' },
                                        { scope: 'papers:submit', label: 'Enviar Trabajos', description: 'Enviar trabajos de investigación' },
                                        { scope: 'papers:write', label: 'Editar Trabajos', description: 'Modificar trabajos enviados' },
                                        { scope: 'papers:manage', label: 'Gestionar Trabajos', description: 'Administración completa de trabajos' },
                                        { scope: 'papers:grade', label: 'Calificar Trabajos', description: 'Asignar calificaciones a trabajos' },
                                        { scope: 'academic:read', label: 'Panel Académico (Lectura)', description: 'Ver panel académico' },
                                        { scope: 'academic:write', label: 'Panel Académico (Escritura)', description: 'Modificar configuración académica' },
                                        { scope: 'jury:assign', label: 'Asignar Jurados', description: 'Asignar jurados a trabajos' },
                                        { scope: 'jury:read', label: 'Panel Jurado (Lectura)', description: 'Ver panel de jurado' },
                                        { scope: 'jury:evaluate', label: 'Evaluar como Jurado', description: 'Evaluar y calificar trabajos asignados' },
                                        { scope: 'research:read', label: 'Investigación (Lectura)', description: 'Ver módulo de investigación' },
                                        { scope: 'research:write', label: 'Investigación (Escritura)', description: 'Gestionar investigación' }
                                    ].map(perm => {
                                        const isActive = customPermissions.includes(perm.scope);
                                        return (
                                            <button
                                                key={perm.scope}
                                                onClick={() => handleTogglePermission(perm.scope)}
                                                className={`text-left p-3 rounded-lg border-2 transition-all ${isActive
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-sm text-gray-900">{perm.label}</h4>
                                                        <p className="text-xs text-gray-600 mt-0.5">{perm.description}</p>
                                                        <code className="text-xs font-mono text-gray-500 mt-1 block">{perm.scope}</code>
                                                    </div>
                                                    {isActive && (
                                                        <Check size={18} className="text-purple-600 flex-shrink-0" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Administrative Permissions */}
                            <div>
                                <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Permisos Administrativos</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[
                                        { scope: 'accounting:read', label: 'Contabilidad (Lectura)', description: 'Ver información financiera' },
                                        { scope: 'accounting:write', label: 'Contabilidad (Escritura)', description: 'Gestionar finanzas' },
                                        { scope: 'secretary:read', label: 'Secretaría (Lectura)', description: 'Ver documentos y actas' },
                                        { scope: 'planning:read', label: 'Planificación (Lectura)', description: 'Ver reuniones y tareas' },
                                        { scope: 'planning:write', label: 'Planificación (Escritura)', description: 'Crear reuniones y asignar tareas' },
                                        { scope: 'attendance:read', label: 'Asistencia (Lectura)', description: 'Ver registros de asistencia' },
                                        { scope: 'attendance:write', label: 'Asistencia (Escritura)', description: 'Registrar asistencia' },
                                        { scope: 'users:manage', label: 'Gestionar Usuarios', description: 'Administrar usuarios del sistema' },
                                        { scope: 'admin:all', label: 'Acceso Total (Admin)', description: 'Acceso completo a todas las funciones' }
                                    ].map(perm => {
                                        const isActive = customPermissions.includes(perm.scope);
                                        return (
                                            <button
                                                key={perm.scope}
                                                onClick={() => handleTogglePermission(perm.scope)}
                                                className={`text-left p-3 rounded-lg border-2 transition-all ${isActive
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-sm text-gray-900">{perm.label}</h4>
                                                        <p className="text-xs text-gray-600 mt-0.5">{perm.description}</p>
                                                        <code className="text-xs font-mono text-gray-500 mt-1 block">{perm.scope}</code>
                                                    </div>
                                                    {isActive && (
                                                        <Check size={18} className="text-purple-600 flex-shrink-0" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                        {advancedMode ? (
                            <>{customPermissions.length} permiso{customPermissions.length !== 1 ? 's' : ''} seleccionado{customPermissions.length !== 1 ? 's' : ''}</>
                        ) : (
                            <>{selectedModules.length} módulo{selectedModules.length !== 1 ? 's' : ''} seleccionado{selectedModules.length !== 1 ? 's' : ''}</>
                        )}
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
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Check size={18} />
                            Guardar Permisos
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PermissionsModal;
