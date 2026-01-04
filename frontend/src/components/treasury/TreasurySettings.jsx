import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Calendar, DollarSign, Settings, Layers, X, Trash2, Edit2, TrendingUp, Wallet } from 'lucide-react';
import { Button, Card, FormField, LoadingSpinner } from '../ui';
import { showSuccess, showError, showConfirm } from '../../utils/alerts';
import { api } from '../../services/api';

const TreasurySettings = ({ config, accounts = [], onUpdateConfig, onInitializePlan, categories, onAddCategory, onDeleteCategory }) => {
    const [activeSection, setActiveSection] = useState('contributions');

    // Contribution Config State
    const [monthlyAmount, setMonthlyAmount] = useState(config?.contribution?.monthlyAmount || 50);
    const [monthlyDeadlineDay, setMonthlyDeadlineDay] = useState(config?.contribution?.monthlyDeadlineDay || 5);
    const [startMonth, setStartMonth] = useState(config?.contribution?.startMonth || '2026-01');
    const [endMonth, setEndMonth] = useState(config?.contribution?.endMonth || '2026-06');
    const [defaultContributionAccount, setDefaultContributionAccount] = useState(config?.contribution?.defaultContributionAccount || '');

    // Inscription Config State - Now Multi-select
    const [inscriptionAccounts, setInscriptionAccounts] = useState(config?.contribution?.inscriptionAccounts || []);

    // Financial Assets Config State
    const [financialAssets, setFinancialAssets] = useState(config?.financialAssets || []);

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (config) {
            setMonthlyAmount(config.contribution.monthlyAmount);
            setMonthlyDeadlineDay(config.contribution.monthlyDeadlineDay || 5);
            setStartMonth(config.contribution.startMonth);
            setEndMonth(config.contribution.endMonth);
            setDefaultContributionAccount(config.contribution.defaultContributionAccount || '');
            setDefaultContributionAccount(config.contribution.defaultContributionAccount || '');
            setInscriptionAccounts(config.contribution.inscriptionAccounts || []);
            setFinancialAssets(config.financialAssets || []);
        }
    }, [config]);

    const generateMonthsArray = (start, end, deadlineDay) => {
        const months = [];
        const startDate = new Date(start + '-02'); // Use 02 to avoid timezone issues
        const endDate = new Date(end + '-02');

        let current = new Date(startDate);
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        while (current <= endDate) {
            const year = current.getFullYear();
            const month = current.getMonth();
            const id = `${year}-${String(month + 1).padStart(2, '0')}`;

            // Last day of month
            // Calculate deadline (Day X of the month)
            // If day is invalid (e.g. Feb 30), Date object auto-corrects to next month, which is fine, or we clamp it.
            // Better to clamp to last day of month.
            const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
            const dayToUse = Math.min(deadlineDay, lastDayOfMonth);
            const deadline = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayToUse).padStart(2, '0')}`;

            months.push({
                id,
                label: monthNames[month],
                deadline
            });

            current.setMonth(current.getMonth() + 1);
        }
        return months;
    };

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Validation: Prevent reducing period below active payments
            const currentPlan = await api.treasury.getContributionPlan();
            const activeContributions = currentPlan.filter(c => c.estado === 'pagado' || c.estado === 'validando');

            if (activeContributions.length > 0) {
                // Find latest month with activity (Lexicographical sort works for YYYY-MM)
                const sortedActive = activeContributions.sort((a, b) => b.mes.localeCompare(a.mes));
                const maxActiveMonth = sortedActive[0].mes;

                if (endMonth < maxActiveMonth) {
                    throw new Error(`No puedes reducir el periodo hasta ${endMonth} porque existen aportes registrados hasta ${maxActiveMonth}.`);
                }
            }

            const months = generateMonthsArray(startMonth, endMonth, parseInt(monthlyDeadlineDay));
            await onUpdateConfig({
                contribution: {
                    monthlyAmount: parseFloat(monthlyAmount),
                    monthlyDeadlineDay: parseInt(monthlyDeadlineDay),
                    startMonth,
                    endMonth,
                    months,
                    defaultContributionAccount,
                    inscriptionAccounts
                },
                financialAssets // Save the assets definitions
            });
            showSuccess('Configuración actualizada correctamente.', 'Configuración guardada');
        } catch (error) {
            showError(error.message, 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveSection('contributions')}
                    className={`pb-2 px-4 transition-all ${activeSection === 'contributions' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Aportes e Inscripciones
                </button>
                <button
                    onClick={() => setActiveSection('categories')}
                    className={`pb-2 px-4 transition-all ${activeSection === 'categories' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Categorías
                </button>
                <button
                    onClick={() => setActiveSection('maintenance')}
                    className={`pb-2 px-4 transition-all ${activeSection === 'maintenance' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Mantenimiento
                </button>
            </div>

            {activeSection === 'contributions' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Left Column: Definitions & Assets */}
                    <div className="space-y-6">
                        {/* 1. Variables de Aportes */}
                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Settings className="text-blue-600" size={20} />
                                Variables de Aportes
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        label="Cuota Mensual (S/)"
                                        type="number"
                                        value={monthlyAmount}
                                        onChange={(e) => setMonthlyAmount(e.target.value)}
                                        placeholder="0.00"
                                        step="0.01"
                                        required
                                    />
                                    <FormField
                                        label="Día Límite"
                                        type="number"
                                        value={monthlyDeadlineDay}
                                        onChange={(e) => setMonthlyDeadlineDay(e.target.value)}
                                        placeholder="Ej. 5"
                                        min="1"
                                        max="31"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        label="Mes Inicio"
                                        type="month"
                                        value={startMonth}
                                        onChange={(e) => setStartMonth(e.target.value)}
                                        required
                                    />
                                    <FormField
                                        label="Mes Fin"
                                        type="month"
                                        value={endMonth}
                                        onChange={(e) => setEndMonth(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button
                                    type="button"
                                    onClick={handleSaveConfig}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled={saving}
                                >
                                    {saving ? <LoadingSpinner size="sm" /> : <><Save size={18} className="mr-2" /> Guardar Variables</>}
                                </Button>
                            </div>
                        </Card>

                        {/* 2. Cuentas Financieras (Asset Definitions) */}
                        <Card className="p-6 border-t-4 border-t-purple-500">
                            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <Wallet className="text-purple-600" size={20} />
                                Cuentas Financieras
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Define aquí tus cuentas bancarias, billeteras digitales y cajas.
                            </p>

                            <FinancialAssetsManager
                                assets={financialAssets}
                                onChange={setFinancialAssets}
                            />
                        </Card>
                    </div>

                    {/* Right Column: Destinations & Actions */}
                    <div className="space-y-6">
                        {/* 3. Configuración de Destinos */}
                        <Card className="p-6 border-t-4 border-t-green-500">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <TrendingUp className="text-green-600" size={20} />
                                Destinos de Fondos
                            </h3>
                            <div className="space-y-4">
                                <FormField
                                    label="Cuenta Destino (Aportes)"
                                    type="select"
                                    value={defaultContributionAccount}
                                    onChange={(e) => setDefaultContributionAccount(e.target.value)}
                                    options={[
                                        { value: "", label: "Seleccionar cuenta..." },
                                        ...accounts.map(acc => ({ value: acc.id, label: acc.nombre }))
                                    ]}
                                    helpText="Cuenta donde se registrarán automáticamente los aportes."
                                />

                                {/* Multi-select for Inscription Accounts */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Cuentas Destino (Inscripciones)
                                    </label>
                                    <div className="p-3 border rounded-xl bg-gray-50 max-h-48 overflow-y-auto space-y-2">
                                        {accounts.length === 0 && <p className="text-sm text-gray-400 italic">No hay cuentas disponibles</p>}
                                        {accounts.map(acc => {
                                            const isSelected = inscriptionAccounts.includes(acc.id);
                                            return (
                                                <div key={acc.id} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`ins-acc-${acc.id}`}
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setInscriptionAccounts([...inscriptionAccounts, acc.id]);
                                                            } else {
                                                                setInscriptionAccounts(inscriptionAccounts.filter(id => id !== acc.id));
                                                            }
                                                        }}
                                                        className="rounded text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <label htmlFor={`ins-acc-${acc.id}`} className="text-sm text-gray-700 cursor-pointer select-none">
                                                        {acc.nombre} <span className="text-xs text-gray-500">({acc.tipo})</span>
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-gray-500">Selecciona las cuentas disponibles para recibir pagos de inscripción.</p>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button
                                    type="button"
                                    onClick={handleSaveConfig}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    disabled={saving}
                                >
                                    {saving ? <LoadingSpinner size="sm" /> : <><Save size={18} className="mr-2" /> Guardar Destinos</>}
                                </Button>
                            </div>
                        </Card>

                        {/* Actions */}
                        <Card className="p-6 bg-amber-50 border-amber-200">
                            <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                                <RefreshCw className="text-amber-600" size={20} />
                                Acciones Críticas
                            </h3>
                            <p className="text-sm text-amber-800 mb-6">
                                Al cambiar el rango de meses o el monto de aportes, debes reinicializar el plan.
                                <strong> ¡Cuidado!</strong> Se perderán los registros de pagos marcados en el plan actual.
                            </p>
                            <Button
                                variant="danger"
                                className="w-full"
                                onClick={async () => {
                                    const confirmed = await showConfirm(
                                        'Esto reseteará el estado de pagos en la matriz.',
                                        '¿Reinicializar plan de aportes?',
                                        { confirmText: 'Sí, reinicializar', confirmColor: '#dc2626' }
                                    );
                                    if (confirmed) {
                                        onInitializePlan();
                                    }
                                }}
                            >
                                <RefreshCw size={18} className="mr-2" />
                                Reinicializar Plan de Aportes
                            </Button>
                        </Card>
                    </div>
                </div>
            )}

            {activeSection === 'categories' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Categorías de Ingresos */}
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                            <Layers size={20} /> Ingresos
                        </h3>
                        <CategoryList
                            type="income"
                            items={categories.income}
                            onDelete={(cat) => onDeleteCategory('income', cat)}
                            onAdd={(cat) => onAddCategory('income', cat)}
                            onRename={(oldName, newName) => onRenameCategory('income', oldName, newName)}
                        />
                    </Card>

                    {/* Categorías de Egresos */}
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
                            <Layers size={20} /> Egresos
                        </h3>
                        <CategoryList
                            type="expense"
                            items={categories.expense}
                            onDelete={(cat) => onDeleteCategory('expense', cat)}
                            onAdd={(cat) => onAddCategory('expense', cat)}
                            onRename={(oldName, newName) => onRenameCategory('expense', oldName, newName)}
                        />
                    </Card>
                </div>
            )}

            {activeSection === 'maintenance' && (
                <div className="max-w-2xl mx-auto space-y-6">
                    <Card className="p-6 bg-blue-50 border-blue-200">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <RefreshCw className="text-blue-600" size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-blue-900 mb-2">
                                    Migración de Datos Antiguos a V2
                                </h3>
                                <p className="text-sm text-blue-800 mb-4 text-justify">
                                    Detecta y migra registros de versiones anteriores del sistema al nuevo formato V2 compatible con el Dashboard de Tesorería.
                                    Esto solucionará problemas de ingresos "invisibles" o datos que no aparecen en las listas.
                                    Al finalizar, los datos antiguos se limpiarán para evitar duplicados.
                                </p>
                                <Button
                                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={async () => {
                                        try {
                                            setSaving(true);
                                            const result = await api.treasury.migrateLegacyData();
                                            if (result.migrated > 0) {
                                                showSuccess(result.message, 'Migración Exitosa');
                                                // Trigger reload of data if possible
                                                if (onInitializePlan) onInitializePlan(); // Hacky reload or just ask user to refresh
                                            } else {
                                                showSuccess('No se encontraron datos antiguos para migrar.', 'Sistema al día');
                                            }
                                        } catch (e) {
                                            showError(e.message, 'Error de Migración');
                                        } finally {
                                            setSaving(false);
                                        }
                                    }}
                                >
                                    <RefreshCw size={18} className="mr-2" />
                                    Ejecutar Migración de Datos (Legacy)
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

const IMMUTABLE_CATEGORIES = ['Inscripciones', 'Aportes', 'Aporte Mensual', 'Penalidades', 'Talleres'];

const CategoryList = ({ type, items, onDelete, onAdd, onRename }) => {
    const [newCat, setNewCat] = useState('');
    const [editingCat, setEditingCat] = useState(null);
    const [editValue, setEditValue] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newCat.trim()) return;
        onAdd(newCat.trim());
        setNewCat('');
    };

    const startEditing = (cat) => {
        setEditingCat(cat);
        setEditValue(cat);
    };

    const cancelEditing = () => {
        setEditingCat(null);
        setEditValue('');
    };

    const saveEditing = async (oldName) => {
        if (!editValue.trim() || editValue === oldName) {
            cancelEditing();
            return;
        }
        await onRename(oldName, editValue.trim());
        cancelEditing();
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    placeholder="Nueva categoría..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <Button type="submit" size="sm" className="bg-gray-800 text-white">Añadir</Button>
            </form>
            <div className="grid grid-cols-1 gap-2">
                {items.map((cat) => {
                    const isImmutable = IMMUTABLE_CATEGORIES.includes(cat);
                    const isEditing = editingCat === cat;

                    return (
                        <div key={cat} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                            {isEditing ? (
                                <div className="flex-1 flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveEditing(cat);
                                            if (e.key === 'Escape') cancelEditing();
                                        }}
                                        className="flex-1 px-2 py-1 text-sm border rounded shadow-sm outline-none focus:ring-1 focus:ring-blue-500"
                                        autoFocus
                                    />
                                    <button type="button" onClick={() => saveEditing(cat)} className="text-green-600 hover:text-green-700">
                                        <Save size={16} />
                                    </button>
                                    <button type="button" onClick={cancelEditing} className="text-gray-400 hover:text-gray-600">
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span className={`text-sm font-medium ${isImmutable ? 'text-blue-700 italic' : 'text-gray-700'}`}>
                                        {cat} {isImmutable && <span className="text-[10px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded ml-2">Sistema</span>}
                                    </span>

                                    {!isImmutable && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEditing(cat)}
                                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                title="Editar nombre"
                                            >
                                                <TrendingUp size={14} className="rotate-90" /> {/* Edit icon replacement */}
                                            </button>
                                            <button
                                                onClick={() => onDelete(cat)}
                                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TreasurySettings;

const FinancialAssetsManager = ({ assets, onChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentAsset, setCurrentAsset] = useState(null);
    const [formData, setFormData] = useState({
        id: '',
        type: 'banco',
        subtype: '',
        name: '',
        number: '',
        cci: '',
        phone: ''
    });

    const ASSET_TYPES = [
        { value: 'banco', label: 'Cuenta Bancaria' },
        { value: 'billetera', label: 'Billetera Digital' },
        { value: 'efectivo', label: 'Efectivo / Caja' }
    ];

    const BANKS = ['BCP', 'Interbank', 'BBVA', 'Scotiabank', 'Banco de la Nación', 'Otro'];
    const WALLETS = ['Yape', 'Plin', 'Agora / OH!', 'Ligo', 'Otro'];

    const handleAddNew = () => {
        setFormData({
            id: '',
            type: 'banco',
            subtype: 'BCP',
            name: '',
            number: '',
            cci: '',
            phone: ''
        });
        setCurrentAsset(null);
        setIsEditing(true);
    };

    const handleEdit = (asset) => {
        setFormData({ ...asset });
        setCurrentAsset(asset);
        setIsEditing(true);
    };

    const handleDelete = (id) => {
        onChange(assets.filter(a => a.id !== id));
    };

    const handleSave = () => {
        // Validation
        if (!formData.name) return alert('El nombre es requerido'); // Simple alert for now or use toast

        const newAsset = {
            ...formData,
            id: currentAsset ? currentAsset.id : `asset-${Date.now()}`
        };

        if (currentAsset) {
            onChange(assets.map(a => a.id === currentAsset.id ? newAsset : a));
        } else {
            onChange([...assets, newAsset]);
        }
        setIsEditing(false);
    };

    const getLogoPlaceholder = (type, subtype) => {
        // Simple visual placeholder logic
        let color = 'bg-gray-200';
        let text = subtype ? subtype.substring(0, 2) : '??';

        if (subtype === 'BCP') { color = 'bg-orange-500 text-white'; text = 'BCP'; }
        if (subtype === 'Interbank') { color = 'bg-green-600 text-white'; text = 'IB'; }
        if (subtype === 'BBVA') { color = 'bg-blue-600 text-white'; text = 'BBVA'; }
        if (subtype === 'Yape') { color = 'bg-purple-600 text-white'; text = 'Y'; }
        if (subtype === 'Plin') { color = 'bg-cyan-500 text-white'; text = 'Plin'; }

        return (
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center font-bold text-xs shadow-sm`}>
                {text}
            </div>
        );
    };

    if (isEditing) {
        return (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 transition-all animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-800">{currentAsset ? 'Editar Cuenta' : 'Nueva Cuenta Financiera'}</h4>
                    <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Tipo de Activo</label>
                        <select
                            className="w-full p-2 border rounded-lg bg-white"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value, subtype: e.target.value === 'banco' ? 'BCP' : e.target.value === 'billetera' ? 'Yape' : '' })}
                        >
                            {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>

                    {formData.type === 'banco' && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Banco</label>
                                <select
                                    className="w-full p-2 border rounded-lg bg-white"
                                    value={formData.subtype}
                                    onChange={(e) => setFormData({ ...formData, subtype: e.target.value })}
                                >
                                    {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Nro. Cuenta</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.number}
                                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                        placeholder="000-000..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">CCI</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.cci}
                                        onChange={(e) => setFormData({ ...formData, cci: e.target.value })}
                                        placeholder="002-..."
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {formData.type === 'billetera' && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Billetera</label>
                                <select
                                    className="w-full p-2 border rounded-lg bg-white"
                                    value={formData.subtype}
                                    onChange={(e) => setFormData({ ...formData, subtype: e.target.value })}
                                >
                                    {WALLETS.map(w => <option key={w} value={w}>{w}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Nro. Celular</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="999..."
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Nombre Identificador</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded-lg"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: BCP Principal Soles"
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button onClick={handleSave} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                            {currentAsset ? 'Actualizar' : 'Agregar'}
                        </Button>
                        <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1">
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
                {assets.map(asset => (
                    <div key={asset.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            {getLogoPlaceholder(asset.type, asset.subtype)}
                            <div>
                                <p className="font-bold text-sm text-gray-900">{asset.name}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="capitalize">{asset.type} {asset.subtype}</span>
                                    {asset.number && <span>• {asset.number}</span>}
                                    {asset.phone && <span>• {asset.phone}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => handleEdit(asset)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(asset.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Button
                onClick={handleAddNew}
                className="w-full border-2 border-dashed border-gray-300 text-gray-500 hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50"
                variant="ghost"
            >
                <DollarSign size={18} className="mr-2" />
                Agregar Nueva Cuenta Financiera
            </Button>
        </div>
    );
};
