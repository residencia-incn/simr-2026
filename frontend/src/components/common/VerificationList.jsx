import React, { useState } from 'react';
import { Check, X, Eye, FileText, Calendar, User, CreditCard, DollarSign, Award, Wifi, Briefcase, Building } from 'lucide-react';
import { Button, Card, EmptyState, Modal } from '../ui';

// Constants for display mapping (mirrors RegistrationView)
const TICKET_OPTIONS = {
    'presencial': { title: 'Presencial', price: 0, subtitle: 'Gratis' },
    'presencial_cert': { title: 'Presencial + Certificado', price: 50, subtitle: 'S/ 50.00' },
    'virtual': { title: 'Virtual', price: 50, subtitle: 'S/ 50.00' }
};

const WORKSHOP_OPTIONS = {
    'workshop1': { name: 'Taller de Neuroimagen Avanzada', price: 20 },
    'workshop2': { name: 'Taller de Electroencefalografía', price: 20 },
    'workshop3': { name: 'Taller de Rehabilitación Neurológica', price: 20 }
};

const VerificationList = ({ pendingRegistrations, onApprove, onReject }) => {
    const [selectedRegistration, setSelectedRegistration] = useState(null);

    if (!pendingRegistrations || pendingRegistrations.length === 0) {
        return (
            <EmptyState
                icon={FileText}
                title="Sin validaciones pendientes"
                description="No hay inscripciones esperando validación en este momento."
            />
        );
    }

    const getTicketInfo = (type) => TICKET_OPTIONS[type] || { title: type, price: 0 };

    const handleViewVoucher = (e) => {
        e.preventDefault();
        const voucherData = selectedRegistration.voucherData;
        const win = window.open("");
        if (win) {
            win.document.write(`
                <html>
                    <head>
                        <title>Voucher - ${selectedRegistration.name}</title>
                        <style>
                            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f2f5; }
                            img { max-width: 95%; max-height: 95vh; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border-radius: 8px; }
                        </style>
                    </head>
                    <body>
                        <img src="${voucherData}" alt="Comprobante de Pago" />
                    </body>
                </html>
            `);
            win.document.close();
        }
    };

    return (
        <div className="space-y-4">
            {pendingRegistrations.map((reg) => (
                <Card
                    key={reg.id}
                    className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer relative group"
                    onClick={() => setSelectedRegistration(reg)}
                >
                    <div className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        {/* User Info */}
                        <div className="flex items-start gap-4 flex-1">
                            <div className="bg-blue-50 p-3 rounded-full hidden sm:block">
                                <User className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{reg.name}</h4>
                                <div className="text-sm text-gray-600 space-y-1 mt-1">
                                    <p className="flex items-center gap-2"><CreditCard size={14} /> DNI: {reg.dni} {reg.cmp && `| CMP: ${reg.cmp}`}</p>
                                    <p className="flex items-center gap-2"><Calendar size={14} /> {reg.occupation}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-gray-50 p-3 rounded-lg min-w-[150px]">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Monto a pagar</p>
                            <p className="font-bold text-gray-900 text-lg">S/ {parseFloat(reg.amount || 0).toFixed(2)}</p>
                            <p className="text-xs text-blue-600 capitalize">{reg.ticketType ? getTicketInfo(reg.ticketType).title : reg.modalidad}</p>
                        </div>

                        {/* Actions (Stop Propagation to prevent opening modal when clicking buttons) */}
                        <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0" onClick={(e) => e.stopPropagation()}>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRegistration(reg);
                                }}
                                className="flex-1 md:flex-none justify-center"
                            >
                                <Eye size={16} className="mr-2" /> Voucher
                            </Button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    console.log("Reject click", reg.id);
                                    // alert("Rejecting " + reg.id);
                                    onReject(reg.id);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Rechazar"
                            >
                                <X size={20} />
                            </button>

                            <Button
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    console.log("Approve click", reg.name);
                                    // alert("Approving " + reg.name);
                                    onApprove(reg);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white flex-1 md:flex-none justify-center"
                            >
                                <Check size={16} className="mr-2" /> Aprobar
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}

            {/* Detailed Registration Modal */}
            {selectedRegistration && (
                <Modal
                    isOpen={!!selectedRegistration}
                    onClose={() => setSelectedRegistration(null)}
                    title="Detalle de Inscripción"
                    size="3xl"
                >
                    {/* Container with negative margin to counteract Modal's default padding */}
                    <div className="-m-4 md:-m-6 flex flex-col h-[calc(90vh-100px)]">

                        <div className="flex-1 overflow-y-auto p-6 md:p-8">
                            <div className="flex flex-col lg:flex-row gap-8">
                                {/* Left Column: Data */}
                                <div className="flex-1 space-y-8">
                                    {/* Personal Info Section */}
                                    <div className="bg-white rounded-xl">
                                        <h4 className="flex items-center gap-2 font-bold text-gray-900 border-b pb-3 mb-4 text-lg">
                                            <User size={20} className="text-blue-600" /> Datos Personales
                                        </h4>
                                        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                            <div>
                                                <p className="text-gray-500 text-xs font-bold uppercase mb-1">Nombre Completo</p>
                                                <p className="font-semibold text-gray-900 text-base">{selectedRegistration.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs font-bold uppercase mb-1">DNI / Pasaporte</p>
                                                <p className="font-semibold text-gray-900 text-base">{selectedRegistration.dni}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-gray-500 text-xs font-bold uppercase mb-1">Email</p>
                                                <p className="font-semibold text-gray-900 text-base">{selectedRegistration.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Professional Info */}
                                    <div className="bg-white rounded-xl">
                                        <h4 className="flex items-center gap-2 font-bold text-gray-900 border-b pb-3 mb-4 text-lg">
                                            <Briefcase size={20} className="text-purple-600" /> Perfil Profesional
                                        </h4>
                                        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                            <div className="col-span-2">
                                                <p className="text-gray-500 text-xs font-bold uppercase mb-1">Institución / Hospital</p>
                                                <p className="font-semibold text-gray-900 text-base flex items-center gap-2">
                                                    <Building size={16} className="text-gray-400" /> {selectedRegistration.institution}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs font-bold uppercase mb-1">Ocupación</p>
                                                <p className="font-semibold text-gray-900">{selectedRegistration.occupation}</p>
                                            </div>

                                            {selectedRegistration.cmp && (
                                                <div>
                                                    <p className="text-gray-500 text-xs font-bold uppercase mb-1">CMP</p>
                                                    <p className="font-semibold text-gray-900">{selectedRegistration.cmp}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Registration Details */}
                                    <div>
                                        <h4 className="flex items-center gap-2 font-bold text-gray-900 border-b pb-3 mb-4 text-lg">
                                            <Award size={20} className="text-orange-600" /> Detalle de Pago
                                        </h4>
                                        <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-700 font-medium text-base">Ticket: {getTicketInfo(selectedRegistration.ticketType).title}</span>
                                                <span className="font-bold text-gray-900 text-base">S/ {getTicketInfo(selectedRegistration.ticketType).price.toFixed(2)}</span>
                                            </div>

                                            {selectedRegistration.workshops && selectedRegistration.workshops.length > 0 && (
                                                <div className="space-y-3 pt-3 border-t border-gray-200">
                                                    <p className="text-xs font-bold text-gray-500 uppercase">Talleres Adicionales</p>
                                                    {selectedRegistration.workshops.map(wsId => {
                                                        const ws = WORKSHOP_OPTIONS[wsId];
                                                        return ws ? (
                                                            <div key={wsId} className="flex justify-between items-center text-sm pl-2">
                                                                <span className="text-gray-700">• {ws.name}</span>
                                                                <span className="font-semibold text-gray-900">+ S/ {ws.price.toFixed(2)}</span>
                                                            </div>
                                                        ) : null;
                                                    })}
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200 mt-2">
                                                <span className="text-xl font-bold text-gray-900">Total a Pagar</span>
                                                <span className="text-3xl font-extrabold text-blue-600">S/ {parseFloat(selectedRegistration.amount || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Voucher Preview */}
                                <div className="w-full lg:w-[400px] flex flex-col shrink-0">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                                        <FileText size={20} className="text-gray-500" /> Voucher
                                    </h4>
                                    <div className="flex-1 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center p-4 relative overflow-hidden group min-h-[400px]">
                                        {selectedRegistration.voucherData ? (
                                            <a
                                                href="#"
                                                onClick={handleViewVoucher}
                                                className="block w-full h-full flex items-center justify-center cursor-zoom-in"
                                                title="Click para ver comprobante original"
                                            >
                                                <img
                                                    src={selectedRegistration.voucherData}
                                                    alt="Voucher"
                                                    className="max-w-full max-h-full object-contain shadow-md rounded hover:opacity-90 transition-opacity"
                                                />
                                            </a>
                                        ) : (
                                            <div className="text-center text-gray-400 p-8">
                                                <CreditCard size={64} className="mx-auto mb-4 opacity-50" />
                                                <p className="text-lg font-medium">Sin comprobante adjunto</p>
                                                <p className="text-sm mt-2">No se ha subido ningún archivo.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>


                        {/* Footer Buttons - Fixed at bottom */}
                        <div className="flex justify-between items-center p-4 md:p-6 border-t border-gray-100 bg-white shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            <span className="text-sm text-gray-500 italic hidden sm:block">
                                Revise cuidadosamente el voucher antes de aprobar.
                            </span>
                            <div className="flex gap-3 w-full sm:w-auto justify-end">
                                <Button variant="outline" onClick={() => setSelectedRegistration(null)}>
                                    Cancelar
                                </Button>
                                <Button
                                    className="bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-100 border border-red-600"
                                    onClick={() => {
                                        onReject(selectedRegistration.id);
                                        setSelectedRegistration(null);
                                    }}
                                >
                                    <X size={18} className="mr-2" /> Rechazar Inscripción
                                </Button>
                                <Button
                                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 px-6"
                                    onClick={() => {
                                        onApprove(selectedRegistration);
                                        setSelectedRegistration(null);
                                    }}
                                >
                                    <Check size={18} className="mr-2" /> Aprobar Inscripción
                                </Button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )
            }
        </div >
    );
};

export default VerificationList;
