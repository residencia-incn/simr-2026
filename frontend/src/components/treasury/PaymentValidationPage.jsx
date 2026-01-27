import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { Receipt, Eye, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PaymentValidationModal from './PaymentValidationModal';
import RecentRequestsWidget from './RecentRequestsWidget';

const PaymentValidationPage = ({ onGoToHistoryTab, onRefresh }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estado para el modal de la tabla principal
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.treasury.getPendingRequests();
            setRequests(data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando solicitudes");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleOpenModal = (request) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedRequest(null);
    };

    const handleRefreshAll = () => {
        loadData(); // Actualizar lista de pendientes local
        if (onRefresh) onRefresh(); // Actualizar tesorería global (Ingresos, Bancos)
    };

    return (
        <div className="p-6 fade-in h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Receipt className="text-blue-600" /> Validación de Pagos
                    </h1>
                    <p className="text-slate-500 text-sm">Solicitudes en "Sala de Espera" pendientes de revisión.</p>
                </div>
                <button
                    onClick={handleRefreshAll}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                    title="Actualizar tabla"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex gap-6 flex-1 items-start">

                {/* COLUMNA IZQUIERDA: TABLA PRINCIPAL (Ocupa más espacio) */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs font-bold leading-normal">
                            <tr>
                                <th className="p-4">DNI / Solicitante</th>
                                <th className="p-4">Fecha Solicitud</th>
                                <th className="p-4">Cuenta Destino</th>
                                <th className="p-4 text-right">Monto Total</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-700 text-sm font-medium divide-y divide-slate-100">
                            {requests.map((req) => (
                                <tr key={req.id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-50 text-blue-700 font-mono font-bold px-3 py-2 rounded-lg border border-blue-200 text-xs shadow-sm min-w-max">
                                                {req.dni}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{req.firstname} {req.lastname}</div>
                                                <div className="text-xs text-slate-500">{req.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Calendar size={14} />
                                            {new Date(req.created_at).toLocaleDateString()}
                                            <span className="text-xs">({new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {req.payment_account_interpreted ? (
                                            <span className="badge badge-outline bg-slate-100 border-slate-300 text-slate-800 font-bold px-2 py-1 rounded">
                                                {req.payment_account_interpreted}
                                            </span>
                                        ) : <span className="text-slate-400 italic">No indicó</span>}
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="font-bold text-emerald-600 text-base">
                                            S/ {req.total_amount.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => handleOpenModal(req)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto font-bold shadow-sm shadow-blue-200"
                                        >
                                            <Eye size={16} /> Revisar Voucher
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {requests.length === 0 && !loading && (
                                <tr><td colSpan="5" className="p-12 text-center text-slate-400 italic">No hay solicitudes pendientes de validación.</td></tr>
                            )}
                        </tbody>
                    </table>
                    {loading && <div className="p-8 text-center text-blue-600 font-bold">Cargando solicitudes...</div>}
                </div>

                {/* COLUMNA DERECHA: WIDGET LATERAL (Fijo a 320px) */}
                <div className="w-80 shrink-0">
                    <RecentRequestsWidget
                        onGoToHistory={onGoToHistoryTab}
                        onRefreshParent={handleRefreshAll} // Para sincronizar recargas
                    />
                </div>

            </div>

            {/* Modal Principal */}
            <PaymentValidationModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                request={selectedRequest}
                onRefreshTable={handleRefreshAll}
            />
        </div>
    );
};

export default PaymentValidationPage;
