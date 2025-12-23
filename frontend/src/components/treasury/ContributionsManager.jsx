import React, { useState } from 'react';
import { CheckCircle, XCircle, DollarSign, Calendar, User, RefreshCw } from 'lucide-react';
import { Button, Card, FormField, Modal } from '../ui';
import { showError } from '../../utils/alerts';

const ContributionsManager = ({
    contributionPlan,
    contributionStatus,
    config,
    accounts,
    onRecordContribution,
    onInitializePlan
}) => {
    const [selectedContribution, setSelectedContribution] = useState(null);
    const [selectedOrganizer, setSelectedOrganizer] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        accountId: '',
        comprobante: null
    });

    // Agrupar contribuciones por organizador
    const organizers = contributionStatus || [];
    const months = config?.contribution?.months || [];

    const handleCellClick = (organizadorId, mes) => {
        // Try to find by ID first, fallback to name if ID is undefined
        const contrib = contributionPlan.find(
            c => (c.organizador_id === organizadorId || c.organizador_nombre === organizadorId) && c.mes === mes
        );

        if (contrib && contrib.estado === 'pendiente') {
            setSelectedContribution(contrib);
            setFormData({
                accountId: accounts.length > 0 ? accounts[0].id : '',
                comprobante: null
            });
            setIsModalOpen(true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedContribution || !formData.accountId) return;

        try {
            await onRecordContribution(
                selectedContribution.organizador_id,
                selectedContribution.mes,
                formData.accountId,
                formData.comprobante
            );
            setIsModalOpen(false);
            setSelectedContribution(null);
        } catch (error) {
            showError(error.message, 'Error al registrar pago');
        }
    };

    const getCellStatus = (organizadorId, mes) => {
        const contrib = contributionPlan.find(
            c => (c.organizador_id === organizadorId || c.organizador_nombre === organizadorId) && c.mes === mes
        );
        return contrib?.estado || 'pendiente';
    };

    const getStatusColor = (estado) => {
        switch (estado) {
            case 'pagado':
                return 'bg-green-100 border-green-300 text-green-800';
            case 'pendiente':
                return 'bg-red-100 border-red-300 text-red-800';
            default:
                return 'bg-gray-100 border-gray-300 text-gray-800';
        }
    };

    const getStatusIcon = (estado) => {
        return estado === 'pagado' ? CheckCircle : XCircle;
    };

    // Calcular totales
    const totalExpected = organizers.reduce((sum, org) => sum + org.total_esperado, 0);
    const totalPaid = organizers.reduce((sum, org) => sum + org.total_pagado, 0);
    const totalPending = totalExpected - totalPaid;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Gestión de Aportes</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Seguimiento de aportes mensuales de organizadores
                    </p>
                </div>
                {contributionPlan.length === 0 && (
                    <Button
                        onClick={onInitializePlan}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <RefreshCw size={18} className="mr-2" />
                        Inicializar Plan
                    </Button>
                )}
            </div>

            {/* Summary Cards */}
            {contributionPlan.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 bg-blue-50 border-blue-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <DollarSign className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Total Esperado</p>
                                <p className="text-2xl font-bold text-blue-900">S/ {totalExpected.toFixed(2)}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-green-50 border-green-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="text-green-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-green-600 font-medium">Total Recaudado</p>
                                <p className="text-2xl font-bold text-green-900">S/ {totalPaid.toFixed(2)}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-red-50 border-red-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <XCircle className="text-red-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-red-600 font-medium">Pendiente</p>
                                <p className="text-2xl font-bold text-red-900">S/ {totalPending.toFixed(2)}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}


            {/* Master-Detail Layout */}
            {contributionPlan.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                    {/* Left Column: Organizer List */}
                    <Card className="lg:col-span-1 overflow-hidden flex flex-col h-full p-0">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar organizador..."
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {organizers.map((organizer) => {
                                const isSelected = selectedOrganizer?.organizador_id === organizer.organizador_id;
                                const progress = (organizer.total_pagado / organizer.total_esperado) * 100;

                                return (
                                    <button
                                        key={organizer.organizador_id}
                                        onClick={() => setSelectedOrganizer(organizer)}
                                        className={`w-full text-left p-3 rounded-lg transition-all ${isSelected
                                            ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                                            : 'hover:bg-gray-50 border border-transparent'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-semibold text-sm ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                                                {organizer.organizador_nombre}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500">Pagado: S/ {organizer.total_pagado.toFixed(0)}</span>
                                            <span className={progress >= 100 ? 'text-green-600 font-bold' : 'text-gray-400'}>
                                                {progress.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="mt-1.5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                                                    }`}
                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                            />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Right Column: Details */}
                    <div className="lg:col-span-2 h-full">
                        {selectedOrganizer ? (
                            <Card className="h-full flex flex-col p-0 overflow-hidden">
                                {/* Detail Header */}
                                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm">
                                            <User size={24} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">{selectedOrganizer.organizador_nombre}</h2>
                                            <p className="text-sm text-gray-500">Historial de aportes</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-500">Total Pagado</p>
                                        <p className="text-2xl font-bold text-green-600">S/ {selectedOrganizer.total_pagado.toFixed(2)}</p>
                                        <p className="text-xs text-gray-400">de S/ {selectedOrganizer.total_esperado.toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* Detail Body (Months) */}
                                <div className="p-6 flex-1 overflow-y-auto">
                                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Calendar size={18} className="text-gray-400" />
                                        Cronograma de Pagos
                                    </h4>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {months.map(month => {
                                            const estado = getCellStatus(selectedOrganizer.organizador_id || selectedOrganizer.organizador_nombre, month.id);
                                            const isPending = estado === 'pendiente';
                                            const isPaid = estado === 'pagado';

                                            return (
                                                <button
                                                    key={month.id}
                                                    onClick={() => handleCellClick(selectedOrganizer.organizador_id || selectedOrganizer.organizador_nombre, month.id)}
                                                    disabled={!isPending}
                                                    className={`
                                                        relative p-4 rounded-xl border-2 text-left transition-all
                                                        ${isPaid
                                                            ? 'bg-green-50 border-green-200 opacity-90'
                                                            : isPending
                                                                ? 'bg-white border-dashed border-red-300 hover:border-red-400 hover:bg-red-50 cursor-pointer shadow-sm hover:shadow-md'
                                                                : 'bg-gray-50 border-gray-200'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className={`font-bold ${isPaid ? 'text-green-800' : 'text-gray-700'}`}>
                                                            {month.label}
                                                        </span>
                                                        {isPaid ? (
                                                            <CheckCircle size={18} className="text-green-600" />
                                                        ) : (
                                                            <div className="h-4 w-4 rounded-full border-2 border-red-300" />
                                                        )}
                                                    </div>

                                                    <div className="text-sm">
                                                        {isPaid ? (
                                                            <span className="text-green-700 font-medium bg-green-100 px-2 py-0.5 rounded text-xs">
                                                                Pagado
                                                            </span>
                                                        ) : (
                                                            <span className="text-red-600 font-medium flex items-center gap-1">
                                                                <span className="text-xs">Pendiente:</span>
                                                                S/ {config?.contribution?.monthlyAmount?.toFixed(0)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm mb-4">
                                    <User size={32} className="text-gray-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">Selecciona un Organizador</h3>
                                <p className="text-gray-500 max-w-xs">
                                    Haz clic en un nombre de la lista izquierda para ver el detalle de sus aportes.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <Card className="p-12 text-center">
                    <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Plan de Aportes no Inicializado</h3>
                    <p className="text-gray-600 mb-4">
                        Inicializa el plan de aportes para comenzar el seguimiento de pagos mensuales
                    </p>
                    <Button
                        onClick={onInitializePlan}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <RefreshCw size={18} className="mr-2" />
                        Inicializar Plan de Aportes
                    </Button>
                </Card>
            )}

            {/* Record Payment Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Registrar Pago de Aporte"
            >
                {selectedContribution && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-gray-600">Organizador:</p>
                                    <p className="font-semibold text-gray-900">{selectedContribution.organizador_nombre}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Mes:</p>
                                    <p className="font-semibold text-gray-900">{selectedContribution.mes_label}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Monto:</p>
                                    <p className="font-semibold text-green-600">S/ {selectedContribution.monto_esperado.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Fecha Límite:</p>
                                    <p className="font-semibold text-gray-900">
                                        {new Date(selectedContribution.deadline).toLocaleDateString('es-PE')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <FormField
                            label="Cuenta de Destino"
                            name="accountId"
                            type="select"
                            value={formData.accountId}
                            onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                            options={accounts.map(acc => ({
                                value: acc.id,
                                label: `${acc.nombre} (S/ ${acc.saldo_actual.toFixed(2)})`
                            }))}
                            required
                        />

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                                <CheckCircle size={18} className="mr-2" />
                                Registrar Pago
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default ContributionsManager;
