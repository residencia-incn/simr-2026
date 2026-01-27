import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Info, AlertTriangle, Check } from 'lucide-react';
import { Modal, Button, LoadingSpinner } from '../ui';
import { api } from '../../services/api';
import { showError } from '../../utils/alerts';

const AssignScheduleModal = ({ isOpen, onClose, work, onUpdate }) => {
    const [config, setConfig] = useState({ days: [], blocks: [], locations: [] });
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedDay, setSelectedDay] = useState('');
    const [selectedBlockId, setSelectedBlockId] = useState('');
    const [selectedLocationId, setSelectedLocationId] = useState('');

    useEffect(() => {
        const loadConfig = async () => {
            setLoading(true);
            try {
                const [configData, activitiesData] = await Promise.all([
                    api.program.getConfig(),
                    api.program.getActivities()
                ]);

                setConfig(configData);
                setActivities(activitiesData);

                // Initialize if work already has schedule
                if (work?.day) {
                    setSelectedDay(work.day);
                } else if (configData.days.length > 0) {
                    setSelectedDay(configData.days[0].date);
                }

                if (configData.locations.length > 0) {
                    // Pre-select location if work already has one, otherwise first one
                    if (work?.location_id) {
                        setSelectedLocationId(work.location_id);
                    } else {
                        const currentRoom = configData.locations.find(l => l.name === work?.room);
                        setSelectedLocationId(currentRoom ? currentRoom.id : configData.locations[0].id);
                    }
                }

                if (work?.block_id) {
                    setSelectedBlockId(work.block_id);
                }
            } catch (error) {
                console.error("Error loading program config:", error);
                showError("No se pudo cargar la configuración del programa.");
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            loadConfig();
        }
    }, [isOpen, work]);

    // Availability Logic
    const isBlockOccupied = (blockId) => {
        if (!selectedLocationId) return false;

        // Find if any activity occupies this block in this location
        return activities.some(act =>
            act.block_id === parseInt(blockId) &&
            act.location_id === parseInt(selectedLocationId) &&
            act.external_paper_id !== work?.id
        );
    };

    const filteredBlocks = config.blocks.filter(b => b.date === selectedDay && !b.is_break);

    const handleAssign = async () => {
        if (!selectedDay || !selectedBlockId || !selectedLocationId) {
            showError("Por favor seleccione un día, un bloque horario y un auditorio.");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.academic.scheduleWork(work.id, {
                block_id: parseInt(selectedBlockId),
                location_id: parseInt(selectedLocationId)
            });
            onUpdate();
            onClose();
        } catch (error) {
            console.error("Error assigning schedule:", error.response || error);
            showError(error.response?.data?.detail || error.message || "Error al programar el trabajo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Programar Presentación" size="lg">
            <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex gap-3">
                    <Info className="text-blue-500 shrink-0" size={20} />
                    <p className="text-blue-800 text-sm">
                        Seleccione el bloque horario y ambiente para la ponencia de: <br />
                        <span className="font-bold">"{work?.title}"</span>
                    </p>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <LoadingSpinner />
                        <span className="text-sm text-gray-500">Cargando disponibilidad...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Days & Auditoriums */}
                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                                    <Calendar size={16} className="text-blue-600" />
                                    1. Seleccione el Día
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {config.days.map(day => (
                                        <button
                                            key={day.number}
                                            onClick={() => {
                                                setSelectedDay(day.date);
                                                // If returning to the original day the work was assigned to, restore selection
                                                if (day.date === work?.day) {
                                                    setSelectedBlockId(work.block_id || '');
                                                } else {
                                                    setSelectedBlockId('');
                                                }
                                            }}
                                            className={`p-3 text-left border rounded-xl transition-all flex justify-between items-center ${selectedDay === day.date
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                                : 'bg-white border-gray-200 hover:border-blue-300 text-gray-700'
                                                }`}
                                        >
                                            <div>
                                                <div className="font-bold">{day.label}</div>
                                                <div className={`text-xs ${selectedDay === day.date ? 'text-blue-100' : 'text-gray-500'}`}>{day.date}</div>
                                            </div>
                                            {selectedDay === day.date && <Check size={18} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                                    <MapPin size={16} className="text-blue-600" />
                                    2. Auditorio / Ambiente
                                </label>
                                <select
                                    value={selectedLocationId}
                                    onChange={(e) => {
                                        const newLocId = parseInt(e.target.value);
                                        setSelectedLocationId(newLocId);
                                        // If returning to the original room and we are on the original day, restore selection
                                        if (newLocId === work?.location_id && selectedDay === work?.day) {
                                            setSelectedBlockId(work.block_id || '');
                                        } else {
                                            setSelectedBlockId('');
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                >
                                    <option value="" disabled>Seleccione una sala</option>
                                    {config.locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.name} {loc.type === 'virtual' ? '(Virtual)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Right Column: Time Blocks */}
                        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                                <Clock size={16} className="text-blue-600" />
                                3. Bloques Disponibles
                            </label>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {filteredBlocks.length > 0 ? (
                                    filteredBlocks.map(block => {
                                        const occupied = isBlockOccupied(block.id);
                                        const isSelected = selectedBlockId === block.id;

                                        return (
                                            <div
                                                key={block.id}
                                                onClick={() => !occupied && setSelectedBlockId(block.id)}
                                                className={`p-3 rounded-xl border transition-all flex items-center justify-between ${occupied
                                                    ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                                                    : isSelected
                                                        ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 cursor-pointer shadow-sm'
                                                        : 'bg-white border-gray-200 hover:border-blue-200 cursor-pointer'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-10 rounded-full ${occupied ? 'bg-gray-300' : isSelected ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                                                    <div>
                                                        <div className={`font-bold text-sm ${occupied ? 'text-gray-500' : 'text-gray-900'}`}>
                                                            {block.name} {occupied && <span className="text-xs font-normal ml-1">(Ocupado)</span>}
                                                        </div>
                                                        <div className={`text-xs ${occupied ? 'text-gray-400' : 'text-blue-600'} font-medium`}>
                                                            {block.startTime.substring(0, 5)} - {block.endTime.substring(0, 5)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                                    {isSelected && <Check size={12} className="text-white" />}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 mt-2">
                                        <AlertTriangle className="mx-auto text-amber-400 mb-2" size={32} />
                                        <p className="text-sm text-gray-500 px-4">
                                            No hay bloques de tiempo configurados para este día.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-3 pt-6 border-t mt-4">
                    <Button variant="ghost" onClick={onClose} className="flex-1 py-3 text-base">Cancelar</Button>
                    <Button onClick={handleAssign} disabled={isSubmitting || !selectedBlockId} className="flex-1 py-3 text-base">
                        {isSubmitting ? 'Programando...' : 'Confirmar Programación'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AssignScheduleModal;
