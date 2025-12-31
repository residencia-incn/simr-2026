import React, { useState, useMemo } from 'react';
import { Filter, Download, TrendingUp, TrendingDown, TriangleAlert, CheckCircle, Printer } from 'lucide-react';
import { Button, Card, FormField, Table } from '../ui';

const ReportsView = ({ transactions, accounts, budgetExecution, user }) => {
    const [activeTab, setActiveTab] = useState('cashflow');
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        accountId: '',
        categoria: ''
    });

    // Helper para obtener fecha segura
    const getSafeDate = (tx) => {
        return tx.fecha || tx.date || new Date().toISOString();
    };

    // Filtrar transacciones
    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];

        return transactions.filter(tx => {
            // Extraer solo la parte de fecha (YYYY-MM-DD) sin conversión de zona horaria
            const rawDate = getSafeDate(tx);
            const txDate = rawDate.split('T')[0];

            if (filters.startDate && txDate < filters.startDate) return false;
            // Para la fecha final, queremos incluir todo el día seleccionado
            if (filters.endDate && txDate > filters.endDate) return false;

            if (filters.accountId && tx.cuenta_id !== filters.accountId) return false;
            if (filters.categoria && tx.categoria !== filters.categoria) return false;
            return true;
        }).sort((a, b) => new Date(getSafeDate(b)) - new Date(getSafeDate(a)));
    }, [transactions, filters]);

    // Calcular totales
    const summary = useMemo(() => {
        const income = filteredTransactions.filter(t => t.monto > 0).reduce((sum, t) => sum + t.monto, 0);
        const expense = filteredTransactions.filter(t => t.monto < 0).reduce((sum, t) => sum + Math.abs(t.monto), 0);
        return {
            income,
            expense,
            net: income - expense
        };
    }, [filteredTransactions]);

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
        if (!transactions) return [];
        const cats = new Set(transactions.map(tx => tx.categoria));
        return Array.from(cats).sort();
    }, [transactions]);

    const handlePrint = () => {
        window.print();
    };

    const exportToCSV = () => {
        const headers = ['Fecha', 'Descripción', 'Categoría', 'Cuenta', 'Monto', 'Saldo'];
        const rows = transactionsWithBalance.map(tx => [
            getSafeDate(tx).split('T')[0],
            tx.descripcion,
            tx.categoria,
            accounts.find(a => a.id === tx.cuenta_id)?.nombre || '',
            (tx.monto || 0).toFixed(2),
            (tx.saldo_acumulado || 0).toFixed(2)
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
                        <TriangleAlert size={12} />
                        Excedido
                    </span>
                );
            case 'alerta':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                        <TriangleAlert size={12} />
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
            <style type="text/css" media="print">
                {`
                @page { margin: 0.5cm; }
                body { padding-top: 0 !important; margin-top: 0 !important; }
                `}
            </style>

            {/* Print Header */}
            <div className="hidden print:block border-b pb-2">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Reporte de Tesorería</h1>
                        <p className="text-gray-600 mt-1">SIMR 2026</p>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                        <p>Generado el: {new Date().toLocaleString('es-PE')}</p>
                        <p>Por: {user?.nombre || user?.email || 'Sistema'}</p>
                    </div>
                </div>

                {/* Print Context/Filters Summary */}
                <div className="flex gap-4 text-sm text-gray-500 bg-gray-50 p-3 rounded">
                    <div>
                        <span className="font-semibold">Cuenta:</span> {filters.accountId ? accounts.find(a => a.id === filters.accountId)?.nombre : 'Todas'}
                    </div>
                    <div>
                        <span className="font-semibold">Periodo:</span> {filters.startDate || 'Inicio'} - {filters.endDate || 'Actualidad'}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 print:hidden">
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

            {/* Summary Section (Visible in UI and Print) */}
            {activeTab === 'cashflow' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 mb-6">
                    <Card className="p-4 bg-green-50 border-green-200 print:border print:shadow-none">
                        <p className="text-sm text-green-700 font-medium mb-1">Total Ingresos ({filters.categoria || 'General'})</p>
                        <p className="text-2xl font-bold text-green-900">
                            S/ {summary.income.toFixed(2)}
                        </p>
                    </Card>
                    <Card className="p-4 bg-red-50 border-red-200 print:border print:shadow-none">
                        <p className="text-sm text-red-700 font-medium mb-1">Total Egresos ({filters.categoria || 'General'})</p>
                        <p className="text-2xl font-bold text-red-900">
                            S/ {summary.expense.toFixed(2)}
                        </p>
                    </Card>
                    <Card className={`p-4 border-2 print:border print:shadow-none ${summary.net >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                        <p className={`text-sm font-medium mb-1 ${summary.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Balance Neto</p>
                        <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                            S/ {summary.net.toFixed(2)}
                        </p>
                    </Card>
                </div>
            )}

            {/* Cash Flow Tab */}
            {activeTab === 'cashflow' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <Card className="p-4 print:hidden">
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
                        <div className="flex justify-end mt-4 gap-2">
                            <Button
                                onClick={handlePrint}
                                variant="outline"
                                className="text-sm"
                            >
                                <Printer size={16} className="mr-2" />
                                Imprimir
                            </Button>
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
                    <Card className="overflow-x-auto print:shadow-none print:border-none">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Descripción</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Categoría</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cuenta</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {transactionsWithBalance.map((tx, idx) => (
                                    <tr key={tx.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {(() => {
                                                const dateStr = getSafeDate(tx);
                                                const [year, month, day] = dateStr.split('T')[0].split('-');
                                                return `${day}/${month}/${year}`;
                                            })()}
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
                                            <span className={`font-bold flex items-center justify-end gap-1 ${tx.monto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.monto >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                S/ {Math.abs(tx.monto || 0).toFixed(2)}
                                            </span>
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
                    <Card className="overflow-x-auto print:shadow-none print:border-none">
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
                                {(budgetExecution || []).map((item, idx) => (
                                    <tr key={item.categoria} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.categoria}</td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                                            S/ {(item.presupuestado || 0).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                            S/ {(item.ejecutado || 0).toFixed(2)}
                                        </td>
                                        <td className={`px-4 py-3 text-sm text-right font-semibold ${item.diferencia >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            S/ {(item.diferencia || 0).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {(item.porcentaje || 0).toFixed(1)}%
                                                </span>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all ${item.estado === 'excedido'
                                                            ? 'bg-red-600'
                                                            : item.estado === 'alerta'
                                                                ? 'bg-yellow-500'
                                                                : 'bg-green-600'
                                                            }`}
                                                        style={{ width: `${Math.min(item.porcentaje || 0, 100)}%` }}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
                        <Card className="p-4 bg-blue-50 border-blue-200 print:shadow-none print:border">
                            <p className="text-sm text-blue-600 font-medium mb-1">Total Presupuestado</p>
                            <p className="text-2xl font-bold text-blue-900">
                                S/ {(budgetExecution || []).reduce((sum, item) => sum + (item.presupuestado || 0), 0).toFixed(2)}
                            </p>
                        </Card>
                        <Card className="p-4 bg-purple-50 border-purple-200 print:shadow-none print:border">
                            <p className="text-sm text-purple-600 font-medium mb-1">Total Ejecutado</p>
                            <p className="text-2xl font-bold text-purple-900">
                                S/ {(budgetExecution || []).reduce((sum, item) => sum + (item.ejecutado || 0), 0).toFixed(2)}
                            </p>
                        </Card>
                        <Card className="p-4 bg-green-50 border-green-200 print:shadow-none print:border">
                            <p className="text-sm text-green-600 font-medium mb-1">Disponible</p>
                            <p className="text-2xl font-bold text-green-900">
                                S/ {(budgetExecution || []).reduce((sum, item) => sum + (item.diferencia || 0), 0).toFixed(2)}
                            </p>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsView;

