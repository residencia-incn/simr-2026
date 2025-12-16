import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Edit2, Save, Calendar, Clock, MapPin, User, Layout, Columns, X, BookOpen, Check, AlertCircle, Settings } from 'lucide-react';
import { Button, Card, Modal, FormField, ConfirmDialog, LoadingSpinner, EmptyState } from '../ui';
import { api } from '../../services/api';
import { useApi } from '../../hooks';

// Helper: Convertir "HH:MM" a minutos desde medianoche
const timeToMinutes = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

// Helper: Convertir minutos a "HH:MM"
const minutesToTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// Helper: Generar slots de tiempo
const generateTimeSlots = (startStr, endStr, interval) => {
    const slots = [];
    let current = timeToMinutes(startStr);
    const end = timeToMinutes(endStr);

    while (current < end) {
        slots.push(minutesToTime(current));
        current += interval;
    }
    return slots;
};

// Helper: Detectar conflictos de horarios
const detectScheduleConflicts = (newBlock, existingBlocks, halls) => {
    const conflicts = [];

    const newStart = timeToMinutes(newBlock.startTime);
    const newEnd = timeToMinutes(newBlock.endTime);

    for (const block of existingBlocks) {
        // Ignorar el mismo bloque (si estamos editando)
        if (block.id === newBlock.id) continue;

        // Parsear el tiempo del bloque existente
        let blockStart, blockEnd;
        if (block.startTime && block.endTime) {
            blockStart = timeToMinutes(block.startTime);
            blockEnd = timeToMinutes(block.endTime);
        } else if (block.time) {
            // Parsear formato "HH:MM - HH:MM"
            const [start, end] = block.time.split(' - ');
            blockStart = timeToMinutes(start);
            blockEnd = timeToMinutes(end);
        } else {
            continue; // Skip si no tiene información de tiempo
        }

        // Verificar si hay solapamiento de horarios
        const hasTimeOverlap = !(newEnd <= blockStart || newStart >= blockEnd);

        if (!hasTimeOverlap) continue;

        // Verificar conflictos de sala según el tipo
        if (newBlock.type === 'full' && block.type === 'full') {
            // Ambos son sala única
            if (newBlock.room === block.room) {
                conflicts.push({
                    block,
                    reason: `"${block.room}" ya está ocupada de ${block.time}`
                });
            }
        } else if (newBlock.type === 'full' && block.type === 'split') {
            // Nuevo es sala única, existente es multi-sala
            for (const hallId in block.sessions) {
                const hall = halls.find(h => h.id === hallId);
                // Si la sala única es una de las salas del split
                if (hall && hall.name === newBlock.room) {
                    conflicts.push({
                        block,
                        reason: `"${newBlock.room}" ya tiene una sesión simultánea de ${block.time}`
                    });
                }
            }
        } else if (newBlock.type === 'split' && block.type === 'full') {
            // Nuevo es multi-sala, existente es sala única
            for (const hallId in newBlock.sessions) {
                const hall = halls.find(h => h.id === hallId);
                if (hall && hall.name === block.room && newBlock.sessions[hallId]?.title) {
                    conflicts.push({
                        block,
                        reason: `"${hall.name}" está ocupada por "${block.title}" de ${block.time}`
                    });
                }
            }
        } else if (newBlock.type === 'split' && block.type === 'split') {
            // Ambos son multi-sala
            for (const hallId in newBlock.sessions) {
                if (block.sessions[hallId] && newBlock.sessions[hallId]?.title) {
                    const hall = halls.find(h => h.id === hallId);
                    conflicts.push({
                        block,
                        reason: `"${hall?.name || hallId}" ya tiene una sesión programada de ${block.time}`
                    });
                }
            }
        }
    }

    return conflicts;
};

const ProgramManager = () => {
    // Data States
    const [halls, setHalls] = useState([]);
    const [days, setDays] = useState([]);
    const [activeDay, setActiveDay] = useState(null);
    const [program, setProgram] = useState({});

    // Academic Works for linking
    const [works, setWorks] = useState([]);

    // Schedule Config State
    const [scheduleConfig, setScheduleConfig] = useState({
        startTime: "08:00",
        endTime: "20:00",
        interval: 30 // minutes
    });
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [currentBlock, setCurrentBlock] = useState(null);
    const [duration, setDuration] = useState(30); // Duración seleccionada en minutos
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false });

    // Room Management State
    const [isManagingRooms, setIsManagingRooms] = useState(false);
    const [newHallName, setNewHallName] = useState('');

    // Work Linking State
    const [isLinkingWork, setIsLinkingWork] = useState(false);
    const [linkingTarget, setLinkingTarget] = useState(null); // { hallId }

    // Conflict Detection State
    const [conflictWarning, setConflictWarning] = useState(null);

    // Memoized Slots
    const availableSlots = useMemo(() => {
        return generateTimeSlots(scheduleConfig.startTime, scheduleConfig.endTime, scheduleConfig.interval);
    }, [scheduleConfig]);

    const durationOptions = [
        { value: 15, label: '15 min' },
        { value: 30, label: '30 min' },
        { value: 45, label: '45 min' },
        { value: 60, label: '1 hora' },
        { value: 90, label: '1 hora 30 min' },
        { value: 120, label: '2 horas' },
        { value: 150, label: '2 horas 30 min' },
        { value: 180, label: '3 horas' },
    ];

    // Helper to check if a slot is available
    const checkSlotAvailability = (slotTime, checkDuration, checkRoom, blockId, checkType) => {
        if (!activeDay || !program[activeDay]) return true;

        const startMins = timeToMinutes(slotTime);
        const endMins = startMins + checkDuration;
        const endTime = minutesToTime(endMins);

        // Simulated block for conflict detection
        const testBlock = {
            id: blockId,
            startTime: slotTime,
            endTime: endTime,
            room: checkRoom,
            type: checkType,
            sessions: {} // Simplified for 'full' check
        };

        const conflicts = detectScheduleConflicts(testBlock, program[activeDay], halls);
        return conflicts.length === 0;
    };

    // API
    const fetchProgramData = async () => {
        const [daysData, progData, hallsData, worksData, configData] = await Promise.all([
            api.program.getDays(),
            api.program.getAll(),
            api.program.getHalls(),
            api.works.getAll(),
            api.program.getScheduleConfig ? api.program.getScheduleConfig() : Promise.resolve(null)
        ]);
        return { days: daysData, program: progData, halls: hallsData, works: worksData, config: configData };
    };

    const { data, loading, execute: loadData } = useApi(fetchProgramData);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (data) {
            setDays(data.days);
            setProgram(data.program);
            setHalls(data.halls || []);
            setWorks(data.works || []);
            if (data.config) setScheduleConfig(data.config);
            if (!activeDay && data.days.length > 0) setActiveDay(data.days[0].id);
        }
    }, [data]);

    const saveDays = async (newDays) => {
        setDays(newDays);
        await api.program.saveDays(newDays);
    };

    const saveHalls = async (newHalls) => {
        setHalls(newHalls);
        await api.program.saveHalls(newHalls);
    };

    const handleAddHall = () => {
        if (!newHallName.trim()) return;
        const newHall = {
            id: `h-${Date.now()}`,
            name: newHallName
        };
        saveHalls([...halls, newHall]);
        setNewHallName('');
    };

    const handleUpdateHall = (id, name) => {
        const updated = halls.map(h => h.id === id ? { ...h, name } : h);
        saveHalls(updated);
    };

    const handleRemoveHall = (id) => {
        const updated = halls.filter(h => h.id !== id);
        saveHalls(updated);
    };

    const handleAddDay = async () => {
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

        // Sync with System Configuration
        try {
            const config = await api.content.getConfig();
            if (config) {
                const newSchedule = [...(config.schedule || [])];
                if (newSchedule.length < newDays.length) {
                    newSchedule.push({
                        day: newDays.length,
                        open: '08:00 a.m.',
                        close: '06:00 p.m.'
                    });
                }
                await api.content.saveConfig({
                    ...config,
                    duration: newDays.length,
                    schedule: newSchedule
                });
                window.dispatchEvent(new Event('config-updated'));
            }
        } catch (error) {
            console.error("Error syncing config:", error);
        }
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

                // Sync with System Configuration
                try {
                    const config = await api.content.getConfig();
                    if (config) {
                        const newSchedule = (config.schedule || []).slice(0, newDays.length);
                        await api.content.saveConfig({
                            ...config,
                            duration: newDays.length,
                            schedule: newSchedule
                        });
                        window.dispatchEvent(new Event('config-updated'));
                    }
                } catch (error) {
                    console.error("Error syncing config:", error);
                }

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
            startTime: availableSlots[0] || '08:00', // Default to first slot
            endTime: minutesToTime(timeToMinutes(availableSlots[0] || '08:00') + 30), // Default +30m
            title: '',
            room: 'Auditorio Principal',
            sessions: {}
        });
        setDuration(30);
        setIsEditing(true);
    };

    const handleEditBlock = (block) => {
        const [start, end] = block.time ? block.time.split(' - ') : ['', ''];
        const startTime = block.startTime || start || '';
        const endTime = block.endTime || end || '';

        // Calculate duration from existing times
        let dur = 30;
        if (startTime && endTime) {
            const startMins = timeToMinutes(startTime);
            const endMins = timeToMinutes(endTime);
            dur = endMins - startMins;
        }

        setDuration(dur > 0 ? dur : 30);

        setCurrentBlock({
            ...block,
            sessions: block.sessions || {},
            startTime: startTime,
            endTime: endTime
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

        // Detectar conflictos de horarios
        const conflicts = detectScheduleConflicts(
            currentBlock,
            program[activeDay] || [],
            halls
        );

        if (conflicts.length > 0) {
            setConflictWarning({
                conflicts,
                onConfirm: () => {
                    saveBlockAnyway();
                    setConflictWarning(null);
                },
                onCancel: () => {
                    setConflictWarning(null);
                }
            });
            return;
        }

        // No hay conflictos, guardar normalmente
        saveBlockNormally();
    };

    const saveBlockNormally = () => {
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

    const saveBlockAnyway = () => {
        saveBlockNormally();
    };

    const openLinkWork = (hallId) => {
        setLinkingTarget({ hallId });
        setIsLinkingWork(true);
    };

    const handleLinkWork = (work) => {
        if (!linkingTarget) return;

        if (linkingTarget.hallId) {
            const newSessions = { ...currentBlock.sessions };
            if (!newSessions[linkingTarget.hallId]) newSessions[linkingTarget.hallId] = {};

            newSessions[linkingTarget.hallId].title = work.title;
            newSessions[linkingTarget.hallId].speaker = work.author; // Using author as speaker
            newSessions[linkingTarget.hallId].linkedWorkId = work.id;

            setCurrentBlock({ ...currentBlock, sessions: newSessions });
        } else {
            // If linking to main block (full type)
            setCurrentBlock({
                ...currentBlock,
                title: work.title,
                speaker: work.author,
                linkedWorkId: work.id
            });
        }
        setIsLinkingWork(false);
        setLinkingTarget(null);
    };

    const handleSaveScheduleConfig = async () => {
        await api.program.saveScheduleConfig(scheduleConfig);
        setIsConfigOpen(false);
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
                <Button variant="outline" size="sm" onClick={() => setIsConfigOpen(true)}>
                    <Settings size={16} className="mr-2" /> Configurar Horario
                </Button>
            </div>

            {/* Auditorium Management Section */}
            <div className="mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                    onClick={() => setIsManagingRooms(!isManagingRooms)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <MapPin size={18} className="text-purple-600" />
                        <span className="font-bold text-gray-800">Gestión de Auditorios</span>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{halls.length} salas</span>
                    </div>
                    <div className={`transform transition-transform ${isManagingRooms ? 'rotate-180' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </div>
                </button>

                {isManagingRooms && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50 animate-fadeIn">
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="Nombre del nuevo auditorio..."
                                className="flex-1 p-2 border rounded-lg text-sm"
                                value={newHallName}
                                onChange={e => setNewHallName(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleAddHall()}
                            />
                            <Button size="sm" onClick={handleAddHall} disabled={!newHallName.trim()}>
                                <Plus size={16} className="mr-1" /> Agregar
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {halls.length === 0 && (
                                <p className="text-center text-gray-500 py-4 italic text-sm">
                                    No hay auditorios configurados. Agrega uno para comenzar.
                                </p>
                            )}
                            {halls.map(hall => (
                                <div key={hall.id} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                                    <MapPin size={16} className="text-purple-500 flex-shrink-0" />
                                    <input
                                        type="text"
                                        value={hall.name}
                                        onChange={(e) => handleUpdateHall(hall.id, e.target.value)}
                                        className="flex-1 bg-transparent border-none text-sm focus:ring-0 p-0 font-medium"
                                    />
                                    <button
                                        onClick={() => handleRemoveHall(hall.id)}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                                        title="Eliminar auditorio"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Day Tabs */}
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
                            <div className="w-1/3 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Hora Inicio</label>
                                    <div className="relative">
                                        <Clock size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
                                        <select
                                            value={currentBlock.startTime || ''}
                                            onChange={e => {
                                                const start = e.target.value;
                                                const startMins = timeToMinutes(start);
                                                const endMins = startMins + duration;
                                                const end = minutesToTime(endMins);
                                                setCurrentBlock({
                                                    ...currentBlock,
                                                    startTime: start,
                                                    endTime: end
                                                });
                                            }}
                                            className={`w-full pl-8 p-2 border rounded-lg text-sm bg-white ${!checkSlotAvailability(currentBlock.startTime, duration, currentBlock.room, currentBlock.id, currentBlock.type)
                                                ? 'border-red-500 text-red-600 bg-red-50'
                                                : ''
                                                }`}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {availableSlots.map(slot => {
                                                const isAvailable = checkSlotAvailability(
                                                    slot,
                                                    duration,
                                                    currentBlock.room,
                                                    currentBlock.id,
                                                    currentBlock.type
                                                );
                                                return (
                                                    <option
                                                        key={slot}
                                                        value={slot}
                                                        disabled={!isAvailable && slot !== currentBlock.startTime}
                                                        className={!isAvailable ? "text-gray-400 bg-gray-50 italic" : ""}
                                                    >
                                                        {slot} {!isAvailable ? '(Ocupado)' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    {!checkSlotAvailability(currentBlock.startTime, duration, currentBlock.room, currentBlock.id, currentBlock.type) && (
                                        <div className="mt-1 text-xs text-red-500 flex items-center gap-1 font-medium animate-fadeIn">
                                            <AlertCircle size={12} />
                                            <span>Horario no disponible en esta sala</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Duración</label>
                                    <select
                                        value={duration}
                                        onChange={e => {
                                            const newDuration = parseInt(e.target.value);
                                            setDuration(newDuration);
                                            if (currentBlock.startTime) {
                                                const startMins = timeToMinutes(currentBlock.startTime);
                                                const endMins = startMins + newDuration;
                                                setCurrentBlock({
                                                    ...currentBlock,
                                                    endTime: minutesToTime(endMins)
                                                });
                                            }
                                        }}
                                        className="w-full p-2 border rounded-lg text-sm bg-white"
                                    >
                                        {durationOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="text-xs text-center text-gray-500 bg-gray-50 p-2 rounded">
                                    Fin calculado: <strong>{currentBlock.endTime || '--:--'}</strong>
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
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Lugar / Sala</label>
                                        <select
                                            value={currentBlock.room}
                                            onChange={e => setCurrentBlock({ ...currentBlock, room: e.target.value })}
                                            className="w-full p-2 border rounded-lg text-sm"
                                        >
                                            <option value="">Seleccionar sala...</option>
                                            {halls.map(hall => (
                                                <option key={hall.id} value={hall.name}>{hall.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1 relative">
                                        <FormField
                                            label="Ponente (Opcional)"
                                            value={currentBlock.speaker || ''}
                                            onChange={e => setCurrentBlock({ ...currentBlock, speaker: e.target.value })}
                                        />
                                        <button
                                            onClick={() => openLinkWork(null)}
                                            className="absolute right-0 top-0 text-blue-600 text-xs font-bold hover:underline flex items-center gap-1"
                                            title="Importar desde Trabajos Aceptados"
                                        >
                                            <BookOpen size={12} /> Importar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-orange-50 p-3 rounded-lg border border-orange-100">
                                    <div className="flex gap-2 text-orange-800 text-xs">
                                        <Columns size={16} />
                                        <span>Configura las actividades para cada sala disponible.</span>
                                    </div>
                                    <Button size="xs" variant="outline" onClick={() => setIsManagingRooms(!isManagingRooms)}>
                                        {isManagingRooms ? 'Ocultar Gestión' : 'Gestionar Salas'}
                                    </Button>
                                </div>

                                {isManagingRooms && (
                                    <div className="bg-white p-3 rounded-lg border border-gray-200 animate-fadeIn mb-4">
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                placeholder="Nombre de nueva sala..."
                                                className="flex-1 p-2 border rounded-lg text-sm"
                                                value={newHallName}
                                                onChange={e => setNewHallName(e.target.value)}
                                            />
                                            <Button size="sm" onClick={handleAddHall} disabled={!newHallName.trim()}>
                                                <Plus size={16} className="mr-1" /> Agregar
                                            </Button>
                                        </div>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {halls.map(hall => (
                                                <div key={hall.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-100">
                                                    <input
                                                        type="text"
                                                        value={hall.name}
                                                        onChange={(e) => handleUpdateHall(hall.id, e.target.value)}
                                                        className="flex-1 bg-transparent border-none text-sm focus:ring-0 p-0"
                                                    />
                                                    <button onClick={() => handleRemoveHall(hall.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {halls.map(hall => (
                                    <div key={hall.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative group">
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
                                            <div className="relative">
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
                                                    className="w-full p-2 border rounded text-sm pr-8"
                                                />
                                                <button
                                                    onClick={() => openLinkWork(hall.id)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700"
                                                    title="Importar Trabajo"
                                                >
                                                    <BookOpen size={14} />
                                                </button>
                                            </div>
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

            {/* Conflict Warning Modal */}
            <Modal
                isOpen={conflictWarning !== null}
                onClose={() => setConflictWarning(null)}
                title="⚠️ Conflicto de Horarios Detectado"
                size="md"
            >
                {conflictWarning && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-700">
                            Se detectaron los siguientes conflictos de horarios:
                        </p>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                            {conflictWarning.conflicts.map((c, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm flex-1">
                                        <div className="font-bold text-red-900">{c.block.title || 'Actividad'}</div>
                                        <div className="text-red-700 mt-1">{c.reason}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="text-xs text-gray-500 bg-yellow-50 p-3 rounded border border-yellow-200">
                            💡 <strong>Nota:</strong> Puedes guardar de todas formas si es necesario, pero esto creará un conflicto en el programa público.
                        </p>

                        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                            <Button variant="ghost" onClick={conflictWarning.onCancel}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={conflictWarning.onConfirm}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Guardar de todas formas
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Link Work Modal */}
            <Modal
                isOpen={isLinkingWork}
                onClose={() => { setIsLinkingWork(false); setLinkingTarget(null); }}
                title="Vincular Trabajo Académico"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Selecciona un trabajo aceptado para rellenar los datos de la sesión.</p>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {works.filter(w => w.status === 'Aceptado').length === 0 && (
                            <p className="text-center text-gray-500 py-4 italic">No hay trabajos aceptados disponibles.</p>
                        )}
                        {works.filter(w => w.status === 'Aceptado').map(work => (
                            <button
                                key={work.id}
                                onClick={() => handleLinkWork(work)}
                                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                            >
                                <div className="font-bold text-sm text-gray-800 group-hover:text-blue-700 line-clamp-2">{work.title}</div>
                                <div className="flex justify-between mt-1 text-xs text-gray-500">
                                    <span>{work.author}</span>
                                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <Check size={10} /> Aceptado
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button variant="ghost" onClick={() => { setIsLinkingWork(false); setLinkingTarget(null); }}>Cancelar</Button>
                    </div>
                </div>
            </Modal>

            {/* Schedule Config Modal */}
            <Modal
                isOpen={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
                title="Configuración de Horario"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Define el rango horario y los intervalos de tiempo para la programación de actividades.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            label="Hora Inicio"
                            type="time"
                            value={scheduleConfig.startTime}
                            onChange={e => setScheduleConfig({ ...scheduleConfig, startTime: e.target.value })}
                        />
                        <FormField
                            label="Hora Fin"
                            type="time"
                            value={scheduleConfig.endTime}
                            onChange={e => setScheduleConfig({ ...scheduleConfig, endTime: e.target.value })}
                        />
                    </div>
                    <FormField
                        label="Intervalo (minutos)"
                        type="number"
                        min="5"
                        max="60"
                        step="5"
                        value={scheduleConfig.interval}
                        onChange={e => setScheduleConfig({ ...scheduleConfig, interval: parseInt(e.target.value) })}
                    />

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <Button variant="ghost" onClick={() => setIsConfigOpen(false)} className="mr-2">Cancelar</Button>
                        <Button onClick={handleSaveScheduleConfig}>
                            <Save size={16} className="mr-2" /> Guardar Configuración
                        </Button>
                    </div>
                </div>
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
