import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Briefcase, University, CreditCard, CheckCircle, XCircle, Receipt, AlertCircle, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { api } from '../../services/api';

// URL Base para las imágenes (ajústala a tu servidor)
const FILE_BASE_URL = "http://localhost:8000";

const PaymentValidationModal = ({ request, isOpen, onClose, onRefreshTable, readOnly = false }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    // ESCUCHADOR DE TECLA ESC
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.keyCode === 27 || event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !request) return null;

    // Extraer el snapshot del detalle (JSON)
    // Aseguramos que items_detail sea un objeto, si viene como string lo parseamos
    const details = typeof request.items_detail === 'string'
        ? JSON.parse(request.items_detail)
        : request.items_detail || {};

    const modality = details.modality || {};
    const workshops = details.workshops || [];

    // --- MANEJADORES DE ACCIÓN ---

    // APROBAR (Botón Verde)
    const handleApprove = async () => {
        try {
            // Confirmación
            const result = await Swal.fire({
                title: '¿Aprobar Inscripción?',
                text: `Se creará el usuario para ${request.firstname} ${request.lastname}`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#10B981',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Sí, Aprobar'
            });

            if (result.isConfirmed) {
                // Loading
                Swal.fire({
                    title: 'Procesando...',
                    text: 'Creando usuario y registrando transacción...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });

                // API Call
                let response;
                if (request.type === 'payment') {
                    response = await api.treasury.validateVoucherV2(request.id, true);
                    response = { message: 'Pago validado correctamente' };
                } else {
                    response = await api.accounting.approveRequest(request.id);
                }

                // Success
                await Swal.fire({
                    icon: 'success',
                    title: '¡Aprobado!',
                    text: response.message,
                    timer: 2000
                });

                onClose();
                onRefreshTable();
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', error.response?.data?.detail || 'No se pudo aprobar', 'error');
        }
    };

    const handleReject = async () => {
        // LÓGICA DE RECHAZO MEJORADA CON SWEETALERT
        await Swal.fire({
            title: 'Rechazar Inscripción',
            input: 'textarea',
            inputLabel: 'Motivo del rechazo',
            inputPlaceholder: 'Ej: Voucher ilegible, monto incorrecto...',
            inputAttributes: {
                'aria-label': 'Motivo del rechazo'
            },
            showCancelButton: true,
            confirmButtonText: 'Rechazar Solicitud',
            confirmButtonColor: '#EF4444',
            cancelButtonText: 'Cancelar',
            showLoaderOnConfirm: true, // Muestra spinner en el botón confirmar
            preConfirm: async (reason) => {
                // Validación del input
                if (!reason) {
                    Swal.showValidationMessage('Debes ingresar un motivo para el rechazo');
                    return false; // Mantiene el modal abierto
                }

                try {
                    // Llamada a la API dentro de preConfirm
                    console.log("Enviando rechazo para ID:", request.id, "Razón:", reason);

                    if (request.type === 'payment') {
                        await api.treasury.validateVoucherV2(request.id, false, reason);
                        return { message: 'Pago rechazado correctamente' };
                    } else {
                        const response = await api.accounting.rejectRequest(request.id, reason);
                        return response;
                    }
                } catch (error) {
                    console.error("Error al rechazar:", error);
                    // Muestra el error en el mismo modal de SweetAlert
                    Swal.showValidationMessage(
                        `Error: ${error.response?.data?.detail || 'No se pudo procesar el rechazo'}`
                    );
                    return false; // Mantiene el modal abierto
                }
            },
            allowOutsideClick: () => !Swal.isLoading() // Evita cerrar mientras carga
        }).then((result) => {
            // Este bloque se ejecuta solo si preConfirm retorna exitosamente
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Rechazado',
                    text: result.value.message || 'La solicitud ha sido eliminada.',
                    icon: 'success'
                });
                onClose();
                onRefreshTable();
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* HEADER */}
                <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            {readOnly ? (
                                <><CheckCircle className="text-emerald-400" /> Detalle de Inscripción (Confirmada)</>
                            ) : (
                                <><Receipt className="text-blue-400" /> Validación de Inscripción #{request.id}</>
                            )}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            {readOnly ? (
                                <span className="flex items-center gap-1">
                                    {request.approved_by_name ? `Validado por: ${request.approved_by_name}` : 'Este registro ya ha sido procesado y aprobado.'}
                                </span>
                            ) : 'Revise los datos cuidadosamente antes de aprobar.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* BODY SCROLLABLE */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* COLUMNA IZQUIERDA: DATOS */}
                        <div className="space-y-6">

                            {/* Datos Personales */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">Información del Solicitante</h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <User className="text-blue-500 mt-1" size={18} />
                                        <div>
                                            <p className="font-bold text-slate-800">{request.firstname} {request.lastname}</p>
                                            <p className="text-sm text-slate-500">DNI: {request.dni}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Mail className="text-blue-500" size={18} />
                                        <p className="text-sm text-slate-600">{request.email}</p>
                                    </div>
                                    {request.phone && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="text-blue-500" size={18} />
                                            <p className="text-sm text-slate-600">{request.phone}</p>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <Briefcase className="text-blue-500" size={18} />
                                        <p className="text-sm text-slate-600">{request.occupation || 'No especificado'} {request.cmp_number ? `(CMP: ${request.cmp_number})` : ''}</p>
                                    </div>
                                    {(request.university || request.residency_year) && (
                                        <div className="flex items-center gap-3">
                                            <University className="text-blue-500" size={18} />
                                            <p className="text-sm text-slate-600">
                                                {request.university} {request.residency_year ? `- Año ${request.residency_year}` : ''}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Datos de Pago */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">Detalles del Pago</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-dashed">
                                        <span className="text-slate-600 flex items-center gap-2"><CreditCard size={16} /> Cuenta Destino</span>
                                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                                            {request.payment_account_interpreted || request.payment_account || 'No indicada'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-dashed">
                                        <span className="text-slate-600 flex items-center gap-2"><Receipt size={16} /> Monto Reportado</span>
                                        <span className="font-bold text-emerald-600 text-lg">S/ {request.total_amount?.toFixed(2)}</span>
                                    </div>

                                    {/* --- SECCIÓN RESUMEN DE COMPRA MEJORADA --- */}
                                    <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider border-b border-slate-200 pb-2">
                                            Resumen de Compra
                                        </h4>

                                        <div className="space-y-2">
                                            {/* LOGIC: Check for explicit breakdown first (Contributions), else fallback to Modality (Inscriptions) */}
                                            {request.breakdown && request.breakdown.length > 0 ? (
                                                <div className="space-y-2">
                                                    {request.breakdown.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-start text-sm border-b border-slate-100 pb-1 last:border-0">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-800">
                                                                    {item.label}
                                                                </span>
                                                                <span className="text-xs text-slate-500">{item.detail || 'Detalle'}</span>
                                                            </div>
                                                            <span className="font-mono font-medium text-slate-700">
                                                                S/ {Number(item.price || item.amount || 0).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <>
                                                    {/* 1. MODALIDAD (Legacy/Inscriptions) */}
                                                    <div className="flex justify-between items-start text-sm">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800">
                                                                {modality.title || "Modalidad no especificada"}
                                                            </span>
                                                            <span className="text-xs text-slate-500">Acceso al Congreso</span>
                                                        </div>
                                                        <span className="font-mono font-medium text-slate-700">
                                                            S/ {Number(modality.price || 0).toFixed(2)}
                                                        </span>
                                                    </div>

                                                    {/* 2. TALLERES (Iteración corregida) */}
                                                    {workshops.length > 0 && (
                                                        <div className="border-t border-slate-200 pt-2 mt-2">
                                                            <p className="text-xs text-slate-400 mb-1">Talleres Adicionales:</p>
                                                            {workshops.map((ws, idx) => (
                                                                <div key={idx} className="flex justify-between items-start text-sm mb-1">
                                                                    <span className="text-slate-600 pl-2 border-l-2 border-slate-300">
                                                                        {ws.title || ws.name || "Taller sin nombre"}
                                                                    </span>
                                                                    <span className="font-mono font-medium text-slate-700">
                                                                        S/ {Number(ws.price || 0).toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {/* 3. CUPONES (Si aplica) */}
                                            {request.coupon_code_used && (
                                                <div className="flex justify-between text-sm text-green-600 bg-green-50 p-2 rounded border border-green-100 mt-2">
                                                    <span>🏷️ Cupón: <strong>{request.coupon_code_used}</strong></span>
                                                    <span>- S/ {((modality.price + workshops.reduce((a, b) => a + b.price, 0)) - request.total_amount).toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* 4. TOTAL FINAL */}
                                        <div className="flex justify-between items-end border-t-2 border-slate-800 pt-3 mt-3">
                                            <span className="text-sm font-bold text-slate-900">Total a Pagar</span>
                                            <span className="text-xl font-bold text-slate-900">
                                                S/ {Number(request.total_amount || request.amount || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* COLUMNA DERECHA: VOUCHER */}
                        <div className="flex flex-col h-full">
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">Evidencia de Pago (Voucher)</h3>

                                <div className="flex-1 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden group min-h-[300px]">
                                    {request.voucher_url ? (
                                        <div
                                            className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors relative"
                                            onClick={() => {
                                                const url = request.voucher_url.startsWith('http')
                                                    ? request.voucher_url
                                                    : `${FILE_BASE_URL}${request.voucher_url}`;
                                                window.open(url, '_blank');
                                            }}
                                        >
                                            {/* LÓGICA: ¿Es PDF o Imagen? */}
                                            {request.voucher_url.toLowerCase().endsWith('.pdf') ? (
                                                // CASO A: Es un PDF (Mostramos icono en vez de intentar cargar imagen)
                                                <div className="text-center p-6">
                                                    <FileText size={64} className="mx-auto text-red-500 mb-3" />
                                                    <span className="text-slate-700 font-bold block text-lg">Documento PDF</span>
                                                    <span className="text-sm text-blue-600 underline">Clic para abrir documento</span>
                                                </div>
                                            ) : (
                                                // CASO B: Es Imagen (Intentamos cargarla)
                                                <>
                                                    <img
                                                        src={request.voucher_url.startsWith('http') ? request.voucher_url : `${FILE_BASE_URL}${request.voucher_url}`}
                                                        alt="Voucher"
                                                        className="w-full h-full object-contain"
                                                        onError={(e) => {
                                                            // Si falla la imagen, ocultamos la etiqueta img y mostramos un mensaje local
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex'; // Muestra el div de error de abajo
                                                        }}
                                                    />
                                                    {/* Fallback local (oculto por defecto) para cuando la imagen falla */}
                                                    <div className="hidden absolute inset-0 flex-col items-center justify-center text-center p-4">
                                                        <AlertTriangle size={48} className="text-amber-500 mb-2" />
                                                        <span className="font-bold text-slate-600">No se pudo previsualizar</span>
                                                        <span className="text-xs text-blue-600 underline mt-1">Clic para descargar archivo</span>
                                                    </div>
                                                </>
                                            )}

                                            {/* Overlay de Hover */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                                        </div>
                                    ) : (
                                        <div className="text-center p-6 text-slate-400">
                                            <AlertCircle size={48} className="mx-auto mb-2 opacity-50" />
                                            <p>No se adjuntó archivo</p>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-center text-slate-400 mt-2">
                                    Haga clic en la imagen para ver en tamaño completo
                                </p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* FOOTER DE ACCIONES */}
                <div className="p-4 bg-slate-100 border-t flex justify-end gap-4 shrink-0">
                    {/* Botón Cerrar (Siempre visible) */}
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                    >
                        Cerrar
                    </button>

                    {/* Botones de Acción (Solo si NO es readOnly) */}
                    {!readOnly && (
                        <>
                            <button
                                onClick={handleReject}
                                className="px-6 py-3 rounded-xl bg-red-100 text-red-600 font-bold hover:bg-red-200 transition-colors flex items-center gap-2"
                            >
                                <XCircle size={20} /> Rechazar
                            </button>

                            <button
                                onClick={handleApprove}
                                className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-200"
                            >
                                <CheckCircle size={20} /> Aprobar Solicitud
                            </button>
                        </>
                    )}

                    {/* Si es ReadOnly, mostramos badge informativo */}
                    {readOnly && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-bold border border-emerald-200 cursor-default">
                            <CheckCircle size={20} /> Inscripción Aprobada
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default PaymentValidationModal;
