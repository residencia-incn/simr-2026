import React, { useState } from 'react';
import Navigation from './components/Navigation';
import { ViewState } from './types';
import { AulaVirtualProvider } from './context/AulaVirtualContext';
import Swal from 'sweetalert2';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import CourseEditorContainer from './pages/admin/CourseEditorContainer';
import ExamManager from './pages/admin/ExamManager';
import CertificateBuilder from './pages/admin/CertificateBuilder';
import VideoManagerContainer from './pages/admin/VideoManagerContainer';

// Student Pages
import Dashboard from './pages/student/Dashboard';
import CourseCatalog from './pages/student/CourseCatalog';
import CourseDashboard from './pages/student/CourseDashboard';
import CoursePlayer from './pages/student/CoursePlayer';
import LiveEvent from './pages/student/LiveEvent';
import ExamRunner from './pages/student/ExamRunner';
import Certificates from './pages/student/Certificates';
import NotesLibrary from './pages/student/NotesLibrary';

const App: React.FC = () => {
  // Default view
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.STUDENT_DASHBOARD);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleViewChange = async (newView: ViewState) => {
    // Check if leaving course editor with unsaved changes
    if (currentView === ViewState.ADMIN_COURSE_EDITOR && hasUnsavedChanges && newView !== ViewState.ADMIN_COURSE_EDITOR) {
      const result = await Swal.fire({
        title: '¿Descartar cambios?',
        text: 'Se perderán todos los cambios no guardados.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Descartar',
        cancelButtonText: 'Cancelar'
      });

      if (!result.isConfirmed) {
        return; // Don't change view
      }

      setHasUnsavedChanges(false); // Reset unsaved changes
    }

    setCurrentView(newView);
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.ADMIN_DASHBOARD:
        return <AdminDashboard />;
      case ViewState.ADMIN_COURSE_EDITOR:
        return <CourseEditorContainer onUnsavedChanges={setHasUnsavedChanges} />;
      case ViewState.ADMIN_EXAM_MANAGER:
        return <ExamManager />;
      case ViewState.ADMIN_CERTIFICATE_EDITOR:
        return <CertificateBuilder />;
      case ViewState.ADMIN_VIDEO_MANAGER:
        return <VideoManagerContainer />;
      case ViewState.STUDENT_DASHBOARD:
        return <Dashboard />;
      case ViewState.STUDENT_COURSE_CATALOG:
        return <CourseCatalog setView={setCurrentView} />;
      case ViewState.STUDENT_COURSE_DETAIL:
        return <CourseDashboard setView={setCurrentView} />;
      case ViewState.STUDENT_PLAYER:
        return <CoursePlayer setView={setCurrentView} />;
      case ViewState.STUDENT_LIVE:
        return <LiveEvent />;
      case ViewState.STUDENT_EXAM:
        return <ExamRunner />;
      case ViewState.STUDENT_CERTIFICATES:
        return <Certificates />;
      case ViewState.STUDENT_NOTES:
        return <NotesLibrary />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AulaVirtualProvider>
      <div className="flex h-screen bg-background-light">
        <Navigation currentView={currentView} setView={handleViewChange} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </AulaVirtualProvider>
  );
};

export default App;