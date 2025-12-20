import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Edit2, Trash2, Tag, Percent, DollarSign, Calendar, AlertCircle, FileDown } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { showWarning, showError } from '../../utils/alerts';

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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [couponsData, registrationsData] = await Promise.all([
                api.coupons.getAll(),
                api.registrations.getAll()
            ]);
            setCoupons(couponsData);

            // Process Registrations to find Coupon Redemptions
            const logs = registrationsData
                .filter(reg => reg.couponCode)
                .map(reg => {
                    const coupon = couponsData.find(c => c.code === reg.couponCode);
                    return {
                        id: reg.id,
                        user: reg.name,
                        dni: reg.dni,
                        code: reg.couponCode,
                        date: new Date(reg.timestamp).toLocaleDateString(),
                        amountPaid: reg.amount,
                        email: reg.email,
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
                                        <div className={`p-3 rounded-lg flex flex-col items-center justify-center w-16 h-16 ${coupon.type === 'percentage' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {coupon.type === 'percentage' ? <Percent size={20} /> : <DollarSign size={20} />}
                                            <span className="font-bold text-sm">
                                                {coupon.value}{coupon.type === 'percentage' ? '%' : ''}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-900 text-lg tracking-wide font-mono">{coupon.code}</h4>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColor}`}>{statusText}</span>
                                            </div>
                                            <p className="text-sm text-gray-600">{coupon.description}</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
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
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">{currentCoupon ? 'Editar Cupón' : 'Nuevo Cupón'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Descuento</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="percentage">Porcentaje (%)</option>
                                        <option value="fixed">Monto Fijo (S/.)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                                    />
                                </div>
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
                                    <span className="text-xs text-gray-400">0 para ilimitado</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
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

export default CouponManager;
