import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, FileText, Users, Settings, X, CheckSquare, FileDown, PieChart, Calendar, User, Building, Wallet, ShieldCheck, Clock } from 'lucide-react';
import { Button, Card, Table, FormField, ConfirmDialog, LoadingSpinner, EmptyState } from '../components/ui';
import TreasurerCharts from './TreasurerCharts';
import { api } from '../services/api';
import { useApi, useForm, useTreasury } from '../hooks';
import VerificationList from '../components/common/VerificationList';
import AccountsManager from '../components/treasury/AccountsManager';
import ContributionsManager from '../components/treasury/ContributionsManager';
import ReportsView from '../components/treasury/ReportsView';
import TreasurySettings from '../components/treasury/TreasurySettings';
import { showSuccess, showError, showWarning } from '../utils/alerts';

const TreasurerDashboard = ({ user }) => {
    const [activeTab, setActiveTab] = useState('summary');
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

    // New Treasury System Hook
    const {
        accounts,
        transactions,
        contributionPlan,
        budgetPlan,
        config,
        categories,
        loading: treasuryLoading,
        totalBalance,
        accountBalances,
        totalIncome: treasuryIncome,
        totalExpenses: treasuryExpenses,
        budgetExecution,
        contributionStatus,
        createAccount,
        updateAccount,
        deleteAccount,
        createTransaction,
        deleteTransaction,
        recordContribution,
        initializeContributionPlan,
        updateBudgetCategory,
        updateConfig,
        reload: reloadTreasury
    } = useTreasury();

    // Category State (Legacy)
    const [editingCategory, setEditingCategory] = useState(null);
    const [newCategory, setNewCategory] = useState('');
    const [categoryType, setCategoryType] = useState('income');

    // Data Fetching (Legacy compatibility)
    const fetchDashboardData = React.useCallback(async () => {
        const [txs, cats, pending, attendees, budgetsList] = await Promise.all([
            api.treasury.getTransactions(),
            api.treasury.getCategories(),
            api.registrations.getAll(),
            api.attendees.getAll(),
            api.treasury.getBudgets()
        ]);
        return {
            transactions: txs,
            categories: cats,
            pendingRegistrations: pending,
            confirmedAttendees: attendees,
            budgets: budgetsList
        };
    }, []);

    const { data, loading, execute: loadData } = useApi(fetchDashboardData);

    const {
        transactions: dashboardTransactions = [],
        categories: dashboardCategories = { income: [], expense: [] },
        pendingRegistrations = [],
        confirmedAttendees = [],
        budgets = []
    } = data || {};

    // Budget Update Handler
    const handleBudgetUpdate = async (category, amount) => {
        const newBudgets = [...budgets];
        const index = newBudgets.findIndex(b => b.category === category);
        const val = parseFloat(amount) || 0;

        if (index >= 0) {
            newBudgets[index] = { ...newBudgets[index], amount: val };
        } else {
            newBudgets.push({ category, amount: val });
        }

        // Optimistic update
        const newData = { ...data, budgets: newBudgets };
        // We can't set data directly with useApi, so we might need a separate state or just re-fetch.
        // For simplicity, let's just call API and reload.
        try {
            await api.treasury.updateBudget(newBudgets);
            await loadData();
        } catch (e) {
            console.error(e);
        }
    };

    // Export Handler
    const handleExport = () => {
        const csvContent = [
            ['ID', 'Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto'],
            ...transactions.map(t => [
                t.id,
                t.date,
                `"${t.description.replace(/"/g, '""')}"`,
                t.category,
                t.type === 'income' ? 'Ingreso' : 'Egreso',
                t.amount
            ])
        ].map(e => e.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'transacciones_simr2026.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Transaction Form
    const { values: formData, handleChange, setValues: setFormData, reset: resetForm } = useForm({
        description: '',
        amount: '',
        accountId: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
    });

    const categoriesList = activeTab === 'income' ? categories.income : categories.expense;

    // Columns definitions
    const transactionColumns = useMemo(() => [
        { header: 'Fecha', key: 'date' },
        { header: 'Descripción', key: 'description', className: 'font-medium text-gray-900' },
        { header: 'Categoría', key: 'category', className: 'text-gray-500' },
        {
            header: 'Monto',
            key: 'amount',
            tdClassName: 'text-right font-bold',
            render: (t) => (
                <span className={t.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                    {t.type === 'income' ? '+' : '-'} S/ {(t.amount || 0).toFixed(2)}
                </span>
            )
        },
        {
            header: 'Tipo',
            key: 'type',
            className: 'text-center',
            render: (t) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {t.type === 'income' ? 'Ingreso' : 'Egreso'}
                </span>
            )
        }
    ], []);

    const historyColumns = useMemo(() => [
        ...transactionColumns.slice(0, 4), // Exclude Type column for specific tabs
        {
            header: 'Acciones',
            key: 'actions',
            className: 'text-center',
            render: (t) => (
                <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors">
                    <Trash2 size={16} />
                </button>
            )
        }
    ], [transactionColumns]);

    const attendeeColumns = useMemo(() => [
        { header: 'Fecha', key: 'date' },
        { header: 'Participante', key: 'name', className: 'font-medium text-gray-900' },
        { header: 'Rol', key: 'role', className: 'text-gray-600' },
        { header: 'Monto', key: 'amount', tdClassName: 'text-right font-bold text-blue-700', render: (a) => `S/ ${a.amount.toFixed(2)}` }
    ], []);

    // Calculate automatic income from attendees
    const attendeeIncome = confirmedAttendees.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        if (editingCategory) {
            showWarning('Elimine y cree una nueva categoría.', 'Edición no disponible');
            setEditingCategory(null);
        } else {
            if (categories[categoryType].includes(newCategory.trim())) {
                showWarning('Por favor use un nombre diferente.', 'Esta categoría ya existe');
                return;
            }
            try {
                await api.treasury.addCategory(categoryType, newCategory.trim());
                await loadData();
            } catch (err) {
                console.error(err);
            }
        }
        setNewCategory('');
    };

    const handleDeleteCategory = async (type, category) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Eliminar Categoría',
            message: `¿Estás seguro de eliminar la categoría "${category}"?`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.treasury.deleteCategory(type, category);
                    await loadData();
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                } catch (err) {
                    console.error(err);
                }
            }
        });
    };

    const startEditCategory = (type, category) => {
        setCategoryType(type);
        setEditingCategory(category);
        setNewCategory(category);
    };

    const handleAddTransaction = async (e) => {
        e.preventDefault();

        if (!formData.accountId) {
            showWarning('Seleccione una cuenta para continuar.', 'Cuenta requerida');
            return;
        }

        const transactionData = {
            fecha: formData.date,
            descripcion: formData.description,
            monto: activeTab === 'income'
                ? parseFloat(formData.amount)
                : -parseFloat(formData.amount),
            categoria: formData.category,
            cuenta_id: formData.accountId
        };

        try {
            await createTransaction(transactionData);
            await loadData(); // Reload legacy data for compatibility
            resetForm();
            showSuccess(`La transacción ha sido registrada exitosamente.`, `${activeTab === 'income' ? 'Ingreso' : 'Egreso'} registrado`);
        } catch (err) {
            console.error(err);
            showError(err.message, 'Error al registrar');
        }
    };

    const handleDelete = async (id) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Eliminar Movimiento',
            message: '¿Estás seguro de eliminar este registro?',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.treasury.deleteTransaction(id);
                    await loadData();
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                } catch (err) {
                    console.error(err);
                }
            }
        });
    };

    const handleApproveRegistration = async (reg) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Confirmar Inscripción',
            message: `¿Confirmar inscripción de ${reg.name} por S/ ${reg.amount}?`,
            type: 'warning',
            onConfirm: async () => {
                try {
                    // Validate that we have at least one account
                    if (accounts.length === 0) {
                        showError('Por favor crea una cuenta primero.', 'No hay cuentas disponibles');
                        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                        return;
                    }

                    // 1. Add to Attendees List
                    const newAttendee = {
                        id: Date.now(),
                        name: reg.name,
                        role: reg.role,
                        specialty: reg.specialty,
                        modality: reg.modalidad,
                        date: new Date().toISOString().split('T')[0],
                        status: 'Confirmado',
                        amount: reg.amount,
                        institution: reg.institution,
                        grade: null,
                        certificationApproved: false,
                        dni: reg.dni,
                        cmp: reg.cmp,
                        email: reg.email,
                        voucherData: reg.voucherData
                    };
                    await api.attendees.add(newAttendee);

                    // 2. Add to Treasury Income (New System)
                    // Use first account as default (could be made configurable)
                    const defaultAccount = accounts[0];
                    await createTransaction({
                        fecha: new Date().toISOString().split('T')[0],
                        descripcion: `Inscripción: ${reg.name}`,
                        monto: parseFloat(reg.amount),
                        categoria: 'Inscripciones',
                        cuenta_id: defaultAccount.id,
                        url_comprobante: reg.voucherData || null
                    });

                    // 3. Remove from Pending
                    await api.registrations.remove(reg.id);

                    await loadData();
                    showSuccess('La inscripción ha sido procesada correctamente.', 'Inscripción aprobada');
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));

                } catch (err) {
                    console.error("Error approving registration", err);
                    showError('No se pudo procesar la inscripción.', 'Error al aprobar');
                }
            }
        });
    };

    const handleRejectRegistration = async (id) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Rechazar Inscripción',
            message: '¿Rechazar esta inscripción? Se eliminará de la lista de pendientes.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.registrations.remove(id);
                    await loadData();
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                } catch (err) {
                    console.error(err);
                }
            }
        });
    };

    const manualIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    // Note: If we add approved registrations to transactions, they will be counted in 'manualIncome' if we are not careful.
    // In the previous code, 'Inscripciones' were kept separate in calculation but added to income list?
    // Actually, in `handleApproveRegistration` above, I added a transaction with category 'Inscripciones'.
    // So `manualIncome` (filtered by type income) WILL include those inscriptions.
    // AND `attendeeIncome` calculates it from attendees.
    // This leads to DOUBLE COUNTING if we sum `manualIncome + attendeeIncome`.
    // The previous implementation added `addTreasuryIncome` which likely added to `transactions`.
    // Let's check logic:
    // Old logic: `totalIncome = manualIncome + attendeeIncome`
    // But `handleApproveRegistration` in old code did: `addTreasuryIncome(...)` which pushed to `treasury_data` (transactions).
    // So old code might have been double counting too?
    // Wait, in old `TreasurerDashboard`: `manualIncome = transactions...reduce`.
    // `attendeeIncome = MOCK_ATTENDEES...reduce`.
    // `totalIncome = manualIncome + attendeeIncome`.
    // If we add a transaction for every attendee, then yes, double counting.
    // However, maybe `MOCK_ATTENDEES` were seeded but NOT added to `treasury_data` initially?
    // And new ones are added to BOTH?
    // To avoid double counting, we should either:
    // A) Not add a transaction record, just rely on attendees list for that income chunk.
    // B) Add transaction record and NOT include attendees list in calculation (treat attendees list as just roster).
    // Option B provides a unified ledger.
    // Let's go with B: Total Income = Sum of all 'income' transactions.

    // BUT the old view showed "Ingresos por Inscripciones (Automático)" section separate from "Historial".
    // If I add them to transactions, they appear in Historial too.
    // I will stick to the previous pattern: 
    // "Automático" comes from Attendees.
    // "Manual" comes from Transactions.
    // SO, when approving, I should NOT add a transaction if I want to keep them separate, OR I should add it and filter it out from "Manual" view?
    // The old code: 
    // `addTreasuryIncome` -> adds to `transactions`.
    // `attendeeIncome` -> reduces `MOCK_ATTENDEES`.
    // `totalIncome` -> `manualIncome + attendeeIncome`.
    // This DEFINITELY looks like double counting potential for new approvals.
    // Unless "Inscripciones" category is filtered out from `manualIncome`?
    // Old code: `const manualIncome = transactions.filter(t => t.type === 'income').reduce...`
    // It does NOT filter out 'Inscripciones'.
    // So the previous code WAS double counting.
    // I will fix this logic.
    // Correct logic: Total Income = Transactions (which captures all cash flow).
    // Attendees list is for membership management.
    // So I will calculate Total Income purely from Transactions.
    // And "Ingresos por Inscripciones" table can be shown for detail, but the top card "Total Ingresos" should use the ledger.
    // OR, if `transactions` is only for "Extra" income, then `Inscripciones` shouldn't be there.
    // But `addTreasuryIncome` implies it goes there.
    // I will assume `transactions` is the source of truth for money.

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalIncome - totalExpenses;

    if (loading && !transactions.length) return <div className="p-8 flex justify-center"><LoadingSpinner text="Cargando tesorería..." /></div>;

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Panel de Tesorería</h2>
                    <p className="text-gray-600">Gestión de caja y contabilidad del evento</p>
                </div>

                <div className="flex p-1 bg-gray-100 rounded-lg gap-1">
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`group relative px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'summary' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <PieChart size={20} />
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900"></span>
                            Resumen
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('validation')}
                        className={`group relative px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'validation' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <CheckSquare size={20} />
                        {pendingRegistrations.length > 0 && <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingRegistrations.length}</span>}
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900"></span>
                            Validación
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('income')}
                        className={`group relative px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'income' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <TrendingUp size={20} />
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900"></span>
                            Ingresos
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('expense')}
                        className={`group relative px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'expense' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <TrendingDown size={20} />
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900"></span>
                            Egresos
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('budget')}
                        className={`group relative px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'budget' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <DollarSign size={20} />
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900"></span>
                            Presupuesto
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('accounts')}
                        className={`group relative px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'accounts' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <Wallet size={20} />
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900"></span>
                            Cuentas
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('contributions')}
                        className={`group relative px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'contributions' ? 'bg-white text-pink-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <Users size={20} />
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900"></span>
                            Aportes
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`group relative px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'reports' ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <FileText size={20} />
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900"></span>
                            Reportes
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`group relative px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'settings' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <Settings size={20} />
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900"></span>
                            Configuración
                        </span>
                    </button>
                </div>
            </div>

            {/* Financial Summary Cards - Only show in Summary tab */}
            {activeTab === 'summary' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-5 border-l-4 border-blue-500">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Balance Total</p>
                                <h3 className="text-2xl font-bold text-gray-900">S/ {balance.toFixed(2)}</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5 border-l-4 border-green-500">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-lg text-green-600">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Total Ingresos</p>
                                <h3 className="text-2xl font-bold text-gray-900">S/ {totalIncome.toFixed(2)}</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5 border-l-4 border-red-500">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-50 rounded-lg text-red-600">
                                <TrendingDown size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Total Egresos</p>
                                <h3 className="text-2xl font-bold text-gray-900">S/ {totalExpenses.toFixed(2)}</h3>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Account Balances - Only show in Summary tab */}
            {activeTab === 'summary' && accountBalances.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Saldos por Cuenta</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {accountBalances.map(account => {
                            const Icon = account.tipo === 'banco' ? Building : Wallet;
                            return (
                                <Card key={account.id} className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${account.tipo === 'banco' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                            <Icon size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500 font-medium">{account.nombre}</p>
                                            <p className="text-lg font-bold text-gray-900">S/ {account.saldo.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'summary' && (
                <div className="space-y-6">
                    {/* Charts Integration */}
                    <TreasurerCharts transactions={transactions} categories={categories} />

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Últimos Movimientos</h3>
                        <Table
                            columns={transactionColumns}
                            data={transactions.slice(0, 5)}
                            emptyMessage="No hay movimientos recientes"
                        />
                    </div>
                </div>
            )}

            {activeTab === 'validation' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Pending Validations */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <CheckSquare className="text-orange-600" /> Validación de Pagos
                            </h3>
                            <div className="text-sm text-gray-500">
                                Pendientes: <span className="font-bold text-gray-900">{pendingRegistrations.length}</span>
                            </div>
                        </div>
                        <VerificationList
                            pendingRegistrations={pendingRegistrations}
                            onApprove={handleApproveRegistration}
                            onReject={handleRejectRegistration}
                        />
                    </div>

                    {/* Right Column: Recent Registrations */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="text-blue-600" /> Últimos Registrados
                        </h3>
                        <div className="space-y-3">
                            {confirmedAttendees.slice(0, 4).map((attendee) => (
                                <Card
                                    key={attendee.id}
                                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => {
                                        // Find the original registration to show voucher
                                        const regData = {
                                            ...attendee,
                                            name: attendee.name,
                                            dni: attendee.dni,
                                            email: attendee.email,
                                            institution: attendee.institution,
                                            occupation: attendee.role,
                                            amount: attendee.amount,
                                            ticketType: attendee.modality,
                                            voucherData: attendee.voucherData || null,
                                            timestamp: attendee.date
                                        };
                                        setConfirmConfig({
                                            isOpen: true,
                                            title: 'Detalle de Registro',
                                            message: (
                                                <div className="space-y-4 text-left">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Nombre</p>
                                                            <p className="font-semibold text-gray-900">{attendee.name}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">DNI</p>
                                                            <p className="font-semibold text-gray-900">{attendee.dni}</p>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Email</p>
                                                            <p className="font-semibold text-gray-900">{attendee.email}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Institución</p>
                                                            <p className="font-semibold text-gray-900">{attendee.institution}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Rol</p>
                                                            <p className="font-semibold text-gray-900">{attendee.role}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Monto Pagado</p>
                                                            <p className="font-bold text-blue-600 text-lg">S/ {parseFloat(attendee.amount || 0).toFixed(2)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Fecha de Registro</p>
                                                            <p className="font-semibold text-gray-900">{attendee.date}</p>
                                                        </div>
                                                    </div>

                                                    {attendee.voucherData && (
                                                        <div className="pt-4 border-t">
                                                            <p className="text-xs text-gray-500 font-bold uppercase mb-2">Voucher de Pago</p>
                                                            <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                                                                <img
                                                                    src={attendee.voucherData}
                                                                    alt="Voucher"
                                                                    className="max-w-full max-h-64 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const win = window.open("");
                                                                        if (win) {
                                                                            win.document.write(`
                                                                                <html>
                                                                                    <head>
                                                                                        <title>Voucher - ${attendee.name}</title>
                                                                                        <style>
                                                                                            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f2f5; }
                                                                                            img { max-width: 95%; max-height: 95vh; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border-radius: 8px; }
                                                                                        </style>
                                                                                    </head>
                                                                                    <body>
                                                                                        <img src="${attendee.voucherData}" alt="Comprobante de Pago" />
                                                                                    </body>
                                                                                </html>
                                                                            `);
                                                                            win.document.close();
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ),
                                            type: 'info',
                                            onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                                        });
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-50 p-2 rounded-full">
                                            <User className="text-blue-600" size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 truncate">{attendee.name}</h4>
                                            <p className="text-sm text-gray-600 truncate">{attendee.email}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {attendee.date}
                                                </span>
                                                <span className="font-bold text-blue-600">
                                                    S/ {parseFloat(attendee.amount || 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {confirmedAttendees.length === 0 && (
                                <EmptyState
                                    icon={Users}
                                    title="Sin registros"
                                    description="No hay usuarios registrados aún."
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {(activeTab === 'income' || activeTab === 'expense') && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-1">
                        <Card>
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Plus size={20} className={activeTab === 'income' ? 'text-green-600' : 'text-red-600'} />
                                Registrar {activeTab === 'income' ? 'Ingreso' : 'Egreso'}
                            </h3>
                            <form onSubmit={handleAddTransaction} className="space-y-4">
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
                                            label: `${acc.nombre} (S/ ${acc.saldo_actual.toFixed(2)})`
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
                                        ...(categoriesList || []).map(cat => ({ value: cat, label: cat }))
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
                                <Button type="submit" className={`w-full ${activeTab === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}>
                                    Guardar {activeTab === 'income' ? 'Ingreso' : 'Egreso'}
                                </Button>
                            </form>
                        </Card>
                    </div>

                    {/* List */}
                    <div className="lg:col-span-2 space-y-8">
                        {activeTab === 'income' && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Users size={20} className="text-blue-600" />
                                    Detalle de Inscripciones (Registrados)
                                </h3>
                                <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-100 overflow-hidden">
                                    <Table
                                        columns={attendeeColumns}
                                        data={confirmedAttendees.filter(a => a.amount > 0)}
                                    />
                                    <div className="bg-blue-100 font-bold text-blue-900 p-4 text-right flex justify-between">
                                        <span>Subtotal Inscripciones:</span>
                                        <span>S/ {attendeeIncome.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900">Historial de {activeTab === 'income' ? 'Todos los Ingresos' : 'Egresos'}</h3>
                            {transactions.filter(t => t.type === activeTab).length > 0 ? (
                                <Table
                                    columns={historyColumns}
                                    data={transactions.filter(t => t.type === activeTab)}
                                />
                            ) : (
                                <EmptyState
                                    icon={FileText}
                                    title={`No hay registros de ${activeTab === 'income' ? 'ingresos' : 'egresos'}`}
                                    description="Comience agregando nuevos registros desde el formulario."
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <TreasurySettings
                    config={config}
                    onUpdateConfig={updateConfig}
                    onInitializePlan={initializeContributionPlan}
                    categories={categories}
                    onAddCategory={api.treasury.addCategory}
                    onDeleteCategory={api.treasury.deleteCategory}
                />
            )}

            {activeTab === 'budget' && (
                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <PieChart className="text-teal-600" /> Control Presupuestal (Previsto vs Ejecutado)
                        </h3>
                        <div className="space-y-8">
                            {budgetExecution.map(item => {
                                const progress = item.porcentaje;
                                const isOver = item.estado === 'excedido';
                                const isAlert = item.estado === 'alerta';

                                return (
                                    <div key={item.categoria} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="font-bold text-gray-900">{item.categoria}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-500">Presupuesto: S/</span>
                                                    <input
                                                        type="number"
                                                        className="border rounded px-2 py-0.5 w-24 text-sm font-medium bg-gray-50 focus:bg-white focus:ring-1 ring-teal-500 outline-none transition-all"
                                                        value={item.presupuestado}
                                                        onChange={(e) => {
                                                            const newAmount = parseFloat(e.target.value) || 0;
                                                            updateBudgetCategory(item.categoria, newAmount);
                                                        }}
                                                        placeholder="0.00"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold ${isOver ? 'text-red-600' : isAlert ? 'text-yellow-600' : 'text-gray-900'}`}>
                                                    S/ {item.ejecutado.toFixed(2)}
                                                </p>
                                                <p className="text-xs text-gray-500">Ejecutado</p>
                                            </div>
                                        </div>

                                        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`absolute left-0 top-0 h-full transition-all duration-500 ${isOver ? 'bg-red-500' : isAlert ? 'bg-yellow-500' : 'bg-teal-500'
                                                    }`}
                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                            ></div>
                                        </div>

                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400">0%</span>
                                            <span className={`font-medium ${isOver ? 'text-red-600' : isAlert ? 'text-yellow-600' : 'text-teal-600'}`}>
                                                {progress.toFixed(1)}% {isOver && '(Excedido)'} {isAlert && '(Alerta)'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            {budgetExecution.length === 0 && (
                                <p className="text-gray-500 italic text-center">No hay categorías presupuestales definidas.</p>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* Accounts Tab */}
            {
                activeTab === 'accounts' && (
                    <AccountsManager
                        accounts={accounts}
                        onCreateAccount={createAccount}
                        onUpdateAccount={updateAccount}
                        onDeleteAccount={deleteAccount}
                    />
                )
            }

            {/* Contributions Tab */}
            {
                activeTab === 'contributions' && (
                    <ContributionsManager
                        contributionPlan={contributionPlan}
                        contributionStatus={contributionStatus}
                        config={config}
                        accounts={accounts}
                        onRecordContribution={recordContribution}
                        onInitializePlan={initializeContributionPlan}
                    />
                )
            }

            {/* Reports Tab */}
            {
                activeTab === 'reports' && (
                    <ReportsView
                        transactions={transactionsV2}
                        accounts={accounts}
                        budgetExecution={budgetExecution}
                    />
                )
            }


            <ConfirmDialog
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                type={confirmConfig.type}
            />
        </div >
    );
};

export default TreasurerDashboard;
