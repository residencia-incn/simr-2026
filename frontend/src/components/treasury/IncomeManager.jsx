import React, { useState, useMemo } from 'react';
import { DollarSign, Filter, Search, Users, User, Calendar, Wallet, TrendingUp, Plus, FileText } from 'lucide-react';
import { Card, Table, Badge, EmptyState, Button, FormField, Modal, DropZone } from '../ui';

const IncomeManager = ({ transactions = [], accounts = [], confirmedAttendees = [], contributionStatus = {}, categories = { income: [] }, onIncomeSubmit }) => {
    const [selectedCategory, setSelectedCategory] = useState('Todas'); // 'Todas' | specific category name
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Sorting state
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [previewVoucher, setPreviewVoucher] = useState(null); // URL of voucher to preview
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        accountId: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        voucherFile: null
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
            // Determine if this is an inscription or contribution based on category
            let type = 'other';
            let categoryName = tx.category || tx.categoria || 'Sin Categoría';
            let typeLabel = categoryName;

            const categoryLower = categoryName.toLowerCase();
            if (categoryLower.includes('inscri') || categoryLower === 'modality') {
                type = 'inscription';
                typeLabel = 'Inscripciones';
            } else if (categoryLower.includes('aporte')) {
                type = 'contribution';
                typeLabel = 'Aporte Mensual';
            } else if (categoryLower.includes('penalidades') || categoryLower.includes('multas')) {
                type = 'penalty';
                typeLabel = 'Penalidades';
            } else if (categoryLower.includes('taller') || categoryLower === 'workshop') {
                type = 'workshop';
                typeLabel = 'Talleres';
            }

            // Append user name if available
            let concept = tx.description || tx.descripcion;

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
                participant: tx.userName || tx.usuario || '-',
                userName: tx.userName || tx.usuario || '-',
                role: tx.role || '-',
                contributorName: tx.contributorName || tx.userName || '-',
                month: tx.month || '-',
                voucher: tx.voucher_url || tx.voucher || tx.comprobante
            });
        });

        // Return raw consolidatd data (sorting handled separately)
        return incomes;
    }, [transactions, accounts, confirmedAttendees, contributionStatus]);

    // Filter incomes based on type, search term, and date range
    const filteredIncomes = useMemo(() => {
        let filtered = allIncomes;

        // Filter by type
        if (selectedCategory !== 'Todas') {
            filtered = filtered.filter(income => income.category === selectedCategory);
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

        // Apply Dynamic Sorting
        return [...filtered].sort((a, b) => {
            const { key, direction } = sortConfig;
            let valA = a[key];
            let valB = b[key];

            // Special handling for amounts
            if (key === 'amount') {
                valA = parseFloat(valA);
                valB = parseFloat(valB);
            }

            // Special handling for dates
            if (key === 'date') {
                valA = new Date(valA);
                valB = new Date(valB);
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allIncomes, selectedCategory, searchTerm, startDate, endDate, sortConfig]);

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
    }, [selectedCategory, searchTerm, startDate, endDate]);

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
            sortable: true,
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
            sortable: true,
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
                    </div>
                </div>
            )
        },
        {
            header: 'Usuario',
            key: 'userName',
            sortable: true,
            render: (income) => (
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                        <User size={14} />
                    </div>
                    <span className="text-gray-700">{income.userName || '-'}</span>
                </div>
            )
        },
        {
            header: 'Categoría',
            key: 'category', // Using category internal key for sorting
            sortable: true,
            render: (income) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeBadgeColor(income.type)}`}>
                    {income.typeLabel}
                </span>
            )
        },
        {
            header: 'Cuenta',
            key: 'account',
            sortable: true,
            render: (income) => (
                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                    <Wallet size={14} className="text-gray-400" />
                    {income.account}
                </div>
            )
        },
        {
            header: 'Voucher',
            key: 'voucher',
            className: 'text-center',
            render: (income) => income.voucher ? (
                <button
                    onClick={() => {
                        const url = income.voucher.startsWith('http')
                            ? income.voucher
                            : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${income.voucher}`;
                        setPreviewVoucher(url);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                    title="Ver Comprobante"
                >
                    <FileText size={16} />
                </button>
            ) : <span className="text-gray-300">-</span>
        },
        {
            header: 'Monto',
            key: 'amount',
            sortable: true,
            className: 'text-right',
            render: (income) => (
                <span className="font-bold text-green-600">
                    S/ {income.amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            )
        }
    ];

    // Form handlers
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Crear FormData para soportar la subida de imagen
        const data = new FormData();
        data.append('descripcion', formData.description);
        data.append('monto', formData.amount);
        data.append('categoria', formData.category);
        data.append('cuenta_id', formData.accountId);
        data.append('type', 'income');
        data.append('fecha', formData.date);

        if (formData.voucherFile) {
            data.append('voucher', formData.voucherFile);
        }

        if (onIncomeSubmit) {
            await onIncomeSubmit(data);
            // Reset form and close modal
            setFormData({
                description: '',
                amount: '',
                accountId: '',
                category: '',
                date: new Date().toISOString().split('T')[0],
                voucherFile: null
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
                                    Total {selectedCategory !== 'Todas' && `(${filteredIncomes.length} registros)`}
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
                    {/* Type Filters - Dynamic */}
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-400" />
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setSelectedCategory('Todas')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === 'Todas'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Todas ({allIncomes.length})
                            </button>

                            {(Array.isArray(categories.income) ? categories.income : []).map(cat => {
                                const catName = typeof cat === 'object' ? cat.name : cat;
                                return (
                                    <button
                                        key={catName}
                                        onClick={() => setSelectedCategory(catName)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === catName
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {catName} ({allIncomes.filter(i => i.category === catName).length})
                                    </button>
                                );
                            })}
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
                                : selectedCategory !== 'Todas'
                                    ? `No hay ingresos de la categoría "${selectedCategory}"`
                                    : "Aún no hay ingresos registrados"
                        }
                    />
                ) : (
                    <>
                        <Table
                            columns={columns}
                            data={paginatedIncomes}
                            sortConfig={sortConfig}
                            onSort={handleSort}
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
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Registrar Ingreso"
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        label="Descripción"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Ej. Pago de inscripción"
                        required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            label="Fecha"
                            name="date"
                            type="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                ...(Array.isArray(categories.income) ? categories.income : [])
                                    .filter(cat => typeof cat === 'object' ? !cat.is_system : !['Inscripciones', 'Aportes', 'Aporte Mensual', 'Penalidades', 'Talleres'].includes(cat))
                                    .map(cat => {
                                        const name = typeof cat === 'object' ? cat.name : cat;
                                        return { value: name, label: name };
                                    })
                            ]}
                            required
                        />
                    </div>

                    <DropZone
                        label="Voucher de Pago"
                        file={formData.voucherFile}
                        onFileSelect={(file) => setFormData(prev => ({ ...prev, voucherFile: file }))}
                        helpText="Arrastra, pega o selecciona la foto del comprobante"
                    />

                    <Button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-bold mt-4"
                    >
                        Guardar Ingreso
                    </Button>
                </form>
            </Modal>
            {/* Voucher Preview Modal */}
            <Modal
                isOpen={!!previewVoucher}
                onClose={() => setPreviewVoucher(null)}
                title="Comprobante de Pago"
                size="xl"
            >
                <div className="flex flex-col items-center">
                    <div className="bg-gray-100 rounded-xl p-2 w-full flex items-center justify-center min-h-[400px]">
                        <img
                            src={previewVoucher}
                            alt="Voucher de pago"
                            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
                        />
                    </div>
                    <div className="mt-6 flex justify-center w-full">
                        <Button
                            variant="secondary"
                            onClick={() => window.open(previewVoucher, '_blank')}
                            className="flex items-center gap-2"
                        >
                            <Plus size={18} className="rotate-45" /> {/* Use as external link icon proxy or find another */}
                            Abrir en pestaña nueva
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default IncomeManager;
