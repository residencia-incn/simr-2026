import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Calendar, DollarSign, Settings, Layers, X, Trash2, Edit2, TrendingUp, Wallet, Landmark, Smartphone, Upload, Image as ImageIcon, Plus } from 'lucide-react';
import { Button, Card, FormField, LoadingSpinner, ConfirmDialog } from '../ui';
import { showSuccess, showError, showConfirm } from '../../utils/alerts';
import { api } from '../../services/api';
import CategoriesTab from './config/CategoriesTab';
import InstitutionModal from './config/InstitutionModal';

const TreasurySettings = ({ onInitializePlan }) => {
    const [activeSection, setActiveSection] = useState('contributions');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Institution Modal State
    const [isInstitutionModalOpen, setIsInstitutionModalOpen] = useState(false);
    const [editingInstitution, setEditingInstitution] = useState(null);
    const [confirmDeleteInst, setConfirmDeleteInst] = useState({ isOpen: false, institution: null });

    // Contribution Config State (SystemSetting)
    const [contributionSettings, setContributionSettings] = useState({
        monthly_amount: 50,
        monthly_deadline_day: 5,
        start_month: '2026-01',
        end_month: '2026-06',
        default_contribution_account: '',
        inscription_accounts: [] // List of IDs
    });

    // Lists for Selection
    const [accounts, setAccounts] = useState([]);
    const [institutions, setInstitutions] = useState([]); // Financial Institutions (Banks/Wallets definitions)

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [settingsData, accountsData, institutionsData, accountingV2Config] = await Promise.all([
                api.treasuryConfig.getSettings(),
                api.treasuryConfig.getAccounts(),
                api.treasuryConfig.getInstitutions(),
                api.organizerContributions.getConfig()
            ]);

            // Response is already { key: value }, so we use it directly as settingsMap
            const settingsMap = settingsData || {};

            const tryParse = (val, defaultVal) => {
                if (val === undefined || val === null) return defaultVal;
                try {
                    const parsed = JSON.parse(val);
                    return parsed;
                } catch {
                    return val;
                }
            };

            setContributionSettings({
                monthly_amount: accountingV2Config.monthly_fee || 50,
                monthly_deadline_day: accountingV2Config.payment_deadline_day || 29,
                start_month: accountingV2Config.start_month.substring(0, 7) || '2026-01',
                end_month: accountingV2Config.end_month.substring(0, 7) || '2026-06',
                default_contribution_account: settingsMap.default_contribution_account || '',
                inscription_accounts: tryParse(settingsMap.inscription_accounts, [])
            });

            setAccounts(accountsData);
            setInstitutions(institutionsData);

        } catch (error) {
            console.error("Error loading settings", error);
            showError("Error al cargar la configuración");
        } finally {
            setLoading(false);
        }
    };

    const loadInstitutions = async () => {
        try {
            const data = await api.treasuryConfig.getInstitutions();
            setInstitutions(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await Promise.all([
                api.treasuryConfig.updateSettings(contributionSettings),
                api.organizerContributions.saveConfig({
                    year: parseInt(contributionSettings.start_month.split('-')[0]),
                    monthly_fee: contributionSettings.monthly_amount,
                    payment_deadline_day: contributionSettings.monthly_deadline_day,
                    start_month: `${contributionSettings.start_month}-01`,
                    end_month: `${contributionSettings.end_month}-01`
                })
            ]);
            showSuccess('Variables actualizadas correctamente.');
        } catch (error) {
            console.error(error);
            showError("Error al guardar cambios");
        } finally {
            setSaving(false);
        }
    };

    // Helper to toggle inscription account
    const toggleInscriptionAccount = (accountId) => {
        setContributionSettings(prev => {
            const current = prev.inscription_accounts || [];
            if (current.includes(accountId)) {
                return { ...prev, inscription_accounts: current.filter(id => id !== accountId) };
            } else {
                return { ...prev, inscription_accounts: [...current, accountId] };
            }
        });
    };

    // Institution Handlers
    const handleEditInstitution = (inst) => {
        setEditingInstitution(inst);
        setIsInstitutionModalOpen(true);
    };

    const handleDeleteInstitution = async () => {
        try {
            await api.treasuryConfig.deleteInstitution(confirmDeleteInst.institution.id);
            showSuccess('Institución eliminada');
            setConfirmDeleteInst({ isOpen: false, institution: null });
            loadInstitutions();
        } catch (error) {
            showError('Error al eliminar institución');
        }
    };

    const renderInstitutionList = (type, title, icon) => (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    {icon} {title}
                </h3>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                        setEditingInstitution({ type }); // Pre-set type
                        setIsInstitutionModalOpen(true);
                    }}
                >
                    <Plus size={16} className="mr-1" /> Añadir
                </Button>
            </div>
            <div className="space-y-2">
                {institutions.filter(i => i.type === type).map(inst => (
                    <div key={inst.id} className="flex justify-between items-center p-3 bg-white border rounded-lg group hover:border-blue-300 transition-colors">
                        <div className="flex items-center gap-3">
                            {inst.logo_url ? (
                                <img src={inst.logo_url} alt={inst.name} className="w-10 h-10 object-contain p-1 border rounded" />
                            ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                                    {type === 'bank' ? <Landmark size={20} /> : <Smartphone size={20} />}
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-gray-800 text-sm">{inst.name}</p>
                                <div className="flex gap-2 text-xs text-gray-500">
                                    {inst.short_name && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">{inst.short_name}</span>}
                                    {inst.code && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">#{inst.code}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEditInstitution(inst)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Editar"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => setConfirmDeleteInst({ isOpen: true, institution: inst })}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Eliminar"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                {institutions.filter(i => i.type === type).length === 0 && (
                    <p className="text-sm text-gray-400 italic text-center py-4">No hay registros</p>
                )}
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 overflow-x-auto">
                {['contributions', 'categories', 'institutions', 'maintenance'].map(section => {
                    const labels = {
                        contributions: 'Aportes e Inscripciones',
                        categories: 'Categorías y Conceptos',
                        institutions: 'Bancos y Billeteras',
                        maintenance: 'Mantenimiento'
                    };
                    const isActive = activeSection === section;
                    const colorClass = section === 'maintenance' ? 'amber' : 'blue';

                    return (
                        <button
                            key={section}
                            onClick={() => setActiveSection(section)}
                            className={`pb-2 px-4 whitespace-nowrap transition-all border-b-2 ${isActive ? `border-${colorClass}-600 text-${colorClass}-600 font-bold` : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            {labels[section]}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="py-12 flex justify-center">
                    <LoadingSpinner />
                </div>
            ) : (
                <>
                    {/* SECTION 1: CONTRIBUTIONS & SETTINGS */}
                    {activeSection === 'contributions' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            {/* Left: Global Variables */}
                            <Card className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Settings className="text-blue-600" size={20} />
                                    Variables del Periodo
                                </h3>
                                <form onSubmit={handleSaveSettings} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            label="Cuota Mensual (S/)"
                                            type="number"
                                            value={contributionSettings.monthly_amount}
                                            onChange={(e) => setContributionSettings({ ...contributionSettings, monthly_amount: parseFloat(e.target.value) })}
                                            placeholder="0.00"
                                            step="0.01"
                                            required
                                        />
                                        <FormField
                                            label="Día Límite de Pago"
                                            type="number"
                                            value={contributionSettings.monthly_deadline_day}
                                            onChange={(e) => setContributionSettings({ ...contributionSettings, monthly_deadline_day: parseInt(e.target.value) })}
                                            placeholder="Ej. 5"
                                            min="1" max="31"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            label="Mes Inicio"
                                            type="month"
                                            value={contributionSettings.start_month}
                                            onChange={(e) => setContributionSettings({ ...contributionSettings, start_month: e.target.value })}
                                            required
                                        />
                                        <FormField
                                            label="Mes Fin"
                                            type="month"
                                            value={contributionSettings.end_month}
                                            onChange={(e) => setContributionSettings({ ...contributionSettings, end_month: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                                        <Button type="submit" className="bg-blue-600 text-white" disabled={saving}>
                                            <Save size={18} className="mr-2" /> Guardar Variables
                                        </Button>
                                    </div>
                                </form>
                            </Card>

                            {/* Right: Fund Destinations */}
                            <div className="space-y-6">
                                <Card className="p-6 border-t-4 border-t-green-500">
                                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <TrendingUp className="text-green-600" size={20} />
                                        Destinos de Fondos
                                    </h3>
                                    <div className="space-y-6">
                                        {/* Aportes Destination */}
                                        <FormField
                                            label="Cuenta para Aportes Mensuales"
                                            type="select"
                                            value={contributionSettings.default_contribution_account}
                                            onChange={(e) => {
                                                setContributionSettings({ ...contributionSettings, default_contribution_account: e.target.value });
                                            }}
                                            options={[
                                                { value: "", label: "Seleccionar cuenta principal..." },
                                                ...accounts.map(acc => ({ value: acc.id, label: `${acc.alias || acc.holder_name} (${acc.currency})` }))
                                            ]}
                                            helpText="Esta cuenta aparecerá por defecto al registrar un aporte."
                                        />

                                        {/* Inscription Destinations (Multi) */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Cuentas para Inscripciones
                                            </label>
                                            <div className="p-3 border rounded-xl bg-gray-50 max-h-48 overflow-y-auto space-y-2">
                                                {accounts.map(acc => {
                                                    const isSelected = (contributionSettings.inscription_accounts || []).includes(acc.id);
                                                    return (
                                                        <div key={acc.id} className="flex items-center gap-2 p-2 hover:bg-white rounded transition-colors cursor-pointer" onClick={() => toggleInscriptionAccount(acc.id)}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                readOnly
                                                                className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                            />
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-gray-900">{acc.alias || acc.holder_name}</p>
                                                                <p className="text-xs text-gray-500 capitalize">{acc.account_number}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {accounts.length === 0 && <p className="text-sm text-gray-400 italic">No hay cuentas registradas</p>}
                                            </div>
                                            <p className="text-xs text-gray-500">Selecciona las cuentas que se mostrarán a los usuarios para pagar su inscripción.</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end">
                                        <Button
                                            onClick={handleSaveSettings}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            disabled={saving}
                                        >
                                            <Save size={18} className="mr-2" /> Actualizar Destinos
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* SECTION 2: CATEGORIES */}
                    {activeSection === 'categories' && (
                        <CategoriesTab />
                    )}

                    {/* SECTION 3: INSTITUTIONS (Full CRUD) */}
                    {activeSection === 'institutions' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-4">
                                <div className="p-2 bg-blue-100 rounded-lg h-fit text-blue-600"><Landmark size={24} /></div>
                                <div>
                                    <h4 className="font-bold text-blue-900">Configuración de Instituciones</h4>
                                    <p className="text-sm text-blue-800">
                                        Define aquí los bancos y billeteras disponibles para seleccionar al crear cuentas.
                                        Puedes personalizar el nombre, logo y código.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderInstitutionList('bank', 'Bancos Habilitados', <Landmark className="text-blue-600" />)}
                                {renderInstitutionList('wallet', 'Billeteras Digitales', <Smartphone className="text-purple-600" />)}
                            </div>
                        </div>
                    )}

                    {/* SECTION 4: MAINTENANCE */}
                    {activeSection === 'maintenance' && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <Card className="p-6 bg-amber-50 border-amber-200">
                                <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                                    <RefreshCw className="text-amber-600" size={20} />
                                    Reinicializar Matriz de Pagos
                                </h3>
                                <p className="text-sm text-amber-800 mb-6 text-justify">
                                    Esta acción regenera la estructura de meses y estados de pago para todos los usuarios activos.
                                    <br /><br />
                                    ⚠️ <strong>Advertencia:</strong> Usar solo al inicio del periodo o si la matriz presenta inconsistencias graves.
                                </p>
                                <Button
                                    variant="danger"
                                    className="w-full"
                                    onClick={async () => {
                                        const confirmed = await showConfirm(
                                            '¿Estás seguro de regenerar el plan de pagos?',
                                            'Confirmar Reinicio',
                                            { confirmText: 'Sí, Reinicializar', confirmColor: '#dc2626' }
                                        );
                                        if (confirmed) onInitializePlan();
                                    }}
                                >
                                    <RefreshCw size={18} className="mr-2" />
                                    Ejecutar Reinicio de Plan
                                </Button>
                            </Card>
                        </div>
                    )}
                </>
            )}

            {/* Institution Edit Modal */}
            <InstitutionModal
                isOpen={isInstitutionModalOpen}
                onClose={() => {
                    setIsInstitutionModalOpen(false);
                    setEditingInstitution(null);
                }}
                institutionToEdit={editingInstitution}
                onSaveSuccess={() => {
                    loadInstitutions();
                    showSuccess('Institución guardada correctamente');
                }}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={confirmDeleteInst.isOpen}
                onClose={() => setConfirmDeleteInst({ isOpen: false, institution: null })}
                onConfirm={handleDeleteInstitution}
                title="Eliminar Institución"
                message={`¿Estás seguro de eliminar "${confirmDeleteInst.institution?.name}"?`}
                type="danger"
            />
        </div>
    );
};

// Reusable Category List Component (Unchanged)
// Removed: CategoryList and IMMUTABLE_CATEGORIES were replaced by CategoriesTab component.

export default TreasurySettings;
