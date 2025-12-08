import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, Mail, DollarSign, TrendingUp, TrendingDown, CheckSquare, Users } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import StatsOverview from '../components/admin/StatsOverview';
import AttendeeList from '../components/admin/AttendeeList';

import CertificationManager from '../components/admin/CertificationManager';
import SystemConfiguration from '../components/admin/SystemConfiguration';
import GalleryManager from '../components/admin/GalleryManager';
import ProgramManager from '../components/admin/ProgramManager';
import CommitteeManager from '../components/admin/CommitteeManager';
import UserManagement from '../components/admin/UserManagement';
import VerificationList from '../components/common/VerificationList';
import { api } from '../services/api';

const AdminDashboard = ({ user }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [admissionTab, setAdmissionTab] = useState('list'); // 'list' or 'verification'
    const isSuperAdmin = user?.role === 'superadmin';

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
        if (confirm(`¿Confirmar inscripción de ${reg.name}?`)) {
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

                alert('Inscripción aprobada exitosamente.');
                loadData(); // Refresh all data
            } catch (error) {
                console.error("Error approving registration", error);
                alert("Hubo un error al procesar la inscripción.");
            }
        }
    };

    const handleRejectRegistration = async (id) => {
        if (confirm('¿Rechazar esta inscripción?')) {
            try {
                await api.registrations.remove(id);
                loadData();
            } catch (error) {
                console.error("Error rejecting", error);
            }
        }
    };

    if (loading && attendees.length === 0) {
        return <div className="p-8 text-center text-gray-500">Cargando panel de control...</div>;
    }

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Panel de Organización</h2>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-100 rounded-lg overflow-x-auto max-w-full">
                    {[
                        { id: 'overview', label: 'Resumen' },
                        { id: 'admission', label: 'Admisión', badge: registrations.length },

                        { id: 'program', label: 'Programa' },
                        { id: 'committee', label: 'Comité' },
                        { id: 'certification', label: 'Certificación' },
                        { id: 'config', label: 'Configuración' },
                        { id: 'gallery', label: 'Galería' },
                        ...(isSuperAdmin ? [{ id: 'users', label: 'Usuarios' }] : [])
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            {tab.label}
                            {tab.badge > 0 && <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{tab.badge}</span>}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'overview' && (
                <>
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
                <div className="animate-fadeIn h-[600px]">
                    <ProgramManager />
                </div>
            )}

            {activeTab === 'committee' && (
                <div className="animate-fadeIn h-[600px]">
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

            {activeTab === 'users' && isSuperAdmin && (
                <div className="animate-fadeIn">
                    <UserManagement />
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
