import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Gift, Users, Tag, Percent, Layers, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

const CreateCouponModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
    const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
        defaultValues: {
            description: '',         // Nombre del Beneficio (ej: Beca Residentes)
            discount_value: 100,     // Por defecto 100%
            target_modules: [],      // Array de IDs
            is_batch: false,
            quantity: 10,
            code: '',               // For editing or manual code
        }
    });

    // Estados para el catálogo
    const [modalities, setModalities] = useState([]);
    const [workshops, setWorkshops] = useState([]);
    const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form with existing data if editing
    useEffect(() => {
        if (initialData) {
            setValue('code', initialData.code);
            setValue('description', initialData.description);
            setValue('discount_value', initialData.discountValue || 100);
            setValue('target_modules', initialData.targetModules || []);
            setValue('max_uses', initialData.maxUses);
            setValue('expiry', initialData.expiry);
            setValue('is_batch', false); // Editing usually implies single item or changing params for the future
            if (initialData.group_tag) setValue('group_tag', initialData.group_tag);
        } else {
            reset({
                description: '',
                discount_value: 100,
                target_modules: [],
                is_batch: false,
                quantity: 10,
                max_uses: 1
            });
        }
    }, [initialData, setValue, reset, isOpen]);

    // 1. CARGAR CATÁLOGO AL ABRIR
    useEffect(() => {
        if (isOpen) {
            const loadData = async () => {
                setIsLoadingCatalog(true);
                setFetchError(null);
                try {
                    // Llamada al endpoint que creamos
                    const data = await api.config.getCatalog(); // We'll need to add this to api.js or use axios directly if api.js doesn't have it yet

                    // Separamos la data para mostrarla ordenada
                    setModalities(data.filter(item => item.type === 'INSCRIPTION'));
                    setWorkshops(data.filter(item => item.type === 'WORKSHOP'));

                } catch (error) {
                    console.error("Error cargando catálogo:", error);
                    setFetchError("No se pudieron cargar las modalidades ni talleres. Verifique el servidor.");
                } finally {
                    setIsLoadingCatalog(false);
                }
            };
            loadData();
        }
    }, [isOpen]);

    // Lógica de selección múltiple
    const selectedModules = watch('target_modules') || [];

    const toggleModule = (id) => {
        const current = selectedModules;
        if (current.includes(id)) {
            setValue('target_modules', current.filter(x => x !== id));
        } else {
            setValue('target_modules', [...current, id]);
        }
    };

    // Seleccionar TODO de una categoría
    const toggleAll = (items) => {
        const ids = items.map(i => i.id);
        const allSelected = ids.every(id => selectedModules.includes(id));

        if (allSelected) {
            // Desmarcar todos estos
            setValue('target_modules', selectedModules.filter(id => !ids.includes(id)));
        } else {
            // Marcar todos (fusionar sin duplicados)
            const newSelection = [...new Set([...selectedModules, ...ids])];
            setValue('target_modules', newSelection);
        }
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const payload = {
                code: data.code,
                description: data.description, // Nombre del Beneficio
                discountType: 'PERCENTAGE', // Pydantic expects camelCase alias in frontend typically? Or snake_case? 
                // The existing code used camelCase in JS map to backend. 
                // Let's stick to the previous pattern or what the backend expects.
                // Backend CouponCreateExtended uses aliases.
                discountValue: parseInt(data.discount_value),
                targetModules: data.target_modules,
                maxUses: parseInt(data.max_uses || 1),
                expiry: data.expiry,

                // Lógica de Lotes
                is_batch: !!data.is_batch,
                batch_prefix: data.batch_prefix?.toUpperCase(),
                quantity: parseInt(data.quantity),
                group_tag: data.description // Usamos la descripción también como tag de grupo defaults
            };

            if (initialData) {
                await api.coupons.update(initialData.id, payload);
            } else {
                await api.coupons.create(payload);
            }

            reset();
            onSuccess();
            onClose();
        } catch (error) {
            alert("Error creando cupón: " + (error.response?.data?.detail || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Gift className="text-indigo-600" />
                            {initialData ? 'Editar Beneficio' : 'Crear Nuevo Beneficio'}
                        </h2>
                        <p className="text-sm text-slate-500">Configure una beca o descuento para modalidades y talleres.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500"><X /></button>
                </div>

                {/* Body Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <form id="couponForm" onSubmit={handleSubmit(onSubmit)}>

                        {/* 1. DEFINICIÓN DEL BENEFICIO */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Beneficio (Etiqueta)</label>
                                <input
                                    {...register('description', { required: true })}
                                    placeholder="Ej: Media Beca Residentes UNMSM - H. Almenara"
                                    className="w-full rounded-lg border-slate-300 focus:ring-indigo-500 font-medium px-3 py-2 border"
                                />
                            </div>

                            {!initialData && !watch('is_batch') && (
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Código Manual (Opcional)</label>
                                    <input
                                        {...register('code')}
                                        placeholder="Dejar vacío para autogenerar"
                                        className="w-full rounded-lg border-slate-300 px-3 py-2 border uppercase font-mono"
                                    />
                                </div>
                            )}

                            {/* Porcentaje */}
                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                    <Percent size={16} /> Porcentaje de Descuento
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        {...register('discount_value', { required: true, min: 1, max: 100 })}
                                        className="w-24 text-center text-xl font-bold text-indigo-700 border-indigo-200 rounded-lg focus:ring-indigo-500 px-2 py-1"
                                    />
                                    <span className="text-indigo-400 font-bold">%</span>
                                    <div className="text-xs text-indigo-600 ml-2">
                                        {watch('discount_value') == 100 ? "¡Es GRATIS (Beca Total)!" :
                                            watch('discount_value') == 50 ? "Media Beca" : "Descuento parcial"}
                                    </div>
                                </div>
                            </div>

                            {/* Configuración de Cantidad */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                {!initialData && (
                                    <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                        <input type="checkbox" {...register('is_batch')} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                        <span className="text-sm font-bold text-slate-700">Generar Lote Masivo</span>
                                    </label>
                                )}

                                {watch('is_batch') ? (
                                    <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <label className="text-xs text-slate-500 block mb-1">Prefijo (Opcional)</label>
                                            <input {...register('batch_prefix')} placeholder="UNMSM" className="w-full text-sm uppercase rounded border-slate-300 px-2 py-1 border" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 block mb-1">Cantidad</label>
                                            <input type="number" {...register('quantity')} defaultValue={10} className="w-full text-sm rounded border-slate-300 px-2 py-1 border" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-2 space-y-3">
                                        <div>
                                            <label className="text-xs text-slate-500 block mb-1">Usos permitidos por código</label>
                                            <input type="number" {...register('max_uses')} defaultValue={1} className="w-full text-sm rounded border-slate-300 px-2 py-1 border" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 block mb-1">Fecha de Expiración</label>
                                            <input type="date" {...register('expiry', { required: true })} className="w-full text-sm rounded border-slate-300 px-2 py-1 border" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <hr className="border-slate-100 my-6" />

                        {/* 2. ALCANCE (SCOPE) - ¿A QUÉ APLICA? */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <Layers size={16} /> Alcance del Beneficio
                            </h3>

                            {isLoadingCatalog && <div className="text-center py-4 text-slate-500">Cargando catálogo...</div>}

                            {fetchError && (
                                <div className="bg-red-50 text-red-600 p-3 rounded text-sm flex gap-2 items-center">
                                    <AlertCircle size={16} /> {fetchError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* COLUMNA 1: MODALIDADES (INSCRIPCIÓN BASE) */}
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-600 uppercase">Inscripción General</span>
                                        <button type="button" onClick={() => toggleAll(modalities)} className="text-xs text-indigo-600 hover:underline">
                                            Seleccionar Todo
                                        </button>
                                    </div>
                                    <div className="p-2 space-y-1 max-h-40 overflow-y-auto">
                                        {modalities.length === 0 && !isLoadingCatalog && <p className="text-xs text-slate-400 p-2">No hay modalidades activas.</p>}
                                        {modalities.map(mod => (
                                            <label key={mod.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${selectedModules.includes(mod.id) ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedModules.includes(mod.id)}
                                                    onChange={() => toggleModule(mod.id)}
                                                    className="rounded border-slate-300 text-indigo-600"
                                                />
                                                <span className="flex-1">{mod.label.replace('Inscripción: ', '')}</span>
                                                <span className="text-xs text-slate-400 font-mono">S/{mod.price}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* COLUMNA 2: TALLERES (EXTRAS) */}
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-600 uppercase">Talleres Adicionales</span>
                                        <button type="button" onClick={() => toggleAll(workshops)} className="text-xs text-indigo-600 hover:underline">
                                            Seleccionar Todo
                                        </button>
                                    </div>
                                    <div className="p-2 space-y-1 max-h-40 overflow-y-auto">
                                        {workshops.length === 0 && !isLoadingCatalog && <p className="text-xs text-slate-400 p-2">No hay talleres activos.</p>}
                                        {workshops.map(ws => (
                                            <label key={ws.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${selectedModules.includes(ws.id) ? 'bg-purple-50 text-purple-700' : 'hover:bg-slate-50'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedModules.includes(ws.id)}
                                                    onChange={() => toggleModule(ws.id)}
                                                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                                />
                                                <span className="flex-1 truncate" title={ws.label}>{ws.label.replace('Taller: ', '')}</span>
                                                <span className="text-xs text-slate-400 font-mono">S/{ws.price}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {selectedModules.length === 0 && !isLoadingCatalog && (
                                <p className="text-amber-600 text-xs mt-2 flex items-center gap-1">
                                    <AlertCircle size={12} /> Selecciona al menos una modalidad o taller para aplicar el descuento.
                                </p>
                            )}
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition">Cancelar</button>
                    <button
                        type="submit"
                        form="couponForm"
                        disabled={isSubmitting || selectedModules.length === 0}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? 'Procesando...' : (
                            <>
                                <CheckCircle size={16} /> {initialData ? 'Actualizar' : 'Generar Beneficio'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateCouponModal;
