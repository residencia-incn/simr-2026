
import React, { useState } from 'react';
import ActivityDetailModal from './ActivityDetailModal';
import { formatDateLabel } from '../../utils/formatters';

const DetailedView = ({ schedule, selectedDay, onDaySelect }) => {
    const [filter, setFilter] = useState('Todos');

    // Get unique categories from all days to populate filters
    const allCategories = React.useMemo(() => {
        const categories = new Set();
        schedule.forEach(day => {
            day.sessions.forEach(session => {
                if (session.category) categories.add(session.category);
            });
        });
        return ['Todos', ...Array.from(categories)].sort((a, b) => {
            if (a === 'Todos') return -1;
            if (b === 'Todos') return 1;
            return a.localeCompare(b);
        });
    }, [schedule]);

    const currentDayData = schedule.find(d => d.dayNumber === selectedDay) || schedule[0];

    const filteredSessions = currentDayData.sessions.filter(s => {
        // Filter by Status (Public Visibility Logic)
        const isPublished = s.status === 'Publicado';
        const isScheduledPassed = s.status === 'Programado' && s.scheduledAt && new Date(s.scheduledAt) <= new Date();

        if (!isPublished && !isScheduledPassed) return false;

        // Filter by Category
        if (filter === 'Todos') return true;
        return s.category === filter;
    });

    const [selectedSession, setSelectedSession] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const handleOpenDetail = (session) => {
        setSelectedSession(session);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Enhanced Day Tabs & Filters */}
            <div className="sticky top-16 z-30 bg-gray-50/95 backdrop-blur-sm pt-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 border-b border-transparent">
                <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto hide-scrollbar">
                        <div className="flex min-w-max">
                            {schedule.map(day => (
                                <button
                                    key={day.dayNumber}
                                    onClick={() => onDaySelect(day.dayNumber)}
                                    className={`flex flex-col items-center justify-center min-w-[200px] py-4 transition-all relative group first:pl-6 ${selectedDay === day.dayNumber
                                        ? 'bg-[#1e3a8a] text-white shadow-md'
                                        : 'bg-transparent text-slate-500 hover:bg-slate-50/80 hover:text-slate-900'
                                        }`}
                                >
                                    <span className={`font-black text-sm tracking-tight transition-colors mb-1 ${selectedDay === day.dayNumber ? 'text-white' : 'text-slate-700'}`}>{day.label}</span>
                                    <span className={`text-[11px] font-bold transition-colors ${selectedDay === day.dayNumber ? 'text-white/80' : 'text-slate-400'}`}>{formatDateLabel(day.date)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

                    {/* Chips Filters */}
                    <div className="flex gap-3 flex-wrap items-center px-4 py-6">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-1">Categoría:</span>
                        {allCategories.map(f => {
                            const isSelected = filter === f;

                            // Map category to its color or fallback
                            let dotColor = 'bg-slate-400';
                            if (f === 'Todos') {
                                dotColor = 'bg-primary';
                            } else {
                                // Try to find a session with this category to get its color
                                const sampleSession = schedule
                                    .flatMap(d => d.sessions)
                                    .find(s => s.category === f);
                                if (sampleSession && sampleSession.categoryColor) {
                                    dotColor = `bg-${sampleSession.categoryColor}-500`;
                                }
                            }

                            return (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`flex h-8 items-center justify-center rounded-full px-4 text-[11px] font-bold transition-all border ${isSelected
                                        ? f === 'Todos' ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white shadow-md' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                        }`}
                                >
                                    {f !== 'Todos' && (
                                        <span className={`size-2 rounded-full mr-2 ${dotColor}`} />
                                    )}
                                    {f}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative flex flex-col gap-8 mt-4 pl-0 sm:pl-4">
                <div className="absolute left-[90px] md:left-[110px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

                {filteredSessions.length === 0 ? (
                    <div className="py-20 text-center text-slate-400 italic font-medium">No hay sesiones que coincidan con el filtro seleccionado.</div>
                ) : (
                    filteredSessions.map((session) => (
                        <div key={session.id} className="relative flex flex-col sm:flex-row gap-4 sm:gap-10 group">
                            {/* Conditional Rendering for GENERAL vs Standard */}
                            {session.category?.toUpperCase() === 'GENERAL' ? (
                                <div className="w-full relative z-10 my-4 transform hover:scale-[1.01] transition-transform duration-300">
                                    <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800/50 rounded-2xl transform -skew-x-6"></div>
                                    <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center gap-2 text-center">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs uppercase tracking-widest mb-2">
                                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                                            {session.timeStart} - {session.timeEnd}
                                        </div>
                                        <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                            {session.title}
                                        </h3>
                                        {session.location && (
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-400 mt-2">
                                                <span className="material-symbols-outlined text-[18px]">location_on</span>
                                                {session.location}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Time Column */}
                                    <div className="sm:w-[90px] md:w-[110px] flex-shrink-0 flex flex-col items-end pt-1 pr-6">
                                        <span className="text-xl font-black text-slate-900 dark:text-white">{session.timeStart}</span>
                                        <span className="text-xs text-slate-500 font-bold">{session.timeEnd}</span>
                                    </div>

                                    {/* Connector Dot */}
                                    <div className="absolute left-[86px] md:left-[106px] top-2.5 size-2.5 rounded-full border-[2px] border-primary bg-white dark:bg-background-dark hidden sm:block z-10"></div>

                                    {/* Session Card */}
                                    <div className={`flex-1 rounded-2xl p-6 border shadow-sm hover:shadow-xl transition-all duration-300 ${session.category === 'Evento Social'
                                        ? 'bg-slate-50 dark:bg-slate-900/50 border-dashed border-slate-300 dark:border-slate-700 opacity-80'
                                        : 'bg-white dark:bg-card-dark border-slate-100 dark:border-slate-800 hover:border-primary/40'
                                        }`}>
                                        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                                            <div className="flex-1">
                                                {session.category && (
                                                    <div className="inline-flex items-center gap-2 mb-3">
                                                        <span className={`size-2 rounded-full bg-${session.categoryColor}-500 shadow-[0_0_8px_rgba(var(--tw-color-${session.categoryColor}-500),0.4)]`} />
                                                        <span className={`text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300`}>
                                                            {session.category}
                                                        </span>
                                                    </div>
                                                )}
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-2">
                                                    {session.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                                    {session.location && (
                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                                            <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                                                            {session.location}
                                                        </div>
                                                    )}
                                                    {session.virtualLocation && (
                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-500">
                                                            <span className="material-symbols-outlined text-[16px]">videocam</span>
                                                            {session.virtualLocation}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {session.speakers.length > 0 && (
                                            <div className="flex items-center gap-4 mt-6 pt-5 border-t border-slate-50 dark:border-slate-800">
                                                <div className="flex -space-x-2.5 overflow-hidden">
                                                    {session.speakers.map(speaker => (
                                                        <div
                                                            key={speaker.id}
                                                            className="inline-block size-10 rounded-full ring-4 ring-white dark:ring-card-dark bg-center bg-cover border border-slate-100 shadow-sm"
                                                            style={{ backgroundImage: `url("${speaker.imageUrl}")` }}
                                                            title={speaker.name}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1">
                                                        {session.speakers.length === 1 ? session.speakers[0].name : 'Panel de Expertos'}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                                                        {session.speakers.length === 1 ? session.speakers[0].role : `Moderado por ${session.speakers[0].name}`}
                                                    </span>
                                                </div>
                                                <div className="ml-auto">
                                                    <button
                                                        onClick={() => handleOpenDetail(session)}
                                                        className="text-[10px] font-black text-primary hover:text-blue-700 flex items-center gap-1 uppercase tracking-widest bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all"
                                                    >
                                                        Ver más <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Show "Ver Más" button if description is enabled, even if no speakers */}
                                        {session.hasDescription && (!session.speakers || session.speakers.length === 0) && (
                                            <div className="flex justify-end mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                                                <button
                                                    onClick={() => handleOpenDetail(session)}
                                                    className="text-[10px] font-black text-primary hover:text-blue-700 flex items-center gap-1 uppercase tracking-widest bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all"
                                                >
                                                    Ver más <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>

            <ActivityDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                session={selectedSession}
            />
        </div>
    );
};

export default DetailedView;
