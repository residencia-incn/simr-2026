import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Calendar, DollarSign, Settings, Layers, X, Trash2, Edit2, TrendingUp } from 'lucide-react';
import { Button, Card, FormField, LoadingSpinner } from '../ui';
import { showSuccess, showError, showConfirm } from '../../utils/alerts';
import { api } from '../../services/api';

const TreasurySettings = ({ config, accounts = [], onUpdateConfig, onInitializePlan, categories, onAddCategory, onDeleteCategory }) => {
    const [activeSection, setActiveSection] = useState('contributions');

    // Contribution Config State
    const [monthlyAmount, setMonthlyAmount] = useState(config?.contribution?.monthlyAmount || 50);
    const [startMonth, setStartMonth] = useState(config?.contribution?.startMonth || '2026-01');
    const [endMonth, setEndMonth] = useState(config?.contribution?.endMonth || '2026-06');
    const [defaultContributionAccount, setDefaultContributionAccount] = useState(config?.contribution?.defaultContributionAccount || '');

    // Inscription Config State
    const [defaultInscriptionAccount, setDefaultInscriptionAccount] = useState(config?.contribution?.defaultInscriptionAccount || '');

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (config) {
            setMonthlyAmount(config.contribution.monthlyAmount);
            setStartMonth(config.contribution.startMonth);
            setEndMonth(config.contribution.endMonth);
            setDefaultContributionAccount(config.contribution.defaultContributionAccount || '');
            setDefaultInscriptionAccount(config.contribution.defaultInscriptionAccount || '');
        }
    }, [config]);

    const generateMonthsArray = (start, end) => {
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
            const lastDay = new Date(year, month + 1, 0).getDate();
            const deadline = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;

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
            const months = generateMonthsArray(startMonth, endMonth);
            await onUpdateConfig({
                contribution: {
                    monthlyAmount: parseFloat(monthlyAmount),
                    startMonth,
                    endMonth,
                    months,
                    defaultContributionAccount,
                    defaultInscriptionAccount
                }
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Aportes Configuration */}
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Settings className="text-blue-600" size={20} />
                                Variables de Aportes
                            </h3>
                            <form onSubmit={handleSaveConfig} className="space-y-4">
                                <FormField
                                    label="Cuota Mensual (S/)"
                                    type="number"
                                    value={monthlyAmount}
                                    onChange={(e) => setMonthlyAmount(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    required
                                />
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

                                <div className="pt-2 border-t mt-4">
                                    <h4 className="text-sm font-bold text-gray-900 mb-3 block">Configuración de Inscripciones</h4>
                                    <FormField
                                        label="Cuenta Destino (Inscripciones)"
                                        type="select"
                                        value={defaultInscriptionAccount}
                                        onChange={(e) => setDefaultInscriptionAccount(e.target.value)}
                                        options={[
                                            { value: "", label: "Seleccionar cuenta..." },
                                            ...accounts.map(acc => ({ value: acc.id, label: acc.nombre }))
                                        ]}
                                        helpText="Cuenta donde se registrarán las inscripciones aprobadas."
                                    />
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                        disabled={saving}
                                    >
                                        {saving ? <LoadingSpinner size="sm" /> : <><Save size={18} className="mr-2" /> Guardar Cambios</>}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="p-6 bg-amber-50 border-amber-200">
                            <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                                <RefreshCw className="text-amber-600" size={20} />
                                Acciones Críticas
                            </h3>
                            <p className="text-sm text-amber-800 mb-6">
                                Al cambiar el rango de meses o el monto de aportes, debes reinicializar el plan para que los cambios se apliquen a todos los miembros.
                                <strong> ¡Cuidado!</strong> Al reinicializar, se perderán los registros de pagos marcados en el plan actual (aunque las transacciones en el historial se mantienen).
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

const IMMUTABLE_CATEGORIES = ['Inscripciones', 'Aportes'];

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

    const saveEditing = (oldName) => {
        if (!editValue.trim() || editValue === oldName) {
            cancelEditing();
            return;
        }
        onRename(oldName, editValue.trim());
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
                                        className="flex-1 px-2 py-1 text-sm border rounded shadow-sm outline-none focus:ring-1 focus:ring-blue-500"
                                        autoFocus
                                    />
                                    <button onClick={() => saveEditing(cat)} className="text-green-600 hover:text-green-700">
                                        <Save size={16} />
                                    </button>
                                    <button onClick={cancelEditing} className="text-gray-400 hover:text-gray-600">
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
