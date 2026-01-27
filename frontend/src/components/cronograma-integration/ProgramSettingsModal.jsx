import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { api } from '../../services/api';

const ProgramSettingsModal = ({ isOpen, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState('days');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // System Config State
    const [config, setConfig] = useState({
        duration: 3,
        startDate: '',
        schedule: [] // [{ day: 1, open: '08:00', close: '18:00', label: '...' }]
    });

    // Blocks State (TimeSlots)
    const [blocks, setBlocks] = useState([]);
    const [newBlock, setNewBlock] = useState({ dayIndex: 0, startTime: '', endTime: '', name: '' });

    useEffect(() => {
        if (isOpen) {
            loadConfig();
        }
    }, [isOpen]);

    const loadConfig = async () => {
        setLoading(true);
        try {
            // Load System Config (Duration, Schedule) and Program Config (Blocks)
            const [sysConfig, progConfig] = await Promise.all([
                api.content.getConfig(),
                api.program.getConfig()
            ]);

            // Initialize Schedule if empty or mismatch
            let loadedSchedule = sysConfig.event_schedule || [];
            const duration = sysConfig.event_duration || 3;

            // Ensure schedule array matches duration
            if (loadedSchedule.length < duration) {
                for (let i = loadedSchedule.length; i < duration; i++) {
                    loadedSchedule.push({
                        day: i + 1,
                        open: '08:00',
                        close: '18:00',
                        label: `Día ${i + 1}`
                    });
                }
            }

            setConfig({
                duration: duration,
                startDate: sysConfig.start_date,
                schedule: loadedSchedule
            });

            // Load Blocks
            setBlocks(progConfig.blocks || []);

        } catch (error) {
            console.error("Error loading config:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers: General ---

    const handleDurationChange = (e) => {
        const newDuration = parseInt(e.target.value) || 1;
        let newSchedule = [...config.schedule];

        if (newDuration > newSchedule.length) {
            // Add days
            for (let i = newSchedule.length; i < newDuration; i++) {
                newSchedule.push({
                    day: i + 1,
                    open: '08:00',
                    close: '18:00',
                    label: `Día ${i + 1}`
                });
            }
        } else if (newDuration < newSchedule.length) {
            // Remove days
            newSchedule = newSchedule.slice(0, newDuration);
        }

        setConfig({ ...config, duration: newDuration, schedule: newSchedule });
    };

    const handleDayChange = (index, field, value) => {
        const newSchedule = [...config.schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setConfig({ ...config, schedule: newSchedule });
    };

    // --- Handlers: Blocks ---

    const handleAddBlock = async () => {
        if (!newBlock.startTime || !newBlock.endTime || !newBlock.name) {
            alert("Por favor complete todos los campos del bloque: Nombre, Inicio y Fin.");
            return;
        }

        try {
            // Calculate Date from Day Index
            const start = new Date(config.startDate + 'T00:00:00');
            if (isNaN(start.getTime())) throw new Error("Fecha de inicio del evento no válida en Configuración General.");

            const current = new Date(start);
            current.setDate(start.getDate() + parseInt(newBlock.dayIndex));
            const dateStr = current.toISOString().split('T')[0];

            // Send "HH:MM" strings, backend handles conversion
            const payload = {
                name: newBlock.name,
                date: dateStr,
                startTime: newBlock.startTime,
                endTime: newBlock.endTime
            };

            const created = await api.program.createBlock(payload);
            setBlocks([...blocks, created].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)));
            setNewBlock({ ...newBlock, name: '', startTime: '', endTime: '' });

        } catch (e) {
            console.error(e);
            alert("Error al crear el bloque: " + (e.response?.data?.detail || e.message));
        }
    };

    const handleDeleteBlock = async (id) => {
        if (!confirm("¿Eliminar este bloque horario?")) return;
        try {
            await api.program.deleteBlock(id);
            setBlocks(blocks.filter(b => b.id !== id));
        } catch (e) {
            console.error(e);
            // Handle dependent activities
            if (e.response?.status === 400 && e.response?.data?.detail?.includes("actividades asignadas")) {
                if (confirm("Este bloque tiene actividades asignadas. ¿Desea eliminarlo junto con todas sus actividades? (Esta acción no se puede deshacer)")) {
                    try {
                        await api.program.deleteBlock(id, true); // Force delete
                        setBlocks(blocks.filter(b => b.id !== id));
                    } catch (err2) {
                        alert("Error al forzar eliminación: " + (err2.response?.data?.detail || err2.message));
                    }
                }
            } else {
                alert("No se pudo eliminar el bloque: " + (e.response?.data?.detail || e.message));
            }
        }
    };

    // --- Save ---

    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. Update System Config (Duration & Schedule)
            const payload = {
                event_duration: config.duration,
                event_schedule: config.schedule
            };
            await api.content.saveConfig(payload);

            // Notify
            window.dispatchEvent(new CustomEvent('program-days-updated'));
            window.dispatchEvent(new CustomEvent('config-updated')); // Sync with Main Settings

            onSave && onSave();
            onClose();
        } catch (error) {
            console.error("Error saving config:", error);
            alert("Error al guardar cambios.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl border border-slate-200 dark:border-slate-800">

                    {/* Header */}
                    <div className="bg-white dark:bg-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">edit_calendar</span>
                            Configuración del Programa
                        </h3>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('days')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'days'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Días y Horarios
                            </button>
                            <button
                                onClick={() => setActiveTab('blocks')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'blocks'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Bloques Generados
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
                                    <div className="flex flex-col gap-6">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3 text-sm text-blue-700 dark:text-blue-300">
                                            <span className="material-symbols-outlined shrink-0">info</span>
                                            <p>Ajusta la duración del evento y los horarios de apertura/cierre para cada día. Esto definirá el marco de trabajo del programa.</p>
                                        </div>

                                        {/* Duration Input */}
                                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                                            <div className="p-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                                                <span className="material-symbols-outlined text-slate-500">date_range</span>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Duración del Evento</label>
                                                <span className="text-xs text-slate-500">Número total de días</span>
                                            </div>
                                            <div className="ml-auto flex items-center gap-3">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="14"
                                                    className="w-20 rounded-lg border-slate-300 py-2 text-center font-bold text-slate-900 focus:ring-2 focus:ring-primary dark:bg-slate-900 dark:text-white"
                                                    value={config.duration}
                                                    onChange={handleDurationChange}
                                                />
                                                <span className="text-sm font-medium text-slate-500">Días</span>
                                            </div>
                                        </div>

                                        {/* Days List */}
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Horarios por Día</h4>
                                            {config.schedule.map((day, index) => (
                                                <div key={index} className="flex flex-col md:flex-row items-center gap-4 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:border-primary/50 transition-colors">

                                                    {/* Day Indicator */}
                                                    <div className="flex items-center gap-3 w-full md:w-48 shrink-0">
                                                        <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                                            {day.day}
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Etiqueta</label>
                                                            <input
                                                                type="text"
                                                                className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-primary focus:ring-0 p-0 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors"
                                                                value={day.label || `Día ${day.day}`}
                                                                onChange={(e) => handleDayChange(index, 'label', e.target.value)}
                                                                placeholder="Nombre del día"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Time Inputs */}
                                                    <div className="flex items-center gap-4 flex-1 w-full">
                                                        <div className="flex-1">
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Apertura</label>
                                                            <input
                                                                type="time"
                                                                className="block w-full rounded-md border-slate-300 py-1.5 text-slate-900 shadow-sm focus:ring-2 focus:ring-primary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                                value={day.open}
                                                                onChange={(e) => handleDayChange(index, 'open', e.target.value)}
                                                            />
                                                        </div>
                                                        <span className="text-slate-300 dark:text-slate-600 mt-4">➜</span>
                                                        <div className="flex-1">
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cierre</label>
                                                            <input
                                                                type="time"
                                                                className="block w-full rounded-md border-slate-300 py-1.5 text-slate-900 shadow-sm focus:ring-2 focus:ring-primary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                                value={day.close}
                                                                onChange={(e) => handleDayChange(index, 'close', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'blocks' && (
                                    <div className="flex flex-col gap-6">
                                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg flex gap-3 text-sm text-amber-700 dark:text-amber-300">
                                            <span className="material-symbols-outlined shrink-0">view_timeline</span>
                                            <div>
                                                <p className="font-bold">Gestión de Bloques Horarios</p>
                                                <p>Crea bloques de tiempo (ej: "Bloque Mañana", "Simposio Industria") para organizar la grilla. Las actividades se asignarán dentro de estos bloques.</p>
                                            </div>
                                        </div>

                                        {/* Add Block Form */}
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                <span className="material-symbols-outlined text-base">add_box</span>
                                                Nuevo Bloque
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                                {/* Day Select */}
                                                <div className="md:col-span-3">
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Día</label>
                                                    <select
                                                        className="block w-full rounded-lg border-slate-300 py-2 text-sm focus:ring-primary dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                        value={newBlock.dayIndex}
                                                        onChange={(e) => setNewBlock({ ...newBlock, dayIndex: parseInt(e.target.value) })}
                                                    >
                                                        {config.schedule.map((day, idx) => (
                                                            <option key={idx} value={idx}>{day.label || `Día ${day.day}`}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Name */}
                                                <div className="md:col-span-3">
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nombre</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ej: Bloque Mañana"
                                                        className="block w-full rounded-lg border-slate-300 py-2 text-sm focus:ring-primary dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                        value={newBlock.name}
                                                        onChange={(e) => setNewBlock({ ...newBlock, name: e.target.value })}
                                                    />
                                                </div>

                                                {/* Times */}
                                                <div className="md:col-span-4 flex gap-2">
                                                    <div className="flex-1">
                                                        <label className="block text-xs font-bold text-slate-500 mb-1">Inicio</label>
                                                        <input
                                                            type="time"
                                                            className="block w-full rounded-lg border-slate-300 py-2 text-sm focus:ring-primary dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                            value={newBlock.startTime}
                                                            onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-xs font-bold text-slate-500 mb-1">Fin</label>
                                                        <input
                                                            type="time"
                                                            className="block w-full rounded-lg border-slate-300 py-2 text-sm focus:ring-primary dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                            value={newBlock.endTime}
                                                            onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Button */}
                                                <div className="md:col-span-2">
                                                    <Button onClick={handleAddBlock} className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700">
                                                        <span className="material-symbols-outlined text-sm mr-1">add</span>
                                                        Agregar
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border rounded-xl overflow-hidden border-slate-200 dark:border-slate-700">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium">
                                                    <tr>
                                                        <th className="px-4 py-3">Fecha</th>
                                                        <th className="px-4 py-3">Horario</th>
                                                        <th className="px-4 py-3">Nombre</th>
                                                        <th className="px-4 py-3 w-10"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {blocks.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="4" className="px-4 py-8 text-center text-slate-400">
                                                                No hay bloques registrados. Use el formulario para crear uno.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        blocks.map(block => (
                                                            <tr key={block.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                                <td className="px-4 py-3 text-slate-900 dark:text-white whitespace-nowrap">
                                                                    {block.date}
                                                                </td>
                                                                <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                                                                    {block.startTime.slice(0, 5)} - {block.endTime.slice(0, 5)}
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                                                                    {block.name}
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <button
                                                                        onClick={() => handleDeleteBlock(block.id)}
                                                                        className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                        title="Eliminar bloque"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end gap-3 rounded-b-2xl border-t border-slate-200 dark:border-slate-800">
                        <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px] flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-b-white"></span>
                                    Guardando...
                                </>
                            ) : (
                                "Guardar Cambios"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgramSettingsModal;
