import React, { useState } from 'react';
import { Users, CheckSquare, Search, RefreshCw } from 'lucide-react';
import AttendeeList from '../components/admin/AttendeeList';
import VerificationList from '../components/common/VerificationList';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';

const AdmissionDashboard = () => {
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'verification'
    const {
        data: attendees,
        loading: loadingAttendees,
        reload: reloadAttendees
    } = useApi(api.attendees.getAll);

    const {
        data: pendingRegistrations,
        loading: loadingPending,
        reload: reloadPending
    } = useApi(api.registrations.getAll);

    const handleApproveRegistration = async (reg) => {
        if (confirm(`¿Confirmar inscripción de ${reg.name}?`)) {
            try {
                const newAttendee = {
                    id: Date.now(),
                    name: reg.name,
                    role: reg.role,
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
                    email: reg.email
                };

                await api.attendees.add(newAttendee);
                await api.treasury.addIncome(reg.amount, `Inscripción: ${reg.name}`, 'Inscripciones');
                await api.registrations.remove(reg.id);

                alert('Inscripción aprobada exitosamente.');
                reloadAll();
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
                reloadAll();
            } catch (error) {
                console.error("Error rejecting", error);
            }
        }
    };

    const reloadAll = () => {
        reloadAttendees();
        reloadPending();
    };

    const isLoading = loadingAttendees || loadingPending;

    if (isLoading && !attendees && !pendingRegistrations) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" message="Cargando panel de admisión..." />
            </div>
        );
    }

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Panel de Admisión</h2>
                    <p className="text-gray-600">Gestión de asistencia y validación de inscripciones.</p>
                </div>

                <div className="flex p-1 bg-gray-100 rounded-lg">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'list' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <Users size={16} />
                        Lista de Asistentes
                    </button>
                    <button
                        onClick={() => setActiveTab('verification')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'verification' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <CheckSquare size={16} />
                        Por Aprobar
                        {pendingRegistrations && pendingRegistrations.length > 0 && (
                            <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {pendingRegistrations.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Asistentes Confirmados</p>
                        <h3 className="text-2xl font-bold text-gray-900">{attendees?.length || 0}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Users size={24} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Pendientes de Validación</p>
                        <h3 className="text-2xl font-bold text-gray-900">{pendingRegistrations?.length || 0}</h3>
                    </div>
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                        <CheckSquare size={24} />
                    </div>
                </div>
                <div className="flex items-center justify-end">
                    <Button onClick={reloadAll} variant="outline" className="flex items-center gap-2">
                        <RefreshCw size={16} /> Actualizar Datos
                    </Button>
                </div>
            </div>

            {/* Content Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px]">
                {activeTab === 'list' && (
                    <div className="p-1">
                        <AttendeeList attendees={attendees || []} />
                    </div>
                )}

                {activeTab === 'verification' && (
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Solicitudes de Inscripción</h3>
                        <VerificationList
                            pendingRegistrations={pendingRegistrations || []}
                            onApprove={handleApproveRegistration}
                            onReject={handleRejectRegistration}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdmissionDashboard;
