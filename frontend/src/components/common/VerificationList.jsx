import React, { useState } from 'react';
import { Check, X, Eye, FileText, Calendar, User, CreditCard, DollarSign, Award, Wifi, Briefcase, Building } from 'lucide-react';
import { Button, Card, EmptyState, Modal } from '../ui';
import Swal from 'sweetalert2';

// Constants for display mapping (mirrors RegistrationView)


const VerificationList = ({ pendingRegistrations, onApprove, onReject, pricingConfig }) => {
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

    const getTicketInfo = (type) => {
        const ticket = pricingConfig?.ticketTypes?.find(t => t.id === type || t.key === type);
        return ticket ? { title: ticket.title, price: ticket.price, subtitle: ticket.subtitle } : { title: type, price: 0 };
    };

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
                    className="overflow-hidden hover:shadow-md transition-shadow relative group"
                >
                    <div className="p-5 space-y-4">
                        {/* User Info Section */}
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-50 p-3 rounded-full shrink-0">
                                <User className="text-blue-600" size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 text-lg mb-1">{reg.name}</h4>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p className="flex items-center gap-2">
                                        <CreditCard size={14} className="shrink-0" />
                                        <span className="truncate">DNI: {reg.dni} {reg.cmp && `| CMP: ${reg.cmp}`}</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <Calendar size={14} className="shrink-0" />
                                        <span className="truncate">{reg.occupation}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Info Section */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-2">Monto a pagar</p>
                            <div className="flex items-baseline gap-2 mb-1">
                                <p className="font-bold text-gray-900 text-2xl">S/ {parseFloat(reg.amount || 0).toFixed(2)}</p>
                            </div>
                            <p className="text-sm text-blue-600 capitalize font-medium">
                                {(() => {
                                    // 0. CHECK FOR UPGRADE PATTERNS (Only for Purchases from Cart)
                                    if (reg.type === 'Purchase') {
                                        const hasWorkshops = (reg.workshops && reg.workshops.length > 0) || (reg.items && reg.items.some(i => i.type === 'workshop' || i.id?.startsWith('w_')));
                                        const hasTicket = (reg.ticketType && reg.ticketType !== 'presencial') || (reg.items && reg.items.some(i => i.type === 'ticket'));

                                        // If both workshops and ticket are present
                                        if (hasWorkshops && hasTicket) return "UPGRADE: Talleres + Modalidad";

                                        // If only workshops are present
                                        if (hasWorkshops && (!reg.ticketType || reg.ticketType === 'presencial' || !hasTicket)) return "UPGRADE: Talleres";

                                        // If only ticket is present
                                        const onlyTicket = hasTicket && !hasWorkshops;
                                        if (onlyTicket) return "UPGRADE: Modalidad";
                                    }

                                    // 1. Try to find embedded item name first (Gold Source)
                                    const embeddedItem = reg.items?.find(i => i.id === reg.ticketType || i.type === 'ticket');
                                    if (embeddedItem?.name || embeddedItem?.title) return embeddedItem.name || embeddedItem.title;

                                    // 2. Try global config (Silver Source)
                                    if (reg.ticketType) {
                                        const info = getTicketInfo(reg.ticketType);
                                        // Only return if it's NOT the raw ID (unless title happens to be the ID, which is rare)
                                        if (info.title && info.title !== reg.ticketType) return info.title;
                                    }

                                    // 3. Fallback to descriptors
                                    return reg.modalidad || reg.ticketType || 'Inscripción';
                                })()}
                            </p>
                        </div>

                        {/* Actions Section */}
                        <div className="flex items-center gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRegistration(reg);
                                }}
                                className="flex-1 justify-center"
                            >
                                <Eye size={16} className="mr-2" /> Voucher
                            </Button>

                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    const { value: reason, isDismissed } = await Swal.fire({
                                        title: 'Motivo del Rechazo',
                                        text: `¿Por qué rechazas el pago de ${reg.name}?`,
                                        input: 'text',
                                        inputPlaceholder: 'Ej. Voucher ilegible, monto incorrecto...',
                                        showCancelButton: true,
                                        confirmButtonText: 'Rechazar',
                                        cancelButtonText: 'Cancelar',
                                        confirmButtonColor: '#dc2626',
                                        cancelButtonColor: '#6b7280'
                                    });

                                    if (isDismissed || reason === undefined) return;
                                    onReject(reg.id, reason);
                                }}
                                className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                                title="Rechazar"
                            >
                                <X size={20} />
                            </button>

                            <Button
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onApprove(reg);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white flex-1 justify-center"
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
                    title={selectedRegistration.type === 'Contribution' ? "Detalle de Aporte" : "Detalle de Inscripción"}
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
                                            {selectedRegistration.type === 'Contribution' ? (
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-3">
                                                        <span className="text-gray-700 font-medium text-base">Concepto General</span>
                                                        <span className="font-bold text-gray-900 text-base text-right">{selectedRegistration.modalidad}</span>
                                                    </div>

                                                    {selectedRegistration.breakdown && (
                                                        <div className="space-y-3 pt-2">
                                                            <p className="text-xs font-bold text-gray-500 uppercase">Desglose de Aportes</p>
                                                            {selectedRegistration.breakdown.map((item, idx) => (
                                                                <div key={idx} className="flex justify-between items-center text-sm pl-2">
                                                                    <span className="text-gray-700">• {item.label}</span>
                                                                    <span className="font-semibold text-gray-900">+ S/ {item.price.toFixed(2)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                /* Show Ticket line. If Amount is 0 (Coupon), we still want to show the original value */
                                                (getTicketInfo(selectedRegistration.ticketType).price > 0 || (!selectedRegistration.items || selectedRegistration.items.length === 0)) && (
                                                    <div className="flex flex-col gap-2 w-full">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-gray-700 font-medium text-base">Ticket: {getTicketInfo(selectedRegistration.ticketType).title}</span>
                                                            <span className="font-bold text-gray-900 text-base">S/ {getTicketInfo(selectedRegistration.ticketType).price.toFixed(2)}</span>
                                                        </div>

                                                        {/* Coupon Discount Row */}
                                                        {selectedRegistration.amount === 0 && selectedRegistration.coupon && (
                                                            <div className="flex justify-between items-center text-sm bg-green-50 p-2 rounded border border-green-100">
                                                                <span className="text-green-700 font-medium flex items-center gap-2">
                                                                    <Award size={14} /> Cupón: {selectedRegistration.coupon}
                                                                </span>
                                                                <span className="font-bold text-green-700">- S/ {getTicketInfo(selectedRegistration.ticketType).price.toFixed(2)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            )}

                                            {/* General Items Breakdown (Works for both workshops and generic cart items) */}
                                            {(selectedRegistration.items && selectedRegistration.items.length > 0) ? (
                                                <div className="space-y-3 pt-3 border-t border-gray-200">
                                                    <p className="text-xs font-bold text-gray-500 uppercase">Detalle de Ítems ({selectedRegistration.items.length})</p>
                                                    {selectedRegistration.items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center text-sm pl-2">
                                                            <span className="text-gray-700">• {item.name || item.title || 'Ítem'}</span>
                                                            <span className="font-semibold text-gray-900">+ S/ {(item.price || 0).toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                /* Fallback for legacy workshop IDs */
                                                selectedRegistration.workshops && selectedRegistration.workshops.length > 0 && (
                                                    <div className="space-y-3 pt-3 border-t border-gray-200">
                                                        <p className="text-xs font-bold text-gray-500 uppercase">Talleres Adicionales</p>
                                                        {selectedRegistration.workshops.map(wsId => {
                                                            const ws = pricingConfig?.workshops?.find(w => w.id === wsId || w.key === wsId);
                                                            return (
                                                                <div key={wsId}>
                                                                    <div className="flex justify-between items-center text-sm pl-2">
                                                                        <span className="text-gray-700">• {ws ? ws.name : wsId}</span>
                                                                        <span className="font-semibold text-gray-900">{ws ? `+ S/ ${ws.price.toFixed(2)}` : '-'}</span>
                                                                    </div>
                                                                    {selectedRegistration.amount === 0 && selectedRegistration.coupon && ws && (
                                                                        <div className="flex justify-between items-center text-xs pl-4 pr-1 mt-1 text-green-600">
                                                                            <span>↳ Incluido en Cupón</span>
                                                                            <span>- S/ {ws.price.toFixed(2)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )
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
                                        {selectedRegistration.amount === 0 && selectedRegistration.coupon ? (
                                            <div className="text-center p-8 bg-green-50 rounded-xl border border-green-200 w-full h-full flex flex-col items-center justify-center">
                                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                                                    <Award size={40} />
                                                </div>
                                                <h3 className="text-xl font-bold text-green-800 mb-2">¡Beca / Cupón Aplicado!</h3>
                                                <p className="text-green-700 font-medium mb-1">Código: <span className="font-bold">{selectedRegistration.coupon}</span></p>
                                                <p className="text-sm text-green-600">Este registro tiene un descuento del 100%.</p>
                                            </div>
                                        ) : selectedRegistration.voucherData ? (
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
                                    onClick={async () => {
                                        const { value: reason, isDismissed } = await Swal.fire({
                                            title: 'Motivo del Rechazo',
                                            text: `¿Por qué rechazas el registro de ${selectedRegistration.name}?`,
                                            input: 'text',
                                            inputPlaceholder: 'Ej. Voucher ilegible, monto incorrecto...',
                                            showCancelButton: true,
                                            confirmButtonText: 'Rechazar',
                                            cancelButtonText: 'Cancelar',
                                            confirmButtonColor: '#dc2626',
                                            cancelButtonColor: '#6b7280'
                                        });

                                        if (isDismissed || reason === undefined) return;

                                        onReject(selectedRegistration.id, reason);
                                        setSelectedRegistration(null);
                                    }}
                                >
                                    <X size={18} className="mr-2" /> {selectedRegistration.type === 'Contribution' ? 'Rechazar Pago' : 'Rechazar Inscripción'}
                                </Button>
                                <Button
                                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 px-6"
                                    onClick={() => {
                                        onApprove(selectedRegistration);
                                        setSelectedRegistration(null);
                                    }}
                                >
                                    <Check size={18} className="mr-2" /> {selectedRegistration.type === 'Contribution' ? 'Validar Pago' : 'Aprobar Inscripción'}
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
