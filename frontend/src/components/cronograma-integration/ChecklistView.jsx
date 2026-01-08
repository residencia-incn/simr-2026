
import React from 'react';
import { formatDateLabel } from '../../utils/formatters';

const ChecklistView = ({ schedule, onBack }) => {
    return (
        <div className="flex flex-col gap-0 font-display min-h-0 print:gap-0">
            {/* Navigation Bar - Removed for print as requested */}


            {/* Printable Area */}
            <div className="print-container bg-white w-full max-w-[297mm] mx-auto p-8 md:p-12 shadow-2xl border border-slate-200 rounded-2xl overflow-hidden mb-0 print:mb-0 print:p-0">

                {/* Header Section */}
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b-2 border-slate-100 gap-6">
                    <div className="flex items-center gap-3">
                        {/* System Logo */}
                        <div className="bg-[#1e3a8a] text-white font-bold px-2 py-1.5 rounded-lg text-xl print:text-lg leading-none shrink-0 shadow-sm print:shadow-none">
                            INCN
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-3xl print:text-2xl font-black text-slate-900 tracking-tight uppercase">Programa de Actividades</h1>
                            <p className="text-slate-500 print:text-[10px] font-medium leading-none mt-1">Semana de Investigación del Medico Residente 2026</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 print:absolute print:top-0 print:right-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Nombre del Asistente</span>
                        <div className="w-72 h-8 bg-slate-50 border-b-2 border-slate-200 border-dashed rounded-t-lg"></div>
                    </div>
                </div>

                {/* 5-Column Horizontal Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 print:grid-cols-5 gap-0 divide-x divide-slate-100">
                    {schedule.map(day => (
                        <div key={day.dayNumber} className="flex flex-col p-3 first:pl-0 last:pr-0">
                            {/* Day Header */}
                            <div className="mb-4 pb-2 border-b-2 border-slate-100">
                                <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider mb-1 ${getDayBadgeClass(day.dayNumber)}`}>
                                    {formatDateLabel(day.date)}
                                </span>
                                <h3 className={`text-base print:text-sm font-black ${getDayTitleColor(day.dayNumber)}`}>
                                    Día {day.dayNumber}
                                </h3>
                            </div>

                            {/* Sessions List */}
                            <div className="flex flex-col gap-3">
                                {day.sessions.map((session) => (
                                    <div key={session.id} className="flex gap-2 group cursor-pointer">
                                        <div className="size-5 rounded-full border-2 border-slate-300 group-hover:border-primary shrink-0 mt-0.5 transition-all flex items-center justify-center bg-white shadow-sm">
                                            <div className="size-2 rounded-full bg-primary opacity-0 group-active:opacity-100 transition-opacity"></div>
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className={`text-[10px] font-black mb-0 ${getDayDateColor(day.dayNumber)}`}>
                                                {session.timeStart}
                                            </span>
                                            <p className="text-[11px] print:text-[10px] font-bold text-slate-800 leading-tight mb-0.5 line-clamp-2">
                                                {session.title}
                                            </p>
                                            {session.speakers.length > 0 && (
                                                <p className="text-[9px] text-slate-500 italic truncate">
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
                <div className="mt-8 pt-4 border-t border-slate-100 flex flex-row justify-start items-center text-[9px] text-slate-400 gap-4">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-200/50">
                        <span className="material-symbols-outlined text-primary text-sm">info</span>
                        <span className="font-medium text-slate-500">Checklist de las ponencias del evento!.</span>
                    </div>
                </div>
            </div>

            {/* Landscape Print Styles */}
            <style>{`
        @media print {
          @page { size: landscape; margin: 0; }
          .print-container { 
            box-shadow: none !important; 
            border: none !important; 
            margin: 0 !important; 
            width: 100% !important; 
            max-width: none !important; 
            padding: 0.5cm !important;
            border-radius: 0 !important;
          }
          body { background: white !important; margin: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print, footer, nav, header { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
        </div>
    );
};

// Style Helpers matching the color palette in the image
const getDayBadgeClass = (day) => {
    switch (day) {
        case 1: return 'bg-blue-50 text-blue-600';
        case 2: return 'bg-indigo-50 text-indigo-600';
        case 3: return 'bg-teal-50 text-teal-600';
        case 4: return 'bg-violet-50 text-violet-600';
        default: return 'bg-rose-50 text-rose-600';
    }
};

const getDayTitleColor = (day) => {
    switch (day) {
        case 1: return 'text-blue-900';
        case 2: return 'text-indigo-900';
        case 3: return 'text-teal-900';
        case 4: return 'text-violet-900';
        default: return 'text-rose-900';
    }
};

const getDayDateColor = (day) => {
    switch (day) {
        case 1: return 'text-blue-600';
        case 2: return 'text-indigo-600';
        case 3: return 'text-teal-600';
        case 4: return 'text-violet-600';
        default: return 'text-rose-600';
    }
};


export default ChecklistView;
