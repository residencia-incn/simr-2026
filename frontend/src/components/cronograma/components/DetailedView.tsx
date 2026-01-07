
import React, { useState } from 'react';
import { Session, DaySchedule } from '../types';

interface DetailedViewProps {
  schedule: DaySchedule[];
  selectedDay: number;
  onDaySelect: (day: number) => void;
}

const DetailedView: React.FC<DetailedViewProps> = ({ schedule, selectedDay, onDaySelect }) => {
  const [filter, setFilter] = useState('Todos');
  const filters = ['Todos', 'Trabajos originales', 'Reporte de caso', 'Plenaria', 'Simposio'];

  const currentDayData = schedule.find(d => d.dayNumber === selectedDay) || schedule[0];

  const filteredSessions = currentDayData.sessions.filter(s => {
    if (filter === 'Todos') return true;
    return s.category.toLowerCase().includes(filter.toLowerCase().substring(0, filter.length - 2));
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Enhanced Day Tabs & Filters */}
      <div className="sticky top-[-1px] z-40 bg-background-light dark:bg-background-dark pt-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 border-b border-transparent">
        <div className="bg-white dark:bg-card-dark rounded-2xl p-2 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="overflow-x-auto hide-scrollbar mb-2">
            <div className="flex min-w-max gap-1">
              {schedule.map(day => (
                <button 
                  key={day.dayNumber}
                  onClick={() => onDaySelect(day.dayNumber)}
                  className={`flex flex-col items-center justify-center min-w-[100px] py-2.5 rounded-xl transition-all ${
                    selectedDay === day.dayNumber 
                      ? 'bg-primary text-white shadow-md shadow-primary/20' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="font-black text-xs uppercase tracking-wider">Día {day.dayNumber}</span>
                  <span className={`text-[10px] font-bold ${selectedDay === day.dayNumber ? 'opacity-90' : 'opacity-60'}`}>{day.date}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800 mx-2 mb-2"></div>

          {/* Chips Filters */}
          <div className="flex gap-2 flex-wrap items-center px-2">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2">Categoría:</span>
            {filters.map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`flex h-7 items-center justify-center rounded-lg px-3 text-[10px] font-bold transition-all uppercase tracking-tight ${
                  filter === f 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative flex flex-col gap-8 mt-4 pl-0 sm:pl-4">
        <div className="absolute left-[70px] md:left-[85px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
        
        {filteredSessions.length === 0 ? (
          <div className="py-20 text-center text-slate-400 italic font-medium">No hay sesiones que coincidan con el filtro seleccionado.</div>
        ) : (
          filteredSessions.map((session: Session) => (
            <div key={session.id} className="relative flex flex-col sm:flex-row gap-4 sm:gap-10 group">
              {/* Time Column */}
              <div className="sm:w-[70px] flex-shrink-0 flex flex-col items-end pt-1">
                <span className="text-xl font-black text-slate-900 dark:text-white">{session.timeStart}</span>
                <span className="text-xs text-slate-500 font-bold">{session.timeEnd}</span>
              </div>

              {/* Connector Dot */}
              <div className="absolute left-[66px] md:left-[81px] top-2.5 size-2.5 rounded-full border-[2px] border-primary bg-white dark:bg-background-dark hidden sm:block z-10"></div>

              {/* Session Card */}
              <div className={`flex-1 rounded-2xl p-6 border shadow-sm hover:shadow-xl transition-all duration-300 ${
                session.category === 'Evento Social' 
                  ? 'bg-slate-50 dark:bg-slate-900/50 border-dashed border-slate-300 dark:border-slate-700 opacity-80' 
                  : 'bg-white dark:bg-card-dark border-slate-100 dark:border-slate-800 hover:border-primary/40'
              }`}>
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                  <div className="flex-1">
                    {session.category && (
                      <div className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider mb-3 bg-${session.categoryColor}-50 dark:bg-${session.categoryColor}-900/20 text-${session.categoryColor}-700 dark:text-${session.categoryColor}-300 border border-${session.categoryColor}-100 dark:border-${session.categoryColor}-900/40`}>
                        {session.category}
                      </div>
                    )}
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-2">
                      {session.title}
                    </h3>
                    {session.location && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                        {session.location}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <button className="size-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all border border-slate-100 dark:border-slate-700">
                      <span className="material-symbols-outlined text-[20px]">bookmark_border</span>
                    </button>
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
                      <button className="text-[10px] font-black text-primary hover:text-blue-700 flex items-center gap-1 uppercase tracking-widest bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all">
                        Ver más <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DetailedView;
