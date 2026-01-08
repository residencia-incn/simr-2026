import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { api } from '../../services/api';

const ProgramSettingsModal = ({ isOpen, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState('days');
    const [days, setDays] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newSlot, setNewSlot] = useState({ start: '', end: '', label: '' });

    useEffect(() => {
        if (isOpen) {
            loadConfig();
        }
    }, [isOpen]);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const [programConfig, daysData, globalConfig] = await Promise.all([
                api.program.getConfig(),
                api.program.getDays(),
                api.content.getConfig()
            ]);

            if (programConfig) {
                // setDays(programConfig.days || []); // Don't rely solely on config.days
                setTimeSlots(programConfig.timeSlots || []);
            }

            if (daysData && daysData.length > 0) {
                setDays(daysData);
            } else if (programConfig && programConfig.days && programConfig.days.length > 0) {
                // Fallback to program config days
                setDays(programConfig.days);
            } else if (globalConfig && globalConfig.startDate && globalConfig.duration) {
                // Dynamic Fallback: Generate from Global Config
                const start = new Date(globalConfig.startDate + 'T00:00:00');
                const duration = parseInt(globalConfig.duration) || 1;
                const newDays = [];

                for (let i = 0; i < duration; i++) {
                    const current = new Date(start);
                    current.setDate(start.getDate() + i);

                    const year = current.getFullYear();
                    const month = String(current.getMonth() + 1).padStart(2, '0');
                    const day = String(current.getDate()).padStart(2, '0');
                    const isoDate = `${year}-${month}-${day}`;

                    newDays.push({
                        id: `day${i + 1}`,
                        label: `Día ${i + 1}`,
                        date: isoDate
                    });
                }
                setDays(newDays);
            } else {
                // Absolute fallback
                setDays([
                    { id: 'day1', label: 'Día 1', date: '2026-06-22' }
                ]);
            }
        } catch (error) {
            console.error("Error loading program config:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDayChange = (id, field, value) => {
        setDays(prev => prev.map(day =>
            day.id === id ? { ...day, [field]: value } : day
        ));
    };

    const handleAddSlot = () => {
        if (newSlot.start && newSlot.end) {
            const label = newSlot.label || `${newSlot.start} - ${newSlot.end}`;
            setTimeSlots(prev => [...prev, { ...newSlot, id: `ts-${Date.now()}`, label }]);
            setNewSlot({ start: '', end: '', label: '' });
        }
    };

    const handleDeleteSlot = (id) => {
        setTimeSlots(prev => prev.filter(slot => slot.id !== id));
    };

    const handleSave = async () => {
        try {
            await api.program.updateConfig({ days, timeSlots });
            onSave && onSave();
            onClose();
        } catch (error) {
            console.error("Error saving config:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl border border-slate-200 dark:border-slate-800">

                    {/* Header */}
                    <div className="bg-white dark:bg-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">settings</span>
                            Configuración del Evento
                        </h3>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('days')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'days'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Días del Evento
                            </button>
                            <button
                                onClick={() => setActiveTab('schedules')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'schedules'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Sistema de Horarios
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                        {loading ? (
                            <div className="text-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'days' && (
                                    <div className="flex flex-col gap-4">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3 text-sm text-blue-700 dark:text-blue-300 mb-2">
                                            <span className="material-symbols-outlined shrink-0">info</span>
                                            <p>Personaliza los nombres de los días tal como aparecerán en el programa público (ej: "Día 1", "Miércoles 24", "Jornada de Enfermería").</p>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            {days.map((day, index) => (
                                                <div key={day.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
                                                    <div className="size-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 text-sm border border-slate-200 dark:border-slate-600">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 mb-1">Etiqueta Visible</label>
                                                            <input
                                                                type="text"
                                                                className="block w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                                                                value={day.label}
                                                                onChange={(e) => handleDayChange(day.id, 'label', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 mb-1">Fecha</label>
                                                            <input
                                                                type="date"
                                                                className="block w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                                                                value={day.date}
                                                                onChange={(e) => handleDayChange(day.id, 'date', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'schedules' && (
                                    <div className="flex flex-col gap-6">
                                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg flex gap-3 text-sm text-amber-700 dark:text-amber-300">
                                            <span className="material-symbols-outlined shrink-0">warning</span>
                                            <div>
                                                <p className="font-bold mb-1">Definición de Bloques Horarios</p>
                                                <p>Define los bloques de tiempo estándar para las actividades. Estos aparecerán como opciones predefinidas al editar actividades para evitar solapamientos.</p>
                                            </div>
                                        </div>

                                        {/* Add New Slot */}
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Agregar Nuevo Bloque</h4>
                                            <div className="flex flex-wrap items-end gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-500 mb-1">Inicio</label>
                                                    <input
                                                        type="time"
                                                        className="block w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-primary sm:text-sm dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                                                        value={newSlot.start}
                                                        onChange={(e) => setNewSlot(prev => ({ ...prev, start: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-500 mb-1">Fin</label>
                                                    <input
                                                        type="time"
                                                        className="block w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-primary sm:text-sm dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                                                        value={newSlot.end}
                                                        onChange={(e) => setNewSlot(prev => ({ ...prev, end: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-[200px]">
                                                    <label className="block text-xs font-medium text-slate-500 mb-1">Etiqueta (Opcional)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="ej. 09:00 - 10:00 (Conferencias)"
                                                        className="block w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-primary sm:text-sm dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                                                        value={newSlot.label}
                                                        onChange={(e) => setNewSlot(prev => ({ ...prev, label: e.target.value }))}
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleAddSlot}
                                                    disabled={!newSlot.start || !newSlot.end}
                                                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-md text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
                                                >
                                                    Agregar
                                                </button>
                                            </div>
                                        </div>

                                        {/* List Slots */}
                                        <div className="flex flex-col gap-2">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Bloques Configurados</h4>
                                            {timeSlots.length === 0 && (
                                                <div className="text-center py-6 text-slate-400 italic bg-slate-50 dark:bg-slate-800/30 rounded-lg">No hay bloques horarios definidos</div>
                                            )}
                                            {timeSlots.sort((a, b) => a.start.localeCompare(b.start)).map(slot => (
                                                <div key={slot.id} className="flex items-center justify-between p-3 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                                                            {slot.start} - {slot.end}
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            {slot.label}
                                                        </span>
                                                        {/* Calculate Duration */}
                                                        <span className="text-xs text-slate-400">
                                                            {(() => {
                                                                const start = new Date(`2000-01-01T${slot.start}`);
                                                                const end = new Date(`2000-01-01T${slot.end}`);
                                                                const diff = (end - start) / (1000 * 60);
                                                                return diff > 0 ? `${diff} min` : '';
                                                            })()}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteSlot(slot.id)}
                                                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end gap-3 rounded-b-2xl border-t border-slate-200 dark:border-slate-800">
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button
                            onClick={handleSave}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Guardar Cambios
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgramSettingsModal;
