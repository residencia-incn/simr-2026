import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Menu, X, Users, ImageIcon, Grid, Home, FileText, Calendar, UserPlus, ChevronDown, Shield, Award, BookOpen, DollarSign, User, CircleUser, TrendingUp } from 'lucide-react';
import { api } from './services/api';
import Button from './components/ui/Button';
import ChatWidget from './components/layout/ChatWidget';
import HomeView from './views/HomeView';
import CommitteeView from './views/CommitteeView';
// import RegistrationView from './views/RegistrationView'; // Removed old view
import ProgramView from './views/ProgramView';
import GalleryView from './views/GalleryView';
import PostersView from './views/PostersView';
import ResidentDashboard from './views/ResidentDashboard';
import SubmitWorkForm from './views/SubmitWorkForm';
import JuryDashboard from './views/JuryDashboard';
import AdminDashboard from './views/AdminDashboard';
import ParticipantDashboard from './views/ParticipantDashboard';
import SecretaryDashboard from './views/SecretaryDashboard';
import AdmissionDashboard from './views/AdmissionDashboard';
import TreasurerDashboard from './views/TreasurerDashboard';
import AcademicDashboard from './views/AcademicDashboard';
import LoginModal from './views/LoginModal';
import BasesView from './views/BasesView';
import NotificationMenu from './components/common/NotificationMenu';
import TasksQuickAccess from './components/common/TasksQuickAccess';
import ProfileView from './views/ProfileView';
import RoadmapView from './views/RoadmapView';
import SmartRegistrationForm from './views/RegistrationView';
import DevelopmentView from './components/common/DevelopmentView';
// import StudentDashboard from './views/StudentDashboard';

export default function SIMRApp() {
  // Persistent User State
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedUser = window.localStorage.getItem('simr_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        // Migrate legacy 'accounting' role to 'treasurer'
        if (userData.roles) {
          userData.roles = userData.roles.map(role => role === 'accounting' ? 'treasurer' : role);
        }
        if (userData.role === 'accounting') {
          userData.role = 'treasurer';
        }
        return userData;
      }
    }
    return null;
  });

  // Auto-persist user state changes
  useEffect(() => {
    if (user) {
      window.localStorage.setItem('simr_user', JSON.stringify(user));
    }
  }, [user]);

  // Persistent Active Role
  const [activeRole, setActiveRole] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedRole = window.localStorage.getItem('simr_active_role');
      // Migrate legacy 'accounting' role to 'treasurer'
      return savedRole === 'accounting' ? 'treasurer' : savedRole || null;
    }
    return null;
  });

  const [currentView, setCurrentView] = useState('home');
  const [basesTab, setBasesTab] = useState('bases');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [config, setConfig] = useState(null);
  const roleMenuRef = useRef(null);

  // Restore view based on role if just loaded and logged in
  useEffect(() => {
    // Check if opened with virtual classroom param
    const params = new URLSearchParams(window.location.search);
    if (params.get('virtual') === 'true') {
      setActiveRole('aula_virtual');
      setCurrentView('participant-dashboard'); // Redirect to the dark, video-centric dashboard (Crehana style)
      return;
    }

    if (user && currentView === 'home' && activeRole) {
      updateViewForRole(activeRole);
    }
  }, []); // Run once on mount

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await api.content.getConfig();
        setConfig(data);
      } catch (error) {
        console.error("Error loading config:", error);
      }
    };
    loadConfig();

    const handleConfigUpdate = () => loadConfig();
    window.addEventListener('config-updated', handleConfigUpdate);
    return () => window.removeEventListener('config-updated', handleConfigUpdate);
  }, []);

  const isSectionVisible = (id) => {
    const section = config?.publicSections?.find(s => s.id === id);
    return section ? section.isVisible : true;
  };

  const isSectionDevelopment = (id) => {
    const section = config?.publicSections?.find(s => s.id === id);
    return section ? section.isDevelopment : false;
  };

  const navItemsList = [
    { id: 'home', label: 'Inicio', icon: Home, show: true },
    { id: 'bases', label: 'Bases', icon: FileText, show: isSectionVisible('bases') },
    { id: 'roadmap', label: 'Roadmap', icon: TrendingUp, show: isSectionVisible('roadmap') },
    { id: 'program', label: 'Programa', icon: Calendar, show: isSectionVisible('program') },
    { id: 'committee', label: 'Comité', icon: Users, show: isSectionVisible('committee') },
    { id: 'gallery', label: 'Galería', icon: ImageIcon, show: isSectionVisible('gallery') },
    { id: 'posters', label: 'E-Posters', icon: Grid, show: isSectionVisible('posters'), isBadge: true }
  ];

  const visibleNavItems = navItemsList.filter(item => item.show !== false);

  // Redirect logged-in users away from registration view
  useEffect(() => {
    if (user && currentView === 'registration') {
      // Redirect to their respective dashboard or home
      const allProfiles = user.profiles || ['perfil_basico'];
      // Filter out 'perfil_basico' to find a "real" dashboard profile, or default to it
      const primaryProfile = allProfiles.find(p => p !== 'perfil_basico') || 'perfil_basico';
      updateViewForRole(primaryProfile);
    }
  }, [user, currentView]);

  // Close role menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target)) {
        setIsRoleMenuOpen(false);
      }
    };

    if (isRoleMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRoleMenuOpen]);

  const handleLogin = (userData) => {
    setUser(userData);
    window.localStorage.setItem('simr_user', JSON.stringify(userData));

    // Default to the first substantive profile
    const allProfiles = userData.profiles || ['perfil_basico'];
    const initialRole = allProfiles.find(p => p !== 'perfil_basico') || 'perfil_basico';

    setActiveRole(initialRole);
    window.localStorage.setItem('simr_active_role', initialRole);

    updateViewForRole(initialRole);
    setIsMobileMenuOpen(false);
  };

  const handleRoleSwitch = (newRole) => {
    // Special handling for Aula Virtual - open in new tab
    if (newRole === 'aula_virtual') {
      // Open the same app in a new tab with a special parameter
      const url = `${window.location.origin}${window.location.pathname}?virtual=true`;
      window.open(url, '_blank');

      setIsRoleMenuOpen(false);
      return;
    }

    // Normal role switching for other roles
    setActiveRole(newRole);
    window.localStorage.setItem('simr_active_role', newRole);
    updateViewForRole(newRole);
    setIsRoleMenuOpen(false);
  };

  const getDashboardView = (profileKey) => {
    switch (profileKey) {
      case 'organizacion': return 'admin-dashboard';
      case 'secretaria': return 'secretary-dashboard';
      case 'investigacion': return 'academic-dashboard'; // Research role
      case 'jurado': return 'jury-dashboard';
      case 'contabilidad': return 'treasurer-dashboard';
      case 'asistencia': return 'admission-dashboard';
      case 'academico': return 'academic-dashboard'; // Committee role
      case 'aula_virtual': return 'participant-dashboard';
      case 'trabajos': return 'resident-dashboard';
      default: return 'profile';
    }
  };

  const updateViewForRole = (role) => {
    setCurrentView(getDashboardView(role));
  };

  const handleLogout = () => {
    setUser(null);
    setActiveRole(null);
    window.localStorage.removeItem('simr_user');
    window.localStorage.removeItem('simr_active_role');
    setCurrentView('home');
  };

  const navigate = (view, tab = null) => {
    setCurrentView(view);
    if (tab) setBasesTab(tab);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const eventYear = config?.eventYear || '2026';
  const eventName = `SIMR ${eventYear}`;

  const ROLE_LABELS = {
    organizacion: 'Organización',
    secretaria: 'Secretaría',
    investigacion: 'Investigación',
    asistencia: 'Asistencia',
    jurado: 'Jurado',
    contabilidad: 'Contabilidad',
    aula_virtual: 'Aula Virtual',
    trabajos: 'Trabajos',
    academico: 'Académico',
    perfil_basico: 'Mi Perfil'
  };

  const ROLE_ICONS = {
    organizacion: Users,
    secretaria: FileText,
    investigacion: BookOpen,
    asistencia: Users,
    jurado: Award,
    contabilidad: DollarSign,
    aula_virtual: Users,
    trabajos: User,
    academico: BookOpen,
    perfil_basico: CircleUser
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer print:hidden" onClick={() => navigate('home')}>
            <div className="bg-blue-900 text-white font-bold p-1.5 rounded text-lg">INCN</div>
            <span className="font-bold text-gray-900 text-lg hidden sm:block">{eventName}</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
            {visibleNavItems.map(item => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`hover:text-blue-700 flex items-center gap-1 transition-all
                  ${item.isBadge ? 'bg-blue-50 text-blue-800 px-3 py-1 rounded-full hover:shadow-sm hover:-translate-y-0.5' : 'transition-colors'}
                `}
              >
                <item.icon size={16} /> {item.label}
              </button>
            ))}
            {!user && (
              <button onClick={() => navigate('registration')} className="hover:text-blue-700 flex items-center gap-1 font-bold text-blue-800 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50 transition-all hover:shadow-sm hover:-translate-y-0.5"><UserPlus size={16} /> Inscripción</button>
            )}

            {/* Notification Menu */}
            {user && <NotificationMenu user={user} />}

            {/* Tasks Quick Access */}
            {user && <TasksQuickAccess user={user} />}




            {user ? (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200 relative" ref={roleMenuRef}>
                <div className="text-right cursor-pointer" onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}>
                  <div className="text-xs text-gray-600 uppercase flex items-center justify-end gap-1">
                    {ROLE_LABELS[activeRole] || activeRole}
                    {user.profiles && user.profiles.filter(p => p !== 'perfil_basico').length > 1 && <ChevronDown size={10} />}
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-sm font-bold text-gray-900 leading-none">{user.name.split(" ")[0]}</span>
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200 overflow-hidden">
                      {user.image ? (
                        <img src={user.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.name.charAt(0)
                      )}
                    </div>
                  </div>
                </div>

                {/* Role Switcher Dropdown */}
                {isRoleMenuOpen && (
                  <div className="absolute top-14 right-0 bg-white border border-gray-100 rounded-xl shadow-xl w-60 py-2 z-50 animate-fadeIn overflow-hidden">

                    {/* User Profile Section */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate('profile'); setIsRoleMenuOpen(false); }}
                        className="text-xs text-blue-600 font-medium hover:underline mt-1 flex items-center gap-1"
                      >
                        Ver mi perfil
                      </button>
                    </div>

                    {user.profiles && user.profiles.length > 0 && (
                      <>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">Navegación</div>
                        {user.profiles.filter(p => p !== 'perfil_basico').map(profile => {
                          const Icon = ROLE_ICONS[profile] || Users;
                          const isDashboardActive = activeRole === profile;
                          return (
                            <button
                              key={profile}
                              onClick={() => handleRoleSwitch(profile)}
                              className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 flex items-center justify-between transition-colors
                                     ${isDashboardActive ? 'text-blue-700 font-bold bg-blue-50' : 'text-gray-600'}
                                     `}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-lg ${isDashboardActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                  <Icon size={16} />
                                </div>
                                {ROLE_LABELS[profile] || profile}
                              </div>
                              {isDashboardActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                            </button>
                          );
                        })}
                        <div className="my-1 border-t border-gray-100"></div>
                      </>
                    )}

                    <button
                      onClick={() => { handleLogout(); setIsRoleMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                    >
                      <div className="p-1.5 rounded-lg bg-red-100 text-red-600">
                        <LogOut size={16} />
                      </div>
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button size="sm" onClick={() => navigate('login')}>Login</Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-gray-700 print:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 p-4 space-y-4">
            <button onClick={() => navigate('home')} className="block w-full text-left font-medium py-2 text-gray-800">Inicio</button>
            <button onClick={() => navigate('roadmap')} className="block w-full text-left font-medium py-2 text-gray-800">Roadmap</button>
            <button onClick={() => navigate('program')} className="block w-full text-left font-medium py-2 text-gray-800">Programa</button>
            <button onClick={() => navigate('committee')} className="block w-full text-left font-medium py-2 text-gray-800">Comité</button>
            <button onClick={() => navigate('gallery')} className="block w-full text-left font-medium py-2 text-gray-800">Galería</button>
            <button onClick={() => navigate('posters')} className="block w-full text-left font-medium py-2 text-blue-700 font-bold">E-Posters</button>
            {!user && (
              <button onClick={() => navigate('registration')} className="block w-full text-left font-medium py-2 text-blue-700">Inscripción</button>
            )}
            {user ? (
              <>
                <div className="border-t border-gray-100 pt-2 mt-2">
                  <div className="text-xs text-gray-500 uppercase mb-2">Cambiar Perfil ({ROLE_LABELS[activeRole]})</div>
                  {user.profiles && user.profiles.filter(p => p !== 'perfil_basico').map(profile => (
                    <button
                      key={profile}
                      onClick={() => handleRoleSwitch(profile)}
                      className={`block w-full text-left py-2 text-sm ${activeRole === profile ? 'font-bold text-blue-700' : 'text-gray-600'}`}
                    >
                      {ROLE_LABELS[profile]}
                    </button>
                  ))}
                </div>
                <button onClick={handleLogout} className="block w-full text-left font-medium py-2 text-red-600 mt-2 border-t border-gray-100 pt-2">Cerrar Sesión</button>
              </>
            ) : (
              <button onClick={() => navigate('login')} className="block w-full text-left font-medium py-2 text-blue-700">Ingresar</button>
            )}
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className={`max-w-7xl mx-auto px-4 md:px-8 ${['home', 'login', 'registration'].includes(currentView) ? 'py-0' : 'py-8'}`}>
        {currentView === 'home' && <HomeView navigate={navigate} user={user} />}
        {currentView === 'roadmap' && (isSectionDevelopment('roadmap') ? <DevelopmentView title="Roadmap en Desarrollo" /> : <RoadmapView />)}
        {currentView === 'bases' && (isSectionDevelopment('bases') ? <DevelopmentView title="Bases en Desarrollo" /> : <BasesView activeTab={basesTab} />)}
        {currentView === 'program' && (isSectionDevelopment('program') ? <DevelopmentView title="Programa en Desarrollo" /> : <ProgramView />)}
        {currentView === 'committee' && (isSectionDevelopment('committee') ? <DevelopmentView title="Comité en Desarrollo" /> : <CommitteeView />)}
        {currentView === 'gallery' && (isSectionDevelopment('gallery') ? <DevelopmentView title="Galería en Desarrollo" /> : <GalleryView />)}
        {currentView === 'posters' && (isSectionDevelopment('posters') ? <DevelopmentView title="E-Posters en Desarrollo" /> : <PostersView />)}
        {currentView === 'registration' && <SmartRegistrationForm />}
        {currentView === 'resident-dashboard' && <ResidentDashboard user={user} navigate={navigate} />}
        {currentView === 'participant-dashboard' && <ParticipantDashboard user={user} navigate={navigate} />}
        {currentView === 'submit-work' && <SubmitWorkForm navigate={navigate} />}
        {currentView === 'jury-dashboard' && <JuryDashboard user={user} />}
        {currentView === 'admin-dashboard' && <AdminDashboard user={user} />}
        {currentView === 'secretary-dashboard' && <SecretaryDashboard user={user} navigate={navigate} />}
        {currentView === 'admission-dashboard' && <AdmissionDashboard />}
        {currentView === 'academic-dashboard' && <AcademicDashboard role={activeRole} />}
        {currentView === 'treasurer-dashboard' && <TreasurerDashboard user={user} />}

        {/* {currentView === 'student-dashboard' && <StudentDashboard />} */}

        {currentView === 'profile' && <ProfileView user={user} onSave={(updatedUser) => setUser({ ...user, ...updatedUser })} />}
        {currentView === 'login' && <LoginModal setCurrentView={setCurrentView} handleLogin={handleLogin} />}
      </main>

      {/* Chat Widget */}
      <div className="print:hidden">
        <ChatWidget />
      </div>

      {/* Footer */}
      {['home', 'bases', 'roadmap', 'program', 'committee', 'gallery', 'posters', 'registration', 'login'].includes(currentView) && (
        <footer className="bg-white border-t border-gray-200 mt-12 py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-8 text-center md:text-left grid md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="font-bold text-gray-900 mb-4">{eventName}</h3>
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
                <li><a href="#" className="hover:text-blue-700">Libro de Resúmenes ({parseInt(eventYear) - 1})</a></li>
                <li><a href="#" className="hover:text-blue-700">Preguntas Frecuentes</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>{config?.contact?.email || 'comite.simr@incn.gob.pe'}</li>
                <li>{config?.contact?.phone || '+51 1 411-7700 (Anexo 234)'}</li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 pt-8 border-t border-gray-100 text-center text-xs text-gray-500">
            © {eventYear} Comité Organizador de Residentes INCN. Todos los derechos reservados.
          </div>
        </footer>
      )}
    </div>
  );
}
