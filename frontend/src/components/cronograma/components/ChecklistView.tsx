
import React from 'react';
import { DaySchedule } from '../types';

interface ChecklistViewProps {
  schedule: DaySchedule[];
  onBack: () => void;
}

const ChecklistView: React.FC<ChecklistViewProps> = ({ schedule, onBack }) => {
  return (
    <div className="flex flex-col gap-6 font-display min-h-screen">
      {/* Navigation Bar - Hidden on Print */}
      <div className="no-print sticky top-0 z-50 bg-slate-800 text-white px-6 py-4 flex justify-between items-center shadow-lg -mt-6 -mx-4 md:mx-0 md:rounded-b-xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver al sitio
          </button>
          <div className="h-6 w-px bg-slate-600"></div>
          <span className="text-sm text-slate-400 font-medium">Vista Checklist Color (Horizontal)</span>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()}
            className="bg-white text-slate-900 hover:bg-slate-100 px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Imprimir
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="print-container bg-white w-full max-w-[297mm] mx-auto p-8 md:p-12 shadow-2xl border border-slate-200 rounded-2xl overflow-hidden mb-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b-2 border-slate-100 gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-white p-3 rounded-xl shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-4xl leading-none">event_note</span>
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">CRONOGRAMA DE ASISTENCIA</h1>
              <p className="text-slate-500 font-medium">Neurología Virtual 2024 • Lista de Control Personal</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Asistente</span>
            <div className="w-72 h-10 bg-slate-50 border-b-2 border-slate-200 border-dashed rounded-t-lg"></div>
          </div>
        </div>

        {/* 5-Column Horizontal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {schedule.map(day => (
            <div key={day.dayNumber} className="flex flex-col p-4 first:pl-0 last:pr-0">
              {/* Day Header */}
              <div className="mb-6 pb-4 border-b-2 border-slate-100">
                <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider mb-2 ${getDayBadgeClass(day.dayNumber)}`}>
                  {getDayFullDate(day.dayNumber)}
                </span>
                <h3 className={`text-xl font-black ${getDayTitleColor(day.dayNumber)}`}>
                  Día {day.dayNumber}: {day.label}
                </h3>
              </div>

              {/* Sessions List */}
              <div className="flex flex-col gap-5">
                {day.sessions.map((session) => (
                  <div key={session.id} className="flex gap-3 group cursor-pointer">
                    <div className="size-6 rounded-full border-2 border-slate-300 group-hover:border-primary shrink-0 mt-0.5 transition-all flex items-center justify-center bg-white shadow-sm">
                      <div className="size-3 rounded-full bg-primary opacity-0 group-active:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={`text-xs font-black mb-0.5 ${getDayDateColor(day.dayNumber)}`}>
                        {session.timeStart}
                      </span>
                      <p className="text-sm font-bold text-slate-800 leading-tight mb-1 line-clamp-2">
                        {session.title}
                      </p>
                      {session.speakers.length > 0 && (
                        <p className="text-[10px] text-slate-500 italic truncate">
                          {session.speakers[0].name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer instructions */}
        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-200/50">
            <span className="material-symbols-outlined text-primary text-base">info</span>
            <span className="font-medium text-slate-500">Instrucciones: Marque el círculo de las ponencias asistidas para su certificado.</span>
          </div>
          <div className="font-black text-slate-300 tracking-widest uppercase">www.neurologia-virtual-2024.com</div>
        </div>
      </div>
      
      {/* Landscape Print Styles */}
      <style>{`
        @media print {
          @page { size: landscape; margin: 0.5cm; }
          .print-container { 
            box-shadow: none !important; 
            border: none !important; 
            margin: 0 !important; 
            width: 100% !important; 
            max-width: none !important; 
            padding: 1cm !important;
          }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
};

// Style Helpers matching the color palette in the image
const getDayBadgeClass = (day: number) => {
  switch (day) {
    case 1: return 'bg-blue-50 text-blue-600';
    case 2: return 'bg-indigo-50 text-indigo-600';
    case 3: return 'bg-teal-50 text-teal-600';
    case 4: return 'bg-violet-50 text-violet-600';
    default: return 'bg-rose-50 text-rose-600';
  }
};

const getDayTitleColor = (day: number) => {
  switch (day) {
    case 1: return 'text-blue-900';
    case 2: return 'text-indigo-900';
    case 3: return 'text-teal-900';
    case 4: return 'text-violet-900';
    default: return 'text-rose-900';
  }
};

const getDayDateColor = (day: number) => {
  switch (day) {
    case 1: return 'text-blue-600';
    case 2: return 'text-indigo-600';
    case 3: return 'text-teal-600';
    case 4: return 'text-violet-600';
    default: return 'text-rose-600';
  }
};

const getDayFullDate = (day: number) => {
  const dates = ['Martes 12 Nov', 'Miércoles 13 Nov', 'Jueves 14 Nov', 'Viernes 15 Nov', 'Sábado 16 Nov'];
  return dates[day - 1] || 'Noviembre 2024';
};

export default ChecklistView;
