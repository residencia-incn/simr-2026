import React, { useState, useMemo } from 'react';
import { Search, Printer, AlertCircle, CheckCircle, DollarSign, User, XCircle, Download } from 'lucide-react';
import { Button, Card, FormField } from '../ui';

const PaymentPunctualityReport = ({ organizers = [], config }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, late, debt, ok

    // Logic for individual status calculation
    const getOrganizerStatus = (organizer) => {
        if (!config?.contribution?.months) return { status: 'unknown' };

        const pendingMonths = config.contribution.months.filter(m => {
            // Normalized statuses from useTreasury: PAID, PENDING, IN_PROCESS
            const status = organizer.meses?.[m.id] || 'PENDING';
            return status === 'PENDING' || status === 'IN_PROCESS';
        });

        if (pendingMonths.length === 0) {
            return { status: 'ok', label: 'Al Día', color: 'green', pendingCount: 0, debt: 0, months: [] };
        }

        let isLate = false;
        let totalDebt = pendingMonths.length * (config.contribution.monthlyAmount || 0);
        const todayStr = new Date().toISOString().split('T')[0];

        pendingMonths.forEach(m => {
            if (m.deadline && todayStr > m.deadline) {
                isLate = true;
            }
        });

        if (isLate) {
            return {
                status: 'late',
                label: 'Fuera de Fecha',
                color: 'red',
                pendingCount: pendingMonths.length,
                debt: totalDebt,
                months: pendingMonths
            };
        } else {
            return {
                status: 'debt',
                label: 'Por Pagar',
                color: 'blue',
                pendingCount: pendingMonths.length,
                debt: totalDebt,
                months: pendingMonths
            };
        }
    };

    const processedData = useMemo(() => {
        return organizers.map(org => {
            const statusData = getOrganizerStatus(org);
            return {
                ...org,
                ...statusData
            };
        }).sort((a, b) => {
            // Sort by status priority: Late > Debt > OK
            const priority = { 'late': 3, 'debt': 2, 'ok': 1, 'unknown': 0 };
            return priority[b.status] - priority[a.status];
        });
    }, [organizers, config]);

    const filteredData = processedData.filter(item => {
        const matchesSearch = item.organizador_nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const stats = useMemo(() => {
        return {
            totalDebt: processedData.reduce((sum, item) => sum + (item.debt || 0), 0),
            lateCount: processedData.filter(item => item.status === 'late').length,
            okCount: processedData.filter(item => item.status === 'ok').length
        };
    }, [processedData]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <style type="text/css" media="print">
                {`
                @page { size: landscape; margin: 1cm; }
                body * { visibility: hidden; }
                #print-area, #print-area * { visibility: visible; }
                #print-area { position: absolute; left: 0; top: 0; width: 100%; }
                .no-print { display: none !important; }
                `}
            </style>

            {/* Header Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center no-print bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar organizador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-gray-50 border-gray-200 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none w-64 transition-all"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 bg-gray-50 border-gray-200 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-gray-700"
                    >
                        <option value="all">Todos los Estados</option>
                        <option value="late">Fuera de Fecha (Crítico)</option>
                        <option value="debt">Con Deuda (A tiempo)</option>
                        <option value="ok">Al Día</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handlePrint}
                        className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl shadow-lg shadow-slate-200 flex items-center gap-2 transition-all transform active:scale-95"
                    >
                        <Printer size={18} />
                        <span className="font-bold">Imprimir Reporte</span>
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
                <Card className="p-6 border-2 border-red-100 bg-white hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-red-500 uppercase tracking-wider mb-2">Deuda Total Acumulada</p>
                            <h3 className="text-3xl font-black text-gray-900">S/ {stats.totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        </div>
                        <div className="p-3 bg-red-50 rounded-2xl text-red-500">
                            <XCircle size={28} />
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-2 border-orange-100 bg-white hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-orange-500 uppercase tracking-wider mb-2">Usuarios Fuera de Fecha</p>
                            <h3 className="text-3xl font-black text-gray-900">{stats.lateCount}</h3>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-2xl text-orange-500">
                            <AlertCircle size={28} />
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-2 border-green-100 bg-white hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-green-500 uppercase tracking-wider mb-2">Usuarios Al Día</p>
                            <h3 className="text-3xl font-black text-gray-900">{stats.okCount}</h3>
                        </div>
                        <div className="p-3 bg-green-50 rounded-2xl text-green-500">
                            <CheckCircle size={28} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Printable Report Area */}
            <div id="print-area" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Reporte de Puntualidad de Pagos</h2>
                        <p className="text-sm text-gray-500">Generado el {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="text-right hidden print:block">
                        <p className="text-xs text-gray-400">SIMR 2026 Treasury System</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 w-12 text-center">#</th>
                                <th className="px-6 py-3">Organizador</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3 text-right">Monto Deuda</th>
                                <th className="px-6 py-3">Meses Pendientes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredData.map((item, index) => (
                                <tr key={item.organizador_id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-center text-gray-400">{index + 1}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 print:hidden">
                                                <User size={14} />
                                            </div>
                                            <span className="font-medium text-gray-900">{item.organizador_nombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.status === 'ok' && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                                                <CheckCircle size={12} className="mr-1.5" /> Al Día
                                            </span>
                                        )}
                                        {item.status === 'debt' && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                <DollarSign size={12} className="mr-1.5" /> Por Pagar
                                            </span>
                                        )}
                                        {item.status === 'late' && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                                                <XCircle size={12} className="mr-1.5" /> Fuera de Fecha
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono">
                                        {item.debt > 0 ? (
                                            <span className={item.status === 'late' ? 'text-red-600 font-bold' : 'text-blue-600'}>
                                                S/ {item.debt.toFixed(2)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.months && item.months.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {item.months.map(m => (
                                                    <span key={m.id} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200">
                                                        {m.label}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic text-xs">Ninguno</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        No se encontraron registros que coincidan con los filtros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PaymentPunctualityReport;
