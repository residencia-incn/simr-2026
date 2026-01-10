import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Menu, X, Users, Home, FileText, Calendar, UserPlus, ChevronDown, ImageIcon, Grid, TrendingUp, BookOpen, Award, DollarSign, User, CircleUser } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { SmallUserAvatar } from '../common/UserAvatar';
import NotificationMenu from '../common/NotificationMenu';
import TasksQuickAccess from '../common/TasksQuickAccess';
import ProfileDropdown, { ROLE_LABELS } from '../common/ProfileDropdown';
import Button from '../ui/Button';
import { useCart } from '../../context/CartContext';

// Cart Helper (Internal)
const CartTrigger = () => {
    const { user } = useAuth();
    const { cartItems, setIsCartOpen } = useCart();

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

const Header = ({ currentView, onNavigate, activeRole, setActiveRole }) => {
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
    const roleMenuRef = useRef(null);



    const handleLogout = () => {
        logout();
        // Force redirect or cleanup if needed
        window.location.href = '/';
    };

    const handleNavigation = (view) => {
        if (onNavigate) {
            onNavigate(view);
        } else {
            // Fallback for Aula Virtual or standalone usage
            if (view === 'home') window.location.href = '/';
            // Add other external redirects if needed
        }
    };

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

    const navItemsList = [
        { id: 'home', label: 'Inicio', icon: Home, show: true },
        { id: 'bases', label: 'Bases', icon: FileText, show: true }, // Simplified for strict portability, or pass visible items as prop
        { id: 'roadmap', label: 'Roadmap', icon: TrendingUp, show: true },
        { id: 'program', label: 'Programa', icon: Calendar, show: true },
        { id: 'committee', label: 'Comité', icon: Users, show: true },
        { id: 'gallery', label: 'Galería', icon: ImageIcon, show: true },
        { id: 'posters', label: 'E-Posters', icon: Grid, show: true, isBadge: true },
    ];

    const visibleNavItems = navItemsList.filter(item => item.show !== false);
    const eventYear = '2026'; // Could be prop or context
    const eventName = `SIMR ${eventYear}`;

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm print:hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                {/* Left Side: SIMR 2026 Logo */}
                <div className="flex items-center gap-2">
                    <div className="bg-blue-900 text-white font-bold p-1.5 rounded text-lg">INCN</div>
                    <span className="font-bold text-gray-900 text-lg">SIMR 2026</span>
                </div>

                {/* Right Side: Notification, Cart, Tasks, and Profile */}
                <div className="flex items-center gap-4">
                    {/* Notification Menu */}
                    {user && <NotificationMenu user={user} />}

                    {/* Shopping Cart Trigger */}
                    {user && <CartTrigger />}

                    {/* Tasks Quick Access */}
                    {user && <TasksQuickAccess user={user} />}

                    {user ? (
                        <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200 relative" ref={roleMenuRef}>
                            <div className="text-right cursor-pointer" onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}>
                                <div className="text-xs text-gray-600 uppercase flex items-center justify-end gap-1">
                                    {ROLE_LABELS[activeRole] || activeRole}
                                    {user.modules && user.modules.filter(m => m !== 'perfil_basico').length > 1 && <ChevronDown size={10} />}
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
                                    activeRole={activeRole}
                                    onRoleChange={(module) => setActiveRole(module)}
                                    onProfileClick={() => {
                                        setActiveRole('perfil_basico');
                                        if (onNavigate) onNavigate('profile');
                                    }}
                                    onLogout={handleLogout}
                                    onClose={() => setIsRoleMenuOpen(false)}
                                />
                            )}
                        </div>
                    ) : (
                        <Button size="sm" onClick={() => handleNavigation('login')}>Login</Button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Header;
