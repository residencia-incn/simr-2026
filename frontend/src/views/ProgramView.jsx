import React, { useState, useEffect } from 'react';
import { User, Calendar } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';
import { ROOMS } from '../data/mockData'; // ROOMS is static config, keeping it
import { api } from '../services/api';

const DEFAULT_DAYS = [
    { id: 'day1', label: 'Día 1', date: 'Lunes 22' },
    { id: 'day2', label: 'Día 2', date: 'Martes 23' },
    { id: 'day3', label: 'Día 3', date: 'Miércoles 24' }
];

const ProgramView = () => {
    const [selectedDay, setSelectedDay] = useState('');
    const [days, setDays] = useState(DEFAULT_DAYS);
    const [programData, setProgramData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const daysData = await api.program.getDays();
                setDays(daysData);
                if (daysData.length > 0) setSelectedDay(daysData[0].id);

                const progData = await api.program.getAll();
                setProgramData(progData);
            } catch (err) {
                console.error("Error loading program", err);
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

    const getSessionForRoom = (sessions, roomIndex) => {
        if (Array.isArray(sessions)) {
            return sessions[roomIndex] || null;
        }
        if (sessions && typeof sessions === 'object') {
            const hallId = `h${roomIndex + 1}`;
            return sessions[hallId] || null;
        }
        return null;
    };

    const currentDayObj = days.find(d => d.id === selectedDay);
    const currentDayLabel = currentDayObj ? currentDayObj.date : (days[0]?.date || 'Fecha por confirmar');
    const hasSplitSessions = (programData[selectedDay] || []).some(block => block.type === 'split');

    if (loading && !programData.day1) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando programa...</div>;

    return (
        <div className="max-w-7xl mx-auto animate-fadeIn">
            <SectionHeader title="Programa Científico" subtitle="Explora las actividades académicas y talleres programados." />
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
                {days.map((day, i) => (
                    <button key={day.id} onClick={() => setSelectedDay(day.id)} className={`px-8 py-3 rounded-lg font-bold text-sm transition-all shadow-sm ${selectedDay === day.id ? 'bg-blue-800 text-white shadow-md transform scale-105' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
                        <div className={`text-xs opacity-70 font-normal uppercase mb-0.5 ${selectedDay === day.id ? 'text-blue-100' : 'text-gray-500'}`}>{day.label}</div>
                        <div>{day.date}</div>
                    </button>
                ))}
            </div>

            {programData && programData[selectedDay] ? (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="text-center py-4 bg-gray-50 border-b border-gray-200"><h3 className="text-xl font-bold text-gray-800">{currentDayLabel}</h3></div>

                    {hasSplitSessions && (
                        <div className="hidden md:grid md:grid-cols-3 bg-blue-900 text-white text-sm font-bold animate-fadeIn">
                            {ROOMS && ROOMS.map((room, i) => (
                                <div key={i} className={`p-4 text-center ${i < 2 ? 'border-r border-blue-800' : ''}`}>{room}</div>
                            ))}
                        </div>
                    )}

                    <div className="divide-y divide-gray-100">
                        {(programData[selectedDay] || []).map((block, idx) => (
                            <div key={block.id || idx} className="group hover:bg-gray-50/50 transition-colors">
                                {block.type === 'full' ? (
                                    <div className={`p-4 md:p-6 text-center ${block.color || 'bg-blue-50 border-blue-100 text-blue-800'} m-2 rounded-lg border flex flex-col items-center`}>
                                        <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2 bg-white/50 px-3 py-1 rounded-full">{block.time}</div>
                                        <h4 className="text-lg font-bold mb-1">{block.title}</h4>
                                        <div className="text-sm opacity-90 font-medium">{block.room}</div>
                                        {block.speaker && <div className="text-xs mt-1 text-blue-600 flex items-center gap-1"><User size={12} /> {block.speaker}</div>}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 relative">
                                        <div className="md:hidden w-full text-center mb-2">
                                            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">{block.time}</span>
                                        </div>

                                        {ROOMS && ROOMS.map((_, sIdx) => {
                                            const session = getSessionForRoom(block.sessions, sIdx);
                                            // Handle case where session might be undefined/non-existent
                                            if (!session) return <div key={sIdx} className="hidden md:block bg-gray-50/30 rounded-lg"></div>;

                                            // Ensure session is an object before accessing props
                                            const title = session.title || "Actividad sin título";
                                            const speaker = session.speaker;

                                            return (
                                                <div key={sIdx} className={`p-4 rounded-lg border border-gray-100 shadow-sm flex flex-col h-full bg-white relative overflow-hidden group/card hover:border-blue-200 transition-colors`}>
                                                    <div className="md:hidden text-xs font-bold text-blue-600 mb-1 border-b pb-1 border-gray-100">{ROOMS[sIdx]}</div>
                                                    <div className="hidden md:block absolute top-0 right-0 bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 rounded-bl-lg group-hover/card:bg-blue-100 group-hover/card:text-blue-600 transition-colors">{block.time}</div>
                                                    <h5 className="font-bold text-gray-900 text-sm mb-2 leading-tight">{title}</h5>
                                                    <p className="text-xs text-gray-600 mt-auto flex items-center gap-1"><User size={12} /> {speaker || 'TBA'}</p>
                                                    <button className="mt-3 w-full py-1.5 text-xs font-medium bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-700 rounded transition-colors">Ver detalles</button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
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
