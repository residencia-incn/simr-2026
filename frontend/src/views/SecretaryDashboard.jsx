import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, ClipboardList, Target, BookOpen, UserCircle, LogOut, Folder
} from 'lucide-react';
import { api } from '../services/api';
import StatsOverview from '../components/admin/StatsOverview';
import AttendeeList from '../components/admin/AttendeeList';
import PlanningManager from '../components/admin/PlanningManager';
import DocumentsManager from '../components/admin/DocumentsManager';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const SecretaryDashboard = ({ user, navigate }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    // Data State
    const [attendees, setAttendees] = useState([]);
    const [treasuryStats, setTreasuryStats] = useState({ income: 0, expense: 0, balance: 0 });

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [attData, treasData] = await Promise.all([
                    api.attendees.getAll(),
                    api.treasury.getStats()
                ]);
                setAttendees(attData);
                setTreasuryStats(treasData);
            } catch (error) {
                console.error("Failed to load secretary data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const navItems = [
        { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
        { id: 'attendance', label: 'Asistencia', icon: ClipboardList },
        { id: 'planning', label: 'Planificación', icon: Target },
        { id: 'docs', label: 'Documentos', icon: Folder },
    ];

    if (loading) return <LoadingSpinner fullScreen text="Cargando panel de secretaría..." />;

    return (
        <div className="animate-fadeIn min-h-[600px] flex flex-col gap-6">
            {/* Top Navigation Bar */}
            <div className="w-full bg-white shadow-sm border-b border-gray-200 rounded-2xl flex flex-row items-center justify-start py-2 px-4 gap-4 sticky top-16 overflow-x-auto z-20">
                {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium text-sm whitespace-nowrap
                                ${isActive
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-blue-600'
                                }`}
                        >
                            <Icon size={18} />
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {/* Main Content */}
            <div className="flex-1">
                {activeTab === 'overview' && (
                    <div className="animate-fadeIn">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Resumen del Evento</h2>
                            <p className="text-gray-500 text-sm">Vista General (Solo Lectura)</p>
                        </div>
                        <StatsOverview
                            attendees={attendees}
                            totalIncome={treasuryStats.income}
                        />
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="animate-fadeIn">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Lista de Asistentes</h2>
                            <p className="text-gray-500 text-sm">Registro en tiempo real (Solo Lectura)</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <AttendeeList attendees={attendees} />
                        </div>
                    </div>
                )}

                {activeTab === 'planning' && (
                    <div className="animate-fadeIn min-h-[600px]">
                        <PlanningManager currentUser={user} />
                    </div>
                )}

                {activeTab === 'docs' && (
                    <div className="animate-fadeIn min-h-[600px]">
                        <DocumentsManager />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SecretaryDashboard;
