import React, { useState } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Modal, Button, FormField } from '../ui';
import { api } from '../../services/api';
import { useApi } from '../../hooks';
import { ROOMS } from '../../data/mockData';

const AssignScheduleModal = ({ isOpen, onClose, work, onUpdate }) => {
    // Fetch available days
    const { data: days } = useApi(api.program.getDays);

    const [schedule, setSchedule] = useState({
        day: work?.day || '',
        time: work?.time || '', // e.g. "10:00 - 10:15"
        room: work?.room || ROOMS[0]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSchedule(prev => ({ ...prev, [name]: value }));
    };

    const handleAssign = async () => {
        if (!schedule.day || !schedule.time) return; // Simple validation
        setIsSubmitting(true);
        try {
            await api.works.update({
                ...work,
                ...schedule
            });
            onUpdate();
            onClose();
        } catch (error) {
            console.error("Error assigning schedule:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Programar Presentación" size="md">
            <div className="space-y-4">
                <p className="text-gray-600 text-sm mb-4">
                    Asigne un horario y sala para la presentación de: <br />
                    <strong>"{work?.title}"</strong>
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Día del Evento</label>
                        <div className="grid grid-cols-2 gap-2">
                            {days?.map(day => (
                                <button
                                    key={day.id}
                                    type="button"
                                    onClick={() => setSchedule({ ...schedule, day: day.date })}
                                    className={`p-2 text-sm border rounded-lg transition-colors ${schedule.day === day.date
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                                            : 'bg-white hover:bg-gray-50 text-gray-700'
                                        }`}
                                >
                                    {day.label} <span className="text-xs block text-gray-500">{day.date}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <FormField
                        label="Hora (Inicio - Fin)"
                        name="time"
                        value={schedule.time}
                        onChange={handleChange}
                        placeholder="Ej. 10:00 - 10:15"
                        icon={Clock}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sala / Auditorio</label>
                        <select
                            name="room"
                            value={schedule.room}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                            {ROOMS.map(room => (
                                <option key={room} value={room}>{room}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 pt-6 border-t mt-6">
                    <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
                    <Button onClick={handleAssign} disabled={isSubmitting || !schedule.day} className="flex-1">
                        Guardar Horario
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AssignScheduleModal;
