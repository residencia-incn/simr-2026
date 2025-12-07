import React, { useState } from 'react';
import { LogOut, Menu, X, Users, ImageIcon, Grid, Home, FileText, Calendar, UserPlus, ChevronDown } from 'lucide-react';
import Button from './components/ui/Button';
import ChatWidget from './components/layout/ChatWidget';
import HomeView from './views/HomeView';
import CommitteeView from './views/CommitteeView';
import RegistrationView from './views/RegistrationView';
import ProgramView from './views/ProgramView';
import GalleryView from './views/GalleryView';
import PostersView from './views/PostersView';
import ResidentDashboard from './views/ResidentDashboard';
import SubmitWorkForm from './views/SubmitWorkForm';
import JuryDashboard from './views/JuryDashboard';
import AdminDashboard from './views/AdminDashboard';
import ParticipantDashboard from './views/ParticipantDashboard';
import AdmissionDashboard from './views/AdmissionDashboard';
import TreasurerDashboard from './views/TreasurerDashboard';
import AcademicDashboard from './views/AcademicDashboard';
import LoginModal from './views/LoginModal';
import BasesView from './views/BasesView';
import NotificationMenu from './components/common/NotificationMenu';

export default function SIMRApp() {
  const [currentView, setCurrentView] = useState('home');
  const [basesTab, setBasesTab] = useState('bases');
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogin = (role) => {
    const mockUsers = {
      resident: { name: "Dr. Carlos Ruiz", role: "resident", year: "R2", specialty: "Neurología" },
      jury: { name: "Dra. Sofia Mendez", role: "jury", specialty: "Neuropediatría" },
      admin: { name: "Comité Organizador", role: "admin" },
      academic: { name: "Dr. Luis Trujillo", role: "academic", specialty: "Neurología" },
      admission: { name: "Personal Admisión", role: "admission" },
      treasurer: { name: "Dr. Juan Perez", role: "treasurer" },
      participant: { name: "Dra. Elena Quispe", role: "participant", type: "Asistente" }
    };
    setUser(mockUsers[role]);
    setCurrentView(
      role === 'admin' ? 'admin-dashboard' :
        role === 'academic' ? 'academic-dashboard' :
          role === 'admission' ? 'admission-dashboard' :
            role === 'jury' ? 'jury-dashboard' :
              role === 'treasurer' ? 'treasurer-dashboard' :
                role === 'participant' ? 'participant-dashboard' :
                  'resident-dashboard'
    );
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('home');
  };

  const navigate = (view, tab = null) => {
    setCurrentView(view);
    if (tab) setBasesTab(tab);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('home')}>
            <div className="bg-blue-900 text-white font-bold p-1.5 rounded text-lg">INCN</div>
            <span className="font-bold text-gray-900 text-lg hidden sm:block">SIMR 2026</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
            <button onClick={() => navigate('home')} className="hover:text-blue-700 flex items-center gap-1 transition-colors"><Home size={16} /> Inicio</button>

            <button onClick={() => navigate('bases')} className="hover:text-blue-700 flex items-center gap-1 transition-colors"><FileText size={16} /> Bases</button>

            <button onClick={() => navigate('program')} className="hover:text-blue-700 flex items-center gap-1 transition-colors"><Calendar size={16} /> Programa</button>
            <button onClick={() => navigate('committee')} className="hover:text-blue-700 flex items-center gap-1 transition-colors"><Users size={16} /> Comité</button>
            <button onClick={() => navigate('gallery')} className="hover:text-blue-700 flex items-center gap-1 transition-colors"><ImageIcon size={16} /> Galería</button>
            <button onClick={() => navigate('posters')} className="hover:text-blue-700 flex items-center gap-1 bg-blue-50 text-blue-800 px-3 py-1 rounded-full transition-all hover:shadow-sm hover:-translate-y-0.5"><Grid size={16} /> E-Posters</button>
            <button onClick={() => navigate('registration')} className="hover:text-blue-700 flex items-center gap-1 font-bold text-blue-800 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50 transition-all hover:shadow-sm hover:-translate-y-0.5"><UserPlus size={16} /> Inscripción</button>

            {/* Notification Menu */}
            {user && <NotificationMenu user={user} />}

            {user ? (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <div className="text-xs text-gray-600 uppercase">
                    {user.role === 'admin' ? 'Admin' :
                      user.role === 'academic' ? 'Académico' :
                        user.role === 'admission' ? 'Admisión' :
                          user.role === 'jury' ? 'Jurado' :
                            user.role === 'treasurer' ? 'Tesorero' :
                              user.role === 'participant' ? 'Asistente' :
                                'Residente'}
                  </div>
                  <div className="text-sm font-bold text-gray-900 leading-none">{user.name.split(" ")[0]}</div>
                </div>
                <button onClick={handleLogout} className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-full transition-colors" title="Cerrar Sesión">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Button size="sm" onClick={() => navigate('login')}>Area Privada</Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-gray-700" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 p-4 space-y-4">
            <button onClick={() => navigate('home')} className="block w-full text-left font-medium py-2 text-gray-800">Inicio</button>
            <button onClick={() => navigate('program')} className="block w-full text-left font-medium py-2 text-gray-800">Programa</button>
            <button onClick={() => navigate('committee')} className="block w-full text-left font-medium py-2 text-gray-800">Comité</button>
            <button onClick={() => navigate('gallery')} className="block w-full text-left font-medium py-2 text-gray-800">Galería</button>
            <button onClick={() => navigate('posters')} className="block w-full text-left font-medium py-2 text-blue-700 font-bold">E-Posters</button>
            <button onClick={() => navigate('registration')} className="block w-full text-left font-medium py-2 text-blue-700">Inscripción</button>
            {user ? (
              <button onClick={handleLogout} className="block w-full text-left font-medium py-2 text-red-600">Cerrar Sesión</button>
            ) : (
              <button onClick={() => navigate('login')} className="block w-full text-left font-medium py-2 text-blue-700">Area Privada</button>
            )}
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {currentView === 'home' && <HomeView navigate={navigate} user={user} />}
        {currentView === 'bases' && <BasesView activeTab={basesTab} />}
        {currentView === 'program' && <ProgramView />}
        {currentView === 'committee' && <CommitteeView />}
        {currentView === 'gallery' && <GalleryView />}
        {currentView === 'posters' && <PostersView />}
        {currentView === 'registration' && <RegistrationView />}
        {currentView === 'resident-dashboard' && <ResidentDashboard user={user} navigate={navigate} />}
        {currentView === 'participant-dashboard' && <ParticipantDashboard user={user} />}
        {currentView === 'submit-work' && <SubmitWorkForm navigate={navigate} />}
        {currentView === 'jury-dashboard' && <JuryDashboard user={user} />}
        {currentView === 'admin-dashboard' && <AdminDashboard />}
        {currentView === 'admission-dashboard' && <AdmissionDashboard />}
        {currentView === 'academic-dashboard' && <AcademicDashboard />}
        {currentView === 'treasurer-dashboard' && <TreasurerDashboard user={user} />}
        {currentView === 'login' && <LoginModal setCurrentView={setCurrentView} handleLogin={handleLogin} />}
      </main>

      {/* Chat Widget */}
      <ChatWidget />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center md:text-left grid md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-bold text-gray-900 mb-4">SIMR 2026</h3>
            <p className="text-gray-600 text-sm leading-relaxed max-w-sm">
              Instituto Nacional de Ciencias Neurológicas.<br />
              Jr. Ancash 1271, Barrios Altos, Lima - Perú.<br />
              Promoviendo la excelencia en investigación neurocientífica desde 1995.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Enlaces</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-blue-700">Bases del Concurso</a></li>
              <li><a href="#" className="hover:text-blue-700">Libro de Resúmenes (2025)</a></li>
              <li><a href="#" className="hover:text-blue-700">Preguntas Frecuentes</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Soporte</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>comite.simr@incn.gob.pe</li>
              <li>+51 1 411-7700 (Anexo 234)</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 pt-8 border-t border-gray-100 text-center text-xs text-gray-500">
          © 2026 Comité Organizador de Residentes INCN. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
