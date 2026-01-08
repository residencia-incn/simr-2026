
import React, { useState } from 'react';
import Button from '../ui/Button';
import { SPEAKERS } from './data/mockData';
import ImportActivityModal from './ImportActivityModal';
import SelectSpeakerModal from './SelectSpeakerModal';
import ManageRoomsModal from './ManageRoomsModal';
import { api } from '../../services/api';

const EditSessionView = ({ session, onSave, onCancel, currentDaySessions = [] }) => {
    const [formData, setFormData] = useState(session);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isSpeakerModalOpen, setIsSpeakerModalOpen] = useState(false);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [workTypes, setWorkTypes] = useState(['Conferencia Magistral', 'Trabajo Original', 'Reporte de Caso', 'Mesa Redonda']);
    const [isGeneralMode, setIsGeneralMode] = useState(
        session.category === 'GENERAL' || (!session.category && (!session.speakers || session.speakers.length === 0))
    );
    const [timeSlots, setTimeSlots] = useState([]);
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

    const isLinked = !!(formData.linkedWorkId || formData.linkedTalkId);

    React.useEffect(() => {
        const loadData = async () => {
            try {
                const [academicConfig, programConfig] = await Promise.all([
                    api.academic.getConfig(),
                    api.program.getConfig()
                ]);

                if (academicConfig && academicConfig.workTypes) {
                    const uniqueTypes = [...new Set(['Conferencia Magistral', ...academicConfig.workTypes])];
                    setWorkTypes(uniqueTypes);
                }

                if (programConfig && programConfig.timeSlots) {
                    // Sort slots by start time
                    const sortedSlots = programConfig.timeSlots.sort((a, b) => a.start.localeCompare(b.start));
                    setTimeSlots(sortedSlots);
                }
            } catch (error) {
                console.error("Error fetching configs:", error);
            }
        };
        loadData();
    }, []);

    // Effect to filter available slots based on location and existing sessions
    React.useEffect(() => {
        if (timeSlots.length === 0) return;

        // If no location set, all slots technically "available" (or none?) -> Let's show all
        if (!formData.location) {
            setAvailableTimeSlots(timeSlots);
            return;
        }

        const occupiedSlots = currentDaySessions.filter(s =>
            // Check same location (normalize?)
            s.location === formData.location &&
            // Exclude current session being edited
            s.id !== formData.id
        );

        const available = timeSlots.map(slot => {
            const slotStart = slot.start; // "HH:MM"
            const slotEnd = slot.end;

            // Check overlap
            const isOverlapping = occupiedSlots.some(s => {
                // Simple string comparison for HH:MM works because padded 09:00 < 10:00
                // Overlap condition: StartA < EndB && StartB < EndA
                // Here A is slot, B is existing session
                return slotStart < s.timeEnd && s.timeStart < slotEnd;
            });

            return { ...slot, disabled: isOverlapping };
        });

        setAvailableTimeSlots(available);
    }, [timeSlots, formData.location, currentDaySessions, formData.id]);

    const getCategoryColor = (category) => {
        const colors = {
            'Conferencia Magistral': 'blue',
            'Trabajo Original': 'green',
            'Reporte de Caso': 'emerald',
            'Mesa Redonda': 'amber',
            'Revisión Sistemática': 'indigo',
            'Trabajo de Investigación': 'sky'
        };

        if (colors[category]) return colors[category];

        // Fallback for new dynamic categories: assign a color based on the name length or hash
        const fallbackColors = ['rose', 'violet', 'fuchsia', 'orange', 'teal'];
        const index = category.length % fallbackColors.length;
        return fallbackColors[index];
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'category') {
            setFormData(prev => ({
                ...prev,
                category: value,
                categoryColor: getCategoryColor(value)
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleStatusChange = (e) => {
        setFormData(prev => ({ ...prev, status: e.target.value }));
    };

    const normalizeName = (name) => {
        if (!name) return '';
        return name.toLowerCase()
            .replace(/^(dr\.|dra\.|med\.|est\.|lic\.)\s+/i, '') // Remove common titles
            .trim()
            .replace(/\s+/g, ' '); // Normalize internal spaces
    };

    const handleImportWork = async (importedData) => {
        // Find if the author is a registered user to get their object
        let workSpeakers = [];
        try {
            // Important: Use all users, not just speakers, because authors are the speakers for works
            const allUsers = await api.users.getAllIncludingSuperAdmin();
            const targetAuthor = normalizeName(importedData.authorName);

            // 1. Try matching by ID first (most reliable)
            let authorUser = null;
            if (importedData.authorId) {
                authorUser = allUsers.find(u => u.id === importedData.authorId);
            }

            // 2. Fallback to name matching
            if (!authorUser && targetAuthor) {
                authorUser = allUsers.find(u =>
                    normalizeName(u.name) === targetAuthor
                );
            }

            if (authorUser) {
                // Map user to speaker format
                workSpeakers = [{
                    id: authorUser.id,
                    name: authorUser.name,
                    specialty: authorUser.specialty,
                    institution: authorUser.institution,
                    image: authorUser.image,
                    email: authorUser.email
                }];
            } else if (importedData.authorName) {
                // 3. Last fallback: Create a basic speaker object from the name
                workSpeakers = [{
                    id: importedData.authorId || `temp-${Date.now()}`,
                    name: importedData.authorName
                }];
            }
        } catch (e) {
            console.error("Error matching speaker", e);
        }

        setFormData(prev => ({
            ...prev,
            title: importedData.title,
            category: importedData.category,
            categoryColor: getCategoryColor(importedData.category),
            linkedWorkId: importedData.linkedWorkId,
            linkedTalkId: null,
            speakers: workSpeakers.length > 0 ? workSpeakers : prev.speakers
        }));
    };

    const handleImportTalk = (importedData) => {
        setFormData(prev => {
            // Avoid duplicate speakers
            const speakerExists = prev.speakers.find(s => s.id === importedData.speaker.id);
            const newSpeakers = speakerExists ? prev.speakers : [...prev.speakers, importedData.speaker];

            return {
                ...prev,
                title: importedData.title,
                category: importedData.category,
                categoryColor: getCategoryColor(importedData.category),
                linkedTalkId: importedData.linkedTalkId,
                linkedWorkId: null,
                speakers: newSpeakers
            };
        });
    };

    const handleToggleSpeakerSelection = (speaker) => {
        setFormData(prev => {
            const exists = prev.speakers.find(s => s.id === speaker.id);
            if (exists) {
                return {
                    ...prev,
                    speakers: prev.speakers.filter(s => s.id !== speaker.id)
                };
            } else {
                return {
                    ...prev,
                    speakers: [...prev.speakers, speaker]
                };
            }
        });
    };

    const handleRemoveSpeaker = (speakerId) => {
        setFormData(prev => ({
            ...prev,
            speakers: prev.speakers.filter(s => s.id !== speakerId)
        }));
    };

    const handleRoomConfirm = (rooms) => {
        setFormData(prev => ({
            ...prev,
            location: rooms.physical,
            virtualLocation: rooms.virtual
        }));
    };

    const handleSave = () => {
        if (isGeneralMode) {
            onSave({
                ...formData,
                category: "GENERAL",
                categoryColor: null,
                speakers: [],
                category: "GENERAL",
                categoryColor: null,
                speakers: [],
                description: null,
                virtualLocation: formData.virtualLocation
            });
        } else {
            onSave(formData);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 md:items-start pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Editar Actividad</h1>
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 ring-1 ring-inset ring-slate-500/10">
                            ID: #{formData.id.toUpperCase()}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-sm">Última edición: hoy por Admin</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setIsImportModalOpen(true)}
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                        Importar
                    </Button>
                    <Button
                        variant={isGeneralMode ? "solid" : "outline"}
                        onClick={() => setIsGeneralMode(!isGeneralMode)}
                        className={`transition-all ${isGeneralMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                        title="Modo simplificado para breaks, almuerzos, etc."
                    >
                        <span className="material-symbols-outlined text-[20px]">{isGeneralMode ? 'coffee' : 'coffee'}</span>
                        {isGeneralMode ? 'General Activo' : 'Actividad General'}
                    </Button>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1 self-center"></div>
                    <Button variant="outline" onClick={onCancel} className="px-6">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-blue-700 hover:bg-blue-800 shadow-blue-700/20 px-8"
                    >
                        <span className="material-symbols-outlined text-[20px]">save</span>
                        Guardar Cambios
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Info General */}
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/20 font-bold text-slate-900 dark:text-white">
                            <span className="material-symbols-outlined text-primary text-[20px]">edit_note</span>
                            Información General
                        </div>
                        <div className="p-6 flex flex-col gap-6">
                            <div>
                                <label className="block text-sm font-semibold leading-6 text-slate-900 dark:text-white mb-2">Título del Evento</label>
                                <input
                                    className="block w-full rounded-lg border-0 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary text-base font-bold sm:leading-6 dark:bg-slate-800/50 dark:ring-slate-700 dark:text-white"
                                    name="title"
                                    type="text"
                                    value={formData.title}
                                    onChange={handleChange}
                                />
                            </div>
                            {!isGeneralMode && (
                                <div className="animate-fadeIn">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-semibold leading-6 text-slate-900 dark:text-white">Descripción</label>
                                        <div className="flex items-center gap-2">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={formData.hasDescription || false}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, hasDescription: e.target.checked }))}
                                                />
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                                                <span className="ml-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                                                    {formData.hasDescription ? 'Visible en programa' : 'Habilitar descripción'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    {formData.hasDescription && (
                                        <div className="rounded-lg ring-1 ring-inset ring-slate-300 dark:ring-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-800/50 animate-fadeIn">
                                            <div className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                                <button className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition"><span className="material-symbols-outlined text-[18px]">format_bold</span></button>
                                                <button className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition"><span className="material-symbols-outlined text-[18px]">format_italic</span></button>
                                                <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                                                <button className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition"><span className="material-symbols-outlined text-[18px]">link</span></button>
                                            </div>
                                            <textarea
                                                className="block w-full border-0 bg-transparent px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm sm:leading-6 dark:text-white"
                                                name="description"
                                                rows={6}
                                                value={formData.description || ''}
                                                onChange={handleChange}
                                                placeholder="Escribe una descripción detallada..."
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ponentes */}
                    {/* Ponentes - Only show if NOT in General Mode */}
                    {!isGeneralMode && (
                        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fadeIn">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20 font-bold text-slate-900 dark:text-white">
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[20px]">groups</span>
                                    Ponentes Asignados
                                </span>
                                {!isLinked && (
                                    <button
                                        onClick={() => setIsSpeakerModalOpen(true)}
                                        className="text-xs font-medium text-primary hover:text-blue-600 flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">add</span>
                                        Nuevo Ponente
                                    </button>
                                )}
                            </div>
                            <div className="p-6 flex flex-col gap-4">
                                {formData.speakers.length > 0 ? (
                                    formData.speakers.map(speaker => (
                                        <div key={speaker.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="bg-center bg-no-repeat bg-cover rounded-full size-10 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800"
                                                    style={{ backgroundImage: (speaker.imageUrl || speaker.image) ? `url("${speaker.imageUrl || speaker.image}")` : 'none' }}
                                                >
                                                    {!(speaker.imageUrl || speaker.image) && (
                                                        <span className="material-symbols-outlined text-slate-400 text-[20px]">person</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{speaker.name}</h4>
                                                    <p className="text-xs text-slate-500">{speaker.institution || 'Ponente'}</p>
                                                </div>
                                            </div>
                                            {!isLinked && (
                                                <button
                                                    onClick={() => handleRemoveSpeaker(speaker.id)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-6 text-center text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                                        <p className="text-sm">No hay ponentes asignados</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Config */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5 flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-semibold leading-6 text-slate-900 dark:text-white mb-2">Estado de Publicación</label>
                            <select
                                className="block w-full rounded-lg border-0 px-4 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 dark:bg-slate-800/50 dark:ring-slate-700 dark:text-white"
                                value={formData.status}
                                onChange={handleStatusChange}
                            >
                                <option value="Publicado">Publicado</option>
                                <option value="Borrador">Borrador</option>
                                <option value="Programado">Programado</option>
                                <option value="Archivado">Archivado</option>
                            </select>
                        </div>

                        {formData.status === 'Programado' && (
                            <div className="animate-fadeIn">
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha de Publicación</label>
                                <input
                                    type="datetime-local"
                                    className="block w-full rounded-lg border-0 px-4 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 dark:bg-slate-800/50 dark:ring-slate-700 dark:text-white"
                                    value={formData.scheduledAt || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                                />
                            </div>
                        )}

                        {(() => {
                            const isScheduledPassed = formData.status === 'Programado' && formData.scheduledAt && new Date(formData.scheduledAt) <= new Date();
                            const displayStatus = isScheduledPassed ? 'Publicado' : formData.status;

                            return (
                                <div className={`flex items-start gap-2 text-sm p-3 rounded-lg border ${displayStatus === 'Publicado'
                                    ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30'
                                    : displayStatus === 'Programado'
                                        ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30'
                                        : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30'
                                    }`}>
                                    <span className="material-symbols-outlined text-[18px] mt-0.5">
                                        {displayStatus === 'Publicado' ? 'visibility' : displayStatus === 'Programado' ? 'schedule' : 'visibility_off'}
                                    </span>
                                    <span>
                                        {displayStatus === 'Publicado' && (isScheduledPassed ? 'Publicado automáticamente (Fecha programada alcanzada).' : 'Visible para todos los usuarios.')}
                                        {displayStatus === 'Borrador' && 'Solo visible para administradores.'}
                                        {displayStatus === 'Programado' && 'Se publicará automáticamente en la fecha seleccionada.'}
                                        {displayStatus === 'Archivado' && 'Oculto y archivado.'}
                                    </span>
                                </div>
                            );
                        })()}

                    </div>

                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wide">Horario</div>
                        <div className="p-5 flex flex-col gap-4">
                            {timeSlots.length > 0 ? (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Seleccionar Bloque Horario</label>
                                    <select
                                        className="block w-full rounded-lg border-0 px-4 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm dark:bg-slate-800/50 dark:ring-slate-700 dark:text-white"
                                        value={`${formData.timeStart || ''} - ${formData.timeEnd || ''}`}
                                        onChange={(e) => {
                                            const [start, end] = e.target.value.split(' - ');
                                            setFormData(prev => ({ ...prev, timeStart: start, timeEnd: end }));
                                        }}
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {availableTimeSlots.map(slot => (
                                            <option key={slot.id} value={`${slot.start} - ${slot.end}`} disabled={slot.disabled} className={slot.disabled ? 'text-red-300 bg-red-50' : ''}>
                                                {slot.label || `${slot.start} - ${slot.end}`}
                                                {slot.disabled ? ' (Ocupado)' : ''}
                                                {(() => {
                                                    const start = new Date(`2000-01-01T${slot.start}`);
                                                    const end = new Date(`2000-01-01T${slot.end}`);
                                                    const diff = (end - start) / (1000 * 60);
                                                    return diff > 0 && !slot.disabled ? ` (${diff} min)` : '';
                                                })()}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-2 text-xs text-slate-500">
                                        {availableTimeSlots.some(s => s.disabled)
                                            ? 'Algunos horarios están deshabilitados porque la sala está ocupada.'
                                            : 'Selecciona un horario libre.'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Inicio</label>
                                        <input
                                            className="block w-full rounded-lg border-0 px-4 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm dark:bg-slate-800/50 dark:ring-slate-700 dark:text-white"
                                            name="timeStart"
                                            type="time"
                                            value={formData.timeStart}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fin</label>
                                        <input
                                            className="block w-full rounded-lg border-0 px-4 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm dark:bg-slate-800/50 dark:ring-slate-700 dark:text-white"
                                            name="timeEnd"
                                            type="time"
                                            value={formData.timeEnd}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wide">Clasificación</div>
                        <div className="p-5 flex flex-col gap-4">
                            {!isGeneralMode && (
                                <div className="animate-fadeIn">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Trabajo</label>
                                    <select
                                        className="block w-full rounded-lg border-0 px-4 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm dark:bg-slate-800/50 dark:ring-slate-700 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-900/50 disabled:cursor-not-allowed disabled:text-slate-500"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        disabled={!!(formData.linkedWorkId || formData.linkedTalkId)}
                                    >
                                        {workTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ubicación</label>
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <div className="flex-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm">
                                            <span className="text-xs font-bold text-slate-400 block mb-0.5">AUDITORIO (Presencial)</span>
                                            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-medium">
                                                <span className="material-symbols-outlined text-[16px] text-slate-400">apartment</span>
                                                {formData.location || <span className="text-slate-400 font-normal italic">Sin asignar</span>}
                                            </div>
                                        </div>
                                        <div className="flex-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm">
                                            <span className="text-xs font-bold text-slate-400 block mb-0.5">SALA VIRTUAL</span>
                                            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-medium">
                                                <span className="material-symbols-outlined text-[16px] text-slate-400">videocam</span>
                                                {formData.virtualLocation || <span className="text-slate-400 font-normal italic">Sin asignar</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsRoomModalOpen(true)}
                                        className="w-full border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-primary hover:border-primary hover:bg-primary-50 dark:hover:bg-primary-900/20"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">edit_location_alt</span>
                                        Gestionar Salas y Auditorios
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            <ImportActivityModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImportWork={handleImportWork}
                onImportTalk={handleImportTalk}
            />

            <SelectSpeakerModal
                isOpen={isSpeakerModalOpen}
                onClose={() => setIsSpeakerModalOpen(false)}
                onSelect={handleToggleSpeakerSelection}
                selectedSpeakers={formData.speakers}
            />

            <ManageRoomsModal
                isOpen={isRoomModalOpen}
                onClose={() => setIsRoomModalOpen(false)}
                onConfirm={handleRoomConfirm}
                initialLocation={formData.location}
                initialVirtualLocation={formData.virtualLocation}
            />
        </div >
    );
};

export default EditSessionView;
