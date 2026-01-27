import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { MODULE_CONFIG } from '../../constants';
// Fallback for icons if lucide-react is not fully available or named exports differ
import { Plus, Save, Trash2, CheckCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';

const RolesTab = ({ modalities, workshops, definedRoles = [] }) => {
    const [roleProfiles, setRoleProfiles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saveMessage, setSaveMessage] = useState(null); // Estado para mensaje temporal

    // Módulos disponibles (Extraídos de tu constante)
    const availableModules = MODULE_CONFIG ? Object.keys(MODULE_CONFIG) : ['mi_perfil', 'aula_virtual', 'organizacion', 'secretaria', 'contabilidad', 'investigacion', 'jurado', 'academico'];

    // Helper to generate slug
    const generateSlug = (name) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    };

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            const data = await api.roles.getAll();
            setRoleProfiles(data);
        } catch (error) {
            console.error("Error loading roles", error);
            toast.error("Error cargando perfiles");
        } finally {
            setLoading(false);
        }
    };

    // Derived list: Combine definedRoles (Strings) with existing Profiles (Objects)
    // Map definedRoles to objects. If profile exists, use it. If not, use draft.
    const mergedRoles = definedRoles.map(roleName => {
        const slug = generateSlug(roleName);
        const existingProfile = roleProfiles.find(r => r.slug === slug || r.name.toLowerCase() === roleName.toLowerCase());

        if (existingProfile) return { ...existingProfile, isDraft: false };

        // Return Draft
        return {
            id: null,
            name: roleName,
            slug: slug,
            description: '',
            default_modules: [],
            mandatory_modules: [],
            default_modality_id: null,
            default_workshops: [],
            priority: 99,
            isDraft: true
        };
    });

    const handleSelectRole = (role) => {
        setSelectedRole(role);
        setSaveMessage(null); // Limpiar mensaje al cambiar
    };

    const handleSaveRole = async () => {
        if (!selectedRole) return;
        setSaveMessage(null);
        try {
            if (selectedRole.isDraft || !selectedRole.id) {
                // CREATE
                const newRole = await api.roles.create({
                    name: selectedRole.name,
                    slug: selectedRole.slug,
                    description: selectedRole.description,
                    default_modules: selectedRole.default_modules,
                    mandatory_modules: selectedRole.mandatory_modules,
                    default_modality_id: selectedRole.default_modality_id,
                    default_workshops: selectedRole.default_workshops,
                    priority: selectedRole.priority || 99
                });
                setRoleProfiles([...roleProfiles, newRole]);
                setSelectedRole(newRole);
                toast.success("Perfil creado y guardado");
            } else {
                // UPDATE
                const updated = await api.roles.update(selectedRole.id, selectedRole);
                setRoleProfiles(roleProfiles.map(r => r.id === selectedRole.id ? updated : r));
                setSelectedRole(updated);
                toast.success("Perfil actualizado");
            }

            // Mostrar mensaje de éxito temporal
            setSaveMessage("¡Configuración Guardada!");
            setTimeout(() => setSaveMessage(null), 3000);

        } catch (error) {
            console.error("Error saving role", error);
            toast.error("Error guardando cambios");
        }
    };

    // --- Lógica de Permisos (Misma que antes) ---
    const toggleModule = (modKey, type) => {
        if (!selectedRole) return;
        const currentList = selectedRole[`${type}_modules`] || [];
        let newList;

        if (currentList.includes(modKey)) {
            newList = currentList.filter(k => k !== modKey);
        } else {
            newList = [...currentList, modKey];
        }

        if (type === 'mandatory' && !currentList.includes(modKey)) {
            const defaults = selectedRole.default_modules || [];
            if (!defaults.includes(modKey)) {
                setSelectedRole(prev => ({
                    ...prev,
                    mandatory_modules: newList,
                    default_modules: [...defaults, modKey]
                }));
                return;
            }
        }
        setSelectedRole(prev => ({ ...prev, [`${type}_modules`]: newList }));
    };

    if (loading) return <div>Cargando perfiles...</div>;

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[600px]">
            {/* SIDEBAR: LISTA DE ROLES (SOLO LECTURA DESDE PARAMETROS) */}
            <div className="w-full md:w-1/4 bg-slate-50 border rounded-lg p-4 flex flex-col">
                <div className="mb-4">
                    <h3 className="font-bold text-slate-700">Perfiles</h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Sincronizado con "Parámetros"
                    </p>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                    {mergedRoles.length === 0 && (
                        <div className="text-xs text-slate-400 p-2 text-center border-2 border-dashed rounded">
                            No hay roles definidos en Parámetros.
                        </div>
                    )}
                    {mergedRoles.map(role => (
                        <button
                            key={role.slug}
                            onClick={() => handleSelectRole(role)}
                            className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex justify-between items-center
                                ${selectedRole?.slug === role.slug ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 text-slate-600'}
                            `}
                        >
                            {role.name}
                            {role.isDraft && (
                                <span className="text-[10px] bg-amber-100 text-amber-700 px-1 rounded border border-amber-200">
                                    Nuevo
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN: CONFIGURACIÓN DETALLADA */}
            <div className="flex-1 bg-white border rounded-lg p-6 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedRole ? (
                        <>
                            <div className="flex justify-between items-start mb-6 border-b pb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">{selectedRole.name}</h2>
                                    <p className="text-xs text-slate-400 font-mono">
                                        Slug: {selectedRole.slug} {selectedRole.isDraft && '(No guardado en DB)'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {saveMessage && (
                                        <span className="text-sm font-medium text-emerald-600 animate-fadeIn bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                                            <CheckCircle size={14} /> {saveMessage}
                                        </span>
                                    )}
                                    <button
                                        onClick={handleSaveRole}
                                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition-colors"
                                    >
                                        <Save size={18} /> Guardar Configuración
                                    </button>
                                </div>
                            </div>

                            {/* SECCIÓN 1: METABOLISMO (Configuración) */}
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Modalidad por Defecto</label>
                                    <select
                                        className="w-full border rounded p-2 text-sm"
                                        value={selectedRole.default_modality_id || ""}
                                        onChange={(e) => setSelectedRole({ ...selectedRole, default_modality_id: e.target.value || null })}
                                    >
                                        <option value="">-- Ninguna --</option>
                                        {modalities.map(m => (
                                            <option key={m.id} value={m.id}>{m.title} - S/ {m.price}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-slate-500 mt-1">Se asignará automáticamente al crear usuario.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Talleres Sugeridos</label>
                                    <div className="border rounded p-2 h-24 overflow-y-auto bg-slate-50">
                                        {/* Aquí asumimos que workshops es una lista de objetos */}
                                        {workshops.map(ws => (
                                            <label key={ws.id} className="flex items-center gap-2 text-xs py-1">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRole.default_workshops?.includes(String(ws.id))}
                                                    onChange={(e) => {
                                                        const id = String(ws.id);
                                                        const current = selectedRole.default_workshops || [];
                                                        // Ensure current is array
                                                        const safeCurrent = Array.isArray(current) ? current : [];
                                                        const next = e.target.checked
                                                            ? [...safeCurrent, id]
                                                            : safeCurrent.filter(x => x !== id);
                                                        setSelectedRole({ ...selectedRole, default_workshops: next });
                                                    }}
                                                />
                                                {ws.title || ws.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Prioridad (1 = Mayor)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="999"
                                        className="w-full border rounded p-2 text-sm"
                                        value={selectedRole.priority || 99}
                                        onChange={(e) => setSelectedRole({ ...selectedRole, priority: parseInt(e.target.value) || 99 })}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Define la relevancia del rol cuando hay múltiples asignados (ej: 1=Organizador, 10=Asistente).</p>
                                </div>
                            </div>

                            {/* SECCIÓN 2: SISTEMA NERVIOSO (Permisos) */}
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <ShieldAlert size={18} className="text-blue-600" />
                                Matriz de Permisos
                            </h3>

                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 text-slate-600">
                                        <tr>
                                            <th className="p-3">Módulo</th>
                                            <th className="p-3 text-center">Acceso por Defecto</th>
                                            <th className="p-3 text-center">Es Obligatorio</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {availableModules.map(modKey => {
                                            const isDefault = selectedRole.default_modules?.includes(modKey);
                                            const isMandatory = selectedRole.mandatory_modules?.includes(modKey);

                                            return (
                                                <tr key={modKey} className="hover:bg-slate-50">
                                                    <td className="p-3 font-medium text-slate-700">
                                                        {MODULE_CONFIG && MODULE_CONFIG[modKey] ? (MODULE_CONFIG[modKey].label || modKey) : modKey}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button
                                                            onClick={() => toggleModule(modKey, 'default')}
                                                            className={`p-1 rounded transition-colors ${isDefault ? 'text-green-600 bg-green-100' : 'text-slate-300'}`}
                                                        >
                                                            <CheckCircle size={20} />
                                                        </button>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button
                                                            onClick={() => toggleModule(modKey, 'mandatory')}
                                                            className={`p-1 rounded transition-colors ${isMandatory ? 'text-red-600 bg-red-100' : 'text-slate-300'}`}
                                                            title="Si está activo, el usuario NO podrá perder este acceso"
                                                        >
                                                            <ShieldAlert size={20} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            Selecciona un rol para editar su ADN
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RolesTab;
