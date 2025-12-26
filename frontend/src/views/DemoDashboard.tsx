import React from 'react';
import { useAuth } from '../context/AuthContext';
import { PermissionGate } from '../components/auth/PermissionGate';
import { DebugSwitcher } from '../components/dev/DebugSwitcher';
import {
    DollarSign,
    BookOpen,
    FileText,
    LayoutDashboard,
    LogOut,
    Bell,
    Search,
    Users
} from 'lucide-react';

const DemoDashboard = () => {
    const { user, logout } = useAuth();

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">RBAC Demo System</h2>
                    <p className="text-gray-600 mb-6">Please select a role from the debug switcher to enter.</p>
                    <DebugSwitcher />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
                            SC
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 leading-none">SIMR 2026</h1>
                            <span className="text-xs text-gray-500 font-medium">Dashboard</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {/* Section: General (Everyone) */}
                    <div className="mb-6">
                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">General</p>
                        <a href="#" className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg font-medium">
                            <LayoutDashboard size={18} /> Resumen
                        </a>

                        {/* Protected: Classroom */}
                        <PermissionGate scopes={['classroom:read']}>
                            <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg font-medium transition-colors">
                                <BookOpen size={18} /> Aula Virtual
                            </a>
                        </PermissionGate>
                    </div>

                    {/* Section: Management (Restricted) */}
                    <div className="mb-6">
                        <PermissionGate scopes={['accounting:read', 'papers:read']} requireAll={false}>
                            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Gestión</p>
                        </PermissionGate>

                        {/* Accounting */}
                        <PermissionGate scopes={['accounting:read']}>
                            <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg font-medium transition-colors">
                                <DollarSign size={18} /> Contabilidad
                            </a>
                        </PermissionGate>

                        {/* Papers */}
                        <PermissionGate scopes={['papers:read']}>
                            <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg font-medium transition-colors">
                                <FileText size={18} /> Trabajos
                            </a>
                        </PermissionGate>

                        {/* Users (Admin Only usually) */}
                        <PermissionGate scopes={['users:manage']}>
                            <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg font-medium transition-colors">
                                <Users size={18} /> Usuarios
                            </a>
                        </PermissionGate>
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100 mb-2">
                        <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full bg-white" />
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.role}</p>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 text-sm text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                        <LogOut size={16} /> Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8">
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Bienvenido, {user.name}</h2>
                        <p className="text-gray-500">Este es tu panel de control personalizado.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                    </div>
                </header>

                {/* Widgets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Widget: Accounting (Protected) */}
                    <PermissionGate
                        scopes={['accounting:read']}
                        fallback={
                            <div className="bg-gray-100 rounded-xl p-6 border border-gray-200 border-dashed flex flex-col items-center justify-center text-gray-400 min-h-[200px]">
                                <DollarSign size={32} className="mb-2 opacity-20" />
                                <p className="text-sm font-medium">No tienes acceso a Contabilidad</p>
                            </div>
                        }
                    >
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-800">Finanzas del Congreso</h3>
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">+12%</span>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-1">S/ 124,500</div>
                            <p className="text-sm text-gray-500 mb-4">Recaudación Total</p>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[65%]"></div>
                            </div>
                        </div>
                    </PermissionGate>

                    {/* Widget: Papers (Protected) */}
                    <PermissionGate
                        scopes={['papers:read']}
                        fallback={
                            <div className="bg-gray-100 rounded-xl p-6 border border-gray-200 border-dashed flex flex-col items-center justify-center text-gray-400 min-h-[200px]">
                                <FileText size={32} className="mb-2 opacity-20" />
                                <p className="text-sm font-medium">No tienes acceso a Trabajos</p>
                            </div>
                        }
                    >
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-800">Trabajos Recibidos</h3>
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">Nuevo</span>
                            </div>
                            <div className="flex items-end gap-2 mb-4">
                                <span className="text-3xl font-bold text-gray-900">42</span>
                                <span className="text-sm text-gray-500 mb-1">pendientes</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Casos Clínicos</span>
                                    <span className="font-medium">28</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Proyectos</span>
                                    <span className="font-medium">14</span>
                                </div>
                            </div>
                        </div>
                    </PermissionGate>

                    {/* Widget: Classroom (Protected) */}
                    <PermissionGate scopes={['classroom:read']}>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-800">Actividad del Aula</h3>
                            </div>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                                        <BookOpen size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Nueva clase disponible</p>
                                        <p className="text-xs text-gray-500">Neuroanatomía II - Dr. House</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                        <Users size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Foro de discusión activo</p>
                                        <p className="text-xs text-gray-500">14 nuevos comentarios</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </PermissionGate>

                    {/* Widget: Public Info (Always visible) */}
                    <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-xl shadow-sm p-6 text-white col-span-1 md:col-span-2 lg:col-span-3">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-lg">
                                <Bell size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Anuncios Generales</h3>
                                <p className="text-blue-200 text-sm">Información importante para todos los asistentes.</p>
                            </div>
                        </div>
                        <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                            <p className="text-sm">📅 La ceremonia de inauguración se llevará a cabo el Lunes 15 a las 9:00 AM en el auditorio principal.</p>
                        </div>
                    </div>

                </div>
            </main>

            <DebugSwitcher />
        </div>
    );
};

export default DemoDashboard;
