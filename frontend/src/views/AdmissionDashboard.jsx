import React, { useState } from 'react';
import { Users, CheckSquare, Search, RefreshCw } from 'lucide-react';
import AttendeeList from '../components/admin/AttendeeList';
import VerificationList from '../components/common/VerificationList';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { showSuccess, showError, showConfirm, showDeleteConfirm } from '../utils/alerts';

const AdmissionDashboard = () => {
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

    const reloadAll = () => {
        reloadAttendees();
        reloadPending();
    };

    const isLoading = loadingAttendees || loadingPending;

    if (isLoading && !attendees) {
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
                    <p className="text-gray-600">Gestión de asistencia y consulta de inscripciones confirmadas.</p>
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

            {/* Content Content - Full width list */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px] overflow-hidden">
                <div className="p-1">
                    <AttendeeList attendees={attendees || []} />
                </div>
            </div>
        </div>
    );
};

export default AdmissionDashboard;
