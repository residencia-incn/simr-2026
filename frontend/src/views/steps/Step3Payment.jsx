import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Upload, CreditCard, Ticket, Trash2, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Step3Payment = ({
    selectedModality,
    selectedWorkshops,
    coupon,
    setCoupon,
    voucherFile,
    setVoucherFile,
    paymentAccount,
    setPaymentAccount,
    onTotalChange // Callback para avisar al padre el nuevo total
}) => {

    const [couponCode, setCouponCode] = useState('');
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [calculatedTotal, setCalculatedTotal] = useState(0);

    // --- DATOS DE CUENTAS (Desde Configuración) ---
    const [bankAccounts, setBankAccounts] = useState([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);

    useEffect(() => {
        const loadAccounts = async () => {
            try {
                const accounts = await api.registrations.getPaymentAccounts();
                setBankAccounts(accounts);
            } catch (error) {
                console.error("Error loading accounts", error);
                toast.error("No se pudieron cargar las cuentas de pago");
            } finally {
                setLoadingAccounts(false);
            }
        };
        loadAccounts();
    }, []);

    // 1. 🧮 MOTOR DE CÁLCULO (El Cerebro Financiero)
    useEffect(() => {
        // A. Precios Base
        const modalityPrice = selectedModality?.price || 0;
        const workshopsPrice = selectedWorkshops.reduce((sum, w) => sum + w.price, 0);
        const subtotal = modalityPrice + workshopsPrice;

        // B. Lógica de Descuento
        let discountAmount = 0;

        if (coupon) {
            const discount = (coupon.discount_percentage || 0) / 100;

            switch (coupon.discount_scope) {
                case 'modality': // Solo a la inscripción
                    discountAmount = modalityPrice * discount;
                    break;
                case 'workshops': // Solo a talleres
                    discountAmount = workshopsPrice * discount;
                    break;
                case 'all': // A todo
                default:
                    discountAmount = subtotal * discount;
                    break;
            }
        }

        // C. Total Final (No menor a 0)
        const final = Math.max(0, subtotal - discountAmount);

        setCalculatedTotal(final);
        onTotalChange(final); // Avisar al Wizard padre

    }, [selectedModality, selectedWorkshops, coupon]);


    // 2. MANEJADOR DE CUPONES
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setValidatingCoupon(true);

        try {
            // Llamada al backend para validar
            // Asumiendo endpoint: GET /payments/validate-coupon?code=XYZ
            const response = await api.payments.validateCoupon(couponCode);

            setCoupon(response); // Guardamos el objeto cupón completo
            toast.success("Cupón aplicado correctamente");
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.detail || "Cupón inválido o expirado");
            setCoupon(null);
        } finally {
            setValidatingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setCoupon(null);
        setCouponCode('');
        toast('Cupón removido', { icon: '🗑️' });
    };

    // 3. MANEJADOR DE ARCHIVOS (Voucher)
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validaciones simples (opcional, el hook ya valida pero aquí damos feedback visual inmediato)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("El archivo no debe superar los 5MB");
                return;
            }
            if (!file.type.match(/image\/|application\/pdf/)) {
                toast.error("Solo imágenes o PDF");
                return;
            }

            // IMPORTANTE: Pasar el EVENTO completo al hook, no el archivo
            setVoucherFile(e);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* A. BANNER DE TOTAL */}
            <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg flex justify-between items-center transform transition-all">
                <div>
                    <h2 className="text-blue-100 font-medium">Total a Pagar</h2>
                    {coupon && (
                        <span className="text-xs bg-green-400 text-green-900 px-2 py-0.5 rounded-full font-bold">
                            Ahorras S/ {(selectedModality?.price + selectedWorkshops.reduce((a, b) => a + b.price, 0) - calculatedTotal).toFixed(2)}
                        </span>
                    )}
                </div>
                <div className="text-4xl font-bold tracking-tight">
                    S/ {calculatedTotal.toFixed(2)}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* COLUMNA IZQUIERDA: CUENTAS BANCARIAS */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <CreditCard size={18} /> Cuentas Disponibles
                    </h3>

                    {calculatedTotal === 0 ? (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 flex items-center gap-3">
                            <CheckCircle size={24} />
                            <div>
                                <p className="font-bold">¡Inscripción Gratuita!</p>
                                <p className="text-xs">No se requiere pago ni voucher.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-500 mb-2">Selecciona dónde realizaste el pago:</p>
                            {loadingAccounts ? (
                                <div className="text-center py-4 text-slate-400">Cargando cuentas...</div>
                            ) : bankAccounts.length === 0 ? (
                                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
                                    No hay cuentas configuradas para inscripción.
                                </div>
                            ) : (
                                bankAccounts.map(acc => (
                                    <div
                                        key={acc.id}
                                        onClick={() => setPaymentAccount(acc.id)}
                                        className={`
                                            p-5 border rounded-2xl cursor-pointer transition-all relative overflow-hidden group
                                            ${paymentAccount === acc.id
                                                ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                                                : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'}
                                        `}
                                    >
                                        <div className="flex items-start gap-4 relative z-10">
                                            {/* Logo/Icon */}
                                            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-white border border-slate-100 rounded-xl p-1.5 shadow-sm">
                                                {acc.institution?.logo_url ? (
                                                    <img src={acc.institution.logo_url} alt={acc.institution.name} className="w-full h-full object-contain" />
                                                ) : (
                                                    <span className="text-2xl">🏦</span>
                                                )}
                                            </div>

                                            {/* Account Info */}
                                            <div className="flex-1 min-w-0">
                                                {/* Titular (Main Title) */}
                                                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-0.5">
                                                    Titular
                                                </div>
                                                <div className="font-extrabold text-lg text-slate-900 leading-tight mb-2">
                                                    {acc.holder_name || "Nombre del Titular"}
                                                </div>

                                                {/* Account Number (Prominent) */}
                                                <div className="bg-slate-900 text-blue-400 px-3 py-2 rounded-lg font-mono text-lg font-bold flex items-center justify-between group/number transition-colors hover:bg-slate-800">
                                                    <span className="truncate">{acc.account_number}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigator.clipboard.writeText(acc.account_number);
                                                            toast.success("Copiado al portapapeles");
                                                        }}
                                                        className="ml-2 p-1 text-slate-500 hover:text-white transition-colors"
                                                        title="Copiar número de cuenta"
                                                    >
                                                        <Copy size={16} />
                                                    </button>
                                                </div>

                                                {/* Footer Info (Bank & CCI) */}
                                                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 items-center">
                                                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                        {acc.institution?.name}
                                                    </span>
                                                    {acc.cci && (
                                                        <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                            CCI: {acc.cci}
                                                        </div>
                                                    )}
                                                    {acc.currency && (
                                                        <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                                                            {acc.currency}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Selection Indicator */}
                                            {paymentAccount === acc.id && (
                                                <div className="absolute top-0 right-0 p-2">
                                                    <CheckCircle size={20} className="text-blue-500 fill-blue-50" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Hover Effect Decorator */}
                                        <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                    </div>
                                )))}
                        </div>
                    )}
                </div>

                {/* COLUMNA DERECHA: VALIDACIÓN DE PAGO */}
                <div className="space-y-6">

                    {/* 1. SUBIR VOUCHER */}
                    {calculatedTotal > 0 && (
                        <div>
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                                <Upload size={18} /> Validación de Pago
                            </h3>
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept="image/*,.pdf"
                                />
                                {voucherFile ? (
                                    <div className="flex flex-col items-center text-blue-600">
                                        <CheckCircle size={32} className="mb-2" />
                                        <span className="font-medium text-sm truncate max-w-[200px]">{voucherFile.name}</span>
                                        <span className="text-xs text-slate-400">Clic para cambiar archivo</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-slate-400">
                                        <Upload size={32} className="mb-2" />
                                        <span className="font-medium text-sm">Subir Voucher / Comprobante</span>
                                        <span className="text-xs">PDF, JPG, PNG (Max 5MB)</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 2. CUPÓN DE DESCUENTO */}
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                            <Ticket size={18} /> Código de Cupón
                        </h3>

                        {coupon ? (
                            // ESTADO: CUPÓN APLICADO
                            <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex justify-between items-center animate-in zoom-in-95">
                                <div>
                                    <div className="font-bold text-green-800 flex items-center gap-2">
                                        <CheckCircle size={16} /> {coupon.code}
                                    </div>
                                    <div className="text-xs text-green-600">
                                        -{coupon.discount_percentage}% ({coupon.discount_scope === 'all' ? 'Total' : coupon.discount_scope})
                                    </div>
                                </div>
                                <button onClick={removeCoupon} className="text-red-400 hover:text-red-600 transition-colors p-2">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ) : (
                            // ESTADO: INPUT CUPÓN
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    placeholder="EJ: BECA2026"
                                    className="flex-1 input-field uppercase tracking-wider font-mono"
                                />
                                <button
                                    onClick={handleApplyCoupon}
                                    disabled={!couponCode || validatingCoupon}
                                    className="bg-slate-800 text-white px-4 rounded-lg font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
                                >
                                    {validatingCoupon ? '...' : 'Aplicar'}
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Step3Payment;
