import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Calendar, Rocket, BookOpen, UserPlus, Clock, CheckCircle, Circle } from 'lucide-react';

const RoadmapView = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await api.roadmap.getAll();
                // Sort by date
                const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
                setEvents(sorted);
            } catch (error) {
                console.error("Failed to load roadmap", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const getIcon = (iconName) => {
        switch (iconName) {
            case 'Rocket': return <Rocket size={24} />;
            case 'BookOpen': return <BookOpen size={24} />;
            case 'UserPlus': return <UserPlus size={24} />;
            case 'Clock': return <Clock size={24} />;
            case 'Calendar': return <Calendar size={24} />;
            default: return <Circle size={24} />;
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-gray-500">Cargando cronograma...</div>;
    }

    return (
        <div className="animate-fadeIn max-w-5xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Linea del Tiempo del Evento</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Sigue paso a paso todas las etapas del SIMR 2026, desde la convocatoria hasta el día central.
                </p>
            </div>

            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-blue-100 -translate-x-1/2 hidden md:block"></div>

                {/* Mobile Line */}
                <div className="absolute left-8 top-0 bottom-0 w-1 bg-blue-100 md:hidden"></div>

                <div className="space-y-12">
                    {events.map((event, index) => {
                        const isEven = index % 2 === 0;
                        const isPast = new Date(event.date) < new Date();
                        const isToday = new Date(event.date).toDateString() === new Date().toDateString();

                        return (
                            <div key={event.id} className={`relative flex items-center md:justify-between ${isEven ? 'md:flex-row-reverse' : ''}`}>

                                {/* Date Circle (Center Desktop, Left Mobile) */}
                                <div className={`absolute left-8 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-4 flex items-center justify-center z-10 bg-white
                                    ${isPast ? 'border-blue-500 text-blue-500' : isToday ? 'border-orange-500 text-orange-500 animate-pulse' : 'border-gray-200 text-gray-400'}
                                `}>
                                    {isPast ? <CheckCircle size={20} className="fill-blue-50" /> : <span className="text-xs font-bold">{event.year}</span>}
                                </div>

                                {/* Content Card */}
                                <div className={`ml-20 md:ml-0 md:w-[45%] p-6 rounded-xl shadow-sm border transition-all hover:shadow-md
                                    ${isPast ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100'}
                                `}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`p-2 rounded-lg ${isPast ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                            {getIcon(event.icon)}
                                        </div>
                                        <div className={`text-sm font-bold ${isPast ? 'text-blue-600' : 'text-gray-500'}`}>
                                            {new Date(event.date + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })}
                                        </div>
                                    </div>
                                    <h3 className={`text-xl font-bold mb-2 ${isPast ? 'text-gray-900' : 'text-gray-800'}`}>{event.title}</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">{event.description}</p>
                                </div>

                                {/* Empty Space for Desktop Alignment */}
                                <div className="hidden md:block md:w-[45%]"></div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default RoadmapView;
