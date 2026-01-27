
import React, { useState, useEffect } from 'react';
import AdminView from '../cronograma-integration/AdminView';
import EditSessionView from '../cronograma-integration/EditSessionView';
import ProgramScheduleView from '../cronograma-integration/ProgramScheduleView';
import { useProgramSchedule } from '../../hooks/useProgramSchedule';
import { LoadingSpinner } from '../ui';
import { WORK_TYPES, ACADEMIC_CONFIG } from '../../constants';
import { api } from '../../services/api';
import { showDeleteConfirm } from '../../utils/alerts';

const ProgramManager = () => {
    const { scheduleData, loading, updateSession, addSession, deleteSession, refresh } = useProgramSchedule();
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'edit' | 'create'
    const [viewType, setViewType] = useState('list'); // 'list' | 'blocks'
    const [selectedDay, setSelectedDay] = useState(1);
    const [currentSession, setCurrentSession] = useState(null);
    const [availableRooms, setAvailableRooms] = useState({ physical: [], virtual: [] });

    // Load rooms dynamically
    useEffect(() => {
        const loadRooms = async () => {
            try {
                const locations = await api.program.getLocations();
                const newRooms = {
                    physical: locations.filter(l => l.type !== 'virtual'),
                    virtual: locations.filter(l => l.type === 'virtual')
                };
                setAvailableRooms(newRooms);
            } catch (error) {
                console.error("Error loading rooms:", error);
                // Fallback
                setAvailableRooms(ACADEMIC_CONFIG.rooms || { physical: [], virtual: [] });
            }
        };
        loadRooms();
    }, []);

    if (loading) return <div className="p-12 flex justify-center"><LoadingSpinner text="Cargando cronograma..." /></div>;

    const handleEditSession = (sessionId) => {
        const dayData = scheduleData.find(d => d.dayNumber === selectedDay);
        const session = dayData.sessions.find(s => s.id === sessionId);
        if (session) {
            setCurrentSession(session);
            setViewMode('edit');
        }
    };

    const handleNewSession = () => {
        // Default to first physical room or Auditorio Principal
        let defaultLocation = { id: null, name: 'Auditorio Principal' };
        if (availableRooms.physical && availableRooms.physical.length > 0) {
            // Try to find Auditorio Principal or take first
            const found = availableRooms.physical.find(r => r.name === 'Auditorio Principal');
            if (found) defaultLocation = found;
            else defaultLocation = availableRooms.physical[0];
        }

        const newSession = {
            id: 'new-' + Date.now(),
            timeStart: '09:00',
            timeEnd: '10:00',
            title: '',
            category: 'Conferencia',
            categoryColor: 'blue',
            speakers: [],
            location: defaultLocation.name,
            locationId: defaultLocation.id, // Important for collision check
            status: 'Borrador',
            description: ''
        };
        setCurrentSession(newSession);
        setViewMode('create');
    };

    const handleDeleteSession = async (sessionId) => {
        const confirmed = await showDeleteConfirm('¿Está seguro de eliminar esta sesión?', 'Eliminar Sesión');
        if (confirmed) {
            deleteSession(selectedDay, sessionId);
        }
    };

    const handleSaveSession = (updatedSession) => {
        if (viewMode === 'create') {
            addSession(selectedDay, updatedSession);
        } else {
            updateSession(selectedDay, updatedSession);
        }
        setViewMode('list');
        setCurrentSession(null);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm min-h-[600px] p-6">
            <div className="flex justify-end mb-4 gap-2">
                <button
                    onClick={() => setViewType('list')}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${viewType === 'list' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    Vista Lista
                </button>
                <button
                    onClick={() => setViewType('blocks')}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${viewType === 'blocks' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    Vista Bloques (Drag&Drop)
                </button>
            </div>

            {viewMode === 'list' && viewType === 'list' && (
                <AdminView
                    schedule={scheduleData}
                    selectedDay={selectedDay}
                    onDaySelect={setSelectedDay}
                    onEditSession={handleEditSession}
                    onDeleteSession={handleDeleteSession}
                    onNewSession={handleNewSession}
                    refreshSchedule={refresh}
                    availableRooms={availableRooms}
                    availableCategories={WORK_TYPES}
                />
            )}

            {viewMode === 'list' && viewType === 'blocks' && (
                <div className="space-y-6">
                    {/* Reuse day selector logic roughly or just pass data */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        {scheduleData.map(day => (
                            <button
                                key={day.dayNumber}
                                onClick={() => setSelectedDay(day.dayNumber)}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${selectedDay === day.dayNumber
                                    ? 'bg-white border border-slate-200 shadow-sm text-primary ring-1 ring-slate-200'
                                    : 'text-slate-500 hover:bg-slate-50'
                                    } `}
                            >
                                Día {day.dayNumber}
                            </button>
                        ))}
                    </div>

                    <ProgramScheduleView
                        initialBlocks={scheduleData.find(d => d.dayNumber === selectedDay)?.blocks || []}
                        refreshData={refresh}
                    />
                </div>
            )}

            {(viewMode === 'edit' || viewMode === 'create') && currentSession && (
                <EditSessionView
                    session={currentSession}
                    date={scheduleData.find(d => d.dayNumber === selectedDay)?.date}
                    onSave={handleSaveSession}
                    currentDaySessions={scheduleData.find(d => d.dayNumber === selectedDay)?.sessions || []}
                    onCancel={() => {
                        setViewMode('list');
                        setCurrentSession(null);
                    }}
                />
            )}
        </div>
    );
};

export default ProgramManager;
