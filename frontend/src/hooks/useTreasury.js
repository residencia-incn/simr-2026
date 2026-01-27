import { useState, useCallback, useMemo, useEffect } from 'react';
import { api } from '../services/api';

/**
 * Custom Hook para gestión centralizada del sistema de tesorería
 * Maneja cuentas, transacciones, aportes y presupuesto
 */
export const useTreasury = () => {
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [contributionPlan, setContributionPlan] = useState([]);
    const [budgetPlan, setBudgetPlan] = useState([]);
    const [config, setConfig] = useState(null);
    const [categories, setCategories] = useState({ income: [], expense: [] });
    const [fines, setFines] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Cargar todos los datos de tesorería
     */
    const loadTreasuryData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const results = await Promise.all([
                api.treasuryConfig.getAccounts(),
                api.treasury.getTransactionsV2(),
                api.organizerContributions.getMatrix(),
                api.treasury.getBudgetPlan(),
                api.treasuryConfig.getSettings(),
                api.treasury.getCategories(),
                api.organizerContributions.getConfig(),
                api.organizerContributions.getStats()
            ]);

            const [accs, txs, contribMatrix, budget, cfg, cats, accountingV2Config, statsData] = results;

            // Normalize accounts: map backend fields to UI fields if necessary
            // Backend BankAccount: { id, institution: { name, logo_url }, alias, holder_name, account_number, currency, saldo_actual (calculated?) }
            // UI expects: { id, type: 'bank'|'wallet', nombre (alias), saldo_actual, ... }
            const normalizedAccounts = accs.map(a => ({
                ...a,
                nombre: a.alias || a.holder_name,
                institutionName: a.institution?.name,
                institutionLogo: a.institution?.logo_url,
                type: a.institution?.type,
                saldo_actual: a.balance || 0,
                balance: a.balance || 0
            }));

            setAccounts(normalizedAccounts);

            // Normalize transactions from Spanish (storage) to English (UI)
            const normalizeTransaction = (tx) => ({
                id: tx.id,
                date: tx.fecha || tx.date,
                description: tx.descripcion || tx.description,
                amount: parseFloat(tx.monto !== undefined ? tx.monto : (tx.amount || 0)),
                category: tx.categoria || tx.category,
                accountId: tx.cuenta_id || tx.accountId,
                type: tx.type || (parseFloat(tx.monto || tx.amount || 0) >= 0 ? 'income' : 'expense'),
                // Keep original fields just in case
                ...tx
            });

            const txsNormalized = txs.map(normalizeTransaction);

            setTransactions(txsNormalized);
            setContributionPlan(contribMatrix);
            setBudgetPlan(budget);

            // --- MERGE & SYNTHESIZE CONFIG ---
            // Backend V2 only returns start_month/end_month. Frontend 'ContributionsManager' needs 'months' array.
            let synthesizedMonths = [];
            if (accountingV2Config && accountingV2Config.start_month && accountingV2Config.end_month) {
                // Parse manually to avoid JS Date timezone shifts (YYYY-MM-DD -> UTC -> Local can shift)
                const [sY, sM] = accountingV2Config.start_month.split('-').map(Number);
                const [eY, eM] = accountingV2Config.end_month.split('-').map(Number);

                const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                const shortNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                const deadlineDay = accountingV2Config.payment_deadline_day || 29;

                let currY = sY;
                let currM = sM; // 1-indexed
                const endVal = eY * 12 + eM;

                let safeCounter = 0;
                while ((currY * 12 + currM) <= endVal && safeCounter < 24) {
                    const mIndex = currM - 1; // 0-11

                    // Generate deadline string safely: YYYY-MM-DD
                    // Use last day of month if deadlineDay exceeds it (e.g., Feb 30 -> 28)
                    const lastDay = new Date(currY, currM, 0).getDate();
                    const day = Math.min(deadlineDay, lastDay);
                    const deadlineStr = `${currY}-${String(currM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                    synthesizedMonths.push({
                        id: shortNames[mIndex],
                        label: monthNames[mIndex],
                        deadline: deadlineStr
                    });

                    // Advance month
                    currM++;
                    if (currM > 12) {
                        currM = 1;
                        currY++;
                    }
                    safeCounter++;
                }
            }

            // Merge legacy config with V2 config and the synthesized months
            // Priority: V2 config > Legacy config
            setConfig({
                ...cfg,
                accountingV2: accountingV2Config,
                contribution: {
                    ...(cfg?.contribution || {}),
                    months: synthesizedMonths.length > 0 ? synthesizedMonths : (cfg?.contribution?.months || []),
                    monthlyAmount: accountingV2Config?.monthly_fee || cfg?.contribution?.monthlyAmount || 0
                }
            });

            setStats(statsData);

            // Fines are now inside the matrix items, but we can set global fines if needed 
            // for other legacy components. For now, empty as the matrix handles it.
            setFines([]);

            // Categorize categories for cleaner UI usage
            const categorizedCats = {
                income: Array.isArray(cats) ? cats.filter(c => c.type === 'income') : [],
                expense: Array.isArray(cats) ? cats.filter(c => c.type === 'expense') : []
            };
            setCategories(categorizedCats);

            // Fix: allFines was not defined. Using empty array as fines are handled in matrix now.
            // setFines([]); // Already set above
        } catch (err) {
            console.error('Error loading treasury data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Cargar datos al montar el componente
     */
    useEffect(() => {
        loadTreasuryData();
    }, [loadTreasuryData]);

    // ==========================================
    // COMPUTED VALUES
    // ==========================================

    /**
     * Balance total (suma de todas las cuentas)
     */
    const totalBalance = useMemo(() =>
        accounts.reduce((sum, acc) => sum + (acc.saldo_actual || 0), 0)
        , [accounts]);

    /**
     * Saldos por cuenta
     */
    const accountBalances = useMemo(() =>
        accounts.map(acc => ({
            id: acc.id,
            nombre: acc.nombre,
            tipo: acc.tipo,
            saldo: acc.saldo_actual || 0
        }))
        , [accounts]);

    /**
     * Total de ingresos
     */
    const totalIncome = useMemo(() =>
        transactions
            .filter(tx => tx.type === 'income')
            .reduce((sum, tx) => sum + (tx.amount || 0), 0)
        , [transactions]);

    /**
     * Total de egresos
     */
    const totalExpenses = useMemo(() =>
        transactions
            .filter(tx => tx.type === 'expense')
            .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0)
        , [transactions]);

    /**
     * Ejecución presupuestal por categoría
     */
    const budgetExecution = useMemo(() => {
        return budgetPlan.map(item => {
            const ejecutado = transactions
                .filter(tx => (tx.category === item.categoria || tx.categoria === item.categoria) && tx.type === 'expense')
                .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

            const porcentaje = item.presupuestado > 0
                ? (ejecutado / item.presupuestado) * 100
                : 0;

            return {
                ...item,
                ejecutado,
                diferencia: item.presupuestado - ejecutado,
                porcentaje: Math.round(porcentaje * 10) / 10,
                estado: porcentaje > 100 ? 'excedido' : porcentaje > 80 ? 'alerta' : 'normal'
            };
        });
    }, [budgetPlan, transactions]);

    /**
     * Estado de aportes por organizador
     */
    const contributionStatus = useMemo(() => {
        // Now contributionPlan IS the matrix from backend
        return contributionPlan.map(item => {
            // Ensure contributions have a monthId for consistent mapping
            const enhancedContributions = item.contributions.map(c => ({
                ...c,
                monthId: c.month // Assuming 'month' field exists and can be used as an ID
            }));

            return {
                organizador_id: item.id,
                organizador_nombre: item.name,
                total_esperado: enhancedContributions.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) +
                    item.penalties.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
                total_pagado: enhancedContributions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) +
                    item.penalties.filter(p => p.status === 'PAID').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
                total_due: parseFloat(item.total_due || 0),
                // Map by monthId for fast lookup
                meses: enhancedContributions.reduce((acc, c) => ({ ...acc, [c.monthId]: c.status === 'PENDIENTE' ? 'PENDING' : c.status }), {}),
                contributions: enhancedContributions.map(c => ({
                    ...c,
                    status: c.status === 'PENDIENTE' ? 'PENDING' : c.status
                })),
                penalties: item.penalties.map(p => ({
                    ...p,
                    status: p.status === 'PENDIENTE' ? 'PENDING' : p.status,
                    amount: parseFloat(p.amount || 0)
                }))
            };
        });
    }, [contributionPlan]);

    // ==========================================
    // ACCOUNT OPERATIONS
    // ==========================================

    /**
     * Crear nueva cuenta
     */
    const createAccount = useCallback(async (accountData) => {
        try {
            const newAccount = await api.treasury.addAccount(accountData);

            // Normalize for UI
            const normalizedAccount = {
                ...newAccount,
                nombre: newAccount.alias || newAccount.holder_name,
                institutionName: newAccount.institution?.name,
                institutionLogo: newAccount.institution?.logo_url,
                type: newAccount.institution?.type,
                saldo_actual: newAccount.balance || 0,
                balance: newAccount.balance || 0
            };

            setAccounts(prev => [...prev, normalizedAccount]);
            return normalizedAccount;
        } catch (err) {
            console.error('Error creating account:', err);
            throw err;
        }
    }, []);

    /**
     * Actualizar cuenta
     */
    const updateAccount = useCallback(async (accountId, updates) => {
        try {
            const updated = await api.treasury.updateAccount(accountId, updates);

            // Normalize the updated account to match the state format
            const normalizedUpdated = {
                ...updated,
                nombre: updated.alias || updated.holder_name,
                institutionName: updated.institution?.name,
                institutionLogo: updated.institution?.logo_url,
                type: updated.institution?.type,
                saldo_actual: updated.balance || 0,
                balance: updated.balance || 0
            };

            setAccounts(prev => prev.map(acc =>
                acc.id === accountId ? normalizedUpdated : acc
            ));
            return normalizedUpdated;
        } catch (err) {
            console.error('Error updating account:', err);
            throw err;
        }
    }, []);

    /**
     * Eliminar cuenta
     */
    const deleteAccount = useCallback(async (accountId) => {
        try {
            await api.treasury.deleteAccount(accountId);
            setAccounts(prev => prev.filter(acc => acc.id !== accountId));
        } catch (err) {
            console.error('Error deleting account:', err);
            throw err;
        }
    }, []);

    // ==========================================
    // TRANSACTION OPERATIONS
    // ==========================================

    /**
     * Crear nueva transacción
     */
    const createTransaction = useCallback(async (transactionData) => {
        try {
            const newTx = await api.treasury.addTransactionV2(transactionData);

            // Normalize for UI
            const normalizedTx = {
                id: newTx.id,
                date: newTx.fecha || newTx.date,
                description: newTx.descripcion || newTx.description,
                amount: parseFloat(newTx.monto !== undefined ? newTx.monto : (newTx.amount || 0)),
                category: newTx.categoria || newTx.category,
                accountId: newTx.cuenta_id || newTx.accountId,
                type: newTx.type || (newTx.monto >= 0 ? 'income' : 'expense'),
                ...newTx
            };

            setTransactions(prev => [normalizedTx, ...prev]);

            // Actualizar saldo de cuenta
            setAccounts(prev => prev.map(acc =>
                acc.id === newTx.cuenta_id
                    ? { ...acc, saldo_actual: acc.saldo_actual + newTx.monto }
                    : acc
            ));

            return normalizedTx;
        } catch (err) {
            console.error('Error creating transaction:', err);
            throw err;
        }
    }, []);

    /**
     * Eliminar transacción
     */
    const deleteTransaction = useCallback(async (transactionId) => {
        try {
            const tx = transactions.find(t => t.id === transactionId);
            if (!tx) throw new Error('Transaction not found');

            await api.treasury.deleteTransactionV2(transactionId);

            setTransactions(prev => prev.filter(t => t.id !== transactionId));

            // Revertir saldo de cuenta
            setAccounts(prev => prev.map(acc =>
                acc.id === tx.cuenta_id
                    ? { ...acc, saldo_actual: acc.saldo_actual - tx.monto }
                    : acc
            ));
        } catch (err) {
            console.error('Error deleting transaction:', err);
            throw err;
        }
    }, [transactions]);

    // ==========================================
    // CONTRIBUTION OPERATIONS
    // ==========================================

    /**
     * Registrar aporte de organizador
     */
    const recordContribution = useCallback(async (organizadorId, mesesIds, accountId, totalAmount, voucher = null, isValidationRequest = false, penaltyIds = []) => {
        try {
            const result = await api.organizerContributions.pay({
                user_id: organizadorId,
                contribution_ids: mesesIds,
                penalty_ids: penaltyIds,
                amount: totalAmount,
                method: "TRANSFERENCIA",
                voucher: voucher // Ahora pasamos el archivo real
            });

            await loadTreasuryData();
            return result;
        } catch (err) {
            console.error('Error recording contribution:', err);
            throw err;
        }
    }, [loadTreasuryData]);

    /**
     * Validar/Aprobar aporte pendiente
     */
    const approveContribution = useCallback(async (organizadorId, meses, accountId) => {
        try {
            const result = await api.treasury.validateContribution(organizadorId, meses, accountId);
            await loadTreasuryData();
            return result;
        } catch (err) {
            console.error('Error approving contribution:', err);
            throw err;
        }
    }, [loadTreasuryData]);

    /**
     * Inicializar plan de aportes
     */
    const initializeContributionPlan = useCallback(async (year = 2026) => {
        try {
            const result = await api.organizerContributions.initializePlan(year);
            await loadTreasuryData();
            return result;
        } catch (err) {
            console.error('Error initializing contribution plan:', err);
            throw err;
        }
    }, [loadTreasuryData]);

    // ==========================================
    // BUDGET OPERATIONS
    // ==========================================

    /**
     * Actualizar presupuesto de categoría
     */
    const updateBudgetCategory = useCallback(async (categoria, presupuestado) => {
        try {
            const updated = await api.treasury.updateBudgetCategory(categoria, presupuestado);
            setBudgetPlan(prev => prev.map(item =>
                item.categoria === categoria
                    ? { ...item, presupuestado }
                    : item
            ));
            return updated;
        } catch (err) {
            console.error('Error updating budget:', err);
            throw err;
        }
    }, []);

    /**
     * Actualizar configuración de tesorería
     */
    const updateConfig = useCallback(async (newConfig) => {
        try {
            await api.treasury.saveConfig(newConfig);
            // Reload all data because saveConfig might have synchronized (changed) the contribution plan
            await loadTreasuryData();
            const updated = await api.treasury.getConfig(); // Redundant via loadTreasuryData but harmless, or we can just rely on loadTreasuryData
            return updated;
        } catch (err) {
            console.error('Error updating treasury config:', err);
            throw err;
        }
    }, [loadTreasuryData]);

    return {
        // Data
        accounts,
        transactions,
        contributionPlan,
        budgetPlan,
        config,
        categories,
        fines,
        loading,
        error,

        // Computed Values
        totalBalance,
        accountBalances,
        totalIncome,
        totalExpenses,
        budgetExecution,
        contributionStatus,
        stats,

        // Account Operations
        createAccount,
        updateAccount,
        deleteAccount,

        // Transaction Operations
        createTransaction,
        deleteTransaction,

        // Contribution Operations
        recordContribution,
        validateContribution: approveContribution, // Use internal wrapper to ensure reload
        rejectContribution: async (organizadorId, meses, reason) => {
            try {
                const result = await api.treasury.rejectContribution(organizadorId, meses, reason);
                await loadTreasuryData();
                return result;
            } catch (err) {
                console.error('Error rejecting contribution:', err);
                throw err;
            }
        },
        initializeContributionPlan,

        // Budget Operations
        updateBudgetCategory,
        updateConfig,

        setCategories,
        renameCategory: api.treasury.renameCategory,

        // Fine Operations
        recordFinePayment: useCallback(async (fineId, accountId, voucherUrl, notes) => {
            try {
                const result = await api.treasury.updateFineStatus(fineId, 'pagado', {
                    accountId,
                    notes,
                    voucher: voucherUrl,
                    paidAt: new Date().toISOString()
                });
                await loadTreasuryData();
                return result;
            } catch (err) {
                console.error('Error recording fine payment:', err);
                throw err;
            }
        }, [loadTreasuryData]),

        // Reload
        reload: loadTreasuryData
    };
};
