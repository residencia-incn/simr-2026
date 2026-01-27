import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { User, CheckCircle, ArrowRight } from 'lucide-react';
import PaymentValidationModal from './PaymentValidationModal';

const RecentRequestsWidget = ({ onGoToHistory, onRefreshParent }) => {
    const [recent, setRecent] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadRecent = async () => {
        try {
            // CAMBIO: Ahora llamamos a getRecentApproved
            const data = await api.registrations.getRecentApproved(5);
            setRecent(data);
        } catch (error) {
            console.error("Error cargando aprobados", error);
        }
    };

    useEffect(() => {
        loadRecent();
    }, [onRefreshParent]); // Se actualiza si apruebas a alguien en la tabla principal

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
                {/* Header Diferente: "Últimos Registrados" */}
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">Últimas Inscripciones</h3>
                    <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                        <CheckCircle size={10} /> Confirmados
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {recent.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm italic">
                            Aún no hay inscritos aprobados.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {recent.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}
                                    className="p-3 hover:bg-emerald-50 cursor-pointer transition-colors flex items-center gap-3 group"
                                >
                                    <div className="bg-emerald-100 text-emerald-600 p-2 rounded-full group-hover:bg-emerald-200 transition-colors">
                                        <User size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">
                                            {item.firstName} {item.lastName}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">{item.email}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            {item.created_at ? new Date(item.created_at).toLocaleString() : 'Fecha no disp.'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-slate-700 text-sm">S/ {item.total_amount}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-3 bg-slate-50 border-t">
                    <button
                        onClick={onGoToHistory}
                        className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                        Ver Historial Completo <ArrowRight size={16} />
                    </button>
                </div>
            </div>

            {/* Reutilizamos el Modal en MODO LECTURA */}
            {selectedItem && (
                <PaymentValidationModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setSelectedItem(null); }}
                    request={selectedItem}
                    /* 🛑 TRUCO: Pasamos una prop nueva para ocultar botones */
                    readOnly={true}
                    onRefreshTable={loadRecent}
                />
            )}
        </>
    );
};

export default RecentRequestsWidget;
