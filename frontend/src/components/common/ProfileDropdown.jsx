import React from 'react';
import {
    LogOut, Users, FileText, BookOpen, Award, DollarSign, User, CircleUser,
    ShieldCheck, UserCheck, Microscope, GraduationCap, Gavel, FolderOpen, Presentation, QrCode
} from 'lucide-react';

export const ROLE_LABELS = {
    organizacion: 'Organización',
    secretaria: 'Secretaría',
    investigacion: 'Investigación',
    asistencia: 'Asistencia',
    jurado: 'Jurado',
    contabilidad: 'Contabilidad',
    aula_virtual: 'Aula Virtual',
    trabajos: 'Trabajos',
    academico: 'Académico',
    mi_perfil: 'Mi Perfil'
};

export const ROLE_ICONS = {
    organizacion: ShieldCheck,
    secretaria: FileText,
    investigacion: Microscope,
    asistencia: QrCode,
    jurado: Gavel,
    contabilidad: DollarSign,
    aula_virtual: Presentation,
    trabajos: FolderOpen,
    academico: GraduationCap,
    mi_perfil: CircleUser
};

/**
 * ProfileDropdown - Shared component for user profile dropdown menu
 * 
 * @param {Object} user - User object with name, email, modules
 * @param {string} activeRole - Currently active role/module
 * @param {Function} onRoleChange - Callback when role/module is changed
 * @param {Function} onProfileClick - Callback when "Ver mi perfil" is clicked
 * @param {Function} onLogout - Callback when logout is clicked
 * @param {Function} onClose - Callback to close the dropdown
 */
const ProfileDropdown = ({
    user,
    activeRole,
    onRoleChange,
    onProfileClick,
    onLogout,
    onClose
}) => {
    const handleRoleClick = (module) => {
        if (onRoleChange) onRoleChange(module);
        if (onClose) onClose();
    };

    const handleProfileClick = () => {
        if (onProfileClick) onProfileClick();
        if (onClose) onClose();
    };

    const handleLogoutClick = () => {
        if (onLogout) onLogout();
        if (onClose) onClose();
    };

    return (
        <div className="absolute top-14 right-0 bg-white border border-gray-100 rounded-xl shadow-xl w-60 py-2 z-50 animate-fadeIn overflow-hidden">

            {/* User Profile Section */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <button
                    onClick={handleProfileClick}
                    className="text-xs text-blue-600 font-medium hover:underline mt-1 flex items-center gap-1"
                >
                    Ver mi perfil
                </button>
            </div>

            {/* Available Modules */}
            {user.modules && user.modules.length > 0 && (
                <>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">Navegación</div>
                    {(() => {
                        const uniqueLabels = new Set();
                        return user.modules
                            .filter(m => m !== 'mi_perfil' && m !== 'ponente' && m !== 'organizador' && m !== 'asistente' && m !== 'participante')
                            .filter(module => {
                                const label = ROLE_LABELS[module] || module;
                                if (uniqueLabels.has(label)) return false;
                                uniqueLabels.add(label);
                                return true;
                            })
                            .map(module => {
                                const Icon = ROLE_ICONS[module] || User;
                                const isDashboardActive = activeRole === module;
                                return (
                                    <button
                                        key={module}
                                        onClick={() => handleRoleClick(module)}
                                        className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 flex items-center justify-between transition-colors
                                            ${isDashboardActive ? 'text-blue-700 font-bold bg-blue-50' : 'text-gray-600'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-lg ${isDashboardActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                                <Icon size={16} />
                                            </div>
                                            {ROLE_LABELS[module] || module}
                                        </div>
                                        {isDashboardActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                                    </button>
                                );
                            });
                    })()}
                    <div className="my-1 border-t border-gray-100"></div>
                </>
            )}

            {/* Logout Button */}
            <button
                onClick={handleLogoutClick}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
            >
                <div className="p-1.5 rounded-lg bg-red-100 text-red-600">
                    <LogOut size={16} />
                </div>
                Cerrar Sesión
            </button>
        </div>
    );
};

export default ProfileDropdown;
