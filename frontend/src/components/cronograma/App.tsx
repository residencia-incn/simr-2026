
import React, { useState } from 'react';
import Breadcrumbs from './components/Breadcrumbs';
import SummarizedView from './components/SummarizedView';
import DetailedView from './components/DetailedView';
import SpeakerSection from './components/SpeakerSection';
import AdminView from './components/AdminView';
import EditSessionView from './components/EditSessionView';
import ChecklistView from './components/ChecklistView';
import Header from './components/Header';
import { ViewMode, DaySchedule, Session } from './types';
import { INITIAL_SCHEDULE } from './data/mockData';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [selectedDay, setSelectedDay] = useState(1);
  const [scheduleData, setScheduleData] = useState<DaySchedule[]>(INITIAL_SCHEDULE);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    if (viewMode === 'summary') {
      setViewMode('detailed');
    }
  };

  const handleEditSession = (sessionId: string) => {
    setEditingSessionId(sessionId);
    setViewMode('edit');
  };

  const handleDeleteSession = (sessionId: string) => {
    setScheduleData(prev => prev.map(day => ({
      ...day,
      sessions: day.sessions.filter(s => s.id !== sessionId)
    })));
  };

  const handleSaveSession = (updatedSession: Session) => {
    setScheduleData(prev => prev.map(day => ({
      ...day,
      sessions: day.sessions.map(s => s.id === updatedSession.id ? updatedSession : s)
    })));
    setEditingSessionId(null);
    setViewMode('admin');
  };

  const handleNewSession = () => {
    const newId = `new-${Math.random().toString(36).substr(2, 5)}`;
    const newSession: Session = {
      id: newId,
      timeStart: '09:00',
      timeEnd: '10:00',
      title: 'Nueva Actividad',
      category: 'Trabajo Original',
      categoryColor: 'green',
      speakers: [],
      location: 'Por definir',
      status: 'Borrador'
    };

    setScheduleData(prev => prev.map(day => 
      day.dayNumber === selectedDay 
        ? { ...day, sessions: [...day.sessions, newSession] }
        : day
    ));
    setEditingSessionId(newId);
    setViewMode('edit');
  };

  const getBreadcrumb = () => {
    switch (viewMode) {
      case 'summary': return 'Cronograma General';
      case 'detailed': return 'Cronograma Detallado';
      case 'admin': return 'Gestión de Cronograma';
      case 'edit': return 'Editar Actividad';
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
    if (viewMode === 'admin') {
      return (
        <AdminView 
          schedule={scheduleData}
          selectedDay={selectedDay}
          onDaySelect={setSelectedDay}
          onEditSession={handleEditSession}
          onDeleteSession={handleDeleteSession}
          onNewSession={handleNewSession}
        />
      );
    }
    if (viewMode === 'edit' && editingSessionId) {
      const session = scheduleData
        .flatMap(d => d.sessions)
        .find(s => s.id === editingSessionId);
      
      if (!session) return <div>Sesión no encontrada</div>;

      return (
        <EditSessionView 
          session={session} 
          onSave={handleSaveSession} 
          onCancel={() => setViewMode('admin')} 
        />
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

  return (
    <div className="flex flex-col min-h-screen">
      <div className="no-print">
        <Header />
      </div>
      
      <main className="flex-grow px-4 md:px-10 py-6 md:py-10">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          
          <div className="no-print">
            <Breadcrumbs current={getBreadcrumb()} />
          </div>

          {viewMode !== 'edit' && viewMode !== 'checklist' && (
            <div className="flex flex-col lg:flex-row justify-between gap-6 lg:items-end mb-4 no-print">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                  {viewMode === 'admin' ? 'Gestión' : `Cronograma ${viewMode === 'summary' ? 'Resumido' : ''}`}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-base md:text-lg font-medium">
                  Planifica tu asistencia con la lista de control personal del congreso.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-xl shadow-inner">
                  <button 
                    onClick={() => setViewMode('summary')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'summary' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
                  >
                    Resumido
                  </button>
                  <button 
                    onClick={() => setViewMode('detailed')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'detailed' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
                  >
                    Detallado
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setViewMode('checklist')}
                    className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all uppercase tracking-wider shadow-sm"
                  >
                    <span className="material-symbols-outlined !text-[20px]">print</span>
                    Imprimir
                  </button>
                  <button 
                    onClick={() => setViewMode('checklist')}
                    className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all uppercase tracking-wider shadow-lg shadow-primary/20"
                  >
                    <span className="material-symbols-outlined !text-[20px]">download</span>
                    Descargar PDF
                  </button>
                  <button 
                    onClick={() => setViewMode('admin')}
                    className="bg-slate-800 hover:bg-slate-900 text-white p-2.5 rounded-xl transition-all shadow-md"
                    title="Administración"
                  >
                    <span className="material-symbols-outlined !text-[20px]">settings</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="transition-all duration-300">
            {renderContent()}
          </div>

          {viewMode !== 'admin' && viewMode !== 'edit' && viewMode !== 'checklist' && <SpeakerSection />}
        </div>
      </main>

      <footer className="py-10 border-t border-slate-200 dark:border-slate-800 text-center text-slate-400 text-sm no-print">
        <p>© 2024 Neurología Virtual - Sociedad de Neurología. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default App;
