// Treasury API Section - To be inserted into api.js before auth section

// --- Treasury System (New) ---
treasury: {
    // ==========================================
    // CONFIGURATION
    // ==========================================
    getConfig: async () => {
        await delay();
        return storage.get(STORAGE_KEYS.TREASURY_CONFIG, TREASURY_CONFIG);
    },

        updateConfig: async (config) => {
            await delay();
            storage.set(STORAGE_KEYS.TREASURY_CONFIG, config);
            return config;
        },

            // ==========================================
            // ACCOUNTS MANAGEMENT
            // ==========================================
            getAccounts: async () => {
                await delay();
                return storage.get(STORAGE_KEYS.TREASURY_ACCOUNTS, INITIAL_ACCOUNTS);
            },

                addAccount: async (accountData) => {
                    await delay();
                    const accounts = storage.get(STORAGE_KEYS.TREASURY_ACCOUNTS, INITIAL_ACCOUNTS);
                    const newAccount = {
                        id: `acc-${Date.now()}`,
                        saldo_actual: 0,
                        createdAt: new Date().toISOString(),
                        ...accountData
                    };
                    storage.set(STORAGE_KEYS.TREASURY_ACCOUNTS, [...accounts, newAccount]);
                    return newAccount;
                },

                    updateAccount: async (accountId, updates) => {
                        await delay();
                        const accounts = storage.get(STORAGE_KEYS.TREASURY_ACCOUNTS, INITIAL_ACCOUNTS);
                        const updated = accounts.map(acc =>
                            acc.id === accountId ? { ...acc, ...updates, updatedAt: new Date().toISOString() } : acc
                        );
                        storage.set(STORAGE_KEYS.TREASURY_ACCOUNTS, updated);
                        return updated.find(acc => acc.id === accountId);
                    },

                        deleteAccount: async (accountId) => {
                            await delay();
                            // Check if account has transactions
                            const transactions = storage.get(STORAGE_KEYS.TREASURY_TRANSACTIONS_V2, INITIAL_TRANSACTIONS_V2);
                            const hasTransactions = transactions.some(tx => tx.cuenta_id === accountId);

                            if (hasTransactions) {
                                throw new Error('No se puede eliminar una cuenta con transacciones asociadas');
                            }

                            const accounts = storage.get(STORAGE_KEYS.TREASURY_ACCOUNTS, INITIAL_ACCOUNTS);
                            const updated = accounts.filter(acc => acc.id !== accountId);
                            storage.set(STORAGE_KEYS.TREASURY_ACCOUNTS, updated);
                            return true;
                        },

                            // ==========================================
                            // TRANSACTIONS V2 (WITH RELATIONS)
                            // ==========================================
                            getTransactionsV2: async () => {
                                await delay();
                                return storage.get(STORAGE_KEYS.TREASURY_TRANSACTIONS_V2, INITIAL_TRANSACTIONS_V2);
                            },

                                addTransactionV2: async (transactionData) => {
                                    await delay();
                                    const transactions = storage.get(STORAGE_KEYS.TREASURY_TRANSACTIONS_V2, INITIAL_TRANSACTIONS_V2);
                                    const accounts = storage.get(STORAGE_KEYS.TREASURY_ACCOUNTS, INITIAL_ACCOUNTS);

                                    // Validate account exists
                                    const account = accounts.find(acc => acc.id === transactionData.cuenta_id);
                                    if (!account) {
                                        throw new Error('Cuenta no encontrada');
                                    }

                                    const newTransaction = {
                                        id: `tx-${Date.now()}`,
                                        estado: 'validado',
                                        createdAt: new Date().toISOString(),
                                        ...transactionData
                                    };

                                    // Update account balance
                                    const updatedAccounts = accounts.map(acc =>
                                        acc.id === transactionData.cuenta_id
                                            ? { ...acc, saldo_actual: acc.saldo_actual + transactionData.monto }
                                            : acc
                                    );

                                    storage.set(STORAGE_KEYS.TREASURY_TRANSACTIONS_V2, [newTransaction, ...transactions]);
                                    storage.set(STORAGE_KEYS.TREASURY_ACCOUNTS, updatedAccounts);

                                    return newTransaction;
                                },

                                    deleteTransactionV2: async (transactionId) => {
                                        await delay();
                                        const transactions = storage.get(STORAGE_KEYS.TREASURY_TRANSACTIONS_V2, INITIAL_TRANSACTIONS_V2);
                                        const accounts = storage.get(STORAGE_KEYS.TREASURY_ACCOUNTS, INITIAL_ACCOUNTS);

                                        const transaction = transactions.find(tx => tx.id === transactionId);
                                        if (!transaction) {
                                            throw new Error('Transacción no encontrada');
                                        }

                                        // Revert account balance
                                        const updatedAccounts = accounts.map(acc =>
                                            acc.id === transaction.cuenta_id
                                                ? { ...acc, saldo_actual: acc.saldo_actual - transaction.monto }
                                                : acc
                                        );

                                        const updated = transactions.filter(tx => tx.id !== transactionId);
                                        storage.set(STORAGE_KEYS.TREASURY_TRANSACTIONS_V2, updated);
                                        storage.set(STORAGE_KEYS.TREASURY_ACCOUNTS, updatedAccounts);

                                        return true;
                                    },

                                        getTransactionsByAccount: async (accountId) => {
                                            await delay();
                                            const transactions = storage.get(STORAGE_KEYS.TREASURY_TRANSACTIONS_V2, INITIAL_TRANSACTIONS_V2);
                                            return transactions.filter(tx => tx.cuenta_id === accountId);
                                        },

                                            getTransactionsByDateRange: async (startDate, endDate) => {
                                                await delay();
                                                const transactions = storage.get(STORAGE_KEYS.TREASURY_TRANSACTIONS_V2, INITIAL_TRANSACTIONS_V2);
                                                return transactions.filter(tx => {
                                                    const txDate = new Date(tx.fecha);
                                                    return txDate >= new Date(startDate) && txDate <= new Date(endDate);
                                                });
                                            },

                                                // ==========================================
                                                // CONTRIBUTION PLAN
                                                // ==========================================
                                                getContributionPlan: async () => {
                                                    await delay();
                                                    return storage.get(STORAGE_KEYS.TREASURY_CONTRIBUTION_PLAN, INITIAL_CONTRIBUTION_PLAN);
                                                },

                                                    initializeContributionPlan: async () => {
                                                        await delay();
                                                        const config = storage.get(STORAGE_KEYS.TREASURY_CONFIG, TREASURY_CONFIG);
                                                        const committee = storage.get(STORAGE_KEYS.COMMITTEE, COMMITTEE_DATA);

                                                        // Extract all unique members from committee
                                                        const allMembers = [];
                                                        committee.forEach(group => {
                                                            group.members.forEach(member => {
                                                                if (!allMembers.find(m => m.id === member.id)) {
                                                                    allMembers.push({
                                                                        id: member.id,
                                                                        nombre: member.name,
                                                                        rol: group.role
                                                                    });
                                                                }
                                                            });
                                                        });

                                                        // Generate contribution plan
                                                        const plan = [];
                                                        allMembers.forEach(member => {
                                                            config.contribution.months.forEach(month => {
                                                                plan.push({
                                                                    id: `contrib-${member.id}-${month.id}`,
                                                                    organizador_id: member.id,
                                                                    organizador_nombre: member.nombre,
                                                                    organizador_rol: member.rol,
                                                                    mes: month.id,
                                                                    mes_label: month.label,
                                                                    monto_esperado: config.contribution.monthlyAmount,
                                                                    estado: 'pendiente',
                                                                    transaccion_id: null,
                                                                    deadline: month.deadline
                                                                });
                                                            });
                                                        });

                                                        storage.set(STORAGE_KEYS.TREASURY_CONTRIBUTION_PLAN, plan);

                                                        // Update budget plan with total expected contributions
                                                        const totalExpected = allMembers.length * config.contribution.months.length * config.contribution.monthlyAmount;
                                                        const budgetPlan = storage.get(STORAGE_KEYS.TREASURY_BUDGET_PLAN, INITIAL_BUDGET_PLAN);
                                                        const updatedBudget = budgetPlan.map(item =>
                                                            item.categoria === 'Aportes'
                                                                ? { ...item, presupuestado: totalExpected }
                                                                : item
                                                        );
                                                        storage.set(STORAGE_KEYS.TREASURY_BUDGET_PLAN, updatedBudget);

                                                        return plan;
                                                    },

                                                        recordContribution: async (organizadorId, mes, accountId, amount, comprobante = null) => {
                                                            await delay();
                                                            const plan = storage.get(STORAGE_KEYS.TREASURY_CONTRIBUTION_PLAN, INITIAL_CONTRIBUTION_PLAN);
                                                            const contrib = plan.find(c => c.organizador_id === organizadorId && c.mes === mes);

                                                            if (!contrib) {
                                                                throw new Error('Aporte no encontrado en el plan');
                                                            }

                                                            if (contrib.estado === 'pagado') {
                                                                throw new Error('Este aporte ya fue registrado');
                                                            }

                                                            // Create transaction
                                                            const transaction = {
                                                                fecha: new Date().toISOString().split('T')[0],
                                                                descripcion: `Aporte ${contrib.mes_label} - ${contrib.organizador_nombre}`,
                                                                monto: amount,
                                                                categoria: 'Aportes',
                                                                cuenta_id: accountId,
                                                                url_comprobante: comprobante,
                                                                estado: 'validado'
                                                            };

                                                            const newTx = await api.treasury.addTransactionV2(transaction);

                                                            // Update contribution plan
                                                            const updatedPlan = plan.map(c =>
                                                                c.id === contrib.id
                                                                    ? { ...c, estado: 'pagado', transaccion_id: newTx.id, fecha_pago: newTx.fecha }
                                                                    : c
                                                            );
                                                            storage.set(STORAGE_KEYS.TREASURY_CONTRIBUTION_PLAN, updatedPlan);

                                                            return {
                                                                contribution: updatedPlan.find(c => c.id === contrib.id),
                                                                transaction: newTx
                                                            };
                                                        },

                                                            getOrganizerContributions: async (organizadorId) => {
                                                                await delay();
                                                                const plan = storage.get(STORAGE_KEYS.TREASURY_CONTRIBUTION_PLAN, INITIAL_CONTRIBUTION_PLAN);
                                                                return plan.filter(c => c.organizador_id === organizadorId);
                                                            },

                                                                // ==========================================
                                                                // BUDGET PLAN
                                                                // ==========================================
                                                                getBudgetPlan: async () => {
                                                                    await delay();
                                                                    return storage.get(STORAGE_KEYS.TREASURY_BUDGET_PLAN, INITIAL_BUDGET_PLAN);
                                                                },

                                                                    updateBudgetCategory: async (categoria, presupuestado) => {
                                                                        await delay();
                                                                        const budgetPlan = storage.get(STORAGE_KEYS.TREASURY_BUDGET_PLAN, INITIAL_BUDGET_PLAN);
                                                                        const updated = budgetPlan.map(item =>
                                                                            item.categoria === categoria
                                                                                ? { ...item, presupuestado }
                                                                                : item
                                                                        );
                                                                        storage.set(STORAGE_KEYS.TREASURY_BUDGET_PLAN, updated);
                                                                        return updated.find(item => item.categoria === categoria);
                                                                    },

                                                                        // ==========================================
                                                                        // LEGACY COMPATIBILITY
                                                                        // ==========================================
                                                                        getTransactions: async () => {
                                                                            await delay();
                                                                            return storage.get(STORAGE_KEYS.TREASURY, INITIAL_TRANSACTIONS);
                                                                        },

                                                                            addTransaction: async (transaction) => {
                                                                                await delay();
                                                                                const current = storage.get(STORAGE_KEYS.TREASURY, INITIAL_TRANSACTIONS);
                                                                                storage.set(STORAGE_KEYS.TREASURY, [transaction, ...current]);
                                                                                return transaction;
                                                                            },

                                                                                deleteTransaction: async (id) => {
                                                                                    await delay();
                                                                                    const current = storage.get(STORAGE_KEYS.TREASURY, INITIAL_TRANSACTIONS);
                                                                                    const updated = current.filter(t => t.id !== id);
                                                                                    storage.set(STORAGE_KEYS.TREASURY, updated);
                                                                                    return true;
                                                                                },

                                                                                    getCategories: async () => {
                                                                                        await delay();
                                                                                        return storage.get(STORAGE_KEYS.TREASURY_CATEGORIES, DEFAULT_CATEGORIES);
                                                                                    },

                                                                                        addCategory: async (type, category) => {
                                                                                            await delay();
                                                                                            const categories = storage.get(STORAGE_KEYS.TREASURY_CATEGORIES, DEFAULT_CATEGORIES);
                                                                                            if (!categories[type].includes(category)) {
                                                                                                categories[type].push(category);
                                                                                                storage.set(STORAGE_KEYS.TREASURY_CATEGORIES, categories);
                                                                                            }
                                                                                            return categories;
                                                                                        },

                                                                                            deleteCategory: async (type, category) => {
                                                                                                await delay();
                                                                                                const categories = storage.get(STORAGE_KEYS.TREASURY_CATEGORIES, DEFAULT_CATEGORIES);
                                                                                                categories[type] = categories[type].filter(c => c !== category);
                                                                                                storage.set(STORAGE_KEYS.TREASURY_CATEGORIES, categories);
                                                                                                return categories;
                                                                                            },

                                                                                                getBudgets: async () => {
                                                                                                    await delay();
                                                                                                    return storage.get(STORAGE_KEYS.TREASURY_BUDGETS, INITIAL_BUDGETS);
                                                                                                },

                                                                                                    updateBudget: async (budgets) => {
                                                                                                        await delay();
                                                                                                        storage.set(STORAGE_KEYS.TREASURY_BUDGETS, budgets);
                                                                                                        return budgets;
                                                                                                    }
},
