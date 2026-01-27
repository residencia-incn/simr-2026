import React, { useState, useMemo } from 'react';
import { DollarSign, Calendar, AlertTriangle, CheckCircle, RefreshCw, Upload, FileText, Image as ImageIcon } from 'lucide-react';
import { Card, Button, LoadingSpinner, Modal } from '../ui';
import { useTreasury } from '../../hooks/useTreasury';
import { showSuccess, showError } from '../../utils/alerts';
import { uploadToCloud } from '../../utils/upload';

const MyTreasuryView = ({ user }) => {
    const {
        contributionStatus,
        loading,
        recordContribution,
        reload
    } = useTreasury();

    const [selectedMonths, setSelectedMonths] = useState([]);
    const [selectedPenalty, setSelectedPenalty] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [voucherFile, setVoucherFile] = useState(null);
    const [voucherPreview, setVoucherPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Find current user data in matrix
    const myData = useMemo(() => {
        return contributionStatus.find(org => org.organizador_id === user.id);
    }, [contributionStatus, user.id]);

    if (loading && !myData) {
        return <div className="p-12 text-center"><LoadingSpinner message="Cargando tu estado de cuenta..." /></div>;
    }

    if (!myData) {
        return (
            <Card className="p-12 text-center border-dashed border-2">
                <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
                <h3 className="font-bold text-lg text-gray-900">Plan no inicializado</h3>
                <p className="text-gray-500 max-w-sm mx-auto">Tu cronograma de aportes aún no ha sido generado por tesorería.</p>
            </Card>
        );
    }

    const handleMonthClick = (monthId) => {
        const contrib = myData.contributions.find(c => c.id === monthId);
        if (contrib?.status === 'PAID') return;

        if (contrib?.status === 'IN_PROCESS') {
            // Show info about pending validation
            return;
        }

        const isAlreadySelected = selectedMonths.includes(monthId);
        if (isAlreadySelected) {
            const monthIdx = myData.contributions.findIndex(m => m.id === monthId);
            const newSelection = selectedMonths.filter(id => {
                const idx = myData.contributions.findIndex(m => m.id === id);
                return idx < monthIdx;
            });
            setSelectedMonths(newSelection);
        } else {
            const monthIdx = myData.contributions.findIndex(m => m.id === monthId);
            const pendingPrevious = myData.contributions.slice(0, monthIdx).filter(m =>
                m.status === 'PENDING' && !selectedMonths.includes(m.id)
            );

            if (pendingPrevious.length > 0) {
                showError('Debes pagar los meses anteriores en orden cronológico.');
                return;
            }
            setSelectedMonths([...selectedMonths, monthId]);
            setSelectedPenalty(null);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVoucherFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setVoucherPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!voucherFile) {
            showError('Por favor selecciona una imagen de tu comprobante.');
            return;
        }

        try {
            setIsUploading(true);
            const uploadedUrl = await uploadToCloud(voucherFile);

            const totalAmount = selectedPenalty
                ? parseFloat(selectedPenalty.amount)
                : selectedMonths.reduce((sum, mId) => {
                    const c = myData.contributions.find(x => x.id === mId);
                    return sum + parseFloat(c?.amount || 0);
                }, 0);

            await recordContribution(
                user.id,
                selectedMonths,
                null,
                totalAmount,
                uploadedUrl,
                true, // isValidationRequest
                selectedPenalty ? [selectedPenalty.id] : []
            );

            showSuccess('Comprobante enviado exitosamente. Espera la validación de tesorería.');
            setIsUploadModalOpen(false);
            setVoucherFile(null);
            setVoucherPreview(null);
            setSelectedMonths([]);
            setSelectedPenalty(null);
            await reload();

        } catch (error) {
            showError(error.message || 'Error al enviar comprobante');
        } finally {
            setIsUploading(false);
        }
    };

    const getStatusStyles = (status, isSelected) => {
        if (isSelected) return 'bg-blue-600 border-blue-700 text-white shadow-lg ring-2 ring-blue-300 transform scale-105 z-10';
        switch (status) {
            case 'PAID': return 'bg-green-50 border-green-200 text-green-800';
            case 'IN_PROCESS': return 'bg-yellow-50 border-yellow-200 text-yellow-700 animate-pulse';
            default: return 'bg-white border-dashed border-red-200 text-red-600 hover:bg-red-50 cursor-pointer';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 overflow-hidden relative">
                    <div className="relative z-10">
                        <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Monto Pagado</p>
                        <h3 className="text-3xl font-black">S/ {parseFloat(myData.total_pagado).toFixed(2)}</h3>
                        <div className="mt-4 h-1.5 w-full bg-white/20 rounded-full">
                            <div
                                className="h-full bg-white rounded-full transition-all duration-1000"
                                style={{ width: `${(myData.total_pagado / myData.total_esperado) * 100}%` }}
                            />
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-10">
                        <CheckCircle size={100} />
                    </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-red-500">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Pendiente Total</p>
                    <h3 className="text-3xl font-black text-red-600">S/ {parseFloat(myData.total_due).toFixed(2)}</h3>
                    <p className="text-xs text-red-400 mt-2 font-medium">Incluye aportes y penalidades</p>
                </Card>

                <Card className="p-6 bg-gray-50 flex flex-col justify-center border-dashed border-2">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Acción Requerida</p>
                    {selectedMonths.length > 0 || selectedPenalty ? (
                        <Button
                            className="bg-blue-600 text-white font-bold w-full shadow-lg h-12"
                            onClick={() => setIsUploadModalOpen(true)}
                        >
                            <Upload size={18} className="mr-2" />
                            Enviar Voucher
                        </Button>
                    ) : (
                        <p className="text-sm text-gray-400 italic">Selecciona un mes o multa para pagar</p>
                    )}
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Months Grid */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Calendar size={18} className="text-blue-600" /> Cronograma 2026
                        </h3>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                            Meses de Aporte
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {myData.contributions.map(month => (
                            <button
                                key={month.id}
                                onClick={() => handleMonthClick(month.id)}
                                className={`
                                    relative p-5 rounded-2xl border-2 text-left transition-all duration-300
                                    ${getStatusStyles(month.status, selectedMonths.includes(month.id))}
                                `}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="font-black text-sm uppercase tracking-tight">{month.month}</span>
                                    {month.status === 'PAID' ? (
                                        <CheckCircle size={18} className="text-green-500" />
                                    ) : month.status === 'IN_PROCESS' ? (
                                        <RefreshCw size={18} className="text-yellow-500 animate-spin" />
                                    ) : selectedMonths.includes(month.id) ? (
                                        <CheckCircle size={18} className="text-white" />
                                    ) : (
                                        <div className="h-4 w-4 rounded-full border border-red-200" />
                                    )}
                                </div>
                                <div className="text-lg font-bold">
                                    S/ {month.amount}
                                </div>
                                {month.status === 'IN_PROCESS' && (
                                    <p className="text-[10px] mt-2 font-bold opacity-80 uppercase">En Validación</p>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Left side: Penalties */}
                <Card className="p-6 h-fit border-red-100">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
                        <AlertTriangle className="text-red-500" size={16} />
                        Penalidades
                    </h3>

                    {myData.penalties.length > 0 ? (
                        <div className="space-y-3">
                            {myData.penalties.map(penalty => (
                                <div
                                    key={penalty.id}
                                    onClick={() => penalty.status === 'PENDING' && (setSelectedPenalty(penalty), setSelectedMonths([]))}
                                    className={`
                                        p-4 rounded-xl border-2 transition-all cursor-pointer
                                        ${penalty.status === 'PAID' ? 'bg-green-50 border-green-200 opacity-70' :
                                            penalty.status === 'IN_PROCESS' ? 'bg-yellow-50 border-yellow-200' :
                                                selectedPenalty?.id === penalty.id ? 'bg-red-600 border-red-700 text-white shadow-md' : 'bg-red-50 border-red-100'}
                                    `}
                                >
                                    <p className="text-sm font-bold mb-1">{penalty.reason}</p>
                                    <div className="flex justify-between items-end">
                                        <span className={`text-[10px] font-bold uppercase ${selectedPenalty?.id === penalty.id ? 'text-white/80' : 'text-gray-400'}`}>
                                            {penalty.status === 'PAID' ? 'PAGADO' : penalty.status === 'IN_PROCESS' ? 'POR VALIDAR' : 'PENDIENTE'}
                                        </span>
                                        <span className="text-lg font-black tracking-tighter">S/ {penalty.amount}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-gray-300">
                            <CheckCircle size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Sin penalidades pendientes</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Upload Modal */}
            <Modal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                title="Subir Comprobante de Pago"
            >
                <form onSubmit={handleUploadSubmit} className="space-y-6">
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-500">Total a Pagar</span>
                            <span className="text-2xl font-black text-blue-600">
                                S/ {(selectedPenalty ? parseFloat(selectedPenalty.amount) : selectedMonths.reduce((sum, mId) => {
                                    const c = myData.contributions.find(x => x.id === mId);
                                    return sum + parseFloat(c?.amount || 0);
                                }, 0)).toFixed(2)}
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-400">
                            Estás pagando: {selectedPenalty ? selectedPenalty.reason : `${selectedMonths.length} meses`}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700">Imagen del Voucher (Foto o Captura)</label>
                        <div className="flex gap-4">
                            <label className="flex-1 block cursor-pointer">
                                <div className={`h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${voucherFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                    {voucherFile ? (
                                        <div className="text-center text-green-600">
                                            <CheckCircle size={32} className="mx-auto mb-2" />
                                            <p className="text-xs font-bold truncate max-w-[200px]">{voucherFile.name}</p>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            <Upload size={32} className="mx-auto mb-2" />
                                            <p className="text-sm font-bold">Seleccionar archivo</p>
                                        </div>
                                    )}
                                </div>
                            </label>
                            {voucherPreview && (
                                <div className="w-40 h-40 rounded-2xl border bg-gray-100 overflow-hidden flex items-center justify-center">
                                    <img src={voucherPreview} alt="Voucher Preview" className="max-w-full max-h-full object-contain" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button variant="ghost" className="flex-1" onClick={() => setIsUploadModalOpen(false)}>Cancelar</Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-blue-600 text-white font-bold h-12"
                            loading={isUploading}
                        >
                            <DollarSign size={18} className="mr-2" /> Confirmar Pago
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default MyTreasuryView;
