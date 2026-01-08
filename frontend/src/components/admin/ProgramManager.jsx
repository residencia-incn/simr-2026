
import React, { useState, useEffect } from 'react';
import AdminView from '../cronograma-integration/AdminView';
import EditSessionView from '../cronograma-integration/EditSessionView';
import { useProgramSchedule } from '../../hooks/useProgramSchedule';
import { LoadingSpinner } from '../ui';
import { WORK_TYPES, ACADEMIC_CONFIG } from '../../data/mockData';
import { api } from '../../services/api';

const ProgramManager = () => {
    const { scheduleData, loading, updateSession, addSession, deleteSession, refresh } = useProgramSchedule();
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'edit' | 'create'
    const [selectedDay, setSelectedDay] = useState(1);
    const [currentSession, setCurrentSession] = useState(null);
    const [availableRooms, setAvailableRooms] = useState({ physical: [], virtual: [] });

    // Load rooms dynamically
    useEffect(() => {
        const loadRooms = async () => {
            try {
                const config = await api.academic.getConfig();
                if (config && config.rooms) {
                    setAvailableRooms(config.rooms);
                } else {
                    setAvailableRooms(ACADEMIC_CONFIG.rooms || { physical: [], virtual: [] });
                }
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
        const newSession = {
            id: 'new-' + Date.now(),
            timeStart: '09:00',
            timeEnd: '10:00',
            title: '',
            category: 'Conferencia',
            categoryColor: 'blue',
            speakers: [],
            location: 'Auditorio Principal',
            status: 'Borrador',
            description: ''
        };
        setCurrentSession(newSession);
        setViewMode('create');
    };

    const handleDeleteSession = (sessionId) => {
        if (window.confirm('¿Está seguro de eliminar esta sesión?')) {
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
            {viewMode === 'list' && (
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

            {(viewMode === 'edit' || viewMode === 'create') && currentSession && (
                <EditSessionView
                    session={currentSession}
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
