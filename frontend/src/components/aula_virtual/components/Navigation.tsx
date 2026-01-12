import React, { useState } from 'react';
import { ViewState } from '../types';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Helper to check active state
  const isActive = (view: ViewState) => currentView === view;

  // Nav Item component for consistency
  const NavLink = ({ view, icon, label, fillIcon = false }: { view: ViewState, icon: string, label: string, fillIcon?: boolean }) => {
    const active = isActive(view);
    return (
      <button
        onClick={() => setView(view)}
        className={`flex items-center gap-3 px-3 py-2 transition-all ${active
          ? 'bg-background-light text-primary font-bold rounded-l-xl rounded-r-none shadow-sm border-y border-l border-slate-200 border-r-0 -mr-3 w-[calc(100%+0.75rem)] relative z-10'
          : 'hover:bg-slate-50 text-slate-600 rounded-lg w-full'
          }`}
        title={isCollapsed ? label : ''}
      >
        <span className={`material-symbols-outlined ${fillIcon ? 'fill-1' : ''} ${active ? 'text-primary' : 'text-slate-500'}`}>{icon}</span>
        {!isCollapsed && (
          <span className={`text-sm whitespace-nowrap overflow-hidden text-ellipsis ${active ? 'font-bold' : 'font-medium'} animate-in fade-in duration-300`}>
            {label}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className={`flex-shrink-0 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 z-50 h-full ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Fixed Top Section - Toggle Button Only */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 flex-shrink-0">
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 ml-auto"
            title="Contraer menú"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
        )}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
            title="Expandir menú"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex flex-col gap-4 p-3 h-full overflow-y-auto">
        {/* Navigation Links */}
        <nav className="flex flex-col gap-0.5">
          <NavLink view={ViewState.STUDENT_DASHBOARD} icon="home" label="Inicio" fillIcon />
          <NavLink view={ViewState.STUDENT_COURSE_CATALOG} icon="school" label="Mis Cursos" />
          {/* Renamed Label here for clarity */}
          <NavLink view={ViewState.STUDENT_NOTES} icon="edit_note" label="Mis Apuntes" />
          <NavLink view={ViewState.STUDENT_LIVE} icon="domain" label="Congreso 2024" />
          <NavLink view={ViewState.STUDENT_CERTIFICATES} icon="verified" label="Certificados" />
          <NavLink view={ViewState.STUDENT_EXAM} icon="quiz" label="Exámenes" />
        </nav>

        {/* Admin Links (Hidden/Secondary for this view but kept for functionality) */}
        <div className="mt-2 pt-2 border-t border-slate-200">
          {!isCollapsed && <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Administración</p>}
          <nav className="flex flex-col gap-0.5">
            <NavLink view={ViewState.ADMIN_DASHBOARD} icon="analytics" label="Dashboard Admin" />
            <NavLink view={ViewState.ADMIN_COURSE_EDITOR} icon="edit_document" label="Editar Cursos" />
            <NavLink view={ViewState.ADMIN_EXAM_MANAGER} icon="assignment" label="Gestor Exámenes" />
            <NavLink view={ViewState.ADMIN_CERTIFICATE_EDITOR} icon="draw" label="Editor Certificados" />
            <NavLink view={ViewState.ADMIN_ENROLLMENT_MANAGER} icon="group_add" label="Inscritos" />
            <NavLink view={ViewState.ADMIN_READING_MANAGER} icon="article" label="Lecturas" />
            <NavLink view={ViewState.ADMIN_VIDEO_MANAGER} icon="video_settings" label="Gestión de Videos" />
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default Navigation;