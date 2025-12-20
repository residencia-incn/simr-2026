import React, { useState, useEffect } from 'react';
import {
    AlertCircle, Clock, Mail, DollarSign, TrendingUp, TrendingDown, CheckSquare, Users,
    LayoutDashboard, ClipboardList, Calendar, Award, Settings, Image, Map, Ticket, Shield, Target, BookOpen, QrCode, MonitorPlay
} from 'lucide-react';
import SuperAdminAnalytics from '../components/admin/SuperAdminAnalytics';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import StatsOverview from '../components/admin/StatsOverview';
import AttendeeList from '../components/admin/AttendeeList';
import ConfirmDialog from '../components/ui/ConfirmDialog';

import CertificationManager from '../components/admin/CertificationManager';
import SystemConfiguration from '../components/admin/SystemConfiguration';
import GalleryManager from '../components/admin/GalleryManager';
import ProgramManager from '../components/admin/ProgramManager';
import CommitteeManager from '../components/admin/CommitteeManager';
import UserManagement from '../components/admin/UserManagement';
import RoadmapManager from '../components/admin/RoadmapManager';
import CouponManager from '../components/admin/CouponManager';
import PlanningManager from '../components/admin/PlanningManager';
import VerificationList from '../components/common/VerificationList';
import DocumentationView from './DocumentationView';
import AttendanceManager from './AttendanceManager';
import AcademicDashboard from './AcademicDashboard'; // Import AcademicDashboard
// import VirtualClassroomManager from '../components/admin/VirtualClassroomManager';
import { api } from '../services/api';
import { showSuccess, showError } from '../utils/alerts';

const AdminDashboard = ({ user }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });
    const [admissionTab, setAdmissionTab] = useState('list'); // 'list' or 'verification'
    const isSuperAdmin = user?.role === 'superadmin' || user?.roles?.includes('admin') || user?.role === 'admin';

    // State - Data
    const [registrations, setRegistrations] = useState([]);
    const [attendees, setAttendees] = useState([]);
    const [treasuryStats, setTreasuryStats] = useState({ income: 0, expense: 0, balance: 0 });
    const [works, setWorks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initial Data Load
    const loadData = async () => {
        setLoading(true);
        try {
            const [regData, attData, treasData, worksData] = await Promise.all([
                api.registrations.getAll(),
                api.attendees.getAll(),
                api.treasury.getStats(),
                api.works.getAll()
            ]);

            setRegistrations(regData);
            setAttendees(attData);
            setTreasuryStats(treasData);
            setWorks(worksData);
        } catch (error) {
            console.error("Failed to load admin data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // Optional: Listen for global updates to refresh dashboard
        const handleRefresh = () => loadData();
        window.addEventListener('storage', handleRefresh); // Only cross-tab
        return () => window.removeEventListener('storage', handleRefresh);
    }, []);

    // Helper to switch main tab and reset sub-tab if needed
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'admission') setAdmissionTab('list');
    };

    const handleApproveRegistration = async (reg) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Confirmar Inscripción',
            message: `¿Confirmar inscripción de ${reg.name}?`,
            type: 'warning',
            onConfirm: async () => {
                try {
                    const newAttendee = {
                        id: Date.now(),
                        name: reg.name,
                        firstName: reg.firstName,
                        lastName: reg.lastName,
                        role: 'Asistente',
                        occupation: reg.occupation,
                        specialty: reg.specialty,
                        modality: reg.modalidad,
                        date: new Date().toISOString().split('T')[0],
                        status: 'Confirmado',
                        amount: reg.amount,
                        institution: reg.institution,
                        grade: null,
                        certificationApproved: false,
                        dni: reg.dni,
                        cmp: reg.cmp,
                        rne: reg.rne,
                        email: reg.email
                    };

                    await api.attendees.add(newAttendee);
                    await api.treasury.addIncome(reg.amount, `Inscripción: ${reg.name}`, 'Inscripciones');
                    await api.registrations.remove(reg.id);

                    // User Creation / Role Assignment Logic
                    const allUsers = await api.users.getAll();
                    const existingUser = allUsers.find(u => u.email === reg.email);

                    // Determine if the user should get the "Aula Virtual" (participant) role
                    // Logic:
                    // - "Solo Presencial" (ticket: presencial) -> No "participant" role.
                    // - "Presencial + Certificado" (ticket: presencial_cert) -> Gets "participant" role.
                    // - "Virtual" (ticket: virtual) -> Gets "participant" role.

                    let shouldHaveVirtualAccess = false;

                    if (reg.ticketType) {
                        shouldHaveVirtualAccess = reg.ticketType !== 'presencial';
                    } else {
                        // Fallback using modality and certification flag if ticketType is missing
                        // Assuming 'Presencial' without explicit type is just Presencial
                        const isVirtual = reg.modalidad && reg.modalidad.toLowerCase() === 'virtual';
                        const wantsCert = reg.wantsCertification === true;
                        shouldHaveVirtualAccess = isVirtual || wantsCert;
                    }

                    const assignedRoles = shouldHaveVirtualAccess ? ['participant'] : [];

                    const userPayload = {
                        id: existingUser ? existingUser.id : Date.now(),
                        name: reg.name,
                        email: reg.email,
                        role: shouldHaveVirtualAccess ? 'participant' : 'user', // Set primary role correctly
                        roles: existingUser ? [...new Set([...(existingUser.roles || []), ...assignedRoles])] : assignedRoles,
                        institution: reg.institution,
                        password: existingUser ? existingUser.password : '123456',
                        specialty: reg.specialty
                    };

                    await api.users.update(userPayload);

                    showSuccess('La inscripción ha sido aprobada y la cuenta actualizada.', 'Inscripción aprobada');
                    loadData(); // Refresh all data
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    console.error("Error approving registration", error);
                    showError('No se pudo procesar la inscripción.', 'Error al procesar');
                }
            }
        });
    };

    const handleRejectRegistration = async (id) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Rechazar Inscripción',
            message: '¿Rechazar esta inscripción? Se eliminará de la lista de pendientes.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.registrations.remove(id);
                    loadData();
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    console.error("Error rejecting", error);
                }
            }
        });
    };

    if (loading && attendees.length === 0) {
        return <div className="p-8 text-center text-gray-500">Cargando panel de control...</div>;
    }

    const hasAdminRole = user?.roles?.includes('admin') || user?.role === 'admin';
    const hasSecretaryRole = user?.roles?.includes('admin') || user?.role === 'admin'; // Secretario tiene rol admin
    const hasCommitteeRole = user?.roles?.some(r => ['admin', 'academic', 'treasurer'].includes(r)) ||
        ['admin', 'academic', 'treasurer'].includes(user?.role);

    const navItems = [
        { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
        { id: 'admission', label: 'Admisión', icon: ClipboardList, badge: registrations.length },
        { id: 'program', label: 'Programa', icon: Calendar },
        { id: 'committee', label: 'Comité', icon: Users },
        ...(hasSecretaryRole ? [{ id: 'planning', label: 'Planificación', icon: Target }] : []),
        { id: 'certification', label: 'Certificación', icon: Award },
        { id: 'gallery', label: 'Galería', icon: Image },
        { id: 'roadmap', label: 'Roadmap', icon: Map },
        { id: 'coupons', label: 'Cupones', icon: Ticket },
        { id: 'config', label: 'Configuración', icon: Settings },
        ...(isSuperAdmin ? [{ id: 'analytics', label: 'Analítica', icon: TrendingUp }] : []),
        ...(isSuperAdmin ? [{ id: 'users', label: 'Usuarios', icon: Shield }] : []),
        ...(isSuperAdmin ? [{ id: 'docs', label: 'Documentación', icon: BookOpen }] : []),
        { id: 'academic-module', label: 'Académico', icon: BookOpen }, // Add Academic Module Icon
        { id: 'attendance', label: 'Asistencia', icon: QrCode },
        // { id: 'virtual-classroom', label: 'Aula Virtual', icon: MonitorPlay }
    ];

    return (
        <div className="animate-fadeIn min-h-[600px] flex flex-col gap-6">
            {/* Sidebar Navigation */}
            {/* Sidebar Navigation */}
            {/* Sidebar Navigation */}
            {/* Top Navigation Bar */}
            <div className="w-full bg-white shadow-sm border-b border-gray-200 rounded-2xl flex flex-row items-center justify-start py-2 px-4 gap-4 sticky top-16 overflow-x-auto md:overflow-visible scrollbar-hide z-20">
                {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <div key={item.id} className="relative group shrink-0">
                            <button
                                onClick={() => handleTabChange(item.id)}
                                className={`p-2 rounded-xl transition-all relative
                                    ${isActive
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-blue-600'
                                    }`}
                            >
                                <Icon size={20} />
                                {item.badge > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] items-center justify-center font-bold">
                                            {item.badge}
                                        </span>
                                    </span>
                                )}
                            </button>

                            {/* Tooltip (Bottom) */}
                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 bg-black text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 hidden md:block shadow-lg">
                                {item.label}
                                {/* Arrow (Up) */}
                                <div className="absolute left-1/2 -translate-x-1/2 -top-[6px] border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-black"></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main Content */}
            <div className="flex-1">
                {activeTab === 'overview' && (
                    <>
                        {/* Header for Overview */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Resumen del Evento</h2>
                            <p className="text-gray-500 text-sm">Panel de Organización SIMR 2026</p>
                        </div>

                        {/* Financial Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <Card className="p-5 border-l-4 border-blue-500">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                        <DollarSign size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Balance Total</p>
                                        <h3 className="text-2xl font-bold text-gray-900">
                                            S/ {treasuryStats.balance.toFixed(2)}
                                        </h3>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-5 border-l-4 border-green-500">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-green-50 rounded-lg text-green-600">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Total Ingresos</p>
                                        <h3 className="text-2xl font-bold text-gray-900">
                                            S/ {treasuryStats.income.toFixed(2)}
                                        </h3>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-5 border-l-4 border-red-500">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-50 rounded-lg text-red-600">
                                        <TrendingDown size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Total Egresos</p>
                                        <h3 className="text-2xl font-bold text-gray-900">
                                            S/ {treasuryStats.expense.toFixed(2)}
                                        </h3>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* New Stats Overview */}
                        <StatsOverview
                            attendees={attendees}
                            totalIncome={treasuryStats.income}
                        />

                        {/* Legacy Dashboard Widgets */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 pt-8 border-t border-gray-200">
                            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6"><h3 className="font-bold text-gray-900 mb-6">Trabajos por Subespecialidad</h3><div className="h-64 flex items-end justify-between gap-2 px-4">{[60, 45, 80, 30, 55, 40].map((h, i) => (<div key={i} className="w-full bg-blue-100 rounded-t-lg relative group hover:bg-blue-200 transition-colors" style={{ height: `${h}%` }}><div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">{h} trabajos</div></div>))}</div><div className="flex justify-between mt-4 text-xs text-gray-600 uppercase font-medium"><span>Neurovascular</span><span>Epilepsia</span><span>Neurocirugía</span><span>Pediatría</span><span>Movimientos</span><span>Infecciosas</span></div></div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><h3 className="font-bold text-gray-900 mb-4">Alertas de Gestión</h3><div className="space-y-3"><div className="flex items-center gap-3 p-3 bg-red-50 text-red-800 rounded-lg text-sm"><AlertCircle size={16} /><span>3 Trabajos sin jurado asignado</span></div><div className="flex items-center gap-3 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm"><Clock size={16} /><span>Taller de EEG al 95% de cupo</span></div><div className="flex items-center gap-3 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm"><Mail size={16} /><span>{registrations.length} Nuevas inscripciones</span></div></div><Button className="w-full mt-6" variant="outline">Ver panel detallado</Button></div>
                        </div>
                    </>
                )}

                {activeTab === 'admission' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Admisión y Asistencia</h3>
                                <p className="text-gray-500 text-sm">Gestión de inscripciones y participantes</p>
                            </div>

                            <div className="flex p-1 bg-gray-100 rounded-lg">
                                <button
                                    onClick={() => setAdmissionTab('list')}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${admissionTab === 'list' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    Lista de Asistentes
                                </button>
                                <button
                                    onClick={() => setAdmissionTab('verification')}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${admissionTab === 'verification' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    Solicitudes por Aprobar {registrations.length > 0 && <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{registrations.length}</span>}
                                </button>
                            </div>
                        </div>

                        {admissionTab === 'list' ? (
                            <>
                                <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <div className="flex items-center gap-2 text-blue-800">
                                        <Users size={20} />
                                        <span className="font-semibold">Total Inscritos Confirmados</span>
                                    </div>
                                    <span className="text-2xl font-bold text-blue-900">{attendees.length}</span>
                                </div>
                                <AttendeeList attendees={attendees} />
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckSquare className="text-orange-600" />
                                    <h4 className="font-bold text-gray-900">Validación de Pagos Pendientes</h4>
                                </div>
                                <VerificationList
                                    pendingRegistrations={registrations}
                                    onApprove={handleApproveRegistration}
                                    onReject={handleRejectRegistration}
                                />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'program' && (
                    <div className="animate-fadeIn min-h-[600px]">
                        <ProgramManager />
                    </div>
                )}

                {activeTab === 'committee' && (
                    <div className="animate-fadeIn min-h-[600px]">
                        <CommitteeManager />
                    </div>
                )}

                {activeTab === 'certification' && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Gestión de Certificados</h3>
                            <div className="text-sm text-gray-500">Aprobación de notas y emisión de certificados</div>
                        </div>
                        <CertificationManager attendees={attendees} />
                    </div>
                )}

                {activeTab === 'config' && <SystemConfiguration />}

                {activeTab === 'gallery' && (
                    <div className="animate-fadeIn">
                        <GalleryManager />
                    </div>
                )}

                {activeTab === 'roadmap' && (
                    <div className="animate-fadeIn">
                        <RoadmapManager />
                    </div>
                )}

                {activeTab === 'coupons' && (
                    <div className="animate-fadeIn">
                        <CouponManager />
                    </div>
                )}

                {activeTab === 'users' && isSuperAdmin && (
                    <div className="animate-fadeIn">
                        <UserManagement />
                    </div>
                )}

                {activeTab === 'planning' && hasSecretaryRole && (
                    <div className="animate-fadeIn min-h-[600px]">
                        <PlanningManager currentUser={user} />
                    </div>
                )}

                {activeTab === 'docs' && isSuperAdmin && (
                    <div className="animate-fadeIn min-h-[600px]">
                        <DocumentationView />
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="animate-fadeIn">
                        <AttendanceManager />
                    </div>
                )}

                {activeTab === 'analytics' && isSuperAdmin && (
                    <div className="animate-fadeIn">
                        <SuperAdminAnalytics />
                    </div>
                )}

                {activeTab === 'academic-module' && (
                    <div className="animate-fadeIn">
                        <AcademicDashboard role="admin" />
                    </div>
                )}

                {/* {activeTab === 'virtual-classroom' && (
                    <div className="animate-fadeIn">
                        <VirtualClassroomManager />
                    </div>
                )} */}
            </div>

            <ConfirmDialog
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                type={confirmConfig.type}
            />
        </div>
    );
};

export default AdminDashboard;
