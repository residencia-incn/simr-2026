import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Calendar, FileText, ArrowDownRight, Tag } from 'lucide-react';
import { Button, Card, Table, FormField, Modal, DropZone } from '../ui';
import { showSuccess, showError } from '../../utils/alerts';

const ExpenseManager = ({
    transactions = [],
    accounts = [],
    categories = { expense: [] },
    onExpenseSubmit
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    // Initial Form State
    const initialFormState = {
        description: '',
        amount: '',
        accountId: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        voucherFile: null
    };

    const [formData, setFormData] = useState(initialFormState);

    // Handle form changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Filter and normalize expenses
    const allExpenses = useMemo(() => {
        return transactions
            .filter(t => t.type === 'expense')
            .map(t => {
                const categoryName = typeof t.category === 'object' ? t.category.name : (t.category || 'Varios');
                return {
                    ...t,
                    categoryLabel: categoryName,
                    amount: Math.abs(parseFloat(t.amount || 0))
                };
            });
    }, [transactions]);

    // Handle Sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filtered Expenses
    const filteredExpenses = useMemo(() => {
        let result = allExpenses.filter(exp => {
            const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || exp.categoryLabel === selectedCategory;

            const expDate = new Date(exp.date);
            const matchesStart = !startDate || expDate >= new Date(startDate);
            const matchesEnd = !endDate || expDate <= new Date(endDate);

            return matchesSearch && matchesCategory && matchesStart && matchesEnd;
        });

        // Apply Sorting
        return result.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allExpenses, searchTerm, selectedCategory, startDate, endDate, sortConfig]);

    // Submit Handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = new FormData();
            submitData.append('descripcion', formData.description);
            submitData.append('monto', Math.abs(parseFloat(formData.amount)));
            submitData.append('cuenta_id', formData.accountId);
            submitData.append('categoria', formData.category);
            submitData.append('fecha', formData.date);
            submitData.append('type', 'expense');

            if (formData.voucherFile) {
                submitData.append('voucher', formData.voucherFile);
            }

            await onExpenseSubmit(submitData);
            setIsModalOpen(false);
            setFormData(initialFormState);
        } catch (error) {
            showError(error.message || 'Error al registrar egreso');
        }
    };

    const columns = [
        {
            header: 'Fecha',
            key: 'date',
            sortable: true,
            render: (exp) => (
                <div className="text-sm">
                    {new Date(exp.date).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
            )
        },
        {
            header: 'Descripción',
            key: 'description',
            sortable: true,
            className: 'font-medium text-gray-900'
        },
        {
            header: 'Categoría',
            key: 'categoryLabel',
            sortable: true,
            render: (exp) => (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    {exp.categoryLabel}
                </span>
            )
        },
        {
            header: 'Monto',
            key: 'amount',
            sortable: true,
            tdClassName: 'text-right font-bold text-red-600',
            render: (exp) => `S/ ${exp.amount.toFixed(2)}`
        },
        {
            header: 'Comprobante',
            key: 'voucher',
            className: 'text-center',
            render: (exp) => exp.voucher ? (
                <button
                    onClick={() => window.open(exp.voucher, '_blank')}
                    className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    title="Ver Comprobante"
                >
                    <FileText size={16} />
                </button>
            ) : (
                <span className="text-gray-300 text-xs">-</span>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header / Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ArrowDownRight className="text-red-600" />
                        Gestión de Egresos
                    </h2>
                    <p className="text-gray-500 text-sm">Registro y control de gastos administrativos</p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 shadow-sm"
                >
                    <Plus size={20} /> Registrar Egreso
                </Button>
            </div>

            {/* Filters */}
            <Card className="p-4 bg-gray-50 border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar egreso..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-400" />
                        <select
                            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="all">Todas las categorías</option>
                            {categories.expense.map(cat => {
                                const name = typeof cat === 'object' ? cat.name : cat;
                                return <option key={name} value={name}>{name}</option>;
                            })}
                        </select>
                    </div>

                    <div className="md:col-span-2 flex items-center gap-2">
                        <Calendar size={18} className="text-gray-400" />
                        <div className="flex items-center gap-2 flex-1">
                            <input
                                type="date"
                                className="flex-1 p-2 border rounded-lg text-sm bg-white"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <span className="text-gray-400">a</span>
                            <input
                                type="date"
                                className="flex-1 p-2 border rounded-lg text-sm bg-white"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Table */}
            <Card className="overflow-hidden border-gray-100 shadow-sm">
                <Table
                    columns={columns}
                    data={filteredExpenses}
                    onSort={handleSort}
                    sortConfig={sortConfig}
                    emptyMessage="No se encontraron egresos registrados"
                />
            </Card>

            {/* Modal de Registro */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Registrar Nuevo Egreso"
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        label="Descripción del Egreso"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Ej: Pago de servicios, Materiales, etc."
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
                            step="0.01"
                            min="0.01"
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
                            label="Cuenta de Origen"
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
                                ...categories.expense.map(cat => {
                                    const name = typeof cat === 'object' ? cat.name : cat;
                                    return { value: name, label: name };
                                })
                            ]}
                            required
                        />
                    </div>

                    <DropZone
                        label="Comprobante de Pago (Opcional)"
                        file={formData.voucherFile}
                        onFileSelect={(file) => setFormData(prev => ({ ...prev, voucherFile: file }))}
                        helpText="Sube o pega la foto de la boleta, factura o recibo"
                    />

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-lg font-bold shadow-md"
                        >
                            Guardar Egreso
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ExpenseManager;
