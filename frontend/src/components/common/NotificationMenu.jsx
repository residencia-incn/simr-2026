import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { api } from '../../services/api';

const NotificationMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [pendingRegistrations, setPendingRegistrations] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = await api.registrations.getAll();
            setPendingRegistrations(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
        // Poll every 30s or listen to events
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

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
                {pendingRegistrations.length > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                        {pendingRegistrations.length}
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
                                {pendingRegistrations.length} nuevas
                            </span>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-xs text-gray-400">Cargando...</div>
                            ) : pendingRegistrations.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <Bell size={24} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">No hay notificaciones nuevas</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="px-4 py-2 bg-blue-50/50 text-xs font-bold text-blue-800 uppercase tracking-wider">
                                        Registros Pendientes
                                    </div>
                                    {pendingRegistrations.map((reg, idx) => (
                                        <div key={idx} className="p-4 hover:bg-gray-50 border-b border-gray-50 transition-colors flex gap-3">
                                            <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${reg.img ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-gray-800">{reg.name}</p>
                                                <p className="text-xs text-gray-500 mb-1">{reg.email}</p>
                                                <p className="text-xs text-gray-400">{reg.timestamp ? new Date(reg.timestamp).toLocaleDateString() : 'Reciente'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
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
