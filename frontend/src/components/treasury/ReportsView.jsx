import React, { useState, useMemo } from 'react';
import { Filter, Download, TrendingUp, TrendingDown, TriangleAlert, CheckCircle, Printer, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Card, FormField, Table } from '../ui';
import PaymentPunctualityReport from './PaymentPunctualityReport';
import UserStatementReport from './UserStatementReport';

const ReportsView = ({ transactions, accounts, budgetExecution, user, organizers, config, categories: legacyCategories, allUsers = [] }) => {
    const [activeTab, setActiveTab] = useState('cashflow');
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        accountId: '',
        categoria: ''
    });

    // Pagination & Sorting State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    // Helper para obtener fecha segura
    const getSafeDate = (tx) => {
        return tx.fecha || tx.date || new Date().toISOString();
    };

    // Helper para mapear categorías del sistema
    const getCategoryLabel = (category) => {
        if (!category) return 'Sin categoría';
        const lower = category.toLowerCase();
        if (lower.includes('inscri') || lower === 'modality') return 'Inscripciones';
        if (lower.includes('aporte')) return 'Aporte Mensual';
        if (lower.includes('penalidades') || lower.includes('multas')) return 'Penalidades';
        if (lower.includes('taller') || lower === 'workshop') return 'Talleres';
        return category;
    };

    // 1. Filter Transactions (Keep unsorted for now to calculate running balance correctly)
    const filteredRawTransactions = useMemo(() => {
        if (!transactions) return [];

        return transactions.filter(tx => {
            const rawDate = getSafeDate(tx);
            const txDate = rawDate.split('T')[0];

            if (filters.startDate && txDate < filters.startDate) return false;
            if (filters.endDate && txDate > filters.endDate) return false;
            if (filters.accountId && tx.cuenta_id !== filters.accountId) return false;
            // Map category for filtering
            const txCatLabel = getCategoryLabel(tx.categoria);
            if (filters.categoria && txCatLabel !== filters.categoria) return false;
            return true;
        });
    }, [transactions, filters]);

    // 2. Calculate Totals (Summary)
    const summary = useMemo(() => {
        const income = filteredRawTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Math.abs(t.monto || 0), 0);

        const expense = filteredRawTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Math.abs(t.monto || 0), 0);

        return {
            income,
            expense,
            net: income - expense
        };
    }, [filteredRawTransactions]);

    // 3. Calculate Balance Chronologically (ASC)
    // We sort ASC first to ensure the running balance calculation is accurate (Start -> End)
    const transactionsWithBalance = useMemo(() => {
        // Create a copy and sort by date ASC
        const sortedAsc = [...filteredRawTransactions].sort((a, b) => new Date(getSafeDate(a)) - new Date(getSafeDate(b)));

        let balance = 0;
        return sortedAsc.map(tx => {
            // For income add, for expense subtract (assuming monto is signed correctly in source or using type)
            // Current system seems to use signed 'monto' (+ for income, - for expense) mostly
            // If strictly relying on 'type', we should check.
            // Assuming 'monto' is already signed (negative for expenses) based on previous Card logic showing Math.abs
            balance += tx.monto;

            return {
                ...tx,
                saldo_acumulado: balance,
                // Add a normalized date for sorting later
                _normalizedDate: new Date(getSafeDate(tx)).getTime()
            };
        });
    }, [filteredRawTransactions]);

    // 4. Verification Check: if transactions are stored unsign (positive expenses), we might need to adjust logic
    // But existing code used: balance += tx.monto; implies unsigned logic mismatch OR signed data.
    // The summary calc used Math.abs(monto) for totals, suggesting monto might be mixed.
    // Let's trust the previous implementation: "accountBalances" usually comes from backend or signed sum.
    // The previous implementation of transactionsWithBalance was:
    // filteredTransactions (DESC) -> map (accumulate) -> reverse (ASC displayed? No, DESC displayed)
    // Wait, previous code: sort DESC, map (accum), reverse (so displayed ASC?). 
    // display mapped: {transactionsWithBalance.map((tx, idx) => ( ... ))}
    // If it was reversed at the end of memo, it means it displayed Oldest First?
    // Let's look at previous file:
    // ... }).sort((a, b) => DESC);
    // ... map ... reverse();
    // Sort DESC (C, B, A). Map (Accum C..B..A). Reverse (A, B, C).
    // So displayed order was ASC (Oldest at top).
    // AND balance was accumulated in Reverse Order (Newest -> Oldest). 
    // That means Balance displayed for Today was (Today's Tx). Balance for Yesterday was (Today + Yesterday).
    // That's "Remaining Funds from this point backwards"?? 
    // NO, usually user wants "Running Balance".
    // I will stick to Standard Running Balance (ASC calc). 

    // 5. Sort & Paginate for Display
    const processedTransactions = useMemo(() => {
        let sorted = [...transactionsWithBalance];

        // Apply Sorting
        sorted.sort((a, b) => {
            let valA, valB;

            if (sortConfig.key === 'date') {
                valA = a._normalizedDate;
                valB = b._normalizedDate;
            } else if (sortConfig.key === 'amount') {
                valA = a.monto;
                valB = b.monto;
            } else {
                // Default string sort
                valA = a[sortConfig.key] || '';
                valB = b[sortConfig.key] || '';
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [transactionsWithBalance, sortConfig]);

    // Pagination Slicing
    const totalPages = Math.max(1, Math.ceil(processedTransactions.length / itemsPerPage));
    const paginatedTransactions = processedTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
        setCurrentPage(1); // Reset to first page on sort
    };

    // Sort Icon Helper
    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <div className="w-4 h-4 inline-block" />; // Spacer
        return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
    };

    // Obtener categorías únicas (Del sistema + existentes)
    const availableCategories = useMemo(() => {
        // Flatten system categories
        let systemCats = [];
        if (legacyCategories) {
            const income = legacyCategories.income || [];
            const expense = legacyCategories.expense || [];
            // Handle object vs string format
            const flatIncome = income.map(c => typeof c === 'object' ? c.name : c);
            const flatExpense = expense.map(c => typeof c === 'object' ? c.name : c);
            systemCats = [...flatIncome, ...flatExpense];
        }

        // Also include categories currently in transactions (in case of historical data)
        const txCats = transactions ? transactions.map(tx => tx.categoria) : [];

        // Remove duplicates and sort
        const allCats = new Set([...systemCats, ...txCats].map(c => getCategoryLabel(c)));
        return Array.from(allCats).filter(Boolean).sort();
    }, [transactions, legacyCategories]);

    const handlePrint = () => {
        window.print();
    };

    const exportToCSV = () => {
        const headers = ['Fecha', 'Descripción', 'Categoría', 'Cuenta', 'Monto', 'Saldo'];
        const rows = transactionsWithBalance.map(tx => [ // Export ALL, chronological or sorted? Usually sorted or chronological. Let's export chronological (calculated)
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

    // ... (Keep getStatusBadge)
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
                        onClick={() => setActiveTab('punctuality')}
                        className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'punctuality'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Puntualidad de Pagos
                    </button>

                    <button
                        onClick={() => setActiveTab('statements')}
                        className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'statements'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Estados de Cuenta
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
                                    ...availableCategories.map(cat => ({ value: cat, label: cat }))
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
                        <table className="w-full print:hidden">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th
                                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('date')}
                                    >
                                        Fecha <SortIcon columnKey="date" />
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('descripcion')}
                                    >
                                        Descripción <SortIcon columnKey="descripcion" />
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('categoria')}
                                    >
                                        Categoría <SortIcon columnKey="categoria" />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cuenta</th>
                                    <th
                                        className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('amount')}
                                    >
                                        Monto <SortIcon columnKey="amount" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {paginatedTransactions.map((tx, idx) => (
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
                                                {getCategoryLabel(tx.categoria)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {accounts.find(a => a.id === tx.cuenta_id)?.nombre || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            <span className={`font-bold flex items-center justify-end gap-1 ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                {tx.type === 'income' ? '+' : '-'} S/ {Math.abs(tx.monto || 0).toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {processedTransactions.length === 0 && (
                            <div className="p-12 text-center text-gray-500 print:hidden">
                                No hay transacciones que coincidan con los filtros
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {processedTransactions.length > 0 && (
                            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between print:hidden">
                                <div className="text-sm text-gray-500">
                                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, processedTransactions.length)} de {processedTransactions.length} registros
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="disabled:opacity-50"
                                    >
                                        <ChevronLeft size={16} />
                                    </Button>
                                    <span className="text-sm font-medium px-2">
                                        Página {currentPage} de {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="disabled:opacity-50"
                                    >
                                        <ChevronRight size={16} />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* PRINT ONLY TABLE (Full List) */}
                        <div className="hidden print:block">
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
                                    {processedTransactions.map((tx, idx) => (
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
                                                    {getCategoryLabel(tx.categoria)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {accounts.find(a => a.id === tx.cuenta_id)?.nombre || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right">
                                                <span className={`font-bold flex items-center justify-end gap-1 ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {tx.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                    {tx.type === 'income' ? '+' : '-'} S/ {Math.abs(tx.monto || 0).toFixed(2)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* Budget Execution Tab */}

            {/* Punctuality Tab */}
            {activeTab === 'punctuality' && (
                <PaymentPunctualityReport organizers={organizers} config={config} />
            )}

            {/* User Statements Tab */}
            {activeTab === 'statements' && (
                <UserStatementReport
                    allUsers={allUsers}
                    transactions={transactions}
                    organizers={organizers}
                    config={config}
                />
            )}
        </div>
    );
};

export default ReportsView;

