import React, { useState, useMemo } from 'react';
import { Filter, Download, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button, Card, FormField, Table } from '../ui';

const ReportsView = ({ transactions, accounts, budgetExecution }) => {
    const [activeTab, setActiveTab] = useState('cashflow');
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        accountId: '',
        categoria: ''
    });

    // Filtrar transacciones
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            if (filters.startDate && tx.fecha < filters.startDate) return false;
            if (filters.endDate && tx.fecha > filters.endDate) return false;
            if (filters.accountId && tx.cuenta_id !== filters.accountId) return false;
            if (filters.categoria && tx.categoria !== filters.categoria) return false;
            return true;
        }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }, [transactions, filters]);

    // Calcular saldo acumulado
    const transactionsWithBalance = useMemo(() => {
        let balance = 0;
        return filteredTransactions.map(tx => {
            balance += tx.monto;
            return { ...tx, saldo_acumulado: balance };
        }).reverse();
    }, [filteredTransactions]);

    // Obtener categorías únicas
    const categories = useMemo(() => {
        const cats = new Set(transactions.map(tx => tx.categoria));
        return Array.from(cats).sort();
    }, [transactions]);

    const exportToCSV = () => {
        const headers = ['Fecha', 'Descripción', 'Categoría', 'Cuenta', 'Ingreso', 'Egreso', 'Saldo'];
        const rows = transactionsWithBalance.map(tx => [
            tx.fecha,
            tx.descripcion,
            tx.categoria,
            accounts.find(a => a.id === tx.cuenta_id)?.nombre || '',
            tx.monto > 0 ? tx.monto.toFixed(2) : '',
            tx.monto < 0 ? Math.abs(tx.monto).toFixed(2) : '',
            tx.saldo_acumulado.toFixed(2)
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flujo_caja_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const getStatusBadge = (estado) => {
        switch (estado) {
            case 'excedido':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                        <AlertTriangle size={12} />
                        Excedido
                    </span>
                );
            case 'alerta':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                        <AlertTriangle size={12} />
                        Alerta
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        <CheckCircle size={12} />
                        Normal
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-6">
                    <button
                        onClick={() => setActiveTab('cashflow')}
                        className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'cashflow'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Flujo de Caja
                    </button>
                    <button
                        onClick={() => setActiveTab('budget')}
                        className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'budget'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Ejecución Presupuestal
                    </button>
                </nav>
            </div>

            {/* Cash Flow Tab */}
            {activeTab === 'cashflow' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <Card className="p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter size={18} className="text-gray-600" />
                            <h4 className="font-semibold text-gray-900">Filtros</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <FormField
                                label="Fecha Inicio"
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            />
                            <FormField
                                label="Fecha Fin"
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            />
                            <FormField
                                label="Cuenta"
                                type="select"
                                value={filters.accountId}
                                onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
                                options={[
                                    { value: '', label: 'Todas las cuentas' },
                                    ...accounts.map(acc => ({ value: acc.id, label: acc.nombre }))
                                ]}
                            />
                            <FormField
                                label="Categoría"
                                type="select"
                                value={filters.categoria}
                                onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}
                                options={[
                                    { value: '', label: 'Todas las categorías' },
                                    ...categories.map(cat => ({ value: cat, label: cat }))
                                ]}
                            />
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button
                                onClick={exportToCSV}
                                variant="outline"
                                className="text-sm"
                            >
                                <Download size={16} className="mr-2" />
                                Exportar CSV
                            </Button>
                        </div>
                    </Card>

                    {/* Transactions Table */}
                    <Card className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Descripción</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Categoría</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cuenta</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Ingreso</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Egreso</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Saldo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {transactionsWithBalance.map((tx, idx) => (
                                    <tr key={tx.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {new Date(tx.fecha).toLocaleDateString('es-PE')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{tx.descripcion}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                                {tx.categoria}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {accounts.find(a => a.id === tx.cuenta_id)?.nombre || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            {tx.monto > 0 && (
                                                <span className="text-green-600 font-semibold flex items-center justify-end gap-1">
                                                    <TrendingUp size={14} />
                                                    S/ {tx.monto.toFixed(2)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            {tx.monto < 0 && (
                                                <span className="text-red-600 font-semibold flex items-center justify-end gap-1">
                                                    <TrendingDown size={14} />
                                                    S/ {Math.abs(tx.monto).toFixed(2)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                            S/ {tx.saldo_acumulado.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {transactionsWithBalance.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                No hay transacciones que coincidan con los filtros
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* Budget Execution Tab */}
            {activeTab === 'budget' && (
                <div className="space-y-4">
                    <Card className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Categoría</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Presupuestado</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Ejecutado</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Diferencia</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">% Ejecución</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {budgetExecution.map((item, idx) => (
                                    <tr key={item.categoria} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.categoria}</td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                                            S/ {item.presupuestado.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                            S/ {item.ejecutado.toFixed(2)}
                                        </td>
                                        <td className={`px-4 py-3 text-sm text-right font-semibold ${item.diferencia >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            S/ {item.diferencia.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {item.porcentaje.toFixed(1)}%
                                                </span>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all ${item.estado === 'excedido'
                                                                ? 'bg-red-600'
                                                                : item.estado === 'alerta'
                                                                    ? 'bg-yellow-500'
                                                                    : 'bg-green-600'
                                                            }`}
                                                        style={{ width: `${Math.min(item.porcentaje, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {getStatusBadge(item.estado)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>

                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-4 bg-blue-50 border-blue-200">
                            <p className="text-sm text-blue-600 font-medium mb-1">Total Presupuestado</p>
                            <p className="text-2xl font-bold text-blue-900">
                                S/ {budgetExecution.reduce((sum, item) => sum + item.presupuestado, 0).toFixed(2)}
                            </p>
                        </Card>
                        <Card className="p-4 bg-purple-50 border-purple-200">
                            <p className="text-sm text-purple-600 font-medium mb-1">Total Ejecutado</p>
                            <p className="text-2xl font-bold text-purple-900">
                                S/ {budgetExecution.reduce((sum, item) => sum + item.ejecutado, 0).toFixed(2)}
                            </p>
                        </Card>
                        <Card className="p-4 bg-green-50 border-green-200">
                            <p className="text-sm text-green-600 font-medium mb-1">Disponible</p>
                            <p className="text-2xl font-bold text-green-900">
                                S/ {budgetExecution.reduce((sum, item) => sum + item.diferencia, 0).toFixed(2)}
                            </p>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsView;
