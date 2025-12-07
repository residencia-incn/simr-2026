import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, Calendar, Clock, MapPin, User, Layout, Columns, X } from 'lucide-react';
import { Button, Card, Modal, FormField, ConfirmDialog, LoadingSpinner, EmptyState } from '../ui';
import { api } from '../../services/api';
import { useApi } from '../../hooks';

const INITIAL_HALLS = [
    { id: 'h1', name: 'Auditorio Principal' },
    { id: 'h2', name: 'Sala 1 (Talleres)' },
    { id: 'h3', name: 'Sala Virtual' }
];

const ProgramManager = () => {
    const [halls] = useState(INITIAL_HALLS);
    const [days, setDays] = useState([]);
    const [activeDay, setActiveDay] = useState(null);
    const [program, setProgram] = useState({});

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [currentBlock, setCurrentBlock] = useState(null);
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false });

    // API
    const fetchProgramData = async () => {
        const [daysData, progData] = await Promise.all([
            api.program.getDays(),
            api.program.getAll()
        ]);
        return { days: daysData, program: progData };
    };

    const { data, loading, execute: loadData } = useApi(fetchProgramData);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (data) {
            setDays(data.days);
            setProgram(data.program);
            if (!activeDay && data.days.length > 0) setActiveDay(data.days[0].id);
        }
    }, [data]);

    const saveDays = async (newDays) => {
        setDays(newDays);
        await api.program.saveDays(newDays);
    };

    const handleAddDay = () => {
        const newDayId = `day${days.length + 1}${Date.now()}`;
        const newDay = {
            id: newDayId,
            label: `Día ${days.length + 1}`,
            date: 'Nueva fecha'
        };
        const newDays = [...days, newDay];
        saveDays(newDays);
        if (!program[newDayId]) {
            const newProgram = { ...program, [newDayId]: [] };
            setProgram(newProgram);
            api.program.save(newProgram);
        }
        setActiveDay(newDayId);
    };

    const handleRemoveDay = (dayId) => {
        if (days.length <= 1) {
            alert("Debe haber al menos un día en el evento.");
            return;
        }

        setConfirmConfig({
            isOpen: true,
            title: 'Eliminar Día',
            message: '¿Estás seguro de eliminar este día? Se borrarán sus actividades.',
            type: 'danger',
            onConfirm: async () => {
                const newDays = days.filter(d => d.id !== dayId);
                await saveDays(newDays);

                const newProgram = { ...program };
                delete newProgram[dayId];
                setProgram(newProgram);
                await api.program.save(newProgram);

                if (activeDay === dayId) {
                    setActiveDay(newDays[0].id);
                }
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleUpdateDayDetails = (key, value) => {
        const newDays = days.map(day => {
            if (day.id === activeDay) {
                return { ...day, [key]: value };
            }
            return day;
        });
        saveDays(newDays);
    };

    const saveProgram = async (newProgram) => {
        setProgram(newProgram);
        await api.program.save(newProgram);
    };

    const handleAddBlock = () => {
        setCurrentBlock({
            id: Date.now().toString(),
            type: 'full',
            time: '',
            startTime: '',
            endTime: '',
            title: '',
            room: 'Auditorio Principal',
            sessions: {}
        });
        setIsEditing(true);
    };

    const handleEditBlock = (block) => {
        const [start, end] = block.time ? block.time.split(' - ') : ['', ''];
        setCurrentBlock({
            ...block,
            sessions: block.sessions || {},
            startTime: block.startTime || start || '',
            endTime: block.endTime || end || ''
        });
        setIsEditing(true);
    };

    const handleDeleteBlock = (blockId) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Eliminar Bloque',
            message: '¿Eliminar este bloque horario?',
            type: 'danger',
            onConfirm: async () => {
                const updatedDay = program[activeDay].filter(b => b.id !== blockId);
                await saveProgram({ ...program, [activeDay]: updatedDay });
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleSaveBlock = () => {
        if (!currentBlock.startTime || !currentBlock.endTime) {
            alert("Por favor ingrese la hora de inicio y fin");
            return;
        }

        const formattedTime = `${currentBlock.startTime} - ${currentBlock.endTime}`;
        const blockToSave = {
            ...currentBlock,
            time: formattedTime
        };
        delete blockToSave.startTime;
        delete blockToSave.endTime;

        const updatedDay = [...(program[activeDay] || [])];
        const existingIndex = updatedDay.findIndex(b => b.id === blockToSave.id);

        if (existingIndex >= 0) {
            updatedDay[existingIndex] = blockToSave;
        } else {
            updatedDay.push(blockToSave);
        }

        updatedDay.sort((a, b) => a.time.localeCompare(b.time));

        saveProgram({ ...program, [activeDay]: updatedDay });
        setIsEditing(false);
        setCurrentBlock(null);
    };

    if (loading && !days.length) return <div className="p-8 flex justify-center"><LoadingSpinner text="Cargando programa..." /></div>;

    const currentActiveDayObj = days.find(d => d.id === activeDay);

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Calendar size={20} className="text-blue-600" />
                    Editor de Programa
                </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-6 p-1 bg-gray-50 rounded-xl border border-gray-100">
                {days.map(day => (
                    <div key={day.id} className="relative group">
                        <button
                            onClick={() => setActiveDay(day.id)}
                            className={`px-4 py-2 rounded-lg text-sm transition-all text-center min-w-[100px] ${activeDay === day.id
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            <div className={`font-bold ${activeDay === day.id ? 'text-blue-100' : 'text-gray-500'} text-xs uppercase`}>{day.label}</div>
                            <div className="font-medium">{day.date}</div>
                        </button>
                        {activeDay === day.id && days.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveDay(day.id); }}
                                className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1 shadow hover:bg-red-200 z-10"
                                title="Eliminar día"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                ))}
                <button
                    onClick={handleAddDay}
                    className="p-3 bg-white text-blue-600 hover:bg-blue-50 rounded-lg border border-dashed border-blue-300 hover:border-blue-500 transition-colors"
                    title="Agregar Día"
                >
                    <Plus size={20} />
                </button>
            </div>

            {currentActiveDayObj && (
                <div className="mb-6 mx-1 flex items-center gap-4 animate-fadeIn">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Editar Etiqueta:</span>
                        <input
                            type="text"
                            value={currentActiveDayObj.label}
                            onChange={(e) => handleUpdateDayDetails('label', e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-blue-800 p-0 w-24"
                        />
                        <Edit2 size={12} className="text-gray-300" />
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Editar Fecha:</span>
                        <input
                            type="text"
                            value={currentActiveDayObj.date}
                            onChange={(e) => handleUpdateDayDetails('date', e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 p-0 w-32"
                        />
                        <Calendar size={12} className="text-gray-300" />
                    </div>
                </div>
            )}

            <Modal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                title={currentBlock?.id?.startsWith('mock') ? 'Editar Bloque (Mock)' : currentBlock?.id ? 'Editar Bloque' : 'Nuevo Bloque'}
                size="lg"
            >
                {currentBlock && (
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-1/3">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Horario</label>
                                <div className="relative flex items-center gap-2">
                                    <Clock size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={currentBlock.startTime || ''}
                                        onChange={e => setCurrentBlock({ ...currentBlock, startTime: e.target.value })}
                                        placeholder="00:00"
                                        className="w-full pl-8 p-2 border rounded-lg text-sm font-mono text-center"
                                    />
                                    <span className="text-gray-400 font-bold">-</span>
                                    <input
                                        type="text"
                                        value={currentBlock.endTime || ''}
                                        onChange={e => setCurrentBlock({ ...currentBlock, endTime: e.target.value })}
                                        placeholder="00:00"
                                        className="w-full p-2 border rounded-lg text-sm font-mono text-center"
                                    />
                                </div>
                            </div>
                            <div className="w-2/3">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Tipo de Sesión</label>
                                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                    <button
                                        onClick={() => setCurrentBlock({ ...currentBlock, type: 'full' })}
                                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-sm ${currentBlock.type === 'full' ? 'bg-white shadow text-blue-700 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <Layout size={16} /> Sala Única
                                    </button>
                                    <button
                                        onClick={() => setCurrentBlock({ ...currentBlock, type: 'split' })}
                                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-sm ${currentBlock.type === 'split' ? 'bg-white shadow text-purple-700 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <Columns size={16} /> Simultáneo (Multi-Sala)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {currentBlock.type === 'full' ? (
                            <div className="space-y-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <FormField
                                    label="Título de la Actividad"
                                    value={currentBlock.title}
                                    onChange={e => setCurrentBlock({ ...currentBlock, title: e.target.value })}
                                    placeholder="Ej: Ceremonia de Inauguración"
                                />
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <FormField
                                            label="Lugar / Sala"
                                            value={currentBlock.room}
                                            onChange={e => setCurrentBlock({ ...currentBlock, room: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <FormField
                                            label="Ponente (Opcional)"
                                            value={currentBlock.speaker || ''}
                                            onChange={e => setCurrentBlock({ ...currentBlock, speaker: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-orange-50 text-orange-800 text-xs p-3 rounded-lg border border-orange-100 flex gap-2">
                                    <Columns size={16} />
                                    <span>Configura las actividades para cada sala disponible en este horario.</span>
                                </div>
                                {halls.map(hall => (
                                    <div key={hall.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <h5 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
                                            <MapPin size={14} /> {hall.name}
                                        </h5>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Título de la actividad"
                                                value={currentBlock.sessions?.[hall.id]?.title || ''}
                                                onChange={e => {
                                                    const newSessions = { ...currentBlock.sessions };
                                                    if (!newSessions[hall.id]) newSessions[hall.id] = {};
                                                    newSessions[hall.id].title = e.target.value;
                                                    setCurrentBlock({ ...currentBlock, sessions: newSessions });
                                                }}
                                                className="w-full p-2 border rounded text-sm"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Ponente"
                                                value={currentBlock.sessions?.[hall.id]?.speaker || ''}
                                                onChange={e => {
                                                    const newSessions = { ...currentBlock.sessions };
                                                    if (!newSessions[hall.id]) newSessions[hall.id] = {};
                                                    newSessions[hall.id].speaker = e.target.value;
                                                    setCurrentBlock({ ...currentBlock, sessions: newSessions });
                                                }}
                                                className="w-full p-2 border rounded text-sm"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                            <Button onClick={handleSaveBlock}>
                                <Save size={18} className="mr-2" /> Guardar Bloque
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmDialog
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                type={confirmConfig.type}
            />

            {/* List */}
            {true && (
                <div className="flex-1 overflow-auto custom-scrollbar space-y-3 pb-4">
                    {(!program[activeDay] || program[activeDay].length === 0) && (
                        <EmptyState
                            icon={Calendar}
                            title="Dia sin actividades"
                            description="No hay actividades programadas para este día."
                        />
                    )}

                    {(program[activeDay] || []).map((block, idx) => (
                        <div key={block.id || idx} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow group">
                            <div className="flex items-start gap-4">
                                <div className="w-24 shrink-0 pt-1">
                                    <div className="font-mono font-bold text-gray-900 text-sm">{block.time}</div>
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold mt-1 ${block.type === 'full' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                        {block.type === 'full' ? 'Sala Única' : 'Simultáneo'}
                                    </span>
                                </div>

                                <div className="flex-1">
                                    {block.type === 'full' ? (
                                        <div>
                                            <h4 className="font-bold text-gray-800">{block.title}</h4>
                                            <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                                <span className="flex items-center gap-1"><MapPin size={12} /> {block.room}</span>
                                                {block.speaker && <span className="flex items-center gap-1"><User size={12} /> {block.speaker}</span>}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {halls.map(hall => {
                                                const session = block.sessions?.[hall.id];
                                                if (!session?.title) return null;
                                                return (
                                                    <div key={hall.id} className="bg-gray-50 p-2 rounded border border-gray-100 text-xs">
                                                        <div className="font-bold text-gray-600 mb-1 flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                                                            {hall.name}
                                                        </div>
                                                        <div className="font-medium text-gray-800">{session.title}</div>
                                                        {session.speaker && <div className="text-gray-500 mt-0.5">{session.speaker}</div>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditBlock(block)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteBlock(block.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <Button onClick={handleAddBlock} variant="outline" className="w-full border-dashed py-4 text-gray-500 hover:text-blue-600 hover:border-blue-100 transition-colors">
                        <Plus size={18} className="mr-2" /> Agregar Actividad al Horario
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ProgramManager;
