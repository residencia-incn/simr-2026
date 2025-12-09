import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Edit2, Trash2, Calendar, Rocket, BookOpen, UserPlus, Clock, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

const RoadmapManager = () => {
    const [events, setEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEvent, setCurrentEvent] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        description: '',
        year: new Date().getFullYear().toString(),
        icon: 'Calendar',
        completed: false
    });

    const AVAILABLE_ICONS = [
        { id: 'Rocket', label: 'Lanzamiento', icon: Rocket },
        { id: 'BookOpen', label: 'Curso/Académico', icon: BookOpen },
        { id: 'UserPlus', label: 'Inscripciones', icon: UserPlus },
        { id: 'Clock', label: 'Plazos', icon: Clock },
        { id: 'Calendar', label: 'Evento', icon: Calendar },
        { id: 'CheckCircle', label: 'Hito', icon: CheckCircle }
    ];

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        const data = await api.roadmap.getAll();
        const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(sorted);
    };

    const handleOpenModal = (event = null) => {
        if (event) {
            setCurrentEvent(event);
            setFormData({
                title: event.title,
                date: event.date,
                description: event.description,
                year: event.year,
                icon: event.icon,
                completed: event.completed
            });
        } else {
            setCurrentEvent(null);
            setFormData({
                title: '',
                date: new Date().toISOString().split('T')[0],
                description: '',
                year: new Date().getFullYear().toString(),
                icon: 'Calendar',
                completed: false
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentEvent) {
                await api.roadmap.update({ ...currentEvent, ...formData });
            } else {
                await api.roadmap.add(formData);
            }
            setIsModalOpen(false);
            loadEvents();
        } catch (error) {
            console.error("Error saving event", error);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('¿Estás seguro de eliminar este evento?')) {
            try {
                await api.roadmap.delete(id);
                loadEvents();
            } catch (error) {
                console.error("Error deleting event", error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Gestión del Roadmap</h3>
                    <p className="text-sm text-gray-500">Administra los hitos y eventos del cronograma.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                    <Plus size={16} /> Nuevo Evento
                </Button>
            </div>

            <div className="grid gap-4">
                {events.map((event) => {
                    const Icon = AVAILABLE_ICONS.find(i => i.id === event.icon)?.icon || Calendar;
                    return (
                        <Card key={event.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{event.title}</h4>
                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><Calendar size={12} /> {event.date}</span>
                                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">Año: {event.year}</span>
                                        {event.completed && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">Completado</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleOpenModal(event)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(event.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </Card>
                    );
                })}

                {events.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <Calendar className="mx-auto text-gray-300 mb-2" size={32} />
                        <p className="text-gray-500">No hay eventos programados</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">{currentEvent ? 'Editar Evento' : 'Nuevo Evento'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Año Visual</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={formData.year}
                                        onChange={e => setFormData({ ...formData, year: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Icono</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {AVAILABLE_ICONS.map(({ id, icon: Icon }) => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, icon: id })}
                                            className={`p-2 flex flex-col items-center gap-1 rounded-lg border transition-all ${formData.icon === id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            <Icon size={20} />
                                            <span className="text-[10px]">{id}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 resize-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="completed"
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                    checked={formData.completed}
                                    onChange={e => setFormData({ ...formData, completed: e.target.checked })}
                                />
                                <label htmlFor="completed" className="text-sm text-gray-700">Marcar como completado</label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit">Guardar Evento</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoadmapManager;
