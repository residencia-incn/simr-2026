import React, { useState } from 'react';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import { X, Trash2, CreditCard, ShoppingCart as CartIcon, Upload, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import { api } from '../../services/api'; // Using same API service logic as Registration
import Swal from 'sweetalert2';

const ShoppingCart = () => {
    const { user, updateUser } = useAuth(); // Destructure useAuth
    const { cartItems, removeFromCart, isCartOpen, setIsCartOpen, cartTotal, clearCart } = useCart();
    const [isCheckout, setIsCheckout] = useState(false);
    const [voucherFile, setVoucherFile] = useState(null);
    const [voucherPreview, setVoucherPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [allowedAccounts, setAllowedAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [accountsLoading, setAccountsLoading] = useState(true);
    const [treasuryConfig, setTreasuryConfig] = useState(null);

    React.useEffect(() => {
        const loadAccounts = async () => {
            try {
                const [accs, cfg] = await Promise.all([
                    api.treasury.getAccounts(),
                    api.treasury.getConfig()
                ]);

                setTreasuryConfig(cfg);
                const allowedIds = cfg?.contribution?.inscriptionAccounts || [];
                // If no accounts are specifically selected, show all or none? 
                // Let's assume none if empty, but maybe fallback to all? 
                // The logical behavior is: if list is present, filter. If not present (legacy), show empty or fallback.

                const filtered = accs.filter(a => allowedIds.includes(a.id));
                setAllowedAccounts(filtered);
                if (filtered.length > 0) {
                    setSelectedAccount(filtered[0]);
                }
            } catch (error) {
                console.error("Error loading accounts", error);
            } finally {
                setAccountsLoading(false);
            }
        };
        loadAccounts();
    }, []);

    React.useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') setIsCartOpen(false);
        };

        if (isCartOpen) {
            window.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden'; // Lock body scroll
        }

        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset'; // Unlock body scroll
        };
    }, [isCartOpen, setIsCartOpen]);

    if (!isCartOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVoucherFile(file);
            const objectUrl = URL.createObjectURL(file);
            setVoucherPreview(objectUrl);
        }
    };

    const handleCheckout = async () => {
        if (cartTotal > 0 && !voucherFile) return;
        setLoading(true);
        // Simulate API call for purchase/upgrade
        try {
            // 1. Upload Voucher First (Only if paying)
            const voucherUrl = (cartTotal > 0 && voucherFile)
                ? await api.upload.image(voucherFile)
                : null;

            // 2. Prepare Registration / Validation Request
            const registrationPayload = {
                name: user.name || 'Usuario',
                email: user.email,
                dni: user.documentId || user.dni || 'SIN-DNI',
                phone: user.phone || '',
                institution: user.institution || '',

                // Transaction Details
                amount: cartTotal,
                voucherData: voucherUrl,
                date: new Date().toISOString(),

                // Purchase Content
                items: cartItems,
                workshops: cartItems.filter(i => i.type === 'shop' || i.type === 'workshop').map(i => i.id),
                ticketType: cartItems.find(i => i.type === 'ticket')?.id || user.ticketType, // Update if buying ticket, else keep existing

                // Metadata
                paymentAccountId: selectedAccount?.id,
                type: 'Purchase', // Marker for generic purchase
                details: `Compra de ${cartItems.length} ítem(s): ${cartItems.map(i => i.name).join(', ')}`,
                status: 'pending'
            };

            // 3. Send to Treasury/Registration System
            await api.registrations.add(registrationPayload);

            // 4. Update User Local State (Optimistic)
            const pendingItemsToAdd = cartItems.map(item => item.id);
            const currentPending = user.pendingItems || [];
            const newPending = [...new Set([...currentPending, ...pendingItemsToAdd])];

            await updateUser({
                pendingItems: newPending
            });

            clearCart();
            setIsCheckout(false);
            setVoucherFile(null);
            setVoucherPreview(null);
            setIsCartOpen(false);

            Swal.fire({
                title: '¡Compra registrada!',
                text: 'Tu acceso se activará en breve tras la validación del voucher por Contabilidad.',
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#2563EB' // blue-600
            });

        } catch (error) {
            console.error(error);
            Swal.fire({
                title: 'Error',
                text: `No se pudo procesar la compra: ${error.message || 'Error desconocido'}. Inténtalo nuevamente.`,
                icon: 'error',
                confirmButtonText: 'Cerrar'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slideInRight">

                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <CartIcon className="text-blue-600" />
                        Tu Carrito
                    </h2>
                    <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div
                    className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
                            <CartIcon size={48} className="opacity-20" />
                            <p>Tu carrito está vacío</p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsCartOpen(false);
                                    window.location.href = '?view=profile&tab=upgrades';
                                }}
                            >
                                Ir a Inscripciones y Talleres
                            </Button>
                        </div>
                    ) : (
                        <>
                            {cartItems.map(item => (
                                <div key={item.id} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm group hover:border-blue-200 transition-colors">
                                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                                        <CartIcon size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 truncate">{item.title || item.name}</h4>
                                        <p className="text-xs text-gray-500">{item.subtitle || 'Taller'}</p>
                                        <p className="text-sm font-bold text-blue-600 mt-1">S/ {item.price}</p>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors p-2 self-start"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Footer / Checkout */}
                {cartItems.length > 0 && (
                    <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-gray-500 text-sm">Total a Pagar</span>
                            <span className="text-2xl font-bold text-gray-900">S/ {cartTotal.toFixed(2)}</span>
                        </div>

                        {!isCheckout ? (
                            <Button className="w-full justify-center py-3 text-base" onClick={() => setIsCheckout(true)}>
                                Proceder al Pago <CreditCard size={18} className="ml-2" />
                            </Button>
                        ) : (
                            <div className="space-y-4 animate-fadeIn">
                                {cartTotal > 0 && (
                                    <>
                                        <div className="mb-4">
                                            <h4 className="text-sm font-bold text-gray-900 mb-2">Cuentas Disponibles:</h4>
                                            {accountsLoading ? (
                                                <div className="text-xs text-center p-2 text-gray-400">Cargando cuentas...</div>
                                            ) : allowedAccounts.length > 0 ? (
                                                <div>
                                                    {/* Tabs */}
                                                    <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-hide">
                                                        {allowedAccounts.map((acc, index) => {
                                                            const isSelected = selectedAccount?.id === acc.id;

                                                            // Resolve Short Name
                                                            let label = acc.shortName || acc.wallet_name || acc.nombre || `Cuenta ${index + 1}`;

                                                            if (treasuryConfig) {
                                                                const bank = treasuryConfig.banks?.find(b => b.name === acc.bank_name);
                                                                const wallet = treasuryConfig.wallets?.find(w => w.name === acc.wallet_name);

                                                                if (bank?.shortName) label = bank.shortName;
                                                                else if (wallet?.shortName) label = wallet.shortName;
                                                            }

                                                            return (
                                                                <button
                                                                    key={acc.id}
                                                                    onClick={() => setSelectedAccount(acc)}
                                                                    className={`
                                                                    px-4 py-2 rounded-t-lg font-bold text-sm whitespace-nowrap transition-colors
                                                                    ${isSelected
                                                                            ? 'bg-[#1e5b7e] text-white' // Dark teal active
                                                                            : 'bg-blue-50 text-blue-400 hover:bg-blue-100' // Light inactive
                                                                        }
                                                                `}
                                                                >
                                                                    {label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Active Account Content */}
                                                    {selectedAccount && (() => {
                                                        // Resolve Logo Logic
                                                        let logo = selectedAccount.logo;
                                                        if (!logo && treasuryConfig) {
                                                            const bank = treasuryConfig.banks?.find(b => b.name === selectedAccount.bank_name);
                                                            const wallet = treasuryConfig.wallets?.find(w => w.name === selectedAccount.wallet_name);
                                                            if (bank?.logo) logo = bank.logo;
                                                            else if (wallet?.logo) logo = wallet.logo;
                                                        }

                                                        return (
                                                            <div className="bg-[#fff8f0] border-2 border-[#1e5b7e] rounded-b-lg rounded-tr-lg p-4 relative -mt-[1px] shadow-sm animate-fadeIn">
                                                                <div className="flex gap-4 items-start">
                                                                    <div className="w-16 h-16 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center p-2 shrink-0 overflow-hidden">
                                                                        {logo ? (
                                                                            <img src={logo} alt="Bank Logo" className="max-w-full max-h-full object-contain" />
                                                                        ) : (
                                                                            <CreditCard size={32} className="text-gray-300" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h5 className="font-bold text-gray-900 text-base mb-1">{selectedAccount.bank_name || selectedAccount.name}</h5>
                                                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{selectedAccount.holder_name || 'ASOCIACIÓN SIMR'}</p>

                                                                        <div className="space-y-1">
                                                                            {/* Bank Account Details */}
                                                                            {selectedAccount.tipo !== 'billetera' && selectedAccount.account_number && (
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">CUENTA</span>
                                                                                    <span className="font-mono text-sm text-gray-700 font-medium">{selectedAccount.account_number}</span>
                                                                                </div>
                                                                            )}
                                                                            {selectedAccount.tipo !== 'billetera' && selectedAccount.cci && (
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-xs font-bold text-blue-100 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">CCI</span>
                                                                                    <span className="font-mono text-sm text-gray-600 font-medium">{selectedAccount.cci}</span>
                                                                                </div>
                                                                            )}

                                                                            {/* Wallet Details (Yape/Plin) */}
                                                                            {selectedAccount.phone_number && (
                                                                                <div className="flex items-center gap-2 mt-2">
                                                                                    <span className="text-xs font-bold text-purple-100 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">CELULAR</span>
                                                                                    <span className="font-mono text-xl font-black text-gray-800 tracking-wide">{selectedAccount.phone_number}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                                    No hay cuentas configuradas.
                                                </div>
                                            )}
                                        </div>

                                        <label className={`block w-full cursor-pointer border-2 border-dashed rounded-xl p-4 transition-all ${voucherFile
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                                            }`}>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />

                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 text-center">
                                                    {voucherFile ? (
                                                        <div className="flex flex-col items-center gap-1 text-green-700">
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle className="w-5 h-5" />
                                                                <span className="text-sm font-bold">Voucher Cargado</span>
                                                            </div>
                                                            <span className="text-xs truncate max-w-[150px] opacity-75">{voucherFile.name}</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Upload className="mx-auto text-gray-400 group-hover:text-blue-500 mb-2" size={24} />
                                                            <span className="text-sm text-gray-600 block group-hover:text-blue-600">Click para subir voucher</span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Preview Image */}
                                                {voucherPreview && (
                                                    <div className="w-16 h-16 rounded-lg border border-green-200 overflow-hidden bg-white shrink-0 shadow-sm relative group">
                                                        <img src={voucherPreview} alt="Preview" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    </>
                                )}

                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={() => setIsCheckout(false)}>Cancelar</Button>
                                    <Button className="flex-1" onClick={handleCheckout} disabled={loading || (cartTotal > 0 && !voucherFile)}>
                                        {loading ? 'Procesando...' : (cartTotal > 0 ? 'Confirmar' : 'Confirmar Gratis')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShoppingCart;
