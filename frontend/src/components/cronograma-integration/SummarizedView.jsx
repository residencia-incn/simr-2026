
import React from 'react';
import { formatDateLabel } from '../../utils/formatters';

const SummarizedView = ({ schedule, onDaySelect }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {schedule.map((day) => {
                // Filter sessions for public visibility
                const visibleSessions = day.sessions.filter(s => {
                    const isPublished = s.status === 'Publicado';
                    const isScheduledPassed = s.status === 'Programado' && s.scheduledAt && new Date(s.scheduledAt) <= new Date();
                    return isPublished || isScheduledPassed;
                });

                // If no visible sessions, optionally skip the day or show empty state (here we just show empty list)

                return (
                    <div
                        key={day.dayNumber}
                        onClick={() => onDaySelect(day.dayNumber)}
                        className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col shadow-sm hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1"
                    >
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-primary">DÍA {day.dayNumber}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{formatDateLabel(day.date)}</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{day.label}</h3>
                        </div>
                        <div className="p-4 flex flex-col gap-4 flex-grow">
                            {visibleSessions.slice(0, 4).map((session, idx) => (
                                <div key={session.id} className={`flex gap-3 items-start ${idx >= 3 ? 'opacity-60' : ''}`}>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 w-[38px] shrink-0 pt-0.5">{session.timeStart}</span>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2">
                                            {session.title}
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                            {session.speakers.length > 0 ? session.speakers[0].name : 'Varios Ponentes'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {visibleSessions.length === 0 && (
                                <div className="text-center text-xs text-slate-400 italic py-4">
                                    No hay actividades visibles
                                </div>
                            )}
                        </div>
                        <div className="p-3 mt-auto border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                            <button className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-primary hover:text-blue-700 transition-colors">
                                {visibleSessions.length > 3 ? `Ver ${visibleSessions.length - 3} más` : 'Ver detalles'}
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

export default SummarizedView;
