import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Trash2, Tag, Calendar, History, Loader, Folder } from 'lucide-react';
import { showToast, showDeleteConfirm, showSuccess, showError } from '../../utils/alerts';
import Button from '../ui/Button';
import Card from '../ui/Card';
import CreateCouponModal from '../coupons/CreateCouponModal';
import CouponHistoryModal from '../coupons/CouponHistoryModal';

const CouponManager = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [selectedCouponHistory, setSelectedCouponHistory] = useState(null);

    // Initial load ensures pricing is empty array not undefined
    // We keep simplified catalogs for display labels (mapping IDs to Names)
    const [catalogMap, setCatalogMap] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Parallel fetch
            const [couponsData, catalogData] = await Promise.all([
                api.coupons.getAll(),
                api.config.getCatalog() // Unified catalog for mapping labels
            ]);

            setCoupons(couponsData); // Most recent first usually from backend

            // Create a quick lookup map for labels: { "modalidad:1": "Inscripción General", ... }
            const map = {};
            if (Array.isArray(catalogData)) {
                catalogData.forEach(item => {
                    map[item.id] = item.label;
                });
            }
            setCatalogMap(map);

        } catch (error) {
            console.error("Error loading data", error);
            showError("No se pudieron cargar los cupones.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        showToast('Código copiado', 'success');
    };

    const handleDelete = async (id) => {
        const confirmed = await showDeleteConfirm('¿Eliminar este cupón permanentemente?', 'Eliminar Cupón');
        if (confirmed) {
            try {
                await api.coupons.delete(id);
                showSuccess('Cupón eliminado.');
                loadData();
            } catch (e) {
                showError('Error eliminando cupón.');
            }
        }
    };

    const openEdit = (coupon) => {
        setEditingCoupon(coupon);
        setIsCreateOpen(true);
    };

    const openHistory = (coupon) => {
        setSelectedCouponHistory(coupon);
        setIsHistoryOpen(true);
    };

    const handleCloseCreate = () => {
        setIsCreateOpen(false);
        setEditingCoupon(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Campaña de Becas y Cupones</h3>
                    <p className="text-sm text-slate-500 mt-1">Gestione descuentos, becas integrales y códigos promocionales.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 shadow-lg shadow-indigo-200">
                    <Plus size={18} /> Nuevo Beneficio
                </Button>
            </div>

            {loading ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
                    <Loader className="animate-spin" /> Cargando cupones...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coupons.map(coupon => {
                        const isExpired = new Date(coupon.expiry) < new Date();
                        const isExhausted = coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses;
                        const statusColor = !coupon.active ? 'bg-slate-100 text-slate-500 ring-slate-200' :
                            (isExpired || isExhausted ? 'bg-red-50 text-red-600 ring-red-100' : 'bg-emerald-50 text-emerald-700 ring-emerald-100');
                        const statusText = !coupon.active ? 'Inactivo' : (isExpired ? 'Expirado' : (isExhausted ? 'Agotado' : 'Activo'));

                        return (
                            <Card key={coupon.id} className="group hover:shadow-lg transition-all duration-300 border-slate-200 relative overflow-hidden">
                                {/* Decorative top strip */}
                                <div className={`absolute top-0 left-0 right-0 h-1 ${coupon.active ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>

                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                <Tag size={18} />
                                            </div>
                                            <div>
                                                <div
                                                    className="font-mono text-lg font-bold text-slate-800 tracking-wider cursor-pointer hover:text-indigo-600"
                                                    onClick={() => handleCopy(coupon.code)}
                                                    title="Click para copiar"
                                                >
                                                    {coupon.code}
                                                </div>
                                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{coupon.group_tag || 'General'}</div>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ring-1 ring-inset ${statusColor}`}>
                                            {statusText}
                                        </span>
                                    </div>

                                    <h4 className="font-bold text-slate-700 mb-1 line-clamp-1">{coupon.description}</h4>

                                    {/* Discount & Target Modules */}
                                    <div className="space-y-2 mt-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-black text-indigo-600">
                                                {coupon.discountValue === 100 ? 'GRATIS' : `-${coupon.discountValue}%`}
                                            </span>
                                            {coupon.discountValue === 100 && (
                                                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase">Beca Total</span>
                                            )}
                                        </div>

                                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 min-h-[60px]">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Aplica a:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {(!coupon.targetModules || coupon.targetModules.length === 0) ? (
                                                    <span className="text-xs text-slate-400 italic">Todo el catálogo (si aplica)</span>
                                                ) : (
                                                    coupon.targetModules.slice(0, 3).map((modId, idx) => (
                                                        <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 truncate max-w-[150px]" title={catalogMap[modId] || modId}>
                                                            {catalogMap[modId] || modId}
                                                        </span>
                                                    ))
                                                )}
                                                {(coupon.targetModules?.length > 3) && (
                                                    <span className="text-[10px] px-1.5 py-0.5 text-slate-400">
                                                        +{coupon.targetModules.length - 3} más
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Stats */}
                                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500">
                                        <div className="flex gap-3">
                                            <span className="flex items-center gap-1" title="Usos / Límite">
                                                <History size={12} />
                                                <b className={coupon.usedCount > 0 ? 'text-indigo-600' : ''}>{coupon.usedCount}</b>
                                                / {coupon.maxUses === 0 ? '∞' : coupon.maxUses}
                                            </span>
                                            <span className="flex items-center gap-1" title="Fecha Expiración">
                                                <Calendar size={12} /> {coupon.expiry}
                                            </span>
                                        </div>

                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openHistory(coupon)}
                                                className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition"
                                                title="Ver Historial"
                                            >
                                                <History size={14} />
                                            </button>
                                            <button
                                                onClick={() => openEdit(coupon)}
                                                className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition"
                                                title="Editar"
                                            >
                                                <Folder size={14} /> {/* Icon changed from Edit to Folder/File generic pending Edit icon import */}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(coupon.id)}
                                                className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Empty State */}
            {!loading && coupons.length === 0 && (
                <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
                    <Tag size={48} className="mb-4 opacity-20" />
                    <p className="text-lg font-medium text-slate-600">No hay beneficios creados aún.</p>
                    <p className="text-sm">Comience creando una nueva campaña de becas o descuentos.</p>
                </div>
            )}

            {/* Modals */}
            <CreateCouponModal
                isOpen={isCreateOpen}
                onClose={handleCloseCreate}
                onSuccess={loadData}
                initialData={editingCoupon}
            />

            <CouponHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                coupon={selectedCouponHistory}
            />
        </div>
    );
};

export default CouponManager;
