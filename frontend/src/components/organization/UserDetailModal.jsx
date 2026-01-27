import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { userService } from '../../api/users';
import { X, User, Shield, GraduationCap, FileText, Activity, MessageCircle, Printer, Check, Copy, AlertTriangle, Save, AlertOctagon, CreditCard, Briefcase, Building2, Stethoscope } from 'lucide-react';
import CustomQRCode from '../ui/CustomQRCode';
import PhotocheckModal from '../admin/PhotocheckModal';

import { api } from '../../services/api';
import showAlerts from '../../utils/alerts';
import { useAuth } from '../../context/AuthContext';

const UserDetailModal = ({ userId, onClose, onUserUpdated, initialTab = 'general' }) => {
    const { user: currentUser, refreshProfile } = useAuth();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(initialTab); // general | academico | seguridad | auditoria
    const printRef = useRef();

    // Roles y Módulos Dinámicos
    const [roleConfigs, setRoleConfigs] = useState({});
    const [systemModules, setSystemModules] = useState([]);

    // Estados para formularios internos
    const [newPassword, setNewPassword] = useState('');

    // Estados para Gestión de Acceso (Nivel 3.1)
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [selectedModules, setSelectedModules] = useState([]);
    const [hasAccessChanges, setHasAccessChanges] = useState(false);
    const [isPhotocheckOpen, setIsPhotocheckOpen] = useState(false);

    // Cargar la "Historia Clínica" y Configuración al abrir
    useEffect(() => {
        if (userId) {
            loadInitialData();
        }
    }, [userId]);

    const loadInitialData = async () => {
        try {
            setLoading(true);

            // Cargar Datos de Roles y Módulos del Sistema
            const matrix = await api.system.getRolesMatrix();
            setRoleConfigs(matrix.roles || {});
            setSystemModules(matrix.all_modules || []);

            // Cargar Detalle del Usuario
            const data = await userService.getDetail(userId);
            setUser(data);

            // Inicializar estados de acceso
            let roles = data.roles && data.roles.length > 0 ? data.roles : [data.eventRole || 'asistente'];

            // 🛡️ NORMALIZACIÓN: Convertir 'participante' (legacy) a 'asistente' (system)
            roles = roles.map(r => r.toLowerCase() === 'participante' ? 'asistente' : r);

            setSelectedRoles(roles);
            setSelectedModules(data.modules || []);
            setHasAccessChanges(false);

        } catch (error) {
            console.error("Fallo al cargar datos iniciales:", error);
            showAlerts.error('Error al cargar los datos del sistema.', 'Error de Carga');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    // Atajo ESC para cerrar
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const loadUserDetail = async () => {
        try {
            const data = await userService.getDetail(userId);
            setUser(data);
            setUser(data);

            // 🛡️ NORMALIZACIÓN: Convertir 'participante' (legacy) a 'asistente' (system)
            const rawRoles = data.roles || [];
            const cleanRoles = rawRoles.map(r => r.toLowerCase() === 'participante' ? 'asistente' : r);

            setSelectedRoles(cleanRoles);
            setSelectedModules(data.modules || []);
            setHasAccessChanges(false);
        } catch (error) {
            console.error("Error recargando usuario:", error);
        }
    };

    // --- ACCESO ---
    const handleRoleToggle = (roleId) => {
        const isSelected = selectedRoles.includes(roleId);
        let newRoles = [];
        let newModulesSet = new Set(selectedModules);

        if (isSelected) {
            // Quitar Rol
            newRoles = selectedRoles.filter(r => r !== roleId);
        } else {
            // Agregar Rol
            newRoles = [...selectedRoles, roleId];

            // Merge de módulos sugeridos (Single Source of Truth)
            const roleData = roleConfigs[roleId];
            if (roleData && roleData.default_modules) {
                roleData.default_modules.forEach(mod => newModulesSet.add(mod));
            }
        }

        // Validación: No dejar sin roles
        if (newRoles.length === 0) {
            showAlerts.warning('El usuario debe mantener al menos un rol.', 'Rol Requerido');
            return;
        }

        // Siempre re-inyectar mandatorios de TODOS los roles seleccionados
        newRoles.forEach(r => {
            const config = roleConfigs[r];
            if (config && config.mandatory_modules) {
                config.mandatory_modules.forEach(m => newModulesSet.add(m));
            }
        });

        setSelectedRoles(newRoles);
        setSelectedModules(Array.from(newModulesSet));
        setHasAccessChanges(true);
    };

    // Obtener lista de módulos mandatorios actuales
    const getMandatoryModules = () => {
        const mandatory = new Set();
        selectedRoles.forEach(r => {
            const config = roleConfigs[r];
            if (config && config.mandatory_modules) {
                config.mandatory_modules.forEach(m => mandatory.add(m));
            }
        });
        return mandatory;
    };

    const handleModuleToggle = (modId) => {
        const mandatory = getMandatoryModules();
        if (mandatory.has(modId)) return; // No permitir toggle si es mandatorio

        const isSelected = selectedModules.includes(modId);
        let newModules = [];
        if (isSelected) {
            newModules = selectedModules.filter(m => m !== modId);
        } else {
            newModules = [...selectedModules, modId];
        }
        setSelectedModules(newModules);
        setHasAccessChanges(true);
    };

    const handleSaveAccess = async () => {
        if (!hasAccessChanges) return;
        try {
            setLoading(true);
            const updatedUser = await userService.updateAccess(user.id, selectedRoles, selectedModules);
            setUser(updatedUser);
            // El backend ya filtró y volvió a inyectar mandatorios, recargamos
            setSelectedRoles(updatedUser.roles || []);
            setSelectedModules(updatedUser.modules || []);
            setHasAccessChanges(false);

            // 🔄 IMMEDIATE EFFECT: If editing self, refresh global permission state
            if (currentUser && currentUser.id === user.id) {
                console.log("Refreshing own profile permissions...");
                await refreshProfile();
            }

            showAlerts.success('Accesos actualizados y validados por el sistema.', 'Accesos Actualizados');
            if (onUserUpdated) onUserUpdated();
        } catch (error) {
            console.error(error);
            showAlerts.error('Error al guardar accesos.');
        } finally {
            setLoading(false);
        }
    };

    // --- SEGURIDAD ---
    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            return showAlerts.warning('La contraseña debe tener al menos 6 caracteres.', 'Contraseña Corta');
        }

        const confirmed = await showAlerts.confirm(
            "Esta acción es irreversible y quedará registrada en auditoría.",
            "¿Estás seguro?",
            { confirmColor: '#ef4444', confirmText: 'Sí, resetear contraseña' }
        );

        if (confirmed) {
            try {
                await userService.resetPassword(userId, newPassword);
                showAlerts.success('Contraseña actualizada correctamente.');
                setNewPassword('');
                loadUserDetail();
            } catch (error) {
                showAlerts.error('Error al actualizar contraseña.');
            }
        }
    };

    const handleDeactivate = async () => {
        const confirmed = await showAlerts.deleteConfirm(
            "El usuario perderá acceso inmediato al sistema.",
            "¿Dar de baja?"
        );

        if (confirmed) {
            try {
                await userService.deactivate(userId);
                showAlerts.success('Usuario desactivado correctamente.', 'Desactivado');
                if (onUserUpdated) onUserUpdated();
                onClose();
            } catch (error) {
                showAlerts.error('Error al desactivar al usuario.');
            }
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (!user && loading) return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white p-10 rounded-xl shadow-2xl text-center">
                <Activity className="animate-pulse text-indigo-600 mx-auto mb-4" size={48} />
                <p className="text-slate-600 font-medium">Cargando Historia Clínica...</p>
            </div>
        </div>
    );

    if (!user) return null;

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Usuario';
    const displayRole = user.eventRole || 'asistente';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            {/* WIDENED MODAL: max-w-6xl */}
            <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* === HEADER: SIGNOS VITALES === */}
                <div className="bg-slate-900 text-white p-6 flex justify-between items-start shrink-0">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-indigo-500 overflow-hidden">
                            {user.image ?
                                <img src={user.image} alt="" className="w-full h-full object-cover" /> :
                                <span>{user.firstName ? user.firstName[0] : 'U'}{user.lastName ? user.lastName[0] : ''}</span>
                            }
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                {fullName}
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {user.isActive ? 'ACTIVO' : 'INACTIVO'}
                                </span>
                            </h2>
                            <div className="text-slate-400 text-sm flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                <span className="flex items-center gap-1">🆔 {user.dni || 'S/D'}</span>
                                <span className="flex items-center gap-1">📧 {user.email}</span>
                                <div className="flex gap-1">
                                    {(user.roles || [displayRole])
                                        .sort((a, b) => (roleConfigs[a]?.priority || 99) - (roleConfigs[b]?.priority || 99))
                                        .map((r) => {
                                            const cleanRole = r.toLowerCase() === 'participante' ? 'asistente' : r;
                                            return (
                                                <span key={r} className="text-[10px] bg-slate-800 border border-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider">{cleanRole}</span>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
                        <X size={28} />
                    </button>
                </div>

                {/* === NAVEGACIÓN: PESTAÑAS === */}
                <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
                    <TabButton id="general" icon={<User size={18} />} label="Perfil General" active={activeTab} set={setActiveTab} />
                    <TabButton id="academico" icon={<GraduationCap size={18} />} label="Académico" active={activeTab} set={setActiveTab} />
                    {/* RENAMED tab to 'seguridad' but label is "Gestión Acceso" per logic */}
                    <TabButton id="seguridad" icon={<Shield size={18} />} label="Gestión de Acceso" active={activeTab} set={setActiveTab} />
                    <TabButton id="auditoria" icon={<Activity size={18} />} label="Auditoría (Logs)" active={activeTab} set={setActiveTab} />
                </div>

                {/* === CUERPO (CONTENIDO) === */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">

                    {/* --- TAB 1: GENERAL --- */}
                    {activeTab === 'general' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-left-4 duration-300">
                            <div className="space-y-6">
                                <InfoCard title="Datos de Contacto">
                                    <InfoItem icon={MessageCircle} label="Teléfono" value={user.phone || "No registrado"} />
                                    <InfoItem icon={User} label="Fecha Nacimiento" value={user.birthDate || "--/--/----"} />
                                    <InfoItem icon={User} label="DNI" value={user.dni} />

                                    <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                                        {user.phone && (
                                            <a href={`https://wa.me/51${user.phone.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm text-sm font-medium">
                                                <MessageCircle size={16} /> WhatsApp
                                            </a>
                                        )}
                                        <button
                                            onClick={() => setIsPhotocheckOpen(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium">
                                            <CreditCard size={16} /> Fotocheck
                                        </button>
                                        <button
                                            onClick={handlePrint}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium">
                                            <Printer size={16} /> Imprimir Ficha
                                        </button>
                                    </div>
                                </InfoCard>

                                {/* DATOS PROFESIONALES */}
                                <InfoCard title="Datos Profesionales">
                                    <InfoItem icon={Briefcase} label="Ocupación" value={user.occupation || "No especificada"} />

                                    {(user.specialty || user.occupation?.toLowerCase().includes('médico') || user.occupation?.toLowerCase().includes('residente')) && (
                                        <InfoItem icon={Stethoscope} label="Especialidad" value={user.specialty || "No especificada"} />
                                    )}

                                    {user.residencyYear && (
                                        <InfoItem icon={GraduationCap} label="Año de Residencia" value={user.residencyYear} />
                                    )}

                                    <InfoItem icon={Building2} label="Institución / Trabajo" value={user.institution || "No registrada"} />

                                    {user.university && (
                                        <InfoItem icon={GraduationCap} label="Universidad" value={user.university} />
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoItem icon={Activity} label="CMP" value={user.cmp_number || '-'} />
                                        <InfoItem icon={Activity} label="RNE" value={user.rne_number || '-'} />
                                    </div>
                                </InfoCard>
                            </div>

                            <div className="space-y-6">
                                <InfoCard title="Inscripción y Acceso">
                                    <InfoRow label="Modalidad" value={user.participationModality} highlight />
                                    <InfoRow label="Estado Pago" value="✅ VALIDADO / PAGADO" highlight />
                                    <InfoRow label="Fecha Registro" value={user.registrationDate ? new Date(user.registrationDate).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "--/--/----"} />
                                    <InfoRow label="Último Acceso" value={user.lastLogin || "Nunca"} />

                                    {user.inscribedWorkshops && user.inscribedWorkshops.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <span className="text-xs text-slate-400 uppercase font-black tracking-widest block mb-2">Talleres Inscritos</span>
                                            <div className="space-y-1.5">
                                                {user.inscribedWorkshops.map((ws, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                                                        <Activity size={14} className="shrink-0" />
                                                        {ws}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </InfoCard>

                                <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Activity className="text-indigo-500" size={18} /> QR de Seguridad
                                    </h3>
                                    <div className="flex flex-col items-center">
                                        <div className="bg-white p-3 border-2 border-slate-100 rounded-xl shadow-inner">
                                            <CustomQRCode value={JSON.stringify({ id: user.id, dni: user.dni, n: fullName })} size={140} />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-3 font-mono">SÍNCRONO - VÁLIDO PARA CONTROL DE PUERTA</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB 2: ACADÉMICO --- */}
                    {activeTab === 'academico' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            {/* Progress Panel */}
                            <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Activity className="text-blue-500" size={20} /> Progreso de Asistencia
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-slate-600">Asistencia Acumulada</span>
                                        <span className={`text-lg font-black ${(user.attendancePercent || 0) >= 60 ? 'text-green-600' : 'text-blue-600'}`}>
                                            {user.attendancePercent || 0}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 border border-slate-200">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${(user.attendancePercent || 0) >= 60 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-indigo-500 animate-pulse'}`}
                                            style={{ width: `${user.attendancePercent || 0}%` }}
                                        ></div>
                                    </div>
                                    <div className={`p-3 rounded-lg text-xs flex gap-3 ${(user.attendancePercent || 0) >= 60 ? 'bg-green-50 border-green-100 text-green-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                                        {(user.attendancePercent || 0) >= 60 ? (
                                            <>
                                                <Check size={16} className="shrink-0" />
                                                <p><strong>Meta Alcanzada:</strong> El usuario cumple con el requisito mínimo del 60% para la certificación.</p>
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle size={16} className="shrink-0" />
                                                <p><strong>En Progreso:</strong> Se requiere alcanzar al menos el 60% de asistencia para habilitar el certificado.</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Misma lógica académica de la versión anterior */}
                            <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                                    <span className="flex items-center gap-2"><FileText className="text-indigo-500" size={20} /> Trabajos de Investigación</span>
                                </h3>
                                {user.submittedAbstracts && user.submittedAbstracts.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {user.submittedAbstracts.map((abs) => (
                                            <div key={abs.id} className="flex flex-col md:flex-row justify-between md:items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="flex gap-3">
                                                    <div className="mt-1"><AlertTriangle size={16} className="text-amber-500" /></div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-800">{abs.title}</h4>
                                                        <p className="text-xs text-slate-500 mt-1">Especialidad: {user.specialty || 'General'}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-bold">{abs.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-400 italic text-center py-8">No ha enviado trabajos.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- TAB 3: GESTIÓN DE ACCESO (UNIFIED) --- */}
                    {activeTab === 'seguridad' && (
                        <div className="animate-in fade-in duration-300 space-y-8">

                            {/* PARTE SUPERIOR: MATRIZ DE ACCESO */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                                        <Shield className="text-indigo-600" size={24} /> Gestión Clínico-Administrativa
                                    </h3>
                                    {hasAccessChanges && (
                                        <button
                                            onClick={handleSaveAccess}
                                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow-md animate-bounce-short">
                                            <Save size={18} /> Guardar Cambios
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* COLUMNA 1: ROLES (Identidad) */}
                                    <div>
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
                                            1. Roles Asignados (Identidad)
                                        </h4>
                                        <div className="space-y-3">
                                            {Object.entries(roleConfigs)
                                                .sort(([, a], [, b]) => (a.priority || 99) - (b.priority || 99))
                                                .map(([slug, config]) => {
                                                    const isSelected = selectedRoles.includes(slug);
                                                    return (
                                                        <label key={slug} className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                                                        ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-300'}`}>
                                                            <input
                                                                type="checkbox"
                                                                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                                                checked={isSelected}
                                                                onChange={() => handleRoleToggle(slug)}
                                                            />
                                                            <div className="ml-3 flex-1">
                                                                <span className="font-bold text-slate-700 block">{config.label || config.name}</span>
                                                                <p className="text-[10px] text-slate-400 leading-tight">{config.description}</p>
                                                            </div>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold bg-slate-100 text-slate-600 border border-slate-200`}>
                                                                {slug}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                        </div>
                                    </div>

                                    {/* COLUMNA 2: MÓDULOS (Permisos Efectivos) */}
                                    <div>
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
                                            2. Módulos Habilitados (Permisos)
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {systemModules.map((mod) => {
                                                const isActive = selectedModules.includes(mod.id);
                                                const mandatoryModules = getMandatoryModules();
                                                const isMandatory = mandatoryModules.has(mod.id);

                                                return (
                                                    <label
                                                        key={mod.id}
                                                        className={`flex items-center gap-2 p-2 rounded border transition-colors select-none
                                                            ${isMandatory ? 'bg-indigo-50 border-indigo-200 cursor-not-allowed' :
                                                                isActive ? 'bg-white border-green-200 shadow-sm cursor-pointer' :
                                                                    'bg-slate-50 border-transparent opacity-60 cursor-pointer'}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={isActive}
                                                            onChange={() => handleModuleToggle(mod.id)}
                                                            disabled={isMandatory}
                                                        />
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center
                                                            ${isActive ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300'}`}>
                                                            {isMandatory ? (
                                                                <Shield size={10} className="text-white" />
                                                            ) : (
                                                                isActive && <Check size={10} className="text-white" />
                                                            )}
                                                        </div>
                                                        <span className={`text-sm ${isActive ? 'font-bold text-slate-800' : 'text-slate-500'} flex items-center gap-1`}>
                                                            {mod.label}
                                                            {isMandatory && <Shield size={12} className="text-indigo-400" title="Requerido por Rol" />}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <div className="mt-4 p-3 bg-indigo-50 text-indigo-800 text-xs rounded border border-indigo-100 italic">
                                            💡 <strong>Módulo Mandatorio:</strong> Los módulos marcados con <Shield size={12} className="inline mb-1" /> están bloqueados porque son requeridos por los roles asignados.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PARTE INFERIOR: ZONA DE PELIGRO */}
                            <div className="border-t border-slate-200 pt-8 mt-4">
                                <h3 className="font-bold text-red-700 mb-4 flex items-center gap-2">
                                    <AlertOctagon size={24} /> Zona de Peligro (Code Red)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-red-50 p-6 rounded-lg border border-red-100">
                                        <label className="block text-xs font-bold text-red-700 uppercase mb-2 tracking-wider">Resetear Contraseña</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="password"
                                                placeholder="Nueva contraseña"
                                                className="flex-1 border-red-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 bg-white"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                autoComplete="new-password"
                                            />
                                            <button
                                                onClick={handleResetPassword}
                                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md">
                                                Resetear
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg border-2 border-dashed border-red-200 flex flex-col justify-center items-center text-center">
                                        <p className="text-xs text-slate-500 mb-3">Esta acción desactivará el acceso pero mantendrá la integridad de datos históricos.</p>
                                        <button
                                            onClick={handleDeactivate}
                                            className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-red-200 hover:border-red-300">
                                            Dar de Baja (Soft Delete)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB 4: AUDITORÍA --- */}
                    {activeTab === 'auditoria' && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
                            {/* Tabla de auditoría, mismo código */}
                            <div className="bg-slate-100 px-6 py-4 flex justify-between items-center border-b border-slate-200">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Activity size={18} className="text-indigo-600" /> Bitácora Quirúrgica (Eventos Críticos)
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-slate-600">
                                    <thead className="text-[10px] text-slate-400 uppercase bg-slate-50 tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Fecha</th>
                                            <th className="px-6 py-4 font-bold">Acción</th>
                                            <th className="px-6 py-4 font-bold">Admin</th>
                                            <th className="px-6 py-4 font-bold text-right">Detalles</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {user.auditLog && user.auditLog.map((log, index) => (
                                            <tr key={index} className="bg-white hover:bg-slate-50">
                                                <td className="px-6 py-4 font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                                                <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{log.action}</span></td>
                                                <td className="px-6 py-4">{log.admin_name}</td>
                                                <td className="px-6 py-4 text-right overflow-hidden max-w-xs truncate" title={JSON.stringify(log.details)}>{JSON.stringify(log.details)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>

                <PhotocheckModal
                    isOpen={isPhotocheckOpen}
                    onClose={() => setIsPhotocheckOpen(false)}
                    attendee={user}
                />

                {/* Portales de impresión */}
                {createPortal(
                    <div id="user-detail-print" className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black" ref={printRef}>
                        {/* HEADER INSTITUCIONAL */}
                        <div className="flex justify-between items-center border-b-2 border-slate-800 pb-4 mb-6">
                            <div className="flex items-center gap-4">
                                {/* Placeholder logo - replace with real one if available */}
                                <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                    IN
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold leading-tight">INSTITUTO NACIONAL DE CIENCIAS NEUROLÓGICAS</h1>
                                    <p className="text-sm text-slate-600 font-bold uppercase">XXXI Semana de Investigación del Médico Residente (SIMR 2026)</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 uppercase tracking-widest">Ficha de Inscripción</p>
                                <p className="text-lg font-mono font-bold">{user.id.toString().padStart(6, '0')}</p>
                            </div>
                        </div>

                        {/* CUERPO DE LA FICHA */}
                        <div className="grid grid-cols-3 gap-8">

                            {/* COLUMNA IZQUIERDA: PERFIL VISUAL */}
                            <div className="col-span-1 space-y-6">
                                <div className="aspect-square w-full bg-slate-100 rounded-xl border-2 border-slate-200 overflow-hidden relative">
                                    {user.image ? (
                                        <img src={user.image} alt="" className="w-full h-full object-cover grayscale" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-6xl font-bold">
                                            {user.firstName ? user.firstName[0] : ''}
                                        </div>
                                    )}
                                </div>

                                <div className="border border-slate-800 p-4 rounded-lg text-center">
                                    <h3 className="text-xs font-black uppercase text-slate-500 mb-2">Código QR de Acceso</h3>
                                    <div className="flex justify-center">
                                        <CustomQRCode value={JSON.stringify({ id: user.id, dni: user.dni, n: fullName })} size={140} />
                                    </div>
                                    <p className="text-[10px] mt-2 font-mono">Válido para Sede Central</p>
                                </div>
                            </div>

                            {/* COLUMNA DERECHA: DATOS */}
                            <div className="col-span-2 space-y-6">

                                {/* 1. DATOS PERSONALES */}
                                <div>
                                    <h2 className="text-sm font-black uppercase bg-slate-100 p-2 rounded mb-3 border-l-4 border-slate-800">1. Datos del Participante</h2>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                        <div className="col-span-2">
                                            <span className="block text-[10px] uppercase text-slate-500 font-bold">Apellidos y Nombres</span>
                                            <span className="block font-bold text-lg border-b border-dashed border-slate-300 pb-1">{fullName.toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase text-slate-500 font-bold">Documento de Identidad (DNI/CNE)</span>
                                            <span className="block font-mono font-bold text-base">{user.dni}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase text-slate-500 font-bold">Fecha de Nacimiento</span>
                                            <span className="block font-medium">{user.birthDate ? new Date(user.birthDate).toLocaleDateString() : '-'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase text-slate-500 font-bold">Correo Electrónico</span>
                                            <span className="block font-medium">{user.email}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase text-slate-500 font-bold">Teléfono / WhatsApp</span>
                                            <span className="block font-mono">{user.phone || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. DATOS PROFESIONALES */}
                                <div>
                                    <h2 className="text-sm font-black uppercase bg-slate-100 p-2 rounded mb-3 border-l-4 border-slate-800">2. Perfil Profesional</h2>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                        <div>
                                            <span className="block text-[10px] uppercase text-slate-500 font-bold">Ocupación</span>
                                            <span className="block font-bold uppercase">{user.occupation || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase text-slate-500 font-bold">Especialidad</span>
                                            <span className="block font-medium uppercase">{user.specialty || '-'}</span>
                                        </div>

                                        {(user.cmp_number || user.rne_number) && (
                                            <>
                                                <div>
                                                    <span className="block text-[10px] uppercase text-slate-500 font-bold">CMP</span>
                                                    <span className="block font-mono">{user.cmp_number || '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] uppercase text-slate-500 font-bold">RNE</span>
                                                    <span className="block font-mono">{user.rne_number || '-'}</span>
                                                </div>
                                            </>
                                        )}

                                        <div className="col-span-2">
                                            <span className="block text-[10px] uppercase text-slate-500 font-bold">Institución / Sede Laboral</span>
                                            <span className="block font-medium uppercase">{user.institution || '-'}</span>
                                        </div>

                                        {user.university && (
                                            <div className="col-span-2">
                                                <span className="block text-[10px] uppercase text-slate-500 font-bold">Universidad de Procedencia</span>
                                                <span className="block font-medium uppercase">{user.university}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 3. INSCRIPCIÓN */}
                                <div>
                                    <h2 className="text-sm font-black uppercase bg-slate-100 p-2 rounded mb-3 border-l-4 border-slate-800">3. Datos de Inscripción</h2>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                        <div>
                                            <span className="block text-[10px] uppercase text-slate-500 font-bold">Modalidad</span>
                                            <span className="block font-bold text-indigo-900 border border-indigo-200 bg-indigo-50 px-2 py-0.5 rounded text-xs w-fit">{user.participationModality || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase text-slate-500 font-bold">Rol en Evento</span>
                                            <span className="block font-bold uppercase text-xs">{displayRole}</span>
                                        </div>
                                        <div className="col-span-2 mt-2">
                                            <span className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Talleres / Actividades Adicionales</span>
                                            {user.inscribedWorkshops && user.inscribedWorkshops.length > 0 ? (
                                                <ul className="list-disc list-inside text-xs space-y-1">
                                                    {user.inscribedWorkshops.map((ws, i) => (
                                                        <li key={i}>{ws}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Ningún taller adicional inscrito.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="mt-12 pt-4 border-t-2 border-slate-800 flex justify-between items-end text-[10px] text-slate-500">
                            <div>
                                <p>Generado por: {currentUser?.firstName} {currentUser?.lastName}</p>
                                <p>Fecha de Impresión: {new Date().toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p>SIMR App v2.1.0 - Sistema de Gestión Académica</p>
                                <p className="font-mono">ID: {user.id} | REF: {user.dni}</p>
                            </div>
                        </div>

                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
};

// --- SUBCOMPONENTES VISUALES ---
const TabButton = ({ id, icon, label, active, set }) => (
    <button
        onClick={() => set(id)}
        className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all border-b-2
      ${active === id ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
    >
        {icon} {label}
    </button>
);

const InfoCard = ({ title, children }) => (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
            {title}
        </h3>
        <div className="space-y-3">{children}</div>
    </div>
);

const InfoRow = ({ label, value, highlight }) => (
    <div className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
        <span className="text-sm text-slate-400 uppercase font-bold text-xs tracking-wider">{label}</span>
        <span className={`text-sm font-medium ${highlight ? 'text-indigo-600 font-black' : 'text-slate-800'}`}>{value || '-'}</span>
    </div>
);

const InfoItem = ({ icon: Icon, label, value }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        if (!value || value === '-') return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400 border border-slate-100"><Icon size={16} /></div>
            <div className="flex-grow min-w-0">
                <p className="text-xs text-slate-400 uppercase font-black tracking-widest">{label}</p>
                <div className="flex items-center gap-1.5">
                    <p className="text-slate-700 font-bold text-base truncate" title={value}>{value || '-'}</p>
                    <button onClick={handleCopy} className="p-1 hover:bg-slate-100 rounded text-slate-300 hover:text-indigo-500 transition-colors">{copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}</button>
                </div>
            </div>
        </div>
    );
};

export default UserDetailModal;
