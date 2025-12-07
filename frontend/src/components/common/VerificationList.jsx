import React, { useState } from 'react';
import { Check, X, Eye, FileText, Calendar, User, CreditCard } from 'lucide-react';
import { Button, Card, EmptyState, Modal } from '../ui';

const VerificationList = ({ pendingRegistrations, onApprove, onReject }) => {
    const [selectedVoucher, setSelectedVoucher] = useState(null);

    if (!pendingRegistrations || pendingRegistrations.length === 0) {
        return (
            <EmptyState
                icon={FileText}
                title="Sin validaciones pendientes"
                description="No hay inscripciones esperando validación en este momento."
            />
        );
    }

    return (
        <div className="space-y-4">
            {pendingRegistrations.map((reg) => (
                <Card key={reg.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        {/* User Info */}
                        <div className="flex items-start gap-4 flex-1">
                            <div className="bg-blue-50 p-3 rounded-full hidden sm:block">
                                <User className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">{reg.name}</h4>
                                <div className="text-sm text-gray-600 space-y-1 mt-1">
                                    <p className="flex items-center gap-2"><CreditCard size={14} /> DNI: {reg.dni} {reg.cmp ? `| CMP: ${reg.cmp}` : ''}</p>
                                    <p className="flex items-center gap-2"><Calendar size={14} /> {reg.role} - {reg.specialty}</p>
                                    <p className="text-xs text-gray-400">Registrado: {new Date(reg.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-gray-50 p-3 rounded-lg min-w-[150px]">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Monto a pagar</p>
                            <p className="font-bold text-gray-900 text-lg">S/ {parseFloat(reg.amount || 0).toFixed(2)}</p>
                            <p className="text-xs text-blue-600 capitalize">{reg.modalidad}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedVoucher(reg)}
                                className="flex-1 md:flex-none justify-center"
                            >
                                <Eye size={16} className="mr-2" /> Voucher
                            </Button>

                            <button
                                onClick={() => onReject(reg.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Rechazar"
                            >
                                <X size={20} />
                            </button>

                            <Button
                                size="sm"
                                onClick={() => onApprove(reg)}
                                className="bg-green-600 hover:bg-green-700 text-white flex-1 md:flex-none justify-center"
                            >
                                <Check size={16} className="mr-2" /> Aprobar
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}

            {/* Voucher Modal */}
            {selectedVoucher && (
                <Modal
                    isOpen={!!selectedVoucher}
                    onClose={() => setSelectedVoucher(null)}
                    title="Comprobante de Pago"
                    size="lg"
                    className="flex flex-col max-h-[90vh]"
                >
                    <div className="p-0 flex-1 flex flex-col min-h-0">
                        <div className="p-4 bg-gray-100 overflow-auto flex-1 flex items-center justify-center min-h-[300px]">
                            {selectedVoucher.voucherData ? (
                                <img
                                    src={selectedVoucher.voucherData}
                                    alt="Voucher"
                                    className="max-w-full max-h-full object-contain shadow-lg rounded"
                                />
                            ) : (
                                <div className="text-center text-gray-500">
                                    <p>No hay imagen disponible</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2 shrink-0">
                            <Button variant="outline" onClick={() => setSelectedVoucher(null)}>Cerrar</Button>
                            <Button onClick={() => { onApprove(selectedVoucher); setSelectedVoucher(null); }} className="bg-green-600 hover:bg-green-700">Aprobar Inscripción</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default VerificationList;
