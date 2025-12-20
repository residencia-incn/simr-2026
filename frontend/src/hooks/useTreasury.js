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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Cargar todos los datos de tesorería
     */
    const loadTreasuryData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [accs, txs, contrib, budget, cfg, cats] = await Promise.all([
                api.treasury.getAccounts(),
                api.treasury.getTransactionsV2(),
                api.treasury.getContributionPlan(),
                api.treasury.getBudgetPlan(),
                api.treasury.getConfig(),
                api.treasury.getCategories()
            ]);

            setAccounts(accs);
            setTransactions(txs);
            setContributionPlan(contrib);
            setBudgetPlan(budget);
            setConfig(cfg);
            setCategories(cats);
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
            .filter(tx => tx.monto > 0)
            .reduce((sum, tx) => sum + tx.monto, 0)
        , [transactions]);

    /**
     * Total de egresos
     */
    const totalExpenses = useMemo(() =>
        transactions
            .filter(tx => tx.monto < 0)
            .reduce((sum, tx) => sum + Math.abs(tx.monto), 0)
        , [transactions]);

    /**
     * Ejecución presupuestal por categoría
     */
    const budgetExecution = useMemo(() => {
        return budgetPlan.map(item => {
            const ejecutado = transactions
                .filter(tx => tx.categoria === item.categoria && tx.monto < 0)
                .reduce((sum, tx) => sum + Math.abs(tx.monto), 0);

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
        if (!contributionPlan.length || !config) return [];

        const organizerMap = new Map();

        contributionPlan.forEach(contrib => {
            if (!organizerMap.has(contrib.organizador_id)) {
                organizerMap.set(contrib.organizador_id, {
                    organizador_id: contrib.organizador_id,
                    organizador_nombre: contrib.organizador_nombre,
                    total_esperado: 0,
                    total_pagado: 0,
                    meses: {}
                });
            }

            const org = organizerMap.get(contrib.organizador_id);
            org.total_esperado += contrib.monto_esperado;
            if (contrib.estado === 'pagado') {
                org.total_pagado += contrib.monto_esperado;
            }
            org.meses[contrib.mes] = contrib.estado;
        });

        return Array.from(organizerMap.values());
    }, [contributionPlan, config]);

    // ==========================================
    // ACCOUNT OPERATIONS
    // ==========================================

    /**
     * Crear nueva cuenta
     */
    const createAccount = useCallback(async (accountData) => {
        try {
            const newAccount = await api.treasury.addAccount(accountData);
            setAccounts(prev => [...prev, newAccount]);
            return newAccount;
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
            setAccounts(prev => prev.map(acc =>
                acc.id === accountId ? updated : acc
            ));
            return updated;
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
            setTransactions(prev => [newTx, ...prev]);

            // Actualizar saldo de cuenta
            setAccounts(prev => prev.map(acc =>
                acc.id === newTx.cuenta_id
                    ? { ...acc, saldo_actual: acc.saldo_actual + newTx.monto }
                    : acc
            ));

            return newTx;
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
    const recordContribution = useCallback(async (organizadorId, mes, accountId, comprobante = null) => {
        try {
            if (!config) throw new Error('Treasury config not loaded');

            const result = await api.treasury.recordContribution(
                organizadorId,
                mes,
                accountId,
                config.contribution.monthlyAmount,
                comprobante
            );

            // Actualizar plan de aportes
            setContributionPlan(prev => prev.map(contrib =>
                contrib.organizador_id === organizadorId && contrib.mes === mes
                    ? { ...contrib, estado: 'pagado', transaccion_id: result.transaction.id }
                    : contrib
            ));

            // Actualizar transacciones
            setTransactions(prev => [result.transaction, ...prev]);

            // Actualizar saldo de cuenta
            setAccounts(prev => prev.map(acc =>
                acc.id === accountId
                    ? { ...acc, saldo_actual: acc.saldo_actual + result.transaction.monto }
                    : acc
            ));

            return result;
        } catch (err) {
            console.error('Error recording contribution:', err);
            throw err;
        }
    }, [config]);

    /**
     * Inicializar plan de aportes
     */
    const initializeContributionPlan = useCallback(async () => {
        try {
            const plan = await api.treasury.initializeContributionPlan();
            setContributionPlan(plan);
            return plan;
        } catch (err) {
            console.error('Error initializing contribution plan:', err);
            throw err;
        }
    }, []);

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
            const updated = await api.treasury.getConfig();
            setConfig(updated);
            return updated;
        } catch (err) {
            console.error('Error updating treasury config:', err);
            throw err;
        }
    }, []);

    return {
        // Data
        accounts,
        transactions,
        contributionPlan,
        budgetPlan,
        config,
        categories,
        loading,
        error,

        // Computed Values
        totalBalance,
        accountBalances,
        totalIncome,
        totalExpenses,
        budgetExecution,
        contributionStatus,

        // Account Operations
        createAccount,
        updateAccount,
        deleteAccount,

        // Transaction Operations
        createTransaction,
        deleteTransaction,

        // Contribution Operations
        recordContribution,
        initializeContributionPlan,

        // Budget Operations
        updateBudgetCategory,
        updateConfig,

        // Reload
        reload: loadTreasuryData
    };
};
