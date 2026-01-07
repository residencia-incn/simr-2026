import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Edit2, Trash2, Tag, Percent, DollarSign, Calendar, AlertCircle, FileDown, Copy } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { showWarning, showError, showToast } from '../../utils/alerts';

const CouponManager = () => {
    const [coupons, setCoupons] = useState([]);
    const [redemptions, setRedemptions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCoupon, setCurrentCoupon] = useState(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        code: '',
        type: 'percentage', // percentage | fixed
        value: 0,
        description: '',
        maxUses: 0, // 0 = infinite
        expiry: '',
        active: true
    });

    const [pricing, setPricing] = useState({ ticketTypes: [], workshops: [] });

    useEffect(() => {
        loadData();
    }, []);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen]);

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        showToast('Código copiado', 'success');
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [couponsData, attendeesData, pricingData] = await Promise.all([
                api.coupons.getAll(),
                api.attendees.getAll(), // Get approved users instead of pending registrations
                api.treasury.getPricing()
            ]);
            setCoupons(couponsData);
            setPricing(pricingData || { ticketTypes: [], workshops: [] });

            // Process Approved Users to find Coupon Redemptions
            const logs = attendeesData
                .filter(user => user.coupon_code || user.couponCode || user.coupon)
                .map(user => {
                    const couponCode = user.coupon_code || user.couponCode || user.coupon;
                    const coupon = couponsData.find(c => c.code === couponCode);
                    return {
                        id: user.id,
                        user: user.name,
                        dni: user.dni,
                        code: couponCode,
                        date: new Date(user.registrationDate || user.date).toLocaleDateString(),
                        amountPaid: user.amount || 0,
                        email: user.email,
                        couponId: coupon?.id || 'unknown'
                    };
                });
            setRedemptions(logs);

        } catch (error) {
            console.error("Error loading data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (redemptions.length === 0) {
            showWarning('No hay datos para exportar.', 'Sin datos');
            return;
        }

        const headers = ["ID Registro", "Usuario", "DNI", "Email", "Cupón", "Monto Pagado", "Fecha"];
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + redemptions.map(r => `${r.id},"${r.user}","${r.dni}","${r.email}","${r.code}",${r.amountPaid},${r.date}`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_cupones_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleOpenModal = (coupon = null) => {
        if (coupon) {
            setCurrentCoupon(coupon);
            setFormData({
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                description: coupon.description,
                maxUses: coupon.maxUses,
                expiry: coupon.expiry,
                active: coupon.active
            });
        } else {
            setCurrentCoupon(null);
            setFormData({
                code: '',
                type: 'percentage',
                value: 0,
                description: '',
                maxUses: 100,
                expiry: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
                active: true
            });
        }
        setIsModalOpen(true);
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, code });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentCoupon) {
                await api.coupons.delete(currentCoupon.id);
                await api.coupons.create(formData);
            } else {
                await api.coupons.create(formData);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
            showError('No se pudo guardar el cupón.', 'Error al guardar');
        }
    };

    const handleDelete = async (id) => {
        if (confirm('¿Eliminar este cupón permanentemente?')) {
            await api.coupons.delete(id);
            loadData();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Gestión de Cupones y Becas</h3>
                    <p className="text-sm text-gray-500">Administra códigos y monitorea su uso.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                    <Plus size={16} /> Nuevo Cupón
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Coupon List */}
                <div className="lg:col-span-2 space-y-4">
                    <h4 className="font-bold text-gray-700 flex items-center gap-2">
                        <Tag size={18} /> Cupones Activos
                    </h4>
                    <div className="grid gap-4">
                        {coupons.length === 0 ? (
                            <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
                                No hay cupones creados.
                            </div>
                        ) : coupons.map(coupon => {
                            const isExpired = new Date(coupon.expiry) < new Date();
                            const isExhausted = coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses;
                            const statusColor = !coupon.active ? 'bg-gray-100 text-gray-500' : (isExpired || isExhausted ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700');
                            const statusText = !coupon.active ? 'Inactivo' : (isExpired ? 'Expirado' : (isExhausted ? 'Agotado' : 'Activo'));

                            return (
                                <Card key={coupon.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg flex flex-col items-center justify-center w-16 h-16 ${coupon.active ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <Tag size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-900 text-lg tracking-wide font-mono">{coupon.code}</h4>
                                                <button
                                                    onClick={() => handleCopy(coupon.code)}
                                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Copiar código"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColor}`}>{statusText}</span>
                                            </div>
                                            <p className="text-sm text-gray-600">{coupon.description}</p>

                                            {/* Granular Discount Details Display */}
                                            <div className="mt-2 text-xs text-gray-500 space-y-1">
                                                {coupon.applicableModality && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-bold text-blue-600">
                                                            {pricing.ticketTypes.find(t => t.id === coupon.applicableModality)?.title || coupon.applicableModality}:
                                                        </span>
                                                        <span>{coupon.modalityDiscount}% OFF</span>
                                                    </div>
                                                )}
                                                {coupon.workshopDiscounts && Object.keys(coupon.workshopDiscounts).length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        <span className="font-bold text-orange-600">Talleres:</span>
                                                        {Object.entries(coupon.workshopDiscounts).map(([wsId, disc]) => (
                                                            <span key={wsId} className="bg-orange-50 text-orange-700 px-1 rounded border border-orange-100">
                                                                {pricing.workshops.find(w => w.id === wsId)?.name || wsId} (-{disc}%)
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                                                <span className="flex items-center gap-1"><Tag size={12} /> Usados: {coupon.usedCount} / {coupon.maxUses === 0 ? '∞' : coupon.maxUses}</span>
                                                <span className="flex items-center gap-1"><Calendar size={12} /> Expira: {coupon.expiry}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(coupon.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Redemption Log */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-gray-700 flex items-center gap-2">
                            <Calendar size={18} /> Historial de Uso
                        </h4>
                        <Button variant="outline" size="sm" onClick={handleExport} disabled={redemptions.length === 0} className="text-xs h-8">
                            <FileDown size={14} className="mr-1" /> Exportar
                        </Button>
                    </div>

                    <Card className="overflow-hidden bg-gray-50/50 border-gray-200">
                        <div className="max-h-[600px] overflow-y-auto">
                            {redemptions.length === 0 ? (
                                <div className="p-8 text-center text-sm text-gray-500">
                                    No se han registrado usos de cupones aún.
                                </div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-600 font-medium sticky top-0">
                                        <tr>
                                            <th className="p-3">Usuario</th>
                                            <th className="p-3">Cupón</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {redemptions.map((log, idx) => (
                                            <tr key={idx} className="hover:bg-white transition-colors">
                                                <td className="p-3">
                                                    <div className="font-medium text-gray-900">{log.user}</div>
                                                    <div className="text-xs text-gray-500">{log.date}</div>
                                                </td>
                                                <td className="p-3">
                                                    <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-mono font-bold">
                                                        {log.code}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                            <h3 className="font-bold text-gray-900">{currentCoupon ? 'Editar Cupón' : 'Nuevo Cupón'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Código del Cupón</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="EJ: BECA2026"
                                    />
                                    <Button type="button" variant="outline" onClick={generateCode} title="Generar código aleatorio">Generar</Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Expiración</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.expiry}
                                        onChange={e => setFormData({ ...formData, expiry: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Límite de Usos</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.maxUses}
                                        onChange={e => setFormData({ ...formData, maxUses: parseInt(e.target.value) })}
                                        placeholder="0 = Ilimitado"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-gray-100">
                                <ModalitySelector pricing={pricing} formData={formData} setFormData={setFormData} />
                                <WorkshopSelector pricing={pricing} formData={formData} setFormData={setFormData} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Ej: Beca Integral para Residentes"
                                />
                            </div>

                            <div className="flex gap-3 pt-4 justify-end">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit">Guardar Cupón</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// HELPER COMPONENTS FOR THE FORM
const ModalitySelector = ({ pricing, formData, setFormData }) => (
    <div className="space-y-4">
        <h4 className="font-bold text-gray-700 text-sm border-b pb-2">1. Modalidad (Ticket)</h4>
        <div className="space-y-3 max-h-32 overflow-y-auto pr-2">
            {pricing.ticketTypes.map(ticket => (
                <label key={ticket.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${formData.applicableModality === ticket.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                        <input
                            type="radio"
                            name="modality"
                            className="text-blue-600 focus:ring-blue-500"
                            checked={formData.applicableModality === ticket.id}
                            onChange={() => setFormData({ ...formData, applicableModality: ticket.id, modalityDiscount: formData.modalityDiscount || 0 })}
                        />
                        <span className="text-sm font-medium text-gray-700">{ticket.title || ticket.name}</span>
                    </div>
                    {formData.applicableModality === ticket.id && (
                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-blue-200 shadow-sm w-24">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                className="w-full text-right outline-none text-sm font-bold text-blue-700"
                                value={formData.modalityDiscount}
                                onChange={(e) => setFormData({ ...formData, modalityDiscount: parseFloat(e.target.value) || 0 })}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-xs text-gray-400 font-bold">%</span>
                        </div>
                    )}
                </label>
            ))}
        </div>
        <p className="text-xs text-gray-500 italic">* Seleccione solo una modalidad aplicable.</p>
    </div>
);

const WorkshopSelector = ({ pricing, formData, setFormData }) => {
    const toggleWorkshop = (id) => {
        const currentws = { ...formData.workshopDiscounts };
        if (currentws[id] !== undefined) {
            delete currentws[id];
        } else {
            currentws[id] = 0; // Default 0% (or should it be 100? Let's say 0 and user types)
        }
        setFormData({ ...formData, workshopDiscounts: currentws });
    };

    const updateWorkshopDiscount = (id, val) => {
        setFormData({
            ...formData,
            workshopDiscounts: {
                ...formData.workshopDiscounts,
                [id]: parseFloat(val) || 0
            }
        });
    };

    return (
        <div className="space-y-4">
            <h4 className="font-bold text-gray-700 text-sm border-b pb-2">2. Talleres (Opcional)</h4>
            <div className="space-y-3 max-h-32 overflow-y-auto pr-2">
                {pricing.workshops.map(ws => {
                    const isSelected = formData.workshopDiscounts && formData.workshopDiscounts[ws.id] !== undefined;
                    return (
                        <label key={ws.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${isSelected ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    className="text-orange-600 focus:ring-orange-500 rounded"
                                    checked={isSelected}
                                    onChange={() => toggleWorkshop(ws.id)}
                                />
                                <span className="text-sm font-medium text-gray-700">{ws.name}</span>
                            </div>
                            {isSelected && (
                                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-orange-200 shadow-sm w-24">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="w-full text-right outline-none text-sm font-bold text-orange-700"
                                        value={formData.workshopDiscounts[ws.id]}
                                        onChange={(e) => updateWorkshopDiscount(ws.id, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="text-xs text-gray-400 font-bold">%</span>
                                </div>
                            )}
                        </label>
                    );
                })}
            </div>
            <p className="text-xs text-gray-500 italic">* Puede seleccionar múltiples talleres.</p>
        </div>
    );
};

export default CouponManager;
