
import React from 'react';
import { DaySchedule, Session } from '../types';

interface AdminViewProps {
  schedule: DaySchedule[];
  selectedDay: number;
  onDaySelect: (day: number) => void;
  onEditSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onNewSession: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  schedule, 
  selectedDay, 
  onDaySelect, 
  onEditSession, 
  onDeleteSession,
  onNewSession
}) => {
  const currentDayData = schedule.find(d => d.dayNumber === selectedDay) || schedule[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Filters & Tabs Wrapper */}
      <div className="sticky top-0 z-40 bg-background-light dark:bg-background-dark pt-4 pb-2">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-4">
          <div className="overflow-x-auto hide-scrollbar">
            <div className="flex p-1 bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700">
              {schedule.map(day => (
                <button 
                  key={day.dayNumber}
                  onClick={() => onDaySelect(day.dayNumber)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                    selectedDay === day.dayNumber 
                      ? 'bg-slate-100 dark:bg-slate-700 text-primary shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Día {day.dayNumber} ({day.date})
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <select className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2">
              <option>Todas las Salas</option>
              <option>Auditorio Principal</option>
              <option>Sala Virtual A</option>
            </select>
            <select className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2">
              <option>Todos los Tipos</option>
              <option>Magistral</option>
              <option>Trabajo Original</option>
            </select>
          </div>
        </div>
      </div>

      {/* Admin Timeline */}
      <div className="relative flex flex-col gap-4 mt-2">
        <div className="absolute left-[70px] md:left-[90px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
        
        {currentDayData.sessions.map((session: Session) => (
          <div key={session.id} className="relative flex flex-col sm:flex-row gap-4 sm:gap-8 group">
            <div className="sm:w-[75px] flex-shrink-0 flex flex-col items-end pt-1 pr-4 sm:pr-0">
              <div className="flex items-center gap-1 mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -left-8 sm:left-auto sm:-ml-10 cursor-grab text-slate-400">
                <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{session.timeStart}</span>
              <span className="text-xs text-slate-500 font-medium">{session.timeEnd}</span>
            </div>
            
            <div className="absolute left-[66px] md:left-[86px] top-3 size-2.5 rounded-full border-[2px] border-primary bg-white dark:bg-background-dark hidden sm:block z-10"></div>
            
            <div className="flex-1 bg-white dark:bg-card-dark rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 relative">
              <div className="flex flex-col md:flex-row justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center rounded-md bg-${session.categoryColor}-50 dark:bg-${session.categoryColor}-900/20 px-2 py-0.5 text-xs font-medium text-${session.categoryColor}-700 dark:text-${session.categoryColor}-300 border border-${session.categoryColor}-100 dark:border-${session.categoryColor}-800`}>
                      {session.category}
                    </span>
                    <span className="text-xs text-slate-400 tracking-tighter">• ID: #{session.id.toUpperCase()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {session.title}
                  </h3>
                </div>
                <div className="flex items-start gap-1">
                  <button 
                    onClick={() => onEditSession(session.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" 
                    title="Editar"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button 
                    onClick={() => onDeleteSession(session.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" 
                    title="Eliminar"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  {session.speakers.length > 0 && (
                    <>
                      <div className="bg-center bg-no-repeat bg-cover rounded-full size-8 border border-slate-200" style={{ backgroundImage: `url("${session.speakers[0].imageUrl}")` }}></div>
                      <div className="flex flex-col leading-none">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{session.speakers[0].name}</span>
                        <span className="text-[11px] text-slate-500">{session.speakers.length > 1 ? 'Panel de Expertos' : 'Ponente Principal'}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="sm:ml-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded">
                    <span className="material-symbols-outlined text-[16px]">meeting_room</span>
                    <span className="text-xs font-medium">{session.location || 'Sin asignar'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded border ${
                    session.status === 'Publicado' 
                      ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30'
                      : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30'
                  }`}>
                    <span className={`size-1.5 rounded-full ${session.status === 'Publicado' ? 'bg-green-600' : 'bg-amber-500'}`}></span>
                    {session.status}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button 
          onClick={onNewSession}
          className="group relative flex flex-col sm:flex-row gap-8 items-center justify-center py-6 mt-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer w-full"
        >
          <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-3xl">add_circle</span>
            <span className="font-medium text-sm">Añadir slot de tiempo en este día</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default AdminView;
