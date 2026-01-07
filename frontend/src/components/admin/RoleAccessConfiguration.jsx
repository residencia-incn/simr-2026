import React, { useState, useEffect } from 'react';
import { UserCog, Lock, Database, Layout, Shield, Check, Save, User } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { showSuccess, showError } from '../../utils/alerts';

// Reusing module list from PermissionsModal for consistency
// Ideally this should be a shared constant, but defining here for now
const SYSTEM_MODULES = [
    { id: 'mi_perfil', label: 'Mi Perfil', category: 'basic', mandatory: true },
    { id: 'aula_virtual', label: 'Aula Virtual', category: 'basic' },
    { id: 'trabajos', label: 'Trabajos', category: 'academic' },
    { id: 'academico', label: 'Académico', category: 'academic' },
    { id: 'investigacion', label: 'Investigación', category: 'academic' },
    { id: 'jurado', label: 'Jurado', category: 'academic' },
    { id: 'secretaria', label: 'Secretaría', category: 'admin' },
    { id: 'contabilidad', label: 'Contabilidad', category: 'admin' },
    { id: 'asistencia', label: 'Asistencia', category: 'admin' },
    { id: 'organizacion', label: 'Organización', category: 'admin' },
];

const RoleAccessConfiguration = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Data States
    const [roles, setRoles] = useState([]);
    const [modalities, setModalities] = useState([]);
    const [workshops, setWorkshops] = useState([]);

    // Configuration State
    // Structure: { [roleId]: { modules: { [moduleId]: { enabled: boolean, locked: boolean } }, modalities: [ids...] } }
    const [defaults, setDefaults] = useState({});

    // UI States
    const [selectedRole, setSelectedRole] = useState(null);
    const [activeTab, setActiveTab] = useState('access'); // 'access' or 'modality'

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [pricing, systemConfig, currentDefaults] = await Promise.all([
                api.treasury.getPricing(),
                api.system.getConfig(),
                api.system.getRoleDefaults()
            ]);

            // Roles hardcoded or fetched? The prompt says "mirror existing roles".
            // We'll define the standard roles we know exist in the system.
            const systemRoles = [
                { id: 'organizador', label: 'Organizador' },
                { id: 'asistente', label: 'Asistente' },
                { id: 'ponente', label: 'Ponente' },
                { id: 'jurado', label: 'Jurado' }
            ];

            setRoles(systemRoles);

            // Extract modalities and workshops from pricing
            setModalities(pricing.ticketTypes || []);
            setWorkshops(pricing.workshops || []);

            setDefaults(currentDefaults || {});

            // Select first role by default
            if (systemRoles.length > 0) {
                setSelectedRole(systemRoles[0].id);
            }

        } catch (error) {
            console.error("Error loading config:", error);
            showError("Error al cargar la configuración");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.system.saveRoleDefaults(defaults);
            showSuccess("Configuración de roles guardada correctamente");
        } catch (error) {
            console.error("Error saving defaults:", error);
            showError("Error al guardar cambios");
        } finally {
            setSaving(false);
        }
    };

    // Helper to get current config for selected role safely
    const getCurrentRoleConfig = () => {
        if (!selectedRole) return {};
        return defaults[selectedRole] || {};
    };

    const updateDefault = (type, id, value, property = null) => {
        if (!selectedRole) return;

        setDefaults(prev => {
            const roleConfig = prev[selectedRole] || { modules: {}, modalities: [] };

            if (type === 'access') {
                const currentModules = roleConfig.modules || {};
                const currentModuleConfig = currentModules[id] || { enabled: false, locked: false };

                const updatedModuleConfig = property
                    ? { ...currentModuleConfig, [property]: value }
                    : { ...currentModuleConfig, enabled: value };

                return {
                    ...prev,
                    [selectedRole]: {
                        ...roleConfig,
                        modules: {
                            ...currentModules,
                            [id]: updatedModuleConfig
                        }
                    }
                };
            } else if (type === 'modality') {
                const currentModalities = roleConfig.modalities || [];
                let newModalities;

                // Check if the ID belongs to the "Ticket Types" (Modalities) group
                const isTicketType = modalities.some(m => m.id === id);

                if (isTicketType && value) {
                    // If it's a ticket type and we are selecting it:
                    // 1. Filter out ALL existing IDs that are ticket types (single select enforcement)
                    // 2. Keep IDs that are NOT ticket types (workshops, etc.)
                    // 3. Add the new ID
                    const otherTypes = currentModalities.filter(existingId =>
                        !modalities.some(m => m.id === existingId)
                    );
                    newModalities = [...otherTypes, id];
                } else {
                    // Standard toggle behavior for workshops or when unchecking
                    if (value) {
                        newModalities = [...new Set([...currentModalities, id])];
                    } else {
                        newModalities = currentModalities.filter(m => m !== id);
                    }
                }

                return {
                    ...prev,
                    [selectedRole]: {
                        ...roleConfig,
                        modalities: newModalities
                    }
                };
            }
            return prev;
        });
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando configuración...</div>;

    const currentConfig = getCurrentRoleConfig();

    return (
        <div className="flex flex-col h-[600px]">
            {/* Header / Toolbar */}
            <div className="flex justify-between items-center mb-4 px-1">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Roles y Módulos</h3>
                    <p className="text-sm text-gray-500">Define el acceso y modalidades por defecto para cada rol.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>

            {/* 3-Column Layout */}
            <div className="flex flex-1 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">

                {/* Column 1: Roles List */}
                <div className="w-1/4 border-r border-gray-200 bg-gray-50 flex flex-col">
                    <div className="p-3 border-b border-gray-200 font-semibold text-gray-700 flex items-center gap-2 bg-gray-100">
                        <UserCog size={18} /> Roles del Sistema
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {roles.map(role => (
                            <button
                                key={role.id}
                                onClick={() => setSelectedRole(role.id)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group ${selectedRole === role.id
                                    ? 'bg-blue-100 text-blue-800 font-medium shadow-sm'
                                    : 'hover:bg-gray-200 text-gray-600'
                                    }`}
                            >
                                <span>{role.label}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${selectedRole === role.id ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-500'}`}>
                                    {role.id}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Column 2: Configuration Type Selection */}
                <div className="w-1/4 border-r border-gray-200 bg-white flex flex-col">
                    <div className="p-3 border-b border-gray-200 font-semibold text-gray-700 flex items-center gap-2">
                        <Layout size={18} /> Configuración
                    </div>
                    <div className="p-2 space-y-2">
                        <button
                            onClick={() => setActiveTab('modality')}
                            className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${activeTab === 'modality'
                                ? 'border-blue-500 bg-blue-50 text-blue-800'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                                }`}
                        >
                            <div className={`p-2 rounded-md ${activeTab === 'modality' ? 'bg-blue-200' : 'bg-gray-100'}`}>
                                <Database size={20} />
                            </div>
                            <div>
                                <div className="font-medium">Modalidad</div>
                                <div className="text-xs opacity-75">Tipos de inscripción y talleres</div>
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveTab('access')}
                            className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${activeTab === 'access'
                                ? 'border-purple-500 bg-purple-50 text-purple-800'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                                }`}
                        >
                            <div className={`p-2 rounded-md ${activeTab === 'access' ? 'bg-purple-200' : 'bg-gray-100'}`}>
                                <Shield size={20} />
                            </div>
                            <div>
                                <div className="font-medium">Acceso</div>
                                <div className="text-xs opacity-75">Módulos del sistema</div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Column 3: Detailed Settings */}
                <div className="w-2/4 bg-white flex flex-col">
                    <div className="p-3 border-b border-gray-200 font-semibold text-gray-700 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            {activeTab === 'access' ? <Shield size={18} /> : <Database size={18} />}
                            {activeTab === 'access' ? 'Permisos de Módulos' : 'Modalidades y Talleres'}
                        </span>
                        <span className="text-xs font-normal bg-gray-100 px-2 py-1 rounded text-gray-500">
                            Rol: <strong>{roles.find(r => r.id === selectedRole)?.label}</strong>
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {activeTab === 'modality' ? (
                            <div className="space-y-6">
                                {/* Ticket Types */}
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tipos de Inscripción</h4>
                                    <div className="space-y-2">
                                        {modalities.length === 0 && <p className="text-sm text-gray-400 italic">No hay modalidades configuradas.</p>}
                                        {modalities.map(mod => {
                                            const isChecked = (currentConfig.modalities || []).includes(mod.id);
                                            return (
                                                <label key={mod.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                        checked={isChecked}
                                                        onChange={(e) => updateDefault('modality', mod.id, e.target.checked)}
                                                    />
                                                    <div className="ml-3">
                                                        <span className="text-sm font-medium text-gray-900 block">{mod.title || mod.name}</span>
                                                        <span className="text-xs text-gray-500">S/ {mod.price}</span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Workshops */}
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Talleres Disponibles</h4>
                                    <div className="space-y-2">
                                        {workshops.length === 0 && <p className="text-sm text-gray-400 italic">No hay talleres configurados.</p>}
                                        {workshops.map(ws => {
                                            const isChecked = (currentConfig.modalities || []).includes(ws.id);
                                            return (
                                                <label key={ws.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                        checked={isChecked}
                                                        onChange={(e) => updateDefault('modality', ws.id, e.target.checked)}
                                                    />
                                                    <div className="ml-3">
                                                        <span className="text-sm font-medium text-gray-900 block">{ws.name}</span>
                                                        <span className="text-xs text-gray-500">S/ {ws.price}</span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Access / Modules Tab
                            <div className="space-y-4">
                                <div className="bg-purple-50 text-purple-800 text-xs p-3 rounded-lg mb-4">
                                    <p>Selecciona los módulos a los que este rol tendrá acceso por defecto.</p>
                                    <p className="mt-1">Marca <strong>"Siempre"</strong> para bloquear este módulo y evitar que sea removido individualmente.</p>
                                </div>

                                {SYSTEM_MODULES.map(module => {
                                    const moduleConfig = (currentConfig.modules || {})[module.id] || {};
                                    const isEnabled = moduleConfig.enabled;
                                    const isLocked = moduleConfig.locked;
                                    const isMandatory = module.mandatory;

                                    return (
                                        <div key={`${module.id}-${selectedRole}`} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${isEnabled ? 'bg-white border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isEnabled ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-500'}`}>
                                                    <Shield size={18} />
                                                </div>
                                                <div>
                                                    <span className={`text-sm font-medium block ${isEnabled ? 'text-gray-900' : 'text-gray-500'}`}>{module.label}</span>
                                                    <span className="text-xs text-gray-400 capitalize">{module.category}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {/* Always Option (Lock) */}
                                                <label className={`flex items-center gap-1.5 cursor-pointer select-none text-xs font-medium ${isLocked ? 'text-amber-600' : 'text-gray-400 hover:text-gray-600'}`}>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={!!isLocked}
                                                        disabled={isMandatory}
                                                        onChange={(e) => updateDefault('access', module.id, e.target.checked, 'locked')}
                                                    />
                                                    <Lock size={14} className={isLocked ? 'fill-amber-600' : ''} />
                                                    {isLocked ? 'Siempre' : 'Opcional'}
                                                </label>

                                                {/* Enable Switch */}
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={!!(isEnabled || isMandatory)}
                                                        disabled={isMandatory}
                                                        onChange={(e) => updateDefault('access', module.id, e.target.checked)}
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                                </label>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoleAccessConfiguration;
