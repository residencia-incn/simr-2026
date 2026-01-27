import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, User, Mail, FileDown } from 'lucide-react';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CouponHistoryModal = ({ coupon, isOpen, onClose }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen && coupon) {
            loadHistory();
        }
    }, [isOpen, coupon]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await api.coupons.getHistory(coupon.id);
            setHistory(data);
        } catch (error) {
            console.error("Error loading history", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (history.length === 0) return;

        const headers = ["Fecha", "Usuario", "Email", "DNI"];
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + history.map(r => `${r.used_at},"${r.user_full_name}","${r.user_email}","${r.user_dni}"`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `historial_cupon_${coupon.code}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen || !coupon) return null;

    const filtered = history.filter(item =>
        item.user_full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user_dni.includes(searchTerm)
    );

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex justify-end">
            <div className="bg-white w-full max-w-md h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Historial de Uso</h3>
                        <p className="text-sm text-slate-500 font-mono font-bold text-indigo-600">{coupon.code}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Stats & Search */}
                <div className="p-4 bg-white border-b border-slate-100 space-y-3">
                    <div className="flex gap-4 text-sm">
                        <div className="flex-1 bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
                            <div className="text-2xl font-bold text-blue-700">{history.length}</div>
                            <div className="text-xs text-blue-600 uppercase font-bold">Total Canjes</div>
                        </div>
                        <div className="flex-1 bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-center">
                            <div className="text-2xl font-bold text-emerald-700">
                                {coupon.maxUses === 0 ? '∞' : (coupon.maxUses - history.length)}
                            </div>
                            <div className="text-xs text-emerald-600 uppercase font-bold">Restantes</div>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o DNI..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="text-center py-8 text-slate-400">Cargando datos...</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 flex flex-col items-center gap-2">
                            <Calendar size={32} className="opacity-20" />
                            <p>No se encontraron registros.</p>
                        </div>
                    ) : (
                        filtered.map((item, idx) => (
                            <div key={idx} className="p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors group">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                        <User size={14} className="text-slate-400" />
                                        {item.user_full_name}
                                    </div>
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                        {format(new Date(item.used_at), "d MMM, HH:mm", { locale: es })}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 pl-6 space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <Mail size={10} className="text-slate-300" /> {item.user_email}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-mono bg-slate-100 px-1 rounded text-slate-500">DNI: {item.user_dni}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <button
                        onClick={handleExport}
                        disabled={history.length === 0}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition disabled:opacity-50"
                    >
                        <FileDown size={16} /> Descargar Reporte CSV
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CouponHistoryModal;
