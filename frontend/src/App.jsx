import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Menu, X, Users, ImageIcon, Grid, Home, FileText, Calendar, UserPlus, ChevronDown, Shield, Award, BookOpen, DollarSign, User, CircleUser, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from './services/api';
import { storage } from './services/storage';
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
import ResearchDashboard from './views/ResearchDashboard';
import LoginModal from './views/LoginModal';
import BasesView from './views/BasesView';
import NotificationMenu from './components/common/NotificationMenu';
import UserDashboardWidget from './components/layout/UserDashboardWidget';
import ProfileDropdown, { ROLE_LABELS, ROLE_ICONS } from './components/common/ProfileDropdown';
import ProfileView from './views/ProfileView';
import RoadmapView from './views/RoadmapView';
import SmartRegistrationForm from './views/RegistrationView';
import DevelopmentView from './components/common/DevelopmentView';
import { SmallUserAvatar } from './components/common/UserAvatar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext.jsx';
import ShoppingCart from './components/checkout/ShoppingCart';
import { PermissionGate } from './components/auth/PermissionGate';
import { checkAndResetStorage } from './utils/resetStorage';
import { MeetingWSProvider } from './context/MeetingWSContext';
import FloatingPollModal from './components/layout/FloatingPollModal';
import { Toaster } from 'react-hot-toast';

const AccessDeniedFallback = ({ message, navigate }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('home');
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-fadeIn">
      <div className="bg-red-50 p-4 rounded-full mb-4">
        <Shield size={48} className="text-red-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{message}</h3>
      <p className="text-gray-500">Redireccionando al inicio en unos segundos...</p>
    </div>
  );
};

// Wrapper to provide Global Auth Context
export default function SIMRApp() {
  return (
    <AuthProvider>
      <CartProvider>
        <SIMRAppContent />
        <ShoppingCart />
      </CartProvider>
    </AuthProvider>
  );
}

function SIMRAppContent() {
  // Use AuthContext for proper permission management
  const { user: authUser, login: authLogin, logout: authLogout } = useAuth();

  // Persistent User State (Legacy - keeping for now to avoid breaking other views until full migration)
  const [user, setUser] = useState(() => {
    const savedUser = storage.get('simr_user');
    if (savedUser) {
      const userData = savedUser;
      // Migrate legacy 'accounting' role to 'treasurer'
      if (userData.roles) {
        userData.roles = userData.roles.map(role => role === 'accounting' ? 'treasurer' : role);
      }
      if (userData.role === 'accounting') {
        userData.role = 'treasurer';
      }
      // Auto-clean: Remove phantom 'ponente' module if present in user data
      if (userData.modules && Array.isArray(userData.modules)) {
        userData.modules = userData.modules.filter(m => m !== 'ponente');

        // Auto-heal: Ensure 'academico' is present for ponentes
        const isPonente = (userData.eventRoles && userData.eventRoles.includes('ponente')) ||
          (userData.roles && userData.roles.includes('ponente'));

        if (isPonente && !userData.modules.includes('academico')) {
          userData.modules.push('academico');
        }
      }
      return userData;
    }
    return null;
  });

  // Check database version and reset if needed (MUST RUN FIRST)
  useEffect(() => {
    const wasReset = checkAndResetStorage();
    if (wasReset) {
      // Force reload to ensure clean state
      console.log('[App] Database was reset, reloading page...');
      window.location.reload();
    }
  }, []); // Run once on mount

  // Sync local user state with AuthContext user (which has properly derived permissions)
  // Sync local user state with AuthContext user (which has properly derived permissions)
  useEffect(() => {
    // Aggressively sync if authUser exists and is different from local user state
    if (authUser) {
      const hasDifferentModules = JSON.stringify(user?.modules) !== JSON.stringify(authUser.modules);
      const hasDifferentPermissions = JSON.stringify(user?.permissions) !== JSON.stringify(authUser.permissions);

      if (!user || user.id !== authUser.id || hasDifferentModules || hasDifferentPermissions) {
        setUser(authUser);
      }
    } else if (user) {
      // AuthContext has cleared user (logout), but legacy user still exists
      // We must clear legacy user to update UI
      setUser(null);
      setCurrentView('home');
      setActiveRole(null);
    }
  }, [authUser, user]);

  // Auto-persist user state changes
  useEffect(() => {
    if (user) {
      storage.set('simr_user', user);
    }
  }, [user]);

  // Persistent Active Role
  const [activeRole, setActiveRole] = useState(() => {
    const savedRole = storage.get('simr_active_role');
    const savedUser = storage.get('simr_user');

    // Validate immediately if we have user data
    if (savedRole && savedUser && savedUser.modules) {
      // Handle admin implicit permission if needed
      const effectiveModules = savedUser.modules.includes('admin')
        ? [...savedUser.modules, 'organizacion']
        : savedUser.modules;

      if (!effectiveModules.includes(savedRole) && savedRole !== 'mi_perfil') {
        // Found invalid role in storage - Fallback immediately
        // This prevents the UI from momentarily rendering unauthorized views
        console.warn(`[App] Invalid cached role '${savedRole}' detected during init. Resetting.`);
        const validFallback = savedUser.modules.find(m => m !== 'mi_perfil') || 'mi_perfil';
        return validFallback;
      }
    }

    return savedRole === 'accounting' ? 'treasurer' : savedRole || null;
  });

  // CRITICAL SECURITY FIX: Validate activeRole against user modules
  useEffect(() => {
    if (user && activeRole && user.modules) {
      // Normalize role check (handle legacy 'admin' -> 'organizacion' mapping if needed, 
      // though AuthContext should have handled it)
      const effectiveModules = user.modules.includes('admin')
        ? [...user.modules, 'organizacion']
        : user.modules;

      if (!effectiveModules.includes(activeRole) && activeRole !== 'mi_perfil') {
        console.warn(`[Security] Forcing role switch. User lacks module for active role: ${activeRole}`);

        // Fallback strategy:
        // 1. Try 'participante' if just a regular user
        // 2. Try first available module
        // 3. Default to 'mi_perfil'

        const firstValidModule = user.modules.find(m => m !== 'mi_perfil') || 'mi_perfil';
        setActiveRole(firstValidModule);
        storage.set('simr_active_role', firstValidModule);
        updateViewForRole(firstValidModule);
      }
    }
  }, [user, activeRole]);

  // Default to 'rbac_demo' to show the new functionality immediately
  const [currentView, setCurrentView] = useState('home');
  const [basesTab, setBasesTab] = useState('bases');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [activeMeetingId, setActiveMeetingId] = useState(null);
  const [config, setConfig] = useState(() => {
    // Intentamos cargar desde la caché local para evitar el "parpadeo" de la UI
    return storage.get('simr_config') || null;
  });
  const roleMenuRef = useRef(null);

  // Restore view based on role if just loaded and logged in
  useEffect(() => {
    // Check for deep linking parameters only
    const params = new URLSearchParams(window.location.search);

    // Support Deep Linking from Notifications
    const viewParam = params.get('view');
    const roleParam = params.get('role');
    const tabParam = params.get('tab');
    if (viewParam) {
      setCurrentView(viewParam);
      if (roleParam) {
        setActiveRole(roleParam);
        storage.set('simr_active_role', roleParam);
      }
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
        // Normalize backend snake_case to frontend camelCase
        const normalizedConfig = {
          ...data,
          publicSections: data.public_sections || data.publicSections || [],
          eventYear: data.event_year || data.eventYear,
          eventName: data.event_name || data.eventName,
          showHeroCountdown: data.show_countdown,
          // Map othe relevant fields if needed
        };
        setConfig(normalizedConfig);
        // Guardamos en caché para el próximo inicio
        storage.set('simr_config', normalizedConfig);
      } catch (error) {
        console.error("Error loading config:", error);
      }
    };
    loadConfig();

    const handleConfigUpdate = () => loadConfig();
    window.addEventListener('config-updated', handleConfigUpdate);
    return () => window.removeEventListener('config-updated', handleConfigUpdate);
  }, []);

  // Detect active meeting for WebSocket signaling
  useEffect(() => {
    if (!user) {
      setActiveMeetingId(null);
      return;
    }

    const checkActiveMeeting = async () => {
      try {
        const summary = await api.dashboard.getSummary();
        if (summary.meetings?.active?.length > 0) {
          // Tomamos la primera reunión activa para el signal
          setActiveMeetingId(summary.meetings.active[0].id);
        } else {
          setActiveMeetingId(null);
        }
      } catch (e) {
        console.error("Error checking active meeting:", e);
      }
    };

    checkActiveMeeting();
    // Poll every 30 seconds to catch new meetings started by admin
    const interval = setInterval(checkActiveMeeting, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const isSectionVisible = (id) => {
    if (!config) return false; // Por defecto no mostrar nada mientras carga (si no hay caché)
    const section = config?.publicSections?.find(s => s.id === id);
    return section ? section.isVisible : false;
  };

  const isSectionDevelopment = (id) => {
    const section = config?.publicSections?.find(s => s.id === id);
    return section ? section.isDevelopment : false;
  };

  // Ideally useAuth() but we are integrating slowly.
  // user object now has .permissions derived in AuthContext if we use login() from there.
  // BUT App.jsx has its own 'user' state which might NOT have permissions if just loaded from localStorage "simr_user" unless AuthProvider updated it.

  // Let's rely on user.permissions if available, or fallbacks.
  const hasAccess = (scope) => {
    if (!user) return false;
    // If permissions array exists, check it
    if (user.permissions && Array.isArray(user.permissions)) {
      if (user.permissions.includes('admin:all')) return true;
      return user.permissions.includes(scope);
    }
    return false;
  };

  const navItemsList = [
    { id: 'home', label: 'Inicio', icon: Home, show: true },
    { id: 'bases', label: 'Bases', icon: FileText, show: isSectionVisible('bases') },
    { id: 'roadmap', label: 'Roadmap', icon: TrendingUp, show: isSectionVisible('roadmap') },
    { id: 'program', label: 'Programa', icon: Calendar, show: isSectionVisible('program') },
    { id: 'committee', label: 'Comité', icon: Users, show: isSectionVisible('committee') },
    { id: 'gallery', label: 'Galería', icon: ImageIcon, show: isSectionVisible('gallery') },
    { id: 'posters', label: 'E-Posters', icon: Grid, show: isSectionVisible('posters'), isBadge: true },
  ];

  const visibleNavItems = navItemsList.filter(item => item.show !== false);

  // Redirect logged-in users away from registration view
  useEffect(() => {
    if (user && currentView === 'registration') {
      // Redirect to their respective dashboard or home
      const allProfiles = user.profiles || ['mi_perfil'];
      // Filter out 'mi_perfil' to find a "real" dashboard profile, or default to it
      const primaryProfile = allProfiles.find(p => p !== 'mi_perfil') || 'mi_perfil';
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
    // Use AuthContext login to properly derive permissions
    authLogin(userData);

    // Also update local state for legacy compatibility
    setUser(userData);

    // RBAC: Use modules instead of profiles for initial role determination
    // Modules are derived from eventRole + organizerFunction in AuthContext
    const allModules = (userData.modules || ['mi_perfil']).filter(m => m !== 'ponente' && m !== 'organizador');
    const initialRole = allModules.find(m => m !== 'mi_perfil') || 'mi_perfil';

    setActiveRole(initialRole);
    storage.set('simr_active_role', initialRole);

    updateViewForRole(initialRole);
    setIsMobileMenuOpen(false);
  };

  const handleRoleSwitch = (newRole) => {
    // Normal role switching for all roles including Aula Virtual
    setActiveRole(newRole);
    storage.set('simr_active_role', newRole);
    updateViewForRole(newRole);
    setIsRoleMenuOpen(false);
  };

  const getDashboardView = (profileKey) => {
    switch (profileKey) {
      case 'organizacion': return 'admin-dashboard';
      case 'secretaria': return 'secretary-dashboard';
      case 'investigacion': return 'research-dashboard'; // Specialized Research role
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
    // Use AuthContext logout for proper cleanup
    authLogout();

    // Also clear local state for legacy compatibility
    setUser(null);
    setActiveRole(null);
    setCurrentView('home');
  };

  const navigate = (view, tab = null) => {
    // Protección contra acceso directo a secciones desactivadas
    const publicViews = ['bases', 'roadmap', 'program', 'committee', 'gallery', 'posters'];
    if (publicViews.includes(view)) {
      if (!isSectionVisible(view)) {
        setCurrentView('home');
        return;
      }
    }

    setCurrentView(view);
    if (tab) setBasesTab(tab);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const eventYear = config?.eventYear || '2026';
  const eventName = `SIMR ${eventYear}`;

  // Determinamos qué rol mostrar como "activo" en la UI según la vista actual
  const getDisplayRole = () => {
    const dashboardRoles = {
      'admin-dashboard': 'organizacion',
      'secretary-dashboard': 'secretaria',
      'jury-dashboard': 'jurado',
      'treasurer-dashboard': 'contabilidad',
      'admission-dashboard': 'asistencia',
      'participant-dashboard': 'aula_virtual',
      'resident-dashboard': 'trabajos',
      'profile': 'mi_perfil'
    };

    // Para el dashboard académico, usamos el activeRole real ya que puede ser 'academico' o 'investigacion'
    if (currentView === 'academic-dashboard') return activeRole;

    return dashboardRoles[currentView] || null;
  };

  const displayRole = getDisplayRole();

  return (
    <div className="min-h-screen print:min-h-0 bg-gray-50 print:bg-white font-sans text-gray-800">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer print:hidden" onClick={() => navigate('home')}>
            <img src="/icono.svg" alt="Logo" className="h-8 w-auto" />
            <span className="font-bold text-gray-900 text-lg hidden sm:block">{eventName}</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
            {/* Only show public sections when NOT in Aula Virtual */}
            {currentView !== 'participant-dashboard' && visibleNavItems.map(item => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`flex items-center gap-1 transition-all
                    ${item.isBadge
                      ? 'bg-blue-50 text-blue-800 px-3 py-1 rounded-full hover:shadow-sm hover:-translate-y-0.5'
                      : isActive
                        ? 'text-blue-700 font-bold border-b-2 border-blue-700'
                        : 'text-gray-700 hover:text-blue-700'
                    }
                  `}
                  title={item.label} // Added tooltip for accessibility when text is hidden
                >
                  <item.icon size={20} />
                  <span className="hidden xl:inline">{item.label}</span>
                </button>
              );
            })}
            {!user && currentView !== 'participant-dashboard' && (
              <button
                onClick={() => navigate('registration')}
                className="hover:text-blue-700 flex items-center gap-1 font-bold text-blue-800 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50 transition-all hover:shadow-sm hover:-translate-y-0.5"
                title="Inscripción"
              >
                <UserPlus size={20} />
                <span className="hidden xl:inline">Inscripción</span>
              </button>
            )}

            {/* Notification Menu */}
            {user && <NotificationMenu user={user} />}

            {/* Shopping Cart Trigger */}
            {user && <CartTrigger />}

            {/* User Dashboard Widget (Command Center) */}
            {user && <UserDashboardWidget user={user} />}

            {user ? (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200 relative" ref={roleMenuRef}>
                <div className="text-right cursor-pointer" onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}>
                  <div className="text-xs text-gray-600 uppercase flex items-center justify-end gap-1">
                    {ROLE_LABELS[displayRole] || (displayRole ? displayRole : 'Inicio')}
                    {user.modules && user.modules.filter(m => m !== 'mi_perfil').length > 1 && <ChevronDown size={14} />}
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-sm font-bold text-gray-900 leading-none">{user.name.split(" ")[0]}</span>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center border border-blue-200 overflow-hidden">
                      <SmallUserAvatar
                        image={user.image}
                        gender={user.gender || 'unspecified'}
                        name={user.name}
                      />
                    </div>
                  </div>
                </div>

                {/* Role Switcher Dropdown */}
                {isRoleMenuOpen && (
                  <ProfileDropdown
                    user={user}
                    activeRole={displayRole}
                    onRoleChange={handleRoleSwitch}
                    onProfileClick={() => navigate('profile')}
                    onLogout={handleLogout}
                    onClose={() => setIsRoleMenuOpen(false)}
                  />
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
            {currentView !== 'participant-dashboard' && (
              <>
                <button onClick={() => navigate('home')} className={`w-full text-left font-medium py-2 flex items-center gap-3 ${currentView === 'home' ? 'text-blue-700 font-bold bg-blue-50 px-3 rounded-lg' : 'text-gray-800 px-3'}`}>
                  <Home size={20} />
                  <span>Inicio</span>
                </button>

                {visibleNavItems.filter(item => item.id !== 'home').map(item => (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    className={`w-full text-left font-medium py-2 flex items-center gap-3
                      ${currentView === item.id ? 'text-blue-700 font-bold bg-blue-50 px-3 rounded-lg' : 'text-gray-800 px-3'}
                      ${item.isBadge ? 'text-blue-700 font-bold' : ''}
                    `}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </button>
                ))}

                {!user && (
                  <button onClick={() => navigate('registration')} className={`w-full text-left font-medium py-2 flex items-center gap-3 ${currentView === 'registration' ? 'text-blue-700 font-bold px-3' : 'text-blue-700 px-3'}`}>
                    <UserPlus size={20} />
                    <span>Inscripción</span>
                  </button>
                )}
              </>
            )}
            {user ? (
              <>
                <div className="border-t border-gray-100 pt-4 mt-2">
                  <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-3 px-3">Módulos</div>
                  <div className="flex flex-wrap gap-2 px-2">
                    {user.modules && user.modules.filter(m => m !== 'mi_perfil' && m !== 'ponente' && m !== 'organizador' && m !== 'asistente' && m !== 'participante').map(module => {
                      const Icon = ROLE_ICONS[module] || User;
                      const isActive = activeRole === module;
                      return (
                        <button
                          key={module}
                          onClick={() => handleRoleSwitch(module)}
                          title={ROLE_LABELS[module]}
                          className={`p-3 rounded-xl transition-all ${isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-110 z-10'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                          <Icon size={20} />
                        </button>
                      );
                    })}
                    <button
                      onClick={() => navigate('profile')}
                      title="Mi Perfil"
                      className={`p-3 rounded-xl transition-all ${activeRole === 'mi_perfil'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-50 text-gray-500'
                        }`}
                    >
                      <User size={20} />
                    </button>
                  </div>
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
      <main className={`${['home', 'login', 'registration'].includes(currentView) ? 'py-0' : currentView === 'participant-dashboard' ? '' : 'py-8'} ${currentView === 'participant-dashboard' ? 'h-[calc(100vh-4rem)] overflow-hidden' : 'max-w-7xl mx-auto px-4 md:px-8'}`}>
        {currentView === 'home' && <HomeView navigate={navigate} user={user} />}
        {currentView === 'roadmap' && isSectionVisible('roadmap') && (isSectionDevelopment('roadmap') ? <DevelopmentView title="Roadmap en Desarrollo" /> : <RoadmapView navigate={navigate} />)}
        {currentView === 'bases' && isSectionVisible('bases') && (isSectionDevelopment('bases') ? <DevelopmentView title="Bases en Desarrollo" /> : <BasesView activeTab={basesTab} />)}
        {currentView === 'program' && isSectionVisible('program') && (isSectionDevelopment('program') ? <DevelopmentView title="Programa en Desarrollo" /> : <ProgramView />)}
        {currentView === 'committee' && isSectionVisible('committee') && (isSectionDevelopment('committee') ? <DevelopmentView title="Comité en Desarrollo" /> : <CommitteeView />)}
        {currentView === 'gallery' && isSectionVisible('gallery') && (isSectionDevelopment('gallery') ? <DevelopmentView title="Galería en Desarrollo" /> : <GalleryView />)}
        {currentView === 'posters' && isSectionVisible('posters') && (isSectionDevelopment('posters') ? <DevelopmentView title="E-Posters en Desarrollo" /> : <PostersView />)}
        {currentView === 'registration' && <SmartRegistrationForm />}

        {currentView === 'resident-dashboard' && (
          <PermissionGate scopes={['papers:read']} fallback={<AccessDeniedFallback message="Acceso Denegado: No tienes permisos para ver Trabajos." navigate={navigate} />}>
            <ResidentDashboard user={user} navigate={navigate} />
          </PermissionGate>
        )}

        {currentView === 'participant-dashboard' && (
          <PermissionGate scopes={['classroom:read']} fallback={<AccessDeniedFallback message="Acceso Denegado: Aula Virtual no habilitada." navigate={navigate} />}>
            <ParticipantDashboard user={user} navigate={navigate} />
          </PermissionGate>
        )}

        {currentView === 'submit-work' && <SubmitWorkForm navigate={navigate} />}

        {currentView === 'jury-dashboard' && (
          <PermissionGate scopes={['jury:read']} fallback={<AccessDeniedFallback message="Acceso Denegado: Panel de Jurado." navigate={navigate} />}>
            <JuryDashboard user={user} />
          </PermissionGate>
        )}

        {currentView === 'admin-dashboard' && (
          <PermissionGate scopes={['admin:all', 'users:manage']} requireAll={false} fallback={<AccessDeniedFallback message="Acceso Denegado: Panel de Organización." navigate={navigate} />}>
            <AdminDashboard user={user} />
          </PermissionGate>
        )}

        {currentView === 'secretary-dashboard' && (
          <PermissionGate scopes={['secretary:read']} fallback={<AccessDeniedFallback message="Acceso Denegado: Secretaría." navigate={navigate} />}>
            <SecretaryDashboard user={user} navigate={navigate} />
          </PermissionGate>
        )}

        {currentView === 'admission-dashboard' && (
          <PermissionGate scopes={['attendance:read']} fallback={<AccessDeniedFallback message="Acceso Denegado: Asistencia." navigate={navigate} />}>
            <AdmissionDashboard />
          </PermissionGate>
        )}

        {currentView === 'research-dashboard' && (
          <PermissionGate scopes={['research:read']} fallback={<AccessDeniedFallback message="Acceso Denegado: Investigación." navigate={navigate} />}>
            <ResearchDashboard />
          </PermissionGate>
        )}

        {currentView === 'academic-dashboard' && (
          <PermissionGate scopes={['academic:read']} fallback={<AccessDeniedFallback message="Acceso Denegado: Académico." navigate={navigate} />}>
            <AcademicDashboard />
          </PermissionGate>
        )}

        {currentView === 'treasurer-dashboard' && (
          <PermissionGate scopes={['accounting:read']} fallback={<AccessDeniedFallback message="Acceso Denegado: Tesorería." navigate={navigate} />}>
            <TreasurerDashboard user={user} />
          </PermissionGate>
        )}

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
        <footer className="bg-white border-t border-gray-200 mt-12 py-12 print:hidden">
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

      {/* Real-Time Signaling Layers */}
      <MeetingWSProvider meetingId={activeMeetingId}>
        <FloatingPollModal />
      </MeetingWSProvider>

      <Toaster position="top-right" />
    </div>
  );
}

// Helper Component for Cart Trigger
const CartTrigger = () => {
  const { user } = useAuth();
  const { cartItems, setIsCartOpen } = useCart();

  // Hide cart for privileged roles (they have full access)
  const isPrivileged = user && (
    ['organizador', 'ponente', 'jurado'].includes(user.eventRole) ||
    (user.eventRoles && user.eventRoles.some(r => ['organizador', 'ponente', 'jurado'].includes(r)))
  );

  if (isPrivileged) return null;

  return (
    <button
      onClick={() => setIsCartOpen(true)}
      className="relative p-2 text-gray-400 hover:text-blue-600 transition-colors hover:bg-blue-50 rounded-full"
      title="Carrito de Compras"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-cart"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
      {cartItems.length > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm animate-pulse">
          {cartItems.length}
        </span>
      )}
    </button>
  );
};
