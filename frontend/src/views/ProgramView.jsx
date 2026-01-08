import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import SummarizedView from '../components/cronograma-integration/SummarizedView';
import DetailedView from '../components/cronograma-integration/DetailedView';
import ChecklistView from '../components/cronograma-integration/ChecklistView';
import SpeakerSection from '../components/cronograma-integration/SpeakerSection';
import Breadcrumbs from '../components/cronograma-integration/Breadcrumbs';
import { INITIAL_SCHEDULE } from '../components/cronograma-integration/data/mockData';

import { useProgramSchedule } from '../hooks/useProgramSchedule';

const ProgramView = () => {
    const [viewMode, setViewMode] = useState('summary');
    const [selectedDay, setSelectedDay] = useState(1);
    const { scheduleData, loading } = useProgramSchedule();

    const handleDaySelect = (day) => {
        setSelectedDay(day);
        if (viewMode === 'summary') {
            setViewMode('detailed');
        }
    };

    const getBreadcrumb = () => {
        switch (viewMode) {
            case 'summary': return 'Cronograma General';
            case 'detailed': return 'Cronograma Detallado';
            case 'checklist': return 'Vista Checklist';
            default: return 'Cronograma';
        }
    };

    const renderContent = () => {
        if (viewMode === 'summary') {
            return <SummarizedView schedule={scheduleData} onDaySelect={handleDaySelect} />;
        }
        if (viewMode === 'detailed') {
            return (
                <div className="max-w-5xl mx-auto w-full">
                    <DetailedView schedule={scheduleData} selectedDay={selectedDay} onDaySelect={setSelectedDay} />
                </div>
            );
        }
        if (viewMode === 'checklist') {
            return (
                <ChecklistView
                    schedule={scheduleData}
                    onBack={() => setViewMode('summary')}
                />
            );
        }
        return null;
    };

    // Special layout for Checklist (fullscreen, minimal wrapper)
    if (viewMode === 'checklist') {
        return <div className="animate-fadeIn">{renderContent()}</div>;
    }

    return (
        <div className="flex flex-col min-h-screen print:min-h-0 bg-gray-50/50 print:bg-white dark:bg-gray-900 animate-fadeIn text-slate-900 dark:text-gray-100 font-sans">
            {/* Print-only Checklist for Summary Mode */}
            {viewMode === 'summary' && (
                <div className="hidden print:block">
                    <ChecklistView schedule={scheduleData} onBack={() => { }} />
                </div>
            )}

            <main className={`flex-grow px-4 md:px-10 py-2 md:py-4 ${viewMode === 'summary' ? 'print:hidden' : ''}`}>
                <div className="max-w-7xl mx-auto flex flex-col gap-6">

                    <div className="flex flex-col lg:flex-row justify-between gap-6 lg:items-end mb-4 no-print border-b border-gray-200 dark:border-gray-800 pb-6">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                                Programa de Actividades
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-base md:text-lg font-medium">
                                Ponencias que se realizaran durante el evento
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-xl shadow-inner">
                                <button
                                    onClick={() => setViewMode('summary')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'summary' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                                >
                                    Resumido
                                </button>
                                <button
                                    onClick={() => setViewMode('detailed')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'detailed' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                                >
                                    Detallado
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all uppercase tracking-wider shadow-sm"
                                >
                                    <span className="material-symbols-outlined !text-[20px]">print</span>
                                    Imprimir
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="transition-all duration-300 min-h-[400px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-500 font-medium animate-pulse">Cargando programa...</p>
                                </div>
                            </div>
                        ) : (
                            renderContent()
                        )}
                    </div>

                    <div className="no-print">
                        <SpeakerSection />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProgramView;
