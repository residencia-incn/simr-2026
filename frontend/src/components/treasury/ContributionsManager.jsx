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


            {/* Contribution Cards */}
            {contributionPlan.length > 0 ? (
                <div className="space-y-4">
                    {organizers.map((organizer) => (
                        <Card key={organizer.organizador_id || organizer.organizador_nombre} className="p-6">
                            {/* Organizer Header */}
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <User size={20} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{organizer.organizador_nombre}</h4>
                                        <p className="text-sm text-gray-500">Aportes Mensuales</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Total Pagado</p>
                                    <p className="text-xl font-bold text-green-600">
                                        S/ {organizer.total_pagado.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        de S/ {organizer.total_esperado.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            {/* Months Grid */}
                            <div>
                                <h5 className="text-sm font-semibold text-gray-700 mb-3">Meses</h5>
                                <div className="grid grid-cols-7 gap-2">
                                    {months.map(month => {
                                        const estado = getCellStatus(organizer.organizador_id || organizer.organizador_nombre, month.id);
                                        const isPending = estado === 'pendiente';
                                        // Extract short month name (e.g., "Enero" -> "Ene")
                                        const shortMonth = month.label.split(' ')[0].substring(0, 3);

                                        return (
                                            <button
                                                key={month.id}
                                                onClick={() => handleCellClick(organizer.organizador_id || organizer.organizador_nombre, month.id)}
                                                disabled={!isPending}
                                                className={`
                                                    py-3 px-2 rounded-lg font-semibold text-sm transition-all
                                                    ${isPending
                                                        ? 'bg-red-100 text-red-700 border-2 border-red-300 hover:bg-red-200 hover:shadow-md cursor-pointer'
                                                        : 'bg-green-100 text-green-700 border-2 border-green-300 cursor-default'
                                                    }
                                                `}
                                                title={isPending ? 'Click para registrar pago' : 'Pagado'}
                                            >
                                                {shortMonth}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </Card>
                    ))}
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
