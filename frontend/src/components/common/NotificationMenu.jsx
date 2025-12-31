import React, { useState, useEffect } from 'react';
import { Bell, Check, X, FileText, UserPlus, AlertCircle, Info, DollarSign } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const NotificationMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const loadNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const allNotifications = await api.notifications.getAll();

            // Filter notifications for the current user
            const filtered = allNotifications.filter(n => {
                // 1. Specific User targeted
                if (n.userId && n.userId === user.id) return true;

                // 2. Role based targeted
                if (n.profiles && n.profiles.some(p => user.profiles?.includes(p))) return true;

                // 3. Fallback: If neither userId nor profiles are set, show to all (or none? let's say none for now to avoid spam)
                return false;
            });

            setNotifications(filtered);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 15000);
        return () => clearInterval(interval);
    }, [user]);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            loadNotifications();
        }
    };

    return (
        <div className="relative">
            <button onClick={toggleMenu} className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100">
                <Bell size={20} />
                {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                        {notifications.filter(n => !n.read).length}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fadeIn">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Notificaciones</h3>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                {notifications.filter(n => !n.read).length} nuevas
                            </span>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-xs text-gray-400">Cargando...</div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <Bell size={24} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">No hay notificaciones nuevas</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map((notif, idx) => (
                                        <button
                                            key={notif.id || idx}
                                            onClick={async () => {
                                                await api.notifications.markAsRead(notif.id);
                                                if (notif.link) {
                                                    // Redirection logic
                                                    if (notif.link.includes('?')) {
                                                        const [path, query] = notif.link.split('?');
                                                        window.location.href = notif.link; // Simple redirect for now as we don't have global router control easily
                                                    } else {
                                                        window.location.href = notif.link;
                                                    }
                                                }
                                                setIsOpen(false);
                                                loadNotifications();
                                            }}
                                            className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex gap-3 ${!notif.read ? 'bg-blue-50/30' : ''}`}
                                        >
                                            <div className="mt-1">
                                                {notif.type === 'registration' ? <UserPlus size={16} className="text-blue-500" /> :
                                                    notif.type === 'work_observation' ? <AlertCircle size={16} className="text-orange-500" /> :
                                                        notif.type === 'contribution_validation' ? <DollarSign size={16} className="text-green-600" /> :
                                                            <Info size={16} className="text-gray-400" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${!notif.read ? 'font-bold' : 'font-medium'} text-gray-800 truncate`}>{notif.title}</p>
                                                <p className="text-xs text-gray-600 mb-1 line-clamp-2">{notif.message}</p>
                                                <p className="text-[10px] text-gray-400">
                                                    {notif.timestamp ? new Date(notif.timestamp).toLocaleString() : 'Reciente'}
                                                </p>
                                            </div>
                                            {!notif.read && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-2 bg-gray-50 border-t border-gray-100 flex justify-between px-4">
                            <button onClick={async () => {
                                await api.notifications.clear();
                                loadNotifications();
                            }} className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors">
                                Borrar todas
                            </button>
                            <button onClick={() => setIsOpen(false)} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationMenu;
