import React, { useState, useMemo } from 'react';
import { DollarSign, Filter, Search, Users, Calendar, Wallet, TrendingUp, Plus, X } from 'lucide-react';
import { Card, Table, Badge, EmptyState, Button, FormField } from '../ui';

const IncomeManager = ({ transactions = [], accounts = [], confirmedAttendees = [], contributionStatus = {}, categories = { income: [] }, onIncomeSubmit }) => {
    const [filterType, setFilterType] = useState('all'); // 'all' | 'inscription' | 'contribution' | 'other'
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        accountId: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
    });

    // Consolidate all income sources into unified format
    const allIncomes = useMemo(() => {
        const incomes = [];

        // 1. Income from transactions (manual entries and other concepts)
        const incomeTransactions = transactions.filter(t => t.type === 'income');
        incomeTransactions.forEach(tx => {
            const accId = (tx.accountId || tx.cuenta_id);
            const account = accounts.find(a => a.id === accId);

            // Determine if this is an inscription or contribution based on category
            let type = 'other';
            let typeLabel = 'Otro Concepto';

            const category = (tx.category || tx.categoria || '').toLowerCase();
            if (category.includes('inscri')) {
                type = 'inscription';
                typeLabel = 'Inscripciones';
            } else if (category.includes('aporte')) {
                type = 'contribution';
                typeLabel = 'Aporte Mensual';
            } else if (category.includes('penalidades') || category.includes('multas')) {
                type = 'penalty';
                typeLabel = 'Penalidades';
            } else if (category.includes('taller')) {
                type = 'workshop';
                typeLabel = 'Talleres';
            }

            // Append user name if available
            let concept = tx.description || tx.descripcion;
            if (tx.userName) {
                concept = `${concept} - ${tx.userName}`;
            } else if (tx.metadata?.originalFine?.userName) {
                concept = `${concept} - ${tx.metadata.originalFine.userName}`;
            }

            incomes.push({
                id: tx.id,
                date: tx.date || tx.fecha,
                concept: concept,
                type,
                typeLabel,
                account: account ? (account.name || account.nombre) : 'Sin cuenta asignada',
                accountId: accId,
                category: tx.category || tx.categoria || 'Sin categoría',
                amount: tx.amount || tx.monto || 0,
                participant: tx.participant || '-',
                role: tx.role || '-',
                contributorName: tx.contributorName || '-',
                month: tx.month || '-'
            });
        });

        // Sort by date (newest first)
        return incomes.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions, accounts, confirmedAttendees, contributionStatus]);

    // Filter incomes based on type, search term, and date range
    const filteredIncomes = useMemo(() => {
        let filtered = allIncomes;

        // Filter by type
        if (filterType !== 'all') {
            filtered = filtered.filter(income => income.type === filterType);
        }

        // Filter by search term
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(income =>
                income.concept.toLowerCase().includes(search) ||
                income.participant.toLowerCase().includes(search) ||
                income.contributorName.toLowerCase().includes(search) ||
                income.category.toLowerCase().includes(search)
            );
        }

        // Filter by date range
        if (startDate) {
            filtered = filtered.filter(income => new Date(income.date) >= new Date(startDate));
        }
        if (endDate) {
            filtered = filtered.filter(income => new Date(income.date) <= new Date(endDate));
        }

        return filtered;
    }, [allIncomes, filterType, searchTerm, startDate, endDate]);

    // Calculate total for filtered results
    const filteredTotal = useMemo(() => {
        return filteredIncomes.reduce((sum, income) => sum + income.amount, 0);
    }, [filteredIncomes]);

    // Pagination
    const totalPages = Math.ceil(filteredIncomes.length / itemsPerPage);
    const paginatedIncomes = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredIncomes.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredIncomes, currentPage]);

    // Reset to page 1 when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [filterType, searchTerm, startDate, endDate]);

    // Get badge color based on type
    const getTypeBadgeColor = (type) => {
        switch (type) {
            case 'inscription':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'contribution':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'penalty':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'workshop':
                return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'other':
                return 'bg-gray-100 text-gray-700 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    // Table columns
    const columns = [
        {
            header: 'Fecha',
            key: 'date',
            render: (income) => (
                <div className="text-sm text-gray-900">
                    {new Date(income.date).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    })}
                </div>
            )
        },
        {
            header: 'Concepto',
            key: 'concept',
            render: (income) => (
                <div>
                    <div className="font-medium text-gray-900">{income.concept}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {income.type === 'inscription' && income.role !== '-' && (
                            <span className="inline-flex items-center gap-1">
                                <Users size={10} /> {income.role}
                            </span>
                        )}
                        {income.type === 'contribution' && income.month !== '-' && (
                            <span className="inline-flex items-center gap-1">
                                <Calendar size={10} /> {income.month}
                            </span>
                        )}
                        {income.type === 'other' && (
                            <span>{income.category}</span>
                        )}
                    </div>
                </div>
            )
        },
        {
            header: 'Tipo',
            key: 'type',
            render: (income) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeBadgeColor(income.type)}`}>
                    {income.typeLabel}
                </span>
            )
        },
        {
            header: 'Cuenta',
            key: 'account',
            render: (income) => (
                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                    <Wallet size={14} className="text-gray-400" />
                    {income.account}
                </div>
            )
        },
        {
            header: 'Monto',
            key: 'amount',
            className: 'text-right',
            render: (income) => (
                <span className="font-bold text-green-600">
                    S/ {income.amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            )
        }
    ];

    // Form handlers
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (onIncomeSubmit) {
            await onIncomeSubmit(formData);
            // Reset form and close modal
            setFormData({
                description: '',
                amount: '',
                accountId: '',
                category: '',
                date: new Date().toISOString().split('T')[0]
            });
            setShowModal(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="text-green-600" size={28} />
                        Gestión de Ingresos
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Visualiza y filtra todos los ingresos del evento
                    </p>
                </div>

                {/* Button and Total Card */}
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => setShowModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Agregar Ingreso
                    </Button>

                    {/* Total Card */}
                    <Card className="px-6 py-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <DollarSign className="text-green-600" size={24} />
                            </div>
                            <div>
                                <div className="text-xs text-green-700 font-medium uppercase">
                                    Total {filterType !== 'all' && `(${filteredIncomes.length} registros)`}
                                </div>
                                <div className="text-2xl font-bold text-green-900">
                                    S/ {filteredTotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Filters and Search */}
            <Card className="p-6">
                <div className="flex flex-col gap-4">
                    {/* Type Filters */}
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-400" />
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setFilterType('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'all'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Todos ({allIncomes.length})
                            </button>
                            <button
                                onClick={() => setFilterType('inscription')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'inscription'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Inscripciones ({allIncomes.filter(i => i.type === 'inscription').length})
                            </button>
                            <button
                                onClick={() => setFilterType('contribution')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'contribution'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Aportes Mensuales ({allIncomes.filter(i => i.type === 'contribution').length})
                            </button>
                            <button
                                onClick={() => setFilterType('penalty')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'penalty'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Penalidades ({allIncomes.filter(i => i.type === 'penalty').length})
                            </button>
                            <button
                                onClick={() => setFilterType('other')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'other'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Otros Conceptos ({allIncomes.filter(i => i.type === 'other').length})
                            </button>
                        </div>
                    </div>

                    {/* Search and Date Range */}
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                        {/* Search */}
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por concepto, participante..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Date Range */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <Calendar size={18} className="text-gray-400" />
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Fecha inicio"
                                />
                                <span className="text-gray-500 text-sm">hasta</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Fecha fin"
                                />
                                {(startDate || endDate) && (
                                    <button
                                        onClick={() => {
                                            setStartDate('');
                                            setEndDate('');
                                        }}
                                        className="px-3 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                                    >
                                        Limpiar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Table */}
            <Card className="overflow-hidden">
                {filteredIncomes.length === 0 ? (
                    <EmptyState
                        icon={DollarSign}
                        title="No se encontraron ingresos"
                        description={
                            searchTerm
                                ? "Intenta con otros términos de búsqueda"
                                : filterType !== 'all'
                                    ? `No hay ingresos de tipo "${filterType === 'inscription' ? 'Inscripciones' : filterType === 'contribution' ? 'Aportes Mensuales' : filterType === 'penalty' ? 'Penalidades' : 'Otros Conceptos'}"`
                                    : "Aún no hay ingresos registrados"
                        }
                    />
                ) : (
                    <>
                        <Table
                            columns={columns}
                            data={paginatedIncomes}
                            className="border-0"
                        />


                        {/* Pagination & Stats - Always show if we have data */}
                        {filteredIncomes.length > 0 && (
                            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-gray-50">
                                <div className="text-sm text-gray-500">
                                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredIncomes.length)} de {filteredIncomes.length} registros
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 rounded-md text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Anterior
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === i + 1
                                                ? 'bg-blue-600 text-white'
                                                : 'border border-gray-200 bg-white hover:bg-gray-50'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 rounded-md text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Income Registration Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Plus className="text-green-600" size={24} />
                                Registrar Ingreso
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <FormField
                                label="Descripción"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Ej. Pago de inscripción"
                                required
                            />

                            <FormField
                                label="Monto (S/)"
                                name="amount"
                                type="number"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                required
                            />

                            <FormField
                                label="Cuenta"
                                name="accountId"
                                type="select"
                                value={formData.accountId}
                                onChange={handleChange}
                                options={[
                                    { value: "", label: "Seleccionar cuenta..." },
                                    ...accounts.map(acc => ({
                                        value: acc.id,
                                        label: `${acc.nombre} (S/ ${(acc.saldo_actual || 0).toFixed(2)})`
                                    }))
                                ]}
                                required
                            />

                            <FormField
                                label="Categoría"
                                name="category"
                                type="select"
                                value={formData.category}
                                onChange={handleChange}
                                options={[
                                    { value: "", label: "Seleccionar..." },
                                    ...(categories.income || [])
                                        .filter(cat => !['Inscripciones', 'Aportes', 'Aporte Mensual', 'Penalidades'].includes(cat))
                                        .map(cat => ({ value: cat, label: cat }))
                                ]}
                                required
                            />

                            <FormField
                                label="Fecha"
                                name="date"
                                type="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />

                            <Button
                                type="submit"
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                            >
                                Guardar Ingreso
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncomeManager;
