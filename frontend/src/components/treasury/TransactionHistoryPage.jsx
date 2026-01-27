import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api';
import { Receipt, CheckCircle, XCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import PaymentValidationModal from './PaymentValidationModal';
import { Button } from '../ui';

const TransactionHistoryPage = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTx, setSelectedTx] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const loadHistory = async () => {
            setLoading(true);
            try {
                const data = await api.registrations.getTransactionHistory();
                setHistory(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, []);

    // Filtered history
    const filteredHistory = useMemo(() => {
        if (!searchTerm) return history;
        const lower = searchTerm.toLowerCase();
        return history.filter(tx =>
            (tx.user.fullname || '').toLowerCase().includes(lower) ||
            (tx.user.dni || '').includes(searchTerm) ||
            (tx.user.email || '').toLowerCase().includes(lower)
        );
    }, [history, searchTerm]);

    // Paginated history
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredHistory.slice(start, start + itemsPerPage);
    }, [filteredHistory, currentPage]);

    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Función para renderizar el estado con colores
    const StatusBadge = ({ status }) => {
        if (status === 'approved') {
            return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={12} /> Aprobado</span>;
        }
        if (status === 'rejected') {
            return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><XCircle size={12} /> Rechazado</span>;
        }
        return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">Pendiente</span>;
    };

    return (
        <div className="p-6 fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Receipt className="text-slate-600" /> Historial de Inscripciones
                </h1>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, DNI o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b text-xs font-bold text-slate-600 uppercase">
                            <tr>
                                <th className="p-4">Usuario / DNI</th>
                                <th className="p-4">Fecha Pago</th>
                                <th className="p-4">Monto</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4">Validado por</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {paginatedHistory.map((tx) => (
                                <tr
                                    key={tx.id}
                                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                                    onClick={() => { setSelectedTx(tx); setIsModalOpen(true); }}
                                >
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900">{tx.user.fullname}</div>
                                        <div className="text-xs text-slate-500">{tx.user.dni} - {tx.user.email}</div>
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        {new Date(tx.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 font-bold">S/ {tx.total_amount.toFixed(2)}</td>
                                    <td className="p-4">
                                        <StatusBadge status={tx.status} />
                                    </td>
                                    <td className="p-4 text-xs font-medium text-slate-500">
                                        {tx.approved_by_name || '-'}
                                    </td>
                                </tr>
                            ))}
                            {filteredHistory.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center text-slate-400">
                                        {searchTerm ? 'No se encontraron resultados para tu búsqueda.' : 'No hay historial disponible.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {loading && <div className="p-12 text-center text-blue-600 font-medium">Cargando historial...</div>}

                {/* Pagination Controls */}
                {!loading && filteredHistory.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="text-sm text-slate-500">
                            Mostrando <span className="font-medium text-slate-700">{((currentPage - 1) * itemsPerPage) + 1}</span> a <span className="font-medium text-slate-700">{Math.min(currentPage * itemsPerPage, filteredHistory.length)}</span> de <span className="font-medium text-slate-700">{filteredHistory.length}</span> registros
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft size={16} />
                            </Button>

                            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mx-2">
                                Página {currentPage} de {totalPages}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {selectedTx && (
                <PaymentValidationModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setSelectedTx(null); }}
                    request={{
                        ...selectedTx,
                        firstname: selectedTx.user.fullname.split(" ")[0],
                        lastname: selectedTx.user.fullname.split(" ").slice(1).join(" "),
                        dni: selectedTx.user.dni,
                        email: selectedTx.user.email,
                        items_detail: selectedTx.items_snapshot || selectedTx.items_detail
                    }}
                    readOnly={true}
                />
            )}
        </div>
    );
};

export default TransactionHistoryPage;
