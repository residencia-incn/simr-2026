import React, { useState, useEffect } from 'react';
import { Search, User, Mail, Shield, Calendar, MapPin, Clock, UserPlus, BookOpen, Edit2, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import Swal from 'sweetalert2';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import AddSpeakerModal from './AddSpeakerModal';
import AddTalkModal from './AddTalkModal';

const AcademicSpeakers = () => {
    const [speakers, setSpeakers] = useState([]);
    const [programData, setProgramData] = useState({});
    const [days, setDays] = useState([]);
    const [selectedSpeakerId, setSelectedSpeakerId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAddTalkOpen, setIsAddTalkOpen] = useState(false);
    const [editingTalk, setEditingTalk] = useState(null);
    const [config, setConfig] = useState(null);

    // Load speakers and program data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [speakersList, progData, daysData] = await Promise.all([
                    api.speakers.getAll(),
                    api.program.getAll(),
                    api.program.getDays()
                ]);

                setSpeakers(speakersList);
                setProgramData(progData || {});
                setDays(daysData || []);

                // Load config for keywords/specialties
                const sysConfig = await api.system.getConfig();
                setConfig(sysConfig);

            } catch (error) {
                console.error("Error loading speakers data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const refetch = () => {
        const loadData = async () => {
            try {
                const [speakersList, progData, daysData] = await Promise.all([
                    api.speakers.getAll(),
                    api.program.getAll(),
                    api.program.getDays()
                ]);
                setSpeakers(speakersList);
                setProgramData(progData || {});
                setDays(daysData || []);
            } catch (error) {
                console.error("Error loading speakers data", error);
            }
        };
        loadData();
    };

    const selectedSpeaker = speakers.find(s => s.id === selectedSpeakerId);

    // Find assigned sessions for the selected speaker
    const getAssignedSessions = () => {
        if (!selectedSpeaker || !programData) return [];

        const sessions = [];
        const normalizeName = (name) => name ? name.toLowerCase().trim() : '';
        const speakerName = normalizeName(selectedSpeaker.name);

        Object.entries(programData).forEach(([dayId, blocks]) => {
            if (!blocks) return;

            const dayLabel = days.find(d => d.id === dayId)?.date || dayId;

            blocks.forEach(block => {
                // Check block speaker (for single session blocks)
                if (block.speaker && normalizeName(block.speaker).includes(speakerName)) {
                    sessions.push({ ...block, day: dayLabel, type: 'block' });
                }

                // Check sessions within the block (for multi-track)
                if (block.sessions) {
                    Object.values(block.sessions).forEach(session => {
                        if (session.speaker && normalizeName(session.speaker).includes(speakerName)) {
                            sessions.push({ ...session, day: dayLabel, time: block.time, type: 'session' });
                        }
                    });
                }
            });
        });

        return sessions;
    };

    const assignedSessions = getAssignedSessions();

    const filteredSpeakers = speakers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.specialty && s.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSaveTalk = async (talkData) => {
        if (!selectedSpeaker) return;

        try {
            const updatedSpeaker = {
                ...selectedSpeaker,
                talks: [...(selectedSpeaker.talks || []), talkData]
            };

            // Optimistic update
            setSpeakers(prev => prev.map(s => s.id === selectedSpeaker.id ? updatedSpeaker : s));

            await api.speakers.update(updatedSpeaker);
        } catch (error) {
            console.error("Error saving talk:", error);
            // Revert on error? For now simple log.
        }
    };

    const getTalkSchedule = (talkId) => {
        if (!programData || !days) return null;

        // Search in all days
        for (const dayId in programData) {
            const dayBlocks = programData[dayId] || [];
            const dayLabel = days.find(d => d.id === dayId)?.date || dayId;

            for (const block of dayBlocks) {
                // Check if block links directly to this talk
                if (block.linkedWorkId === talkId) {
                    return { day: dayLabel, time: block.time, room: block.room };
                }

                // Check if any concurrent session links to this talk
                if (block.sessions) {
                    for (const session of Object.values(block.sessions)) {
                        if (session.linkedWorkId === talkId) {
                            return { day: dayLabel, time: block.time, room: block.room }; // Using block time for simplicity
                        }
                    }
                }
            }
        }
        return null;
    };

    return (
        <div className="h-[600px] flex gap-6 animate-fadeIn">
            {/* Left Panel: Speaker List */}
            <div className="w-1/3 flex flex-col gap-4 bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Directorio de Ponentes</h3>
                    <div className="flex items-center gap-2">
                        {/* Badge removed */}
                        <Button
                            size="xs"
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1"
                        >
                            <UserPlus size={14} />
                            Nuevo Ponente
                        </Button>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o especialidad..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {filteredSpeakers.map(speaker => (
                        <div
                            key={speaker.id}
                            onClick={() => setSelectedSpeakerId(speaker.id)}
                            className={`
                                p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm
                                ${selectedSpeakerId === speaker.id
                                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                                    : 'bg-white border-gray-100 hover:border-gray-200'
                                }
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-purple-100 text-purple-700`}>
                                    {speaker.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-900">{speaker.name}</h4>
                                    <p className="text-xs text-gray-500">{speaker.specialty || 'Sin especialidad'}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel: Details & Assigned Sessions */}
            <div className="w-2/3 bg-gray-50 rounded-xl border border-gray-200 p-6 flex flex-col">
                {selectedSpeaker ? (
                    <>
                        <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center text-2xl font-bold text-purple-600 shadow-sm">
                                    {selectedSpeaker.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{selectedSpeaker.name}</h2>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Shield size={14} className="text-purple-500" />
                                            <span>{selectedSpeaker.specialty || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Mail size={14} />
                                            <span>{selectedSpeaker.email || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        Institución: <span className="font-medium text-gray-700">{selectedSpeaker.institution || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                size="sm"
                                variant="secondary"
                                className="!bg-white !text-red-600 !border-red-200 hover:!bg-red-50 shadow-sm flex items-center gap-2"
                                onClick={async () => {
                                    // 1. Check for scheduled talks
                                    const scheduledTalks = (selectedSpeaker.talks || []).filter(talk => getTalkSchedule(talk.id));

                                    if (scheduledTalks.length > 0) {
                                        await Swal.fire({
                                            title: 'No se puede quitar',
                                            html: `Este ponente tiene <b>${scheduledTalks.length} ponencia(s) programada(s)</b> en el cronograma.<br/><br/>
                                                   Por favor, primero elimine las ponencias programadas desde la sección de Programa para proceder.`,
                                            icon: 'error',
                                            confirmButtonColor: '#3085d6',
                                            confirmButtonText: 'Entendido'
                                        });
                                        return;
                                    }

                                    const result = await Swal.fire({
                                        title: '¿Quitar rol de Ponente?',
                                        html: `Se quitará a <b>${selectedSpeaker.name}</b> de la lista de ponentes.<br/><br/>
                                               <ul style="text-align: left; font-size: 0.9em; color: #555; list-style-type: disc; margin-left: 20px;">
                                                   <li>Se eliminarán sus <b>${(selectedSpeaker.talks || []).length}</b> ponencias asignadas (no programadas).</li>
                                                   <li>Su rol cambiará a "Asistente".</li>
                                                   <li>Sus accesos se restablecerán.</li>
                                               </ul>`,
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: '#d33',
                                        cancelButtonColor: '#3085d6',
                                        confirmButtonText: 'Sí, quitar',
                                        cancelButtonText: 'Cancelar'
                                    });

                                    if (!result.isConfirmed) return;

                                    try {
                                        setLoading(true);
                                        // 1. Get default 'asistente' config to reset modules
                                        const roleDefaults = await api.system.getRoleDefaults();
                                        const asistenteDefaults = roleDefaults['asistente']?.modules || {
                                            'perfil_basico': { enabled: true, locked: true },
                                            'aula_virtual': { enabled: true, locked: false }
                                        };

                                        // 2. Update User
                                        const updatedUser = {
                                            ...selectedSpeaker,
                                            eventRoles: ['asistente'], // Reset to only asistente
                                            role: 'participant',
                                            modules: asistenteDefaults,
                                            talks: [] // Clear talks
                                        };

                                        await api.users.update(updatedUser);

                                        await Swal.fire(
                                            '¡Eliminado!',
                                            'El usuario ha sido quitado de la lista de ponentes.',
                                            'success'
                                        );

                                        // 3. Refresh
                                        setSelectedSpeakerId(null);
                                        refetch();

                                    } catch (error) {
                                        console.error("Error removing speaker role:", error);
                                        Swal.fire('Error', 'Hubo un problema al quitar el rol de ponente.', 'error');
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                            >
                                <Trash2 size={16} />
                                Quitar
                            </Button>
                        </div>

                        {/* Registered Talks Section (Now "Ponencias Asignadas") */}
                        <div className="">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <BookOpen size={18} className="text-purple-500" />
                                    Ponencias Asignadas ({selectedSpeaker.talks?.length || 0})
                                </h3>
                                <Button
                                    size="xs"
                                    className="bg-purple-600 text-white hover:bg-purple-700 shadow-md transition-all"
                                    onClick={() => setIsAddTalkOpen(true)}
                                >
                                    + Agregar Ponencia
                                </Button>
                            </div>

                            {selectedSpeaker.talks && selectedSpeaker.talks.length > 0 ? (
                                <div className="space-y-2">
                                    {selectedSpeaker.talks.map((talk, idx) => {
                                        const schedule = getTalkSchedule(talk.id);
                                        return (
                                            <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center group hover:border-purple-200 transition-all">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 text-sm">{talk.title}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full inline-block">
                                                            {talk.specialty}
                                                        </span>
                                                        {schedule && (
                                                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                                                                <Calendar size={10} />
                                                                {schedule.day} • {schedule.time}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                                                    <button
                                                        onClick={() => {
                                                            setEditingTalk({ ...talk, index: idx }); // Pass index to identify talk when editing
                                                            setIsAddTalkOpen(true);
                                                        }}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    {!schedule && (
                                                        <button
                                                            onClick={() => handleDeleteTalk(idx)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                    {schedule && (
                                                        <span className="text-xs text-gray-400 italic ml-2" title="Esta ponencia ya está programada">Programado</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-gray-100/50 rounded-lg dashed-border">
                                    <p className="text-xs text-gray-500">No hay temas registrados para este ponente.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <User size={48} className="mb-4 opacity-20" />
                        <p>Seleccione un ponente del directorio para ver sus detalles.</p>
                    </div>
                )}
            </div >

            {/* Add Speaker Modal */}
            < AddSpeakerModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onUpdate={refetch}
            />

            {/* Add/Edit Speaker Talk Modal */}
            < AddTalkModal
                isOpen={isAddTalkOpen}
                initialData={editingTalk}
                onClose={() => {
                    setIsAddTalkOpen(false);
                    setEditingTalk(null);
                }}
                onSave={handleSaveTalk}
                specialties={['Neurocirugía', 'Neurología', 'Neuropsicología', 'Neurociencias', 'Neuroimagen', 'Neurogenética', 'Neuroinmunología']}
            />
        </div >
    );
};

export default AcademicSpeakers;
