import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Receipt, Eye, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PaymentValidationModal from './PaymentValidationModal';

const PaymentValidationTable = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estado para el modal
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await api.treasury.getPendingRequests();
            setRequests(data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando solicitudes pendientes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenModal = (request) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedRequest(null);
    };

    return (
        <div className="p-6 fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Receipt className="text-blue-600" /> Validación de Pagos
                    </h1>
                    <p className="text-slate-500 text-sm">Solicitudes en "Sala de Espera" pendientes de revisión.</p>
                </div>
                <button
                    onClick={loadData}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                    title="Actualizar tabla"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Tabla (Réplica de Imagen 1) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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

            {/* MODAL DE DETALLE */}
            <PaymentValidationModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                request={selectedRequest}
                onRefreshTable={loadData} // Para recargar la tabla al cerrar el modal
            />

        </div>
    );
};

export default PaymentValidationTable;
