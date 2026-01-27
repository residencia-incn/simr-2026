import React from 'react';
import { Key, ShieldCheck, Info, Crown, AlertTriangle } from 'lucide-react';

interface TabRulesProps {
    formData: {
        allowed_modality_ids: string[];
        linked_workshop_id: string | number | null;
        allowed_vip_roles?: string[]; // Optional in case not initialized
    };
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    allModalities: any[];
    allWorkshops: any[];
    allRoles: any[];
}

const TabRules: React.FC<TabRulesProps> = ({ formData, setFormData, allModalities, allWorkshops, allRoles }) => {

    // Toggle para Modalidades
    const toggleModality = (modalityId: string) => {
        setFormData((prev: any) => {
            const currentIds = prev.allowed_modality_ids || [];
            if (currentIds.includes(modalityId)) {
                return { ...prev, allowed_modality_ids: currentIds.filter((id: string) => id !== modalityId) };
            } else {
                return { ...prev, allowed_modality_ids: [...currentIds, modalityId] };
            }
        });
    };

    // Toggle para Roles VIP
    const toggleVipRole = (roleSlug: string) => {
        setFormData((prev: any) => {
            const currentRoles = prev.allowed_vip_roles || [];
            if (currentRoles.includes(roleSlug)) {
                return { ...prev, allowed_vip_roles: currentRoles.filter((r: string) => r !== roleSlug) };
            } else {
                return { ...prev, allowed_vip_roles: [...currentRoles, roleSlug] };
            }
        });
    };

    const handleWorkshopChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData((prev: any) => ({
            ...prev,
            linked_workshop_id: e.target.value || null
        }));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">

            {/* SECCIÓN A: ACCESO POR MODALIDAD */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <Key size={18} className="text-purple-600" />
                    1. ¿Qué modalidades entran?
                </h3>

                {/* VALIDACIÓN DE DATOS VACÍOS */}
                {(!allModalities || allModalities.length === 0) ? (
                    <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg flex items-center gap-2 border border-red-100">
                        <AlertTriangle size={18} />
                        ⚠️ No se cargaron las modalidades. Revisa la configuración del sistema.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {allModalities.map(mod => (
                            <label
                                key={mod.id || mod.code}
                                className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all select-none ${formData.allowed_modality_ids?.includes(mod.id || mod.code)
                                    ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500 shadow-sm'
                                    : 'bg-white hover:bg-slate-100 border-slate-200'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={formData.allowed_modality_ids?.includes(mod.id || mod.code) || false}
                                    onChange={() => toggleModality(mod.id || mod.code)}
                                    className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500 mr-3"
                                />
                                <div>
                                    <div className="font-semibold text-sm text-slate-800">{mod.title || mod.label}</div>
                                    <div className="text-xs text-slate-500">Cod: {mod.code || mod.id}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* SECCIÓN B: ROLES VIP */}
            <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
                <h3 className="text-sm font-bold text-amber-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <Crown size={18} className="text-amber-600" />
                    2. Acceso VIP (Staff)
                </h3>
                <div className="flex flex-wrap gap-4">
                    {/* Render default roles if allRoles is empty (fallback) */}
                    {(allRoles && allRoles.length > 0 ? allRoles : [
                        { id: 'organizador', name: 'Organizador' },
                        { id: 'ponente', name: 'Ponente' },
                        { id: 'admin', name: 'Admin' }
                    ]).map(role => (
                        <label key={role.id || role.code} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                            <input
                                type="checkbox"
                                checked={formData.allowed_vip_roles?.includes(role.id || role.code) || false}
                                onChange={() => toggleVipRole(role.id || role.code)}
                                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 accent-amber-600"
                            />
                            <span className="text-sm font-medium capitalize text-amber-900">{role.name || role.title || role.label || role.id}</span>
                        </label>
                    ))}
                </div>
                <p className="text-xs text-amber-700/80 mt-3 flex items-center gap-1.5">
                    <Info size={14} />
                    Los usuarios con estos roles entrarán siempre, sin importar su modalidad.
                </p>
            </div>

            {/* SECCIÓN C: VINCULACIÓN A TALLER */}
            <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    3. Vinculación a Taller
                </h3>

                <div className="flex gap-4 items-start">
                    <div className="flex-1">
                        <select
                            value={formData.linked_workshop_id || ""}
                            onChange={handleWorkshopChange}
                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium text-slate-700"
                        >
                            <option value="">-- No vinculado (Curso General) --</option>
                            {allWorkshops.map(ws => (
                                <option key={ws.id} value={ws.id}>
                                    Sí, exclusivo para: {ws.title || ws.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TabRules;
