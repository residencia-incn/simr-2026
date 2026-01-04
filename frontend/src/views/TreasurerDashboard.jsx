import React, { useState, useMemo, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, FileText, Users, Settings, X, CheckSquare, FileDown, PieChart, Calendar, User, Building, Wallet, ShieldCheck, Clock, AlertCircle, RefreshCw, Search, Tag, Award } from 'lucide-react';
import { Button, Card, Table, FormField, ConfirmDialog, LoadingSpinner, EmptyState, Modal } from '../components/ui';
import TreasurerCharts from './TreasurerCharts';
import { api } from '../services/api';
import { useApi, useForm, useTreasury } from '../hooks';
import VerificationList from '../components/common/VerificationList';
import AccountsManager from '../components/treasury/AccountsManager';
import ContributionsManager from '../components/treasury/ContributionsManager';
import ReportsView from '../components/treasury/ReportsView';
import TreasurySettings from '../components/treasury/TreasurySettings';
import IncomeManager from '../components/treasury/IncomeManager';
import { showSuccess, showError, showConfirm, showWarning } from '../utils/alerts';




const TreasurerDashboard = ({ user }) => {
    const [activeTab, setActiveTab] = useState('summary');
    const [pricingConfig, setPricingConfig] = useState(null); // Dynamic Pricing
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

    // URL syncing for tabs
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);

        // Update URL
        const params = new URLSearchParams(window.location.search);
        params.set('tab', tabId);

        // Remove organizerId when switching away from contributions to keep URL clean
        if (tabId !== 'contributions') {
            params.delete('organizerId');
        }

        const newQuery = params.toString();
        const newUrl = window.location.pathname + (newQuery ? '?' + newQuery : '');
        window.history.pushState({}, '', newUrl);
    };

    // Handle initial tab from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && ['summary', 'income', 'expenses', 'reports', 'settings', 'contributions', 'accounts', 'verification'].includes(tab)) {
            setActiveTab(tab);
        }
    }, []);

    // Load Pricing Config
    useEffect(() => {
        const loadPricing = async () => {
            try {
                const config = await api.treasury.getPricing();
                setPricingConfig(config);
            } catch (err) {
                console.error("Failed to load pricing config", err);
            }
        };
        loadPricing();
    }, []);

    // New Treasury System Hook
    const {
        accounts = [],
        transactions = [],
        contributionPlan = [],
        budgetPlan = [],
        config = {},
        categories = { income: [], expense: [] },
        loading: treasuryLoading = false,
        totalBalance = 0,
        accountBalances = [],
        totalIncome: treasuryIncome = 0,
        totalExpenses: treasuryExpenses = 0,
        budgetExecution = [],
        contributionStatus = {},
        createAccount,
        updateAccount,
        deleteAccount,
        createTransaction,
        deleteTransaction,
        recordContribution,
        validateContribution,
        rejectContribution,
        initializeContributionPlan,
        updateBudgetCategory,
        updateConfig,
        reload: reloadTreasury,
        setCategories,
        recordFinePayment,
        error: treasuryError
    } = useTreasury();

    // Category State (Legacy)
    const [editingCategory, setEditingCategory] = useState(null);
    const [newCategory, setNewCategory] = useState('');
    const [categoryType, setCategoryType] = useState('income');
    const [showAllRegistrations, setShowAllRegistrations] = useState(false);
    const [registrationSearch, setRegistrationSearch] = useState('');

    // New Detail Modal States
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);

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

    const { data, loading, error, execute: loadData } = useApi(fetchDashboardData);

    const {
        transactions: dashboardTransactions = [],
        categories: dashboardCategories = { income: [], expense: [] },
        pendingRegistrations = [],
        confirmedAttendees = [],
        budgets = []
    } = data || {};

    // --- Validation Logic: Merge Registrations + Contributions ---
    const pendingContributions = useMemo(() => {
        if (!contributionPlan) return [];
        // Group by organizer and voucher timestamp (or ID)
        const groups = {};
        contributionPlan.filter(c => c.estado === 'validando').forEach(c => {
            const key = `${c.organizador_id}-${c.voucheredAt || 'novoucher'}`;
            if (!groups[key]) {
                groups[key] = {
                    id: key,
                    type: 'Contribution', // Marker
                    organizerId: c.organizador_id,
                    name: c.organizador_nombre,
                    voucheredAt: c.voucheredAt,
                    voucherData: c.comprobante,
                    months: [],
                    amount: 0,
                    mes_labels: [],

                    // Fields for VerificationList compatibility
                    dni: 'Organizador',
                    occupation: 'Comité Organizador',
                    institution: 'SIMR 2026',
                    modalidad: 'Aporte Mensual',
                    ticketType: null, // Use modalidad
                    email: '-'
                };
            }
            groups[key].months.push(c.mes);
            groups[key].mes_labels.push(c.mes_label);
            groups[key].amount += c.monto_esperado;
        });

        return Object.values(groups).map(g => ({
            ...g,
            details: `Meses: ${g.mes_labels.join(', ')}`
        }));
    }, [contributionPlan]);

    // Combine for display (Contributions first)
    const allPendingValidations = [...pendingContributions, ...pendingRegistrations];

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
                    {t.type === 'income' ? '+' : '-'} S/ {parseFloat(t.amount || 0).toFixed(2)}
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
        { header: 'Monto', key: 'amount', tdClassName: 'text-right font-bold text-blue-700', render: (a) => `S/ ${parseFloat(a.amount || 0).toFixed(2)}` }
    ], []);

    // Calculate automatic income from attendees
    const attendeeIncome = confirmedAttendees.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);

    // Combined list of all registrations (Inscriptions + Contributions)
    const allRegistrations = useMemo(() => {
        const inscriptions = confirmedAttendees.map(a => ({
            id: `INS-${a.id}`,
            type: 'Inscripción',
            name: a.name,
            secondary: a.role,
            details: a.institution,
            date: a.registrationDate || a.date || new Date().toISOString(),
            amount: parseFloat(a.amount || 0),
            voucher: a.voucherData || a.voucher,
            coupon: a.coupon || a.couponCode,
            original: a,
            isContribution: false
        }));

        // Valid contributions
        const contribs = Array.isArray(contributionPlan)
            ? contributionPlan
                .filter(c => (c.estado === 'validado' || c.estado === 'pagado') && c.comprobante)
                .map(c => ({
                    id: `CTR-${c.id}`,
                    type: 'Aporte',
                    name: c.organizador_nombre || 'Organizador',
                    secondary: c.mes_label,
                    details: 'Cuota Mensual',
                    date: c.fecha_pago || c.updated_at || new Date().toISOString(),
                    amount: parseFloat(c.monto || 0),
                    voucher: c.comprobante,
                    original: c,
                    isContribution: true
                }))
            : [];

        return [...inscriptions, ...contribs].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [confirmedAttendees, contributionPlan]);

    const filteredRegistrations = useMemo(() => {
        if (!registrationSearch.trim()) return allRegistrations;
        const query = registrationSearch.toLowerCase();
        return allRegistrations.filter(item =>
            item.name.toLowerCase().includes(query) ||
            (item.secondary && item.secondary.toLowerCase().includes(query)) ||
            (item.details && item.details.toLowerCase().includes(query))
        );
    }, [allRegistrations, registrationSearch]);

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

    const handleViewDetail = (item) => {
        setSelectedDetail(item);
        setDetailModalOpen(true);
        return;
        setConfirmConfig({
            isOpen: true,
            title: 'Detalle de Registro',
            message: (
                <div className="space-y-4 text-left">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Nombre</p>
                            <p className="font-semibold text-gray-900">{item.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Tipo</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.type === 'Aporte' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {item.type || 'Inscripción'}
                            </span>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Detalle / Email</p>
                            <p className="font-semibold text-gray-900 truncate" title={item.secondary || item.email}>
                                {item.secondary || item.details || item.email || '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Institución / Concepto</p>
                            <p className="font-semibold text-gray-900">{item.details || item.institution || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Monto Pagado</p>
                            <p className={`font-bold text-lg ${item.amount === 0 ? 'text-gray-500' : 'text-blue-600'}`}>
                                S/ {parseFloat(item.amount || 0).toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Fecha</p>
                            <p className="font-semibold text-gray-900">
                                {new Date(item.date).toLocaleString('es-PE', {
                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>

                    {item.amount === 0 ? (
                        <div className="pt-4 border-t">
                            <p className="text-xs text-gray-500 font-bold uppercase mb-2">Método de Validación</p>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-center gap-3">
                                <div className="p-2 bg-green-100 rounded-full text-green-600">
                                    <Tag size={24} />
                                </div>
                                <div className="text-center md:text-left">
                                    <p className="text-sm text-green-800 font-bold">CUPÓN / BECA APLICADA</p>
                                    <p className="text-xs text-green-600 mt-1">El monto es S/ 0.00 debido a un descuento.</p>
                                    <p className="text-xs font-mono font-bold text-green-700 mt-1 bg-green-200 px-2 py-0.5 rounded inline-block">
                                        {item.coupon || 'PROMOCIÓN'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="pt-4 border-t">
                            <p className="text-xs text-gray-500 font-bold uppercase mb-2">Voucher de Pago</p>
                            {item.voucher ? (
                                <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                                    <img
                                        src={item.voucher}
                                        alt="Voucher"
                                        className="max-w-full max-h-64 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const win = window.open("");
                                            if (win) {
                                                win.document.write(`
                                                <html>
                                                    <head>
                                                        <title>Voucher - ${item.name}</title>
                                                        <style>
                                                            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f2f5; }
                                                            img { max-width: 95%; max-height: 95vh; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border-radius: 8px; }
                                                        </style>
                                                    </head>
                                                    <body>
                                                        <img src="${item.voucher}" alt="Comprobante de Pago" />
                                                    </body>
                                                </html>
                                            `);
                                                win.document.close();
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500 text-sm">
                                    No se ha adjuntado un voucher digital.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ),
            type: 'info',
            onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
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


    // Dedicated handler for income modal
    const handleIncomeSubmit = async (data) => {
        try {
            await api.treasury.addTransactionV2({
                fecha: data.date || new Date().toISOString(),
                descripcion: data.description,
                monto: parseFloat(data.amount),
                categoria: data.category,
                cuenta_id: data.accountId,
                type: 'income'
            });
            await loadData();
            showSuccess('Ingreso registrado correctamente.');
        } catch (error) {
            console.error(error);
            showError(error.message, 'Error al registrar ingreso');
        }
    };

    // Dedicated handler for transfers
    // Dedicated handler for transfers
    const handleTransfer = async (fromId, toId, amount, description) => {
        try {
            await api.treasury.transfer(fromId, toId, amount, description);
            showSuccess('Transferencia realizada correctamente.');
            await Promise.all([
                loadData(),
                reloadTreasury() // Reload new treasury system data
            ]);
        } catch (error) {
            showError(error.message, 'Error en transferencia');
        }
    };

    const handleCreateAccount = async (accountData) => {
        if (!formData.accountId) {
            showWarning('Seleccione una cuenta para continuar.', 'Cuenta requerida');
            return;
        }

        const transactionData = {
            fecha: formData.date,
            descripcion: formData.description,
            monto: parseFloat(formData.amount), // Always positive for income
            categoria: formData.category,
            cuenta_id: formData.accountId,
            type: 'income' // Explicitly set type for filtering
        };

        try {
            await createTransaction(transactionData);
            await reloadTreasury(); // Reload treasury data to update transactions list
            await loadData(); // Reload legacy data for compatibility
            showSuccess('El ingreso ha sido registrado exitosamente.', 'Ingreso registrado');
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

    // Wrappers for TreasurySettings to ensure state updates
    const handleAddCategoryWrapper = async (type, category) => {
        try {
            const updatedCategories = await api.treasury.addCategory(type, category);
            setCategories(updatedCategories);
            showSuccess(`Categoría "${category}" agregada correctamente.`, 'Categoría Agregada');
        } catch (err) {
            console.error(err);
            showError('No se pudo agregar la categoría. ' + err.message, 'Error');
        }
    };

    const handleDeleteCategoryWrapper = async (type, category) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Eliminar Categoría',
            message: `¿Estás seguro de eliminar la categoría "${category}"?`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    const updatedCategories = await api.treasury.deleteCategory(type, category);
                    setCategories(updatedCategories);
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                    showSuccess(`Categoría "${category}" eliminada.`, 'Categoría Eliminada');
                } catch (err) {
                    console.error(err);
                    showError('No se pudo eliminar la categoría.', 'Error');
                }
            }
        });
    };

    const handleRenameCategoryWrapper = async (type, oldName, newName) => {
        try {
            await api.treasury.renameCategory(type, oldName, newName);
            await reloadTreasury(); // Force reload to ensure synchronization
            showSuccess(`Categoría renombrada a "${newName}".`, 'Éxito');
        } catch (err) {
            console.error(err);
            showError(err.message, 'Error al renombrar');
        }
    };

    const handleApproveRegistration = async (reg) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Confirmar Inscripción',
            message: `¿Confirmar inscripción de ${reg.name} por S/ ${reg.amount}?`,
            type: 'warning',
            onConfirm: async () => {
                try {
                    if (reg.type === 'Contribution') {
                        await validateContribution(reg.organizerId, reg.months, null); // Default account
                        showSuccess(`Aporte validado por S/ ${reg.amount.toFixed(2)}`, 'Aporte Validado');
                    } else {
                        // Validate that we have at least one account
                        if (accounts.length === 0) {
                            showError('Por favor crea una cuenta primero.', 'No hay cuentas disponibles');
                            setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                            return;
                        }
                        await api.registrations.approve(reg);
                    }

                    await Promise.all([
                        loadData(),
                        reloadTreasury()
                    ]);

                    if (reg.type !== 'Contribution') {
                        showSuccess('La inscripción ha sido procesada correctamente.', 'Inscripción aprobada');
                    }
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));

                } catch (err) {
                    console.error("Error approving:", err);
                    showError('No se pudo procesar la solicitud.', 'Error');
                }
            }
        });
    };

    const handleRejectRegistration = async (id) => {
        const item = allPendingValidations.find(i => i.id === id);

        setConfirmConfig({
            isOpen: true,
            title: item?.type === 'Contribution' ? 'Rechazar Aporte' : 'Rechazar Inscripción',
            message: item?.type === 'Contribution'
                ? '¿Rechazar este comprobante? El estado volverá a pendiente.'
                : '¿Rechazar esta inscripción? Se eliminará de la lista de pendientes.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    if (item?.type === 'Contribution') {
                        await rejectContribution(item.organizerId, item.months, 'Comprobante rechazado por tesorería');
                        showSuccess('El aporte ha sido rechazado.', 'Rechazado');
                    } else {
                        await api.registrations.remove(id);
                    }

                    await Promise.all([loadData(), reloadTreasury()]);
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                } catch (err) {
                    console.error(err);
                    showError('Error al rechazar.', 'Error');
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

    // Use centralized values from useTreasury to ensure consistency with ReportsView
    const totalIncome = treasuryIncome;
    const totalExpenses = treasuryExpenses;

    // Per user request, Balance Total MUST be Ingresos - Egresos.
    // NOTE: This might differ from 'totalBalance' (Sum of Accounts) if there are data integrity issues.
    const balance = totalIncome - totalExpenses;

    if (treasuryError || (error && !data && !loading)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="p-4 bg-red-50 rounded-full text-red-500 mb-4">
                    <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Error de Almacenamiento</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                    No se pudieron cargar todos los datos de tesorería. Esto suele ocurrir cuando el almacenamiento del navegador está lleno.
                    {treasuryError || error}
                </p>
                <div className="flex gap-4">
                    <Button variant="ghost" onClick={() => {
                        localStorage.clear();
                        window.location.reload();
                    }} className="text-red-600 hover:bg-red-50">
                        Limpiar Almacenamiento
                    </Button>
                    <Button onClick={() => window.location.reload()} className="flex items-center gap-2">
                        <RefreshCw size={18} />
                        Reintentar
                    </Button>
                </div>
            </div>
        );
    }

    if (loading && !transactions.length) return <div className="p-8 flex justify-center"><LoadingSpinner text="Cargando tesorería..." /></div>;

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Panel de Tesorería</h2>
                    <p className="text-gray-600">Gestión de caja y contabilidad del evento</p>
                </div>

                <div className="flex p-1 bg-gray-100 rounded-lg gap-1">
                    <button
                        onClick={() => handleTabChange('summary')}
                        className={`group relative px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'summary' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <PieChart size={20} />
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900"></span>
                            Resumen
                        </span>
                    </button>
                    <button
                        onClick={() => handleTabChange('validation')}
                        className={`group relative px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'validation' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <CheckSquare size={20} />
                        {allPendingValidations.length > 0 && <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{allPendingValidations.length}</span>}
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900"></span>
                            Validación
                        </span>
                    </button>
                    <button
                        onClick={() => handleTabChange('income-details')}
                        className={`group relative px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'income-details' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <TrendingUp size={18} />
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 bg-black text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
                            Ingresos
                            <div className="absolute left-1/2 -translate-x-1/2 -top-[6px] border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-black"></div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleTabChange('expense')}
                        className={`group relative px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'expense' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <TrendingDown size={20} />
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900"></span>
                            Egresos
                        </span>
                    </button>

                    <button
                        onClick={() => handleTabChange('accounts')}
                        className={`group relative px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'accounts' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <Wallet size={20} />
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900"></span>
                            Cuentas
                        </span>
                    </button>
                    <button
                        onClick={() => handleTabChange('contributions')}
                        className={`group relative px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'contributions' ? 'bg-white text-pink-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <Users size={20} />
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900"></span>
                            Aportes
                        </span>
                    </button>
                    <button
                        onClick={() => handleTabChange('reports')}
                        className={`group relative px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'reports' ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <FileText size={20} />
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900"></span>
                            Reportes
                        </span>
                    </button>
                    <button
                        onClick={() => handleTabChange('settings')}
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

            {/* Income Details Section */}
            {activeTab === 'income-details' && (
                <IncomeManager
                    transactions={transactions}
                    accounts={accounts}
                    confirmedAttendees={confirmedAttendees}
                    contributionStatus={contributionStatus}
                    categories={categories}
                    onIncomeSubmit={handleIncomeSubmit}
                />
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
                                Pendientes: <span className="font-bold text-gray-900">{allPendingValidations.length}</span>
                            </div>
                        </div>
                        <VerificationList
                            pendingRegistrations={allPendingValidations}
                            onApprove={handleApproveRegistration}
                            onReject={handleRejectRegistration}
                            pricingConfig={pricingConfig}
                        />
                    </div>

                    {/* Right Column: Recent Registrations */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Users className="text-blue-600" /> Últimos Registrados
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:bg-blue-50"
                                onClick={() => setShowAllRegistrations(true)}
                            >
                                Ver Todos
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {[...confirmedAttendees]
                                .sort((a, b) => new Date(b.registrationDate || b.date) - new Date(a.registrationDate || a.date))
                                .slice(0, 4).map((attendee) => (
                                    <Card
                                        key={attendee.id}
                                        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => {
                                            const item = {
                                                name: attendee.name,
                                                type: 'Inscripción',
                                                secondary: attendee.role,
                                                details: attendee.institution,
                                                date: attendee.registrationDate || attendee.date,
                                                amount: parseFloat(attendee.amount || 0),
                                                voucher: attendee.voucherData || attendee.voucher,
                                                coupon: attendee.coupon || attendee.couponCode,
                                                email: attendee.email,
                                                original: attendee // Pass full object for detail view
                                            };
                                            handleViewDetail(item);
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
                                                        {new Date(attendee.registrationDate || attendee.date).toLocaleString('es-PE', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
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

            {activeTab === 'expense' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-1">
                        <Card>
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Plus size={20} className="text-red-600" />
                                Registrar Egreso
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
                                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white">
                                    Guardar Egreso
                                </Button>
                            </form>
                        </Card>
                    </div>

                    {/* List */}
                    <div className="lg:col-span-2 space-y-8">


                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900">Historial de Egresos</h3>
                            {transactions.filter(t => t.type === activeTab).length > 0 ? (
                                <Table
                                    columns={historyColumns}
                                    data={transactions.filter(t => t.type === activeTab)}
                                />
                            ) : (
                                <EmptyState
                                    icon={FileText}
                                    title="No hay registros de egresos"
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
                    accounts={accounts}
                    onUpdateConfig={updateConfig}
                    onInitializePlan={initializeContributionPlan}
                    categories={categories}
                    onAddCategory={handleAddCategoryWrapper}
                    onDeleteCategory={handleDeleteCategoryWrapper}
                    onRenameCategory={handleRenameCategoryWrapper}
                />
            )}



            {/* Treasury Error Alert */}
            {treasuryError && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm flex items-start justify-between">
                    <div className="flex items-center">
                        <AlertCircle className="text-red-500 mr-2" size={20} />
                        <div>
                            <h3 className="text-red-800 font-bold text-sm">Error de Sistema de Tesorería</h3>
                            <p className="text-red-700 text-sm mt-1">{treasuryError}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Accounts Tab */}
            {
                activeTab === 'accounts' && (
                    <AccountsManager
                        key={transactions.length} // Force re-render on transaction change
                        accounts={accounts}
                        financialAssets={config?.financialAssets || []}
                        transactions={transactions}
                        onCreateAccount={createAccount}
                        onUpdateAccount={updateAccount}
                        onDeleteAccount={deleteAccount}
                        onTransfer={handleTransfer}
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
                        onApproveContribution={validateContribution}
                        onInitializePlan={initializeContributionPlan}
                        onReload={reloadTreasury}
                        onRecordFine={recordFinePayment}
                    />
                )
            }

            {/* Reports Tab */}
            {
                activeTab === 'reports' && (
                    <ReportsView
                        transactions={transactions}
                        accounts={accounts}
                        budgetExecution={budgetExecution}
                        user={user}
                        organizers={contributionStatus}
                        config={config}
                    />
                )
            }


            {/* All Registrations Modal */}
            <Modal
                isOpen={showAllRegistrations}
                onClose={() => setShowAllRegistrations(false)}
                title="Todos los Registros Confirmados"
                size="3xl"
            >
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 mb-4 justify-between items-center">
                        <div className="flex gap-4">
                            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium">
                                Total Registros: {filteredRegistrations.length}
                            </div>
                            <div className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm font-medium">
                                <span className="font-bold">Total Recaudado: S/ {filteredRegistrations.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                autoFocus
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                value={registrationSearch}
                                onChange={(e) => setRegistrationSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 max-h-[65vh] overflow-y-auto pr-2">
                        {filteredRegistrations.map((item) => (
                            <Card
                                key={item.id}
                                className="p-4 hover:shadow-md transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500 group"
                                onClick={() => handleViewDetail(item)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full shrink-0 ${item.type === 'Aporte' ? 'bg-purple-100 group-hover:bg-purple-200' : 'bg-blue-50 group-hover:bg-blue-100'} transition-colors`}>
                                        {item.type === 'Aporte' ? <DollarSign className="text-purple-600" size={24} /> : <User className="text-blue-600" size={24} />}
                                    </div>

                                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                        {/* Name and Basic Info */}
                                        <div className="md:col-span-5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-gray-900 text-base">{item.name}</h4>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${item.type === 'Aporte' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {item.type.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">{item.secondary}</p>
                                        </div>

                                        {/* Additional Details */}
                                        <div className="md:col-span-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1 mb-1">
                                                <span className="font-medium text-gray-700 block md:hidden">Detalle:</span>
                                                {item.details || '-'}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {new Date(item.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="md:col-span-3 text-right">
                                            <span className="font-bold text-lg text-blue-700 block">S/ {item.amount.toFixed(2)}</span>
                                            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                                Confirmado
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {filteredRegistrations.length === 0 && (
                            <div className="col-span-2 py-8 text-center text-gray-500">
                                {registrationSearch.trim() ? 'No se encontraron resultados para tu búsqueda.' : 'No se encontraron registros confirmados.'}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <Button variant="secondary" onClick={() => setShowAllRegistrations(false)}>
                            Cerrar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Detail Modal */}
            <Modal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                title="Detalle de Registro"
                size="3xl"
            >
                {selectedDetail && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Columna Izquierda: Voucher */}
                        <div className="flex flex-col h-full md:order-2">
                            <h4 className="font-bold text-gray-700 mb-2">Comprobante de Pago</h4>
                            {selectedDetail.amount === 0 ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex flex-col items-center justify-center gap-4 h-full min-h-[300px]">
                                    <div className="p-4 bg-green-100 rounded-full text-green-600">
                                        <Tag size={48} />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-lg font-bold text-green-800">CUPÓN APLICADO</h4>
                                        <p className="text-green-600 mt-2">Descuento del 100%</p>
                                        <div className="mt-4 px-4 py-2 bg-white rounded border border-green-200 font-mono font-bold text-lg text-green-700">
                                            {selectedDetail.coupon || 'PROMOCIÓN'}
                                        </div>
                                    </div>
                                </div>
                            ) : selectedDetail.voucher ? (
                                <div className="bg-gray-100 rounded-lg p-2 flex items-center justify-center h-full min-h-[300px] bg-opacity-50">
                                    <img
                                        src={selectedDetail.voucher}
                                        alt="Voucher"
                                        className="max-w-full max-h-[400px] object-contain rounded shadow-sm hover:scale-105 transition-transform cursor-zoom-in"
                                        onClick={() => window.open(selectedDetail.voucher, '_blank')}
                                    />
                                </div>
                            ) : (
                                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-8 h-full min-h-[300px] text-gray-400">
                                    <FileText size={48} className="mb-4 opacity-50" />
                                    <p>No hay voucher digital</p>
                                </div>
                            )}
                        </div>

                        {/* Columna Derecha: Datos */}
                        <div className="space-y-6 md:order-1">
                            <div>
                                <h4 className="text-xl font-bold text-gray-900 mb-1">{selectedDetail.name}</h4>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${selectedDetail.type === 'Aporte' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {selectedDetail.type}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Detalle / Email</p>
                                    <p className="font-semibold text-gray-900 break-all">{selectedDetail.secondary || selectedDetail.email || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Institución / Concepto</p>
                                    <p className="font-semibold text-gray-900">{selectedDetail.details || selectedDetail.institution || '-'}</p>
                                </div>
                                {console.log('SelectedDetail Debug:', selectedDetail)}

                                {/* Payment Breakdown Section */}
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                                    <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                        <Award size={14} className="text-orange-600" /> Detalle de Pago
                                    </p>

                                    {selectedDetail.original && (
                                        selectedDetail.original.ticketType ||
                                        selectedDetail.original.modalidad ||
                                        selectedDetail.original.modality ||
                                        (selectedDetail.original.workshops && selectedDetail.original.workshops.length > 0)
                                    ) ? (
                                        <>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-700 font-medium text-base">
                                                    Ticket: {(() => {
                                                        const type = selectedDetail.original.ticketType || selectedDetail.original.modalidad || selectedDetail.original.modality;
                                                        const option = pricingConfig?.ticketTypes?.find(t => t.id === type || t.key === type);
                                                        return option ? option.title : (type || 'Entrada General');
                                                    })()}
                                                </span>
                                                <span className="font-bold text-gray-900 text-base">
                                                    {(() => {
                                                        const type = selectedDetail.original.ticketType || selectedDetail.original.modalidad || selectedDetail.original.modality;
                                                        const option = pricingConfig?.ticketTypes?.find(t => t.id === type || t.key === type);

                                                        if (option) return `S/ ${option.price.toFixed(2)}`;

                                                        // Fallback: Calculate from total - workshops
                                                        if (selectedDetail.amount && selectedDetail.original.workshops && pricingConfig?.workshops) {
                                                            const wsTotal = selectedDetail.original.workshops.reduce((sum, wId) => {
                                                                const ws = pricingConfig.workshops.find(w => w.id === wId || w.key === wId);
                                                                return sum + (ws?.price || 0);
                                                            }, 0);
                                                            const ticketPart = selectedDetail.amount - wsTotal;
                                                            return `S/ ${ticketPart.toFixed(2)}`;
                                                        }
                                                        return '-';
                                                    })()}
                                                </span>
                                            </div>

                                            {selectedDetail.original.workshops && selectedDetail.original.workshops.length > 0 && (
                                                <div className="space-y-2 pt-2 border-t border-gray-200 mt-2">
                                                    <p className="text-xs font-bold text-gray-500 uppercase">Talleres Adicionales</p>
                                                    {selectedDetail.original.workshops.map(wsId => {
                                                        const ws = pricingConfig?.workshops?.find(w => w.id === wsId || w.key === wsId);
                                                        return (
                                                            <div key={wsId} className="flex justify-between items-center text-sm pl-2">
                                                                <span className="text-gray-700">• {ws ? ws.name : wsId}</span>
                                                                <span className="font-semibold text-gray-900">{ws ? `+ S/ ${ws.price.toFixed(2)}` : '-'}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-sm text-gray-500 italic">
                                            <p>Detalle no disponible para este tipo de registro.</p>
                                            <p className="text-xs mt-2 font-mono bg-gray-100 p-1 rounded break-all">
                                                Debug: {selectedDetail.original ? Object.keys(selectedDetail.original).filter(k => !['voucherData', 'image', 'paymentData'].includes(k)).join(', ') : 'No Data'}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200 mt-2">
                                        <span className="text-base font-bold text-gray-900">Total Pagado</span>
                                        <span className="text-2xl font-extrabold text-blue-600">S/ {selectedDetail.amount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-end">
                                        <p className="text-xs text-gray-500 font-semibold">
                                            Fecha: {new Date(selectedDetail.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 flex justify-end">
                                <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
                                    Cerrar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

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
