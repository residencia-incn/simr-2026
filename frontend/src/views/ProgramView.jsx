import React, { useState, useEffect, useRef } from 'react';
import { User, Calendar, MapPin, Clock } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';
import { api } from '../services/api';

// Hook para obtener la hora actual (actualiza cada minuto)
const useCurrentTime = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Actualizar cada minuto

        return () => clearInterval(interval);
    }, []);

    return currentTime;
};

// Helper para verificar si una sesión está en vivo
const isSessionLive = (startTime, endTime, currentTime) => {
    if (!startTime || !endTime) return false;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const now = currentTime.getHours() * 60 + currentTime.getMinutes();
    const start = startH * 60 + startM;
    const end = endH * 60 + endM;

    return now >= start && now < end;
};

// Componente Badge "EN VIVO"
const LiveBadge = () => (
    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg">
        <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        EN VIVO
    </span>
);

// Layout para UNA SALA (optimizado)
const SingleRoomLayout = ({ blocks, currentTime, scrollRef }) => {
    return (
        <div className="space-y-4 p-4">
            {blocks.map((block, idx) => {
                const isLive = isSessionLive(block.startTime, block.endTime, currentTime);

                return (
                    <div
                        key={block.id || idx}
                        ref={isLive ? scrollRef : null}
                        className={`session-card rounded-xl p-6 transition-all duration-300 ${isLive
                                ? 'live-session border-2 border-green-500 bg-gradient-to-br from-green-50 to-white shadow-xl shadow-green-200 scale-[1.02]'
                                : 'border-2 border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                            }`}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                                <Clock size={16} className={isLive ? 'text-green-600' : 'text-gray-400'} />
                                <span className={isLive ? 'text-green-700' : ''}>{block.time}</span>
                            </div>
                            {isLive && <LiveBadge />}
                        </div>

                        <h3 className={`text-xl font-bold mb-2 ${isLive ? 'text-green-900' : 'text-gray-900'}`}>
                            {block.title}
                        </h3>

                        <div className="flex flex-col gap-2 text-sm text-gray-600">
                            {block.speaker && (
                                <div className="flex items-center gap-2">
                                    <User size={16} className="text-blue-500" />
                                    <span>{block.speaker}</span>
                                </div>
                            )}
                            {block.room && (
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-purple-500" />
                                    <span>{block.room}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Layout para MÚLTIPLES SALAS
const MultiRoomLayout = ({ blocks, halls, currentTime }) => {
    const getSessionForRoom = (sessions, hallId) => {
        if (!sessions || typeof sessions !== 'object') return null;
        return sessions[hallId] || null;
    };

    return (
        <div>
            {/* Headers de salas */}
            <div className="hidden md:grid bg-blue-900 text-white text-sm font-bold" style={{ gridTemplateColumns: `repeat(${halls.length}, 1fr)` }}>
                {halls.map((hall, i) => (
                    <div key={hall.id} className={`p-4 text-center ${i < halls.length - 1 ? 'border-r border-blue-800' : ''}`}>
                        {hall.name}
                    </div>
                ))}
            </div>

            {/* Bloques de sesiones */}
            <div className="divide-y divide-gray-100">
                {blocks.map((block, idx) => {
                    if (block.type === 'full') {
                        // Sesión única (full-width)
                        return (
                            <div key={block.id || idx} className="p-4 md:p-6 text-center bg-blue-50 border-blue-100 text-blue-800 m-2 rounded-lg border flex flex-col items-center">
                                <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2 bg-white/50 px-3 py-1 rounded-full">
                                    {block.time}
                                </div>
                                <h4 className="text-lg font-bold mb-1">{block.title}</h4>
                                <div className="text-sm opacity-90 font-medium">{block.room}</div>
                                {block.speaker && (
                                    <div className="text-xs mt-1 text-blue-600 flex items-center gap-1">
                                        <User size={12} /> {block.speaker}
                                    </div>
                                )}
                            </div>
                        );
                    } else {
                        // Sesiones simultáneas (multi-sala)
                        return (
                            <div key={block.id || idx} className="p-4">
                                <div className="md:hidden w-full text-center mb-2">
                                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">
                                        {block.time}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:gap-4" style={{ gridTemplateColumns: `repeat(${halls.length}, 1fr)` }}>
                                    {halls.map((hall) => {
                                        const session = getSessionForRoom(block.sessions, hall.id);
                                        if (!session) {
                                            return <div key={hall.id} className="hidden md:block bg-gray-50/30 rounded-lg"></div>;
                                        }

                                        const isLive = isSessionLive(block.startTime, block.endTime, currentTime);

                                        return (
                                            <div
                                                key={hall.id}
                                                className={`p-4 rounded-lg border shadow-sm flex flex-col h-full relative overflow-hidden transition-all ${isLive
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-100 bg-white hover:border-blue-200'
                                                    }`}
                                            >
                                                <div className="md:hidden text-xs font-bold text-blue-600 mb-1 border-b pb-1 border-gray-100">
                                                    {hall.name}
                                                </div>
                                                <div className="hidden md:block absolute top-0 right-0 bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 rounded-bl-lg">
                                                    {block.time}
                                                </div>
                                                {isLive && (
                                                    <div className="absolute top-2 left-2">
                                                        <LiveBadge />
                                                    </div>
                                                )}
                                                <h5 className="font-bold text-gray-900 text-sm mb-2 leading-tight mt-6">
                                                    {session.title}
                                                </h5>
                                                <p className="text-xs text-gray-600 mt-auto flex items-center gap-1">
                                                    <User size={12} /> {session.speaker || 'TBA'}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    }
                })}
            </div>
        </div>
    );
};

const ProgramView = () => {
    const [selectedDay, setSelectedDay] = useState('');
    const [days, setDays] = useState([]);
    const [programData, setProgramData] = useState({});
    const [halls, setHalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentTime = useCurrentTime();
    const scrollRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [daysData, progData, hallsData] = await Promise.all([
                    api.program.getDays(),
                    api.program.getAll(),
                    api.program.getHalls()
                ]);

                setDays(daysData);
                setProgramData(progData);
                setHalls(hallsData || []);

                if (daysData.length > 0) setSelectedDay(daysData[0].id);
            } catch (err) {
                console.error('Error loading program', err);
            } finally {
                setLoading(false);
            }
        };

        load();

        window.addEventListener('program-updated', load);
        window.addEventListener('program-days-updated', load);
        return () => {
            window.removeEventListener('program-updated', load);
            window.removeEventListener('program-days-updated', load);
        };
    }, []);

    // Auto-scroll a la sesión actual
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [selectedDay, currentTime]);

    const currentDayObj = days.find((d) => d.id === selectedDay);
    const currentDayLabel = currentDayObj ? currentDayObj.date : days[0]?.date || 'Fecha por confirmar';
    const dayBlocks = programData[selectedDay] || [];
    const isSingleRoom = halls.length <= 1;

    if (loading && !programData.day1)
        return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando programa...</div>;

    return (
        <div className="max-w-7xl mx-auto animate-fadeIn">
            <SectionHeader
                title="Programa Científico"
                subtitle="Explora las actividades académicas y talleres programados."
            />

            {/* Tabs de días */}
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
                {days.map((day) => (
                    <button
                        key={day.id}
                        onClick={() => setSelectedDay(day.id)}
                        className={`px-8 py-3 rounded-lg font-bold text-sm transition-all shadow-sm ${selectedDay === day.id
                                ? 'bg-blue-800 text-white shadow-md transform scale-105'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        <div
                            className={`text-xs opacity-70 font-normal uppercase mb-0.5 ${selectedDay === day.id ? 'text-blue-100' : 'text-gray-500'
                                }`}
                        >
                            {day.label}
                        </div>
                        <div>{day.date}</div>
                    </button>
                ))}
            </div>

            {/* Contenido del programa */}
            {dayBlocks.length > 0 ? (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="text-center py-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-xl font-bold text-gray-800">{currentDayLabel}</h3>
                    </div>

                    {isSingleRoom ? (
                        <SingleRoomLayout blocks={dayBlocks} currentTime={currentTime} scrollRef={scrollRef} />
                    ) : (
                        <MultiRoomLayout blocks={dayBlocks} halls={halls} currentTime={currentTime} />
                    )}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Calendar size={48} className="mx-auto mb-3 opacity-20" />
                    <p>No hay actividades programadas para este día.</p>
                </div>
            )}
        </div>
    );
};

export default ProgramView;
