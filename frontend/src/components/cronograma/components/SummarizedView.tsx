
import React from 'react';
import { DaySchedule } from '../types';

interface SummarizedViewProps {
  // Add schedule prop to allow data injection from parent component
  schedule: DaySchedule[];
  onDaySelect: (day: number) => void;
}

const SummarizedView: React.FC<SummarizedViewProps> = ({ schedule, onDaySelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {/* Use schedule from props instead of non-existent global import */}
      {schedule.map((day: DaySchedule) => (
        <div 
          key={day.dayNumber}
          onClick={() => onDaySelect(day.dayNumber)}
          className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col shadow-sm hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1"
        >
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Día {day.dayNumber}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{day.date}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{day.label}</h3>
          </div>
          <div className="p-4 flex flex-col gap-4 flex-grow">
            {day.sessions.slice(0, 4).map((session, idx) => (
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
          </div>
          <div className="p-3 mt-auto border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <button className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-primary hover:text-blue-700 transition-colors">
              {day.sessions.length > 3 ? `Ver ${day.sessions.length - 3} más` : 'Ver detalles'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummarizedView;
